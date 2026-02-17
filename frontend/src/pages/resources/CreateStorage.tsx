import React from 'react';
import { useForm } from 'react-hook-form';
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
  Database,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader,
  Shield,
  Globe,
  History,
  HardDrive,
  Box,
  Cloud,
} from 'lucide-react';



const regions = {
  aws: [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
    { value: 'eu-west-1', label: 'EU West (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
  ],
  azure: [
    { value: 'eastus', label: 'East US' },
    { value: 'westus', label: 'West US' },
    { value: 'northeurope', label: 'North Europe' },
    { value: 'southeastasia', label: 'Southeast Asia' },
  ],
  gcp: [
    { value: 'us-central1', label: 'US Central (Iowa)' },
    { value: 'us-east1', label: 'US East (South Carolina)' },
    { value: 'europe-west1', label: 'Europe West (Belgium)' },
    { value: 'asia-southeast1', label: 'Asia Southeast (Singapore)' },
  ],
};

interface CreateStorageForm {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  check_public_access: boolean;
  versioning_enabled: boolean;
  encryption_enabled: boolean;
}

interface CreateStoragePayload {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  type: 'storage';
  project_id: number;
  configuration: {
    region: string;
    bucket_name: string;
    public_access: boolean;
    versioning_enabled: boolean;
    encryption_enabled: boolean;
  };
}

interface CreateStorageResponse {
  id: number;
  status: string;
  terraform_output?: {
    error?: string;
    detail?: string;
    [key: string]: unknown;
  } | null;
}

interface ProjectOption {
  id: number;
  name: string;
}

const CreateStorage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [projectError, setProjectError] = React.useState<string | null>(null);
  const [projectMode, setProjectMode] = React.useState<'current' | 'new'>('current');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | ''>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateStorageForm>({
    defaultValues: {
      provider: 'aws',
      region: 'us-east-1',
      check_public_access: false,
      versioning_enabled: false,
      encryption_enabled: true,
    }
  });

  const selectedProvider = watch('provider');
  const bucketName = watch('name');
  const selectedRegion = watch('region');
  const publicAccessEnabled = watch('check_public_access');
  const versioningEnabled = watch('versioning_enabled');
  const encryptionEnabled = watch('encryption_enabled');

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'create-storage'],
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

  // Update region when provider changes
  React.useEffect(() => {
    const defaultRegion = regions[selectedProvider][0].value;
    setValue('region', defaultRegion);
  }, [selectedProvider, setValue]);

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
    mutationFn: async ({ data, projectId }: { data: CreateStorageForm; projectId: number }) => {
      const payload: CreateStoragePayload = {
        name: data.name,
        provider: data.provider,
        type: 'storage',
        project_id: projectId,
        configuration: {
          region: data.region,
          bucket_name: data.name,
          public_access: data.check_public_access,
          versioning_enabled: data.versioning_enabled,
          encryption_enabled: data.encryption_enabled,
        },
      };
      const response = await axios.post('/resources/', payload);
      return response.data as CreateStorageResponse;
    },
    onSuccess: (resource) => {
      if (resource?.status === 'failed') {
        setSubmitError(
          extractProvisioningErrorMessage(
            resource.terraform_output,
            'Resource request was accepted but provisioning could not be queued.'
          )
        );
        return;
      }
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      navigate('/resources/storage');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail !== undefined) {
        setSubmitError(
          extractProvisioningErrorMessage(detail, 'Failed to create storage bucket. Please try again.')
        );
        return;
      }
      setSubmitError('Failed to create storage bucket. Please try again.');
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

  const onSubmit = async (data: CreateStorageForm) => {
    setSubmitError(null);
    setProjectError(null);
    const resolvedProjectId = await resolveProjectId();
    if (!resolvedProjectId) return;
    createMutation.mutate({ data, projectId: resolvedProjectId });
  };

  const numericSelectedProjectId =
    typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
  const selectedProject = projects.find((project) => project.id === numericSelectedProjectId);
  const hardeningScore = [!publicAccessEnabled, versioningEnabled, encryptionEnabled].filter(Boolean).length;
  const applySecurityPreset = (preset: 'hardened' | 'public-read' | 'balanced') => {
    if (preset === 'hardened') {
      setValue('check_public_access', false, { shouldDirty: true });
      setValue('versioning_enabled', true, { shouldDirty: true });
      setValue('encryption_enabled', true, { shouldDirty: true });
      return;
    }

    if (preset === 'public-read') {
      setValue('check_public_access', true, { shouldDirty: true });
      setValue('versioning_enabled', false, { shouldDirty: true });
      setValue('encryption_enabled', true, { shouldDirty: true });
      return;
    }

    setValue('check_public_access', false, { shouldDirty: true });
    setValue('versioning_enabled', true, { shouldDirty: true });
    setValue('encryption_enabled', false, { shouldDirty: true });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <PageHero
        id="create-storage"
        tone="purple"
        eyebrow="Provision object storage"
        eyebrowIcon={<Database className="h-3.5 w-3.5" />}
        title="Create Storage Bucket"
        titleIcon={<Database className="w-8 h-8 text-purple-400" />}
        description="Provision a new object storage bucket with region, access, and protection controls."
        chips={[
          { label: `provider: ${selectedProvider.toUpperCase()}`, tone: 'purple' },
          { label: `region: ${watch('region')}`, tone: 'cyan' },
        ]}
        actions={
          <button
            onClick={() => navigate('/resources/storage')}
            className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Storage
          </button>
        }
      />

      <PageGuide
        title="About Create Storage"
        purpose="This form provisions object storage buckets across AWS, Azure, and GCP."
        actions={[
          'pick provider and region',
          'set access, versioning, and encryption options',
          'create a storage resource that appears in inventory',
        ]}
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                Cloud Provider
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Choose where this bucket should be created.
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'aws', name: 'AWS', description: 'S3 bucket' },
                  { id: 'azure', name: 'Azure', description: 'Blob container' },
                  { id: 'gcp', name: 'GCP', description: 'Cloud Storage' },
                ].map((provider) => {
                  const isSelected = selectedProvider === provider.id;
                  return (
                    <label key={provider.id} className="cursor-pointer">
                      <input type="radio" value={provider.id} {...register('provider')} className="sr-only" />
                      <div
                        className={`rounded-xl border p-4 transition-colors ${
                          isSelected
                            ? 'border-purple-500/60 bg-purple-500/10'
                            : 'border-gray-800/70 bg-gray-900/40 hover:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-white">{provider.name}</p>
                          {isSelected && <Check className="w-4 h-4 text-purple-300" />}
                        </div>
                        <p className="mt-1 text-xs text-gray-400">{provider.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-cyan-400" />
                Configuration
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Basic naming and placement for this resource.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Bucket Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      {...register('name', {
                        required: 'Bucket name is required',
                        minLength: {
                          value: 3,
                          message: 'Bucket name must be at least 3 characters',
                        },
                        maxLength: {
                          value: 63,
                          message: 'Bucket name must be 63 characters or fewer',
                        },
                        pattern: {
                          value: /^[a-z0-9][a-z0-9-.]*[a-z0-9]$/,
                          message: 'Invalid bucket name format',
                        },
                      })}
                      className={`w-full bg-[#0a0a0c] border rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:ring-1 transition-colors ${
                        errors.name
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/50'
                      }`}
                      placeholder="my-unique-bucket-name"
                    />
                    {errors.name && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                        <AlertCircle className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  {errors.name ? (
                    <p className="text-xs text-red-400">{errors.name.message}</p>
                  ) : (
                    <p className="text-xs text-gray-500">Use lowercase letters, numbers, and hyphens.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Region <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <Globe className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      list={`region-options-${selectedProvider}`}
                      {...register('region', { required: 'Region is required' })}
                      className={`w-full bg-[#0a0a0c] border rounded-lg pl-10 pr-4 py-3 text-white placeholder-gray-600 focus:ring-1 transition-colors ${
                        errors.region
                          ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                          : 'border-gray-700/50 focus:border-purple-500/50 focus:ring-purple-500/50'
                      }`}
                      placeholder="Type or select region"
                    />
                  </div>
                  <datalist id={`region-options-${selectedProvider}`}>
                    {regions[selectedProvider]?.map((region) => (
                      <option key={region.value} value={region.value}>
                        {region.label}
                      </option>
                    ))}
                  </datalist>
                  {errors.region ? (
                    <p className="text-xs text-red-400">{errors.region.message}</p>
                  ) : (
                    <p className="text-xs text-gray-500">You can type any valid provider region.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                Access & Protection
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Apply a preset or customize each policy.
              </p>
            </div>

            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => applySecurityPreset('hardened')}
                  className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/15"
                >
                  Hardened
                </button>
                <button
                  type="button"
                  onClick={() => applySecurityPreset('balanced')}
                  className="cursor-pointer rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/15"
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => applySecurityPreset('public-read')}
                  className="cursor-pointer rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200 hover:bg-yellow-500/15"
                >
                  Public Read
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <Globe className="w-4 h-4 text-yellow-300 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-white">Public Access</h3>
                      <p className="text-xs text-gray-400">Allow unauthenticated reads.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" {...register('check_public_access')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:content-[''] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600" />
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <History className="w-4 h-4 text-blue-300 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-white">Versioning</h3>
                      <p className="text-xs text-gray-400">Keep historical object versions.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" {...register('versioning_enabled')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:content-[''] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600" />
                  </div>
                </label>

                <label className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-800/40 transition-colors">
                  <div className="flex items-start gap-3">
                    <Shield className="w-4 h-4 text-emerald-300 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-medium text-white">Encryption</h3>
                      <p className="text-xs text-gray-400">Encrypt data at rest.</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input type="checkbox" {...register('encryption_enabled')} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:content-[''] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-purple-600" />
                  </div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200 flex items-center gap-2">
              <Box className="w-4 h-4 text-purple-300" />
              Project Assignment
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProjectMode('current')}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
                  projectMode === 'current'
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-100'
                    : 'border-gray-700/60 bg-gray-900/50 text-gray-300 hover:bg-gray-800/60'
                }`}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => setProjectMode('new')}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
                  projectMode === 'new'
                    ? 'border-purple-500/50 bg-purple-500/10 text-purple-100'
                    : 'border-gray-700/60 bg-gray-900/50 text-gray-300 hover:bg-gray-800/60'
                }`}
              >
                New
              </button>
            </div>

            {projectMode === 'current' ? (
              <div className="space-y-2">
                <label className="text-xs text-gray-500 uppercase tracking-wider">Project</label>
                <select
                  value={selectedProjectId}
                  onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                  disabled={isProjectsLoading || projects.length === 0}
                  className="w-full bg-[#0a0a0c] border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 disabled:opacity-50"
                >
                  <option value="">Select project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
                {projects.length === 0 && !isProjectsLoading && (
                  <p className="text-xs text-yellow-300">No projects found. Switch to New.</p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="Project name"
                  className="w-full bg-[#0a0a0c] border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
                <textarea
                  value={newProjectDescription}
                  onChange={(event) => setNewProjectDescription(event.target.value)}
                  rows={2}
                  placeholder="Description (optional)"
                  className="w-full resize-none bg-[#0a0a0c] border border-gray-700/50 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder-gray-500 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50"
                />
              </div>
            )}
          </div>

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Live Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Bucket</span>
                <span className="text-gray-200 font-medium truncate max-w-[180px] text-right">
                  {bucketName || 'not set'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-200 uppercase">{selectedProvider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-200">{selectedRegion || 'not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Project</span>
                <span className="text-gray-200 truncate max-w-[180px] text-right">
                  {projectMode === 'new' ? newProjectName || 'new project' : selectedProject?.name || 'not selected'}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-800/70 flex items-center justify-between">
                <span className="text-gray-500">Security score</span>
                <span className="text-purple-300 font-semibold">{hardeningScore}/3</span>
              </div>
            </div>
          </div>

          {(projectError || createMutation.isError || submitError) && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{projectError || submitError || 'Failed to create storage bucket. Please try again.'}</p>
            </div>
          )}

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`cursor-pointer w-full flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
                createMutation.isPending
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-purple-500 hover:bg-purple-600'
              }`}
            >
              {createMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Provisioning...
                </>
              ) : (
                'Create Bucket'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/storage')}
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

export default CreateStorage;
