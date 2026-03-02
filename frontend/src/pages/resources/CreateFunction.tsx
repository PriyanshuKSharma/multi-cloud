import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import { extractProvisioningErrorMessage } from '../../utils/terraformOutput';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  readCurrentProjectId,
  setCurrentProject,
} from '../../utils/currentProject';
import {
  Zap,
  ArrowLeft,
  Loader,
  AlertCircle,
  Check,
  Cloud,
  Timer,
  MemoryStick,
  Code2,
} from 'lucide-react';

type Provider = 'aws' | 'azure' | 'gcp';

interface ProjectOption {
  id: number;
  name: string;
}

interface CreateFunctionResponse {
  id: number;
  status: string;
  terraform_output?: {
    error?: string;
    detail?: string;
    [key: string]: unknown;
  } | null;
}

interface CreateFunctionPayload {
  name: string;
  provider: Provider;
  type: 'faas';
  project_id: number;
  configuration: Record<string, unknown>;
}

const REGIONS: Record<Provider, string[]> = {
  aws: ['us-east-1', 'us-west-2', 'ap-south-1', 'eu-west-1'],
  azure: ['eastus', 'westus2', 'westeurope', 'southeastasia'],
  gcp: ['us-central1', 'us-east1', 'europe-west1', 'asia-southeast1'],
};

const RUNTIMES: Record<Provider, Array<{ value: string; label: string }>> = {
  aws: [
    { value: 'python3.11', label: 'Python 3.11' },
    { value: 'python3.10', label: 'Python 3.10' },
    { value: 'nodejs20.x', label: 'Node.js 20' },
  ],
  azure: [
    { value: '3.11', label: 'Python 3.11' },
    { value: '3.10', label: 'Python 3.10' },
  ],
  gcp: [
    { value: 'python311', label: 'Python 3.11' },
    { value: 'python310', label: 'Python 3.10' },
    { value: 'nodejs20', label: 'Node.js 20' },
  ],
};

const normalizeFunctionName = (name: string): string =>
  name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const CreateFunctionPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [provider, setProvider] = React.useState<Provider>('aws');
  const [name, setName] = React.useState('');
  const [region, setRegion] = React.useState(REGIONS.aws[0]);
  const [runtime, setRuntime] = React.useState(RUNTIMES.aws[0].value);
  const [timeoutSeconds, setTimeoutSeconds] = React.useState(30);
  const [memoryMb, setMemoryMb] = React.useState(256);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [projectError, setProjectError] = React.useState<string | null>(null);
  const [projectMode, setProjectMode] = React.useState<'current' | 'new'>('current');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | ''>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'create-function'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map((project: any) => ({
        id: Number(project.id),
        name: String(project.name ?? `Project ${project.id}`),
      }));
    },
    staleTime: 30_000,
    retry: 1,
  });

  React.useEffect(() => {
    setRegion(REGIONS[provider][0]);
    setRuntime(RUNTIMES[provider][0].value);
  }, [provider]);

  React.useEffect(() => {
    if (projects.length === 0) return;
    const storedId = readCurrentProjectId();
    if (storedId && projects.some((project) => project.id === storedId)) {
      setSelectedProjectId(storedId);
      return;
    }
    setSelectedProjectId(projects[0].id);
    setCurrentProject({ id: projects[0].id, name: projects[0].name });
  }, [projects]);

  React.useEffect(() => {
    const onProjectChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: number | null }>;
      if (typeof customEvent.detail?.id === 'number' && customEvent.detail.id > 0) {
        setSelectedProjectId(customEvent.detail.id);
      }
    };
    window.addEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
    return () => window.removeEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
  }, []);

  const createMutation = useMutation({
    mutationFn: async (payload: CreateFunctionPayload) => {
      const response = await axios.post('/resources/', payload);
      return response.data as CreateFunctionResponse;
    },
    onSuccess: (resource) => {
      if (resource?.status === 'failed') {
        setSubmitError(
          extractProvisioningErrorMessage(
            resource.terraform_output,
            'Function request was accepted but provisioning could not be queued.'
          )
        );
        return;
      }
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      navigate('/resources/functions');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail !== undefined) {
        setSubmitError(extractProvisioningErrorMessage(detail, 'Failed to create function. Please try again.'));
        return;
      }
      setSubmitError('Failed to create function. Please try again.');
    },
  });

  const resolveProjectId = async (): Promise<number | null> => {
    if (projectMode === 'new') {
      const trimmedName = newProjectName.trim();
      if (!trimmedName) {
        setProjectError('New project name is required.');
        return null;
      }
      if (trimmedName.length < 2) {
        setProjectError('Project name must be at least 2 characters.');
        return null;
      }

      try {
        const response = await axios.post('/projects/', {
          name: trimmedName,
          description: newProjectDescription.trim() || undefined,
        });
        const createdProject = response.data as ProjectOption;
        setCurrentProject({ id: createdProject.id, name: createdProject.name });
        queryClient.invalidateQueries({ queryKey: ['projects'] });
        return createdProject.id;
      } catch (error: any) {
        const detail = error?.response?.data?.detail;
        setProjectError(typeof detail === 'string' ? detail : 'Failed to create project.');
        return null;
      }
    }

    const projectId = typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
    if (!projectId || projectId <= 0) {
      setProjectError('Select a project or create a new one before provisioning.');
      return null;
    }

    const selectedProject = projects.find((project) => project.id === projectId);
    if (selectedProject) {
      setCurrentProject({ id: selectedProject.id, name: selectedProject.name });
    }
    return projectId;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitError(null);
    setProjectError(null);

    if (!name.trim()) {
      setSubmitError('Function name is required.');
      return;
    }

    const resolvedProjectId = await resolveProjectId();
    if (!resolvedProjectId) return;

    const payload: CreateFunctionPayload = {
      name: name.trim(),
      provider,
      type: 'faas',
      project_id: resolvedProjectId,
      configuration: {
        region,
        timeout_seconds: timeoutSeconds,
        memory_mb: memoryMb,
      },
    };

    if (provider === 'aws') {
      payload.configuration = {
        ...payload.configuration,
        function_name: name.trim(),
        runtime,
        handler: 'index.lambda_handler',
        timeout: timeoutSeconds,
        memory_size: memoryMb,
      };
    } else if (provider === 'azure') {
      payload.configuration = {
        ...payload.configuration,
        location: region,
        runtime_version: runtime,
      };
    } else {
      payload.configuration = {
        ...payload.configuration,
        function_name: normalizeFunctionName(name),
        runtime,
        entry_point: 'handler',
      };
    }

    createMutation.mutate(payload);
  };

  const numericSelectedProjectId =
    typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
  const selectedProject = projects.find((project) => project.id === numericSelectedProjectId);
  const functionSlug = normalizeFunctionName(name);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHero
        id="create-function"
        tone="orange"
        eyebrow="Provision serverless runtime"
        eyebrowIcon={<Zap className="h-3.5 w-3.5" />}
        title="Create Function"
        titleIcon={<Zap className="w-8 h-8 text-orange-400" />}
        description="Create FaaS resources across AWS Lambda, Azure Functions, and Google Cloud Functions."
        chips={[
          { label: `provider: ${provider.toUpperCase()}`, tone: 'orange' },
          { label: `region: ${region}`, tone: 'cyan' },
          { label: `runtime: ${runtime}`, tone: 'blue' },
        ]}
        actions={
          <button
            onClick={() => navigate('/resources/functions')}
            className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Functions
          </button>
        }
      />

      <PageGuide
        title="About Create Function"
        purpose="This flow creates provider-native serverless runtimes with unified configuration controls."
        actions={[
          'select cloud provider and deployment region',
          'choose runtime with timeout and memory limits',
          'provision a function deployment record and monitor status',
        ]}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                Cloud Provider
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Select where the serverless function should run.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'aws', name: 'AWS', description: 'Lambda' },
                  { id: 'azure', name: 'Azure', description: 'Functions' },
                  { id: 'gcp', name: 'GCP', description: 'Cloud Functions' },
                ].map((item) => {
                  const isSelected = provider === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setProvider(item.id as Provider)}
                      className={`cursor-pointer rounded-xl border p-4 text-left transition-colors ${
                        isSelected
                          ? 'border-orange-500/60 bg-orange-500/10'
                          : 'border-gray-800/70 bg-gray-900/40 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-white">{item.name}</p>
                        {isSelected && <Check className="w-4 h-4 text-orange-300" />}
                      </div>
                      <p className="mt-1 text-xs text-gray-400">{item.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                Function Configuration
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Define runtime profile and execution limits.
              </p>
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Function Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="orders-processor"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Region</label>
                <select
                  value={region}
                  onChange={(event) => setRegion(event.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {REGIONS[provider].map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Runtime</label>
                <select
                  value={runtime}
                  onChange={(event) => setRuntime(event.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                >
                  {RUNTIMES[provider].map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Timeout (seconds)</label>
                <input
                  type="number"
                  min={1}
                  max={900}
                  value={timeoutSeconds}
                  onChange={(event) => setTimeoutSeconds(Number(event.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Memory (MB)</label>
                <input
                  type="number"
                  min={128}
                  max={3072}
                  step={64}
                  value={memoryMb}
                  onChange={(event) => setMemoryMb(Number(event.target.value))}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                />
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Live Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Function</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">{name || 'not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-200 uppercase">{provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-200">{region}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Code2 className="w-3.5 h-3.5" />
                  Runtime
                </span>
                <span className="text-gray-200">{runtime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <Timer className="w-3.5 h-3.5" />
                  Timeout
                </span>
                <span className="text-gray-200">{timeoutSeconds}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 flex items-center gap-1">
                  <MemoryStick className="w-3.5 h-3.5" />
                  Memory
                </span>
                <span className="text-gray-200">{memoryMb} MB</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-800/70">
                <p className="text-gray-500 text-xs">
                  normalized id: {functionSlug || 'pending'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-3">
            <div className="space-y-3">
              <label className="text-xs uppercase tracking-wider text-gray-400">Project target</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setProjectMode('current');
                    setProjectError(null);
                  }}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    projectMode === 'current'
                      ? 'border-orange-500/60 bg-orange-500/10 text-orange-200'
                      : 'border-gray-700/70 bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  Current
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setProjectMode('new');
                    setProjectError(null);
                  }}
                  className={`cursor-pointer rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                    projectMode === 'new'
                      ? 'border-orange-500/60 bg-orange-500/10 text-orange-200'
                      : 'border-gray-700/70 bg-gray-800/60 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  New
                </button>
              </div>

              {projectMode === 'current' ? (
                <div>
                  <select
                    value={selectedProjectId}
                    onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                    disabled={isProjectsLoading || projects.length === 0}
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40 disabled:opacity-60"
                  >
                    <option value="" disabled>
                      {isProjectsLoading ? 'Loading projects...' : projects.length ? 'Select project' : 'No projects'}
                    </option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                  {selectedProject && (
                    <p className="mt-2 text-xs text-gray-500">Using: {selectedProject.name}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newProjectName}
                    onChange={(event) => setNewProjectName(event.target.value)}
                    placeholder="Project name"
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                  <textarea
                    value={newProjectDescription}
                    onChange={(event) => setNewProjectDescription(event.target.value)}
                    placeholder="Description (optional)"
                    rows={3}
                    className="w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-3 py-2 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
                  />
                </div>
              )}
            </div>

            {projectError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                {projectError}
              </div>
            )}

            {submitError && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{submitError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`cursor-pointer w-full flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
                createMutation.isPending
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600'
              }`}
            >
              {createMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Provisioning...
                </>
              ) : (
                'Create Function'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/functions')}
              className="cursor-pointer w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateFunctionPage;
