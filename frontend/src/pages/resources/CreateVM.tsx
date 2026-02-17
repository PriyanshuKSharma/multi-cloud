import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import { extractProvisioningErrorMessage } from '../../utils/terraformOutput';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  readCurrentProjectId,
  setCurrentProject,
} from '../../utils/currentProject';
import {
  ArrowLeft,
  Server,
  Cloud,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';

interface VMConfig {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  type: 'vm';
  project_id: number;
  configuration: {
    instance_type: string;
    ami?: string;
    instance_name?: string;
    region: string;
    vpc_id?: string;
    subnet_id?: string;
    key_name?: string;
    security_groups?: string[];
  };
}

interface InstanceTypeOption {
  value: string;
  label: string;
  specs: string;
  cost: string;
  freeTier?: boolean;
}

interface CreateVMResponse {
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

const CreateVMPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [projectError, setProjectError] = React.useState<string | null>(null);
  const [awsFreeTierOnly, setAwsFreeTierOnly] = React.useState(true);
  const [projectMode, setProjectMode] = React.useState<'current' | 'new'>('current');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | ''>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');

  const [formData, setFormData] = React.useState<VMConfig>({
    name: '',
    provider: 'aws',
    type: 'vm',
    project_id: 0,
    configuration: {
      instance_type: 't3.micro',
      region: 'us-east-1',
    },
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'create-vm'],
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
    mutationFn: async (data: VMConfig) => {
      const payload: VMConfig = {
        ...data,
        configuration: {
          ...data.configuration,
          instance_name: data.name,
          ami: data.configuration.ami?.trim() || undefined,
        },
      };

      const response = await axios.post('/resources/', payload);
      return response.data as CreateVMResponse;
    },
    onSuccess: (resource) => {
      if (resource?.status === 'failed') {
        setSubmitError(
          extractProvisioningErrorMessage(
            resource.terraform_output,
            'VM request was accepted but provisioning could not be queued.'
          )
        );
        return;
      }
      setSubmitError(null);
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      navigate('/deployments');
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      if (detail !== undefined) {
        setSubmitError(
          extractProvisioningErrorMessage(detail, 'Failed to create VM resource. Please try again.')
        );
        return;
      }
      setSubmitError('Failed to create VM resource. Please try again.');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setProjectError(null);

    const resolvedProjectId = await resolveProjectId();
    if (!resolvedProjectId) return;

    createMutation.mutate({
      ...formData,
      project_id: resolvedProjectId,
    });
  };

  const providerOptions = [
    { value: 'aws', label: 'AWS', description: 'Amazon Web Services' },
    { value: 'azure', label: 'Azure', description: 'Microsoft Azure' },
    { value: 'gcp', label: 'GCP', description: 'Google Cloud Platform' },
  ];

  const instanceTypes: Record<'aws' | 'azure' | 'gcp', InstanceTypeOption[]> = {
    aws: [
      { value: 't2.micro', label: 't2.micro', specs: '1 vCPU • 1 GB RAM', cost: '$0.0116/hour', freeTier: true },
      { value: 't3.micro', label: 't3.micro', specs: '2 vCPU • 1 GB RAM', cost: '$0.0104/hour', freeTier: true },
      { value: 't3.small', label: 't3.small', specs: '2 vCPU • 2 GB RAM', cost: '$0.0208/hour' },
      { value: 't3.medium', label: 't3.medium', specs: '2 vCPU • 4 GB RAM', cost: '$0.0416/hour' },
      { value: 't3.large', label: 't3.large', specs: '2 vCPU • 8 GB RAM', cost: '$0.0832/hour' },
      { value: 'm5.large', label: 'm5.large', specs: '2 vCPU • 8 GB RAM', cost: '$0.096/hour' },
      { value: 'm5.xlarge', label: 'm5.xlarge', specs: '4 vCPU • 16 GB RAM', cost: '$0.192/hour' },
    ],
    azure: [
      { value: 'Standard_B1s', label: 'Standard_B1s', specs: '1 vCPU • 1 GB RAM', cost: '$0.0104/hour' },
      { value: 'Standard_B2s', label: 'Standard_B2s', specs: '2 vCPU • 4 GB RAM', cost: '$0.0416/hour' },
      { value: 'Standard_D2s_v3', label: 'Standard_D2s_v3', specs: '2 vCPU • 8 GB RAM', cost: '$0.096/hour' },
    ],
    gcp: [
      { value: 'e2-micro', label: 'e2-micro', specs: '2 vCPU • 1 GB RAM', cost: '$0.0084/hour' },
      { value: 'e2-small', label: 'e2-small', specs: '2 vCPU • 2 GB RAM', cost: '$0.0168/hour' },
      { value: 'e2-medium', label: 'e2-medium', specs: '2 vCPU • 4 GB RAM', cost: '$0.0336/hour' },
    ],
  };

  const regions = {
    aws: ['us-east-1', 'us-west-2', 'ap-south-1', 'eu-west-1', 'ap-southeast-1'],
    azure: ['eastus', 'westus', 'westeurope', 'southeastasia'],
    gcp: ['us-central1', 'us-west1', 'europe-west1', 'asia-southeast1'],
  };

  const availableInstanceTypes = React.useMemo(() => {
    if (formData.provider === 'aws' && awsFreeTierOnly) {
      const freeTierTypes = instanceTypes.aws.filter((type) => type.freeTier);
      return freeTierTypes.length > 0 ? freeTierTypes : instanceTypes.aws;
    }
    return instanceTypes[formData.provider];
  }, [formData.provider, awsFreeTierOnly]);

  React.useEffect(() => {
    const hasSelectedType = availableInstanceTypes.some(
      (type) => type.value === formData.configuration.instance_type
    );
    if (!hasSelectedType && availableInstanceTypes.length > 0) {
      setFormData((previous) => ({
        ...previous,
        configuration: {
          ...previous.configuration,
          instance_type: availableInstanceTypes[0].value,
        },
      }));
    }
  }, [availableInstanceTypes, formData.configuration.instance_type]);

  const selectedInstanceType = availableInstanceTypes.find(
    (t) => t.value === formData.configuration.instance_type
  );
  const numericSelectedProjectId =
    typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId);
  const selectedProject = projects.find((project) => project.id === numericSelectedProjectId);

  const applyVmPreset = (preset: 'cost' | 'balanced' | 'performance') => {
    const byProvider = instanceTypes[formData.provider];
    if (byProvider.length === 0) return;

    const nextType =
      preset === 'cost'
        ? byProvider[0].value
        : preset === 'balanced'
          ? byProvider[Math.min(1, byProvider.length - 1)].value
          : byProvider[byProvider.length - 1].value;

    setFormData((previous) => ({
      ...previous,
      configuration: {
        ...previous.configuration,
        instance_type: nextType,
      },
    }));
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHero
        id="create-vm"
        tone="blue"
        eyebrow="Provision compute"
        eyebrowIcon={<Cloud className="h-3.5 w-3.5" />}
        title="Create Virtual Machine"
        titleIcon={<Server className="w-8 h-8 text-blue-400" />}
        description="Deploy a new VM using Terraform-backed orchestration and live job tracking."
        chips={[
          { label: `provider: ${formData.provider.toUpperCase()}`, tone: 'blue' },
          { label: `region: ${formData.configuration.region}`, tone: 'cyan' },
        ]}
        actions={
          <Link
            to="/resources/vms"
            className="cursor-pointer flex items-center space-x-2 rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to VMs</span>
          </Link>
        }
      />

      <PageGuide
        title="About Create VM"
        purpose="Use this form to define provider-specific VM configuration and launch compute through the provisioning engine."
        actions={[
          'select provider, region, and instance type',
          'configure networking and machine access settings',
          'submit to create a managed VM resource',
        ]}
      />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white">Cloud Provider</h2>
              <p className="mt-1 text-sm text-gray-400">Pick the provider and compute profile.</p>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {providerOptions.map((provider) => (
                  <button
                    key={provider.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        provider: provider.value as VMConfig['provider'],
                        configuration: {
                          ...formData.configuration,
                          instance_type:
                            provider.value === 'aws' && awsFreeTierOnly
                              ? (instanceTypes.aws.find((type) => type.freeTier)?.value ?? instanceTypes.aws[0].value)
                              : instanceTypes[provider.value as VMConfig['provider']][0].value,
                          region: regions[provider.value as VMConfig['provider']][0],
                        },
                      })
                    }
                    className={`rounded-xl border p-4 transition-colors ${
                      formData.provider === provider.value
                        ? 'border-blue-500/60 bg-blue-500/10'
                        : 'border-gray-800/70 bg-gray-900/40 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <ProviderIcon provider={provider.value as VMConfig['provider']} size="lg" />
                      <div className="text-center">
                        <p className="text-sm font-semibold text-white">{provider.label}</p>
                        <p className="text-xs text-gray-500">{provider.description}</p>
                      </div>
                      {formData.provider === provider.value && <CheckCircle className="w-4 h-4 text-blue-300" />}
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => applyVmPreset('cost')}
                  className="cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 hover:bg-emerald-500/15"
                >
                  Cost Saver
                </button>
                <button
                  type="button"
                  onClick={() => applyVmPreset('balanced')}
                  className="cursor-pointer rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/15"
                >
                  Balanced
                </button>
                <button
                  type="button"
                  onClick={() => applyVmPreset('performance')}
                  className="cursor-pointer rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-xs text-orange-200 hover:bg-orange-500/15"
                >
                  Performance
                </button>
              </div>
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-800/60">
              <h2 className="text-lg font-semibold text-white">Compute Configuration</h2>
              <p className="mt-1 text-sm text-gray-400">Name, placement, and machine size.</p>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                  Instance Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                  placeholder="e.g., web-server-01"
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                    Region <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.configuration.region}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, region: event.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {regions[formData.provider].map((region) => (
                      <option key={region} value={region}>
                        {region}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                    Instance Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    required
                    value={formData.configuration.instance_type}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        configuration: { ...formData.configuration, instance_type: event.target.value },
                      })
                    }
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                  >
                    {availableInstanceTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.specs}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formData.provider === 'aws' && (
                <label className="flex items-center justify-between rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-3 cursor-pointer">
                  <div>
                    <p className="text-sm font-semibold text-yellow-200">Free Tier Safe Mode</p>
                    <p className="text-xs text-gray-400">Restrict to free-tier friendly AWS options.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={awsFreeTierOnly}
                    onChange={(event) => setAwsFreeTierOnly(event.target.checked)}
                    className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-blue-500 focus:ring-blue-500/50"
                  />
                </label>
              )}

              <details className="rounded-xl border border-gray-800/70 bg-gray-900/20">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-200">
                  Advanced Networking (Optional)
                </summary>
                <div className="border-t border-gray-800/70 px-4 py-4 space-y-4">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                      VPC ID
                    </label>
                    <input
                      type="text"
                      value={formData.configuration.vpc_id || ''}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          configuration: { ...formData.configuration, vpc_id: event.target.value },
                        })
                      }
                      placeholder="vpc-abc123"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                      Subnet ID
                    </label>
                    <input
                      type="text"
                      value={formData.configuration.subnet_id || ''}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          configuration: { ...formData.configuration, subnet_id: event.target.value },
                        })
                      }
                      placeholder="subnet-xyz789"
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                      Security Group IDs
                    </label>
                    <input
                      type="text"
                      value={(formData.configuration.security_groups || []).join(',')}
                      onChange={(event) =>
                        setFormData({
                          ...formData,
                          configuration: {
                            ...formData.configuration,
                            security_groups: event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean),
                          },
                        })
                      }
                      placeholder="sg-123...,sg-456..."
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                        SSH Key Pair
                      </label>
                      <input
                        type="text"
                        value={formData.configuration.key_name || ''}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            configuration: { ...formData.configuration, key_name: event.target.value },
                          })
                        }
                        placeholder="my-key-pair"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">
                        AMI ID
                      </label>
                      <input
                        type="text"
                        value={formData.configuration.ami || ''}
                        onChange={(event) =>
                          setFormData({
                            ...formData,
                            configuration: { ...formData.configuration, ami: event.target.value },
                          })
                        }
                        placeholder="ami-xxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      />
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200">Project Assignment</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProjectMode('current')}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
                  projectMode === 'current'
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-100'
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
                    ? 'border-blue-500/50 bg-blue-500/10 text-blue-100'
                    : 'border-gray-700/60 bg-gray-900/50 text-gray-300 hover:bg-gray-800/60'
                }`}
              >
                New
              </button>
            </div>

            {projectMode === 'current' ? (
              <select
                value={selectedProjectId}
                onChange={(event) => setSelectedProjectId(Number(event.target.value))}
                disabled={isProjectsLoading || projects.length === 0}
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:opacity-60"
              >
                <option value="">Select project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="space-y-2">
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(event) => setNewProjectName(event.target.value)}
                  placeholder="New project name"
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
                <textarea
                  value={newProjectDescription}
                  onChange={(event) => setNewProjectDescription(event.target.value)}
                  rows={2}
                  placeholder="Description (optional)"
                  className="w-full resize-none px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
            )}
          </div>

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Live Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">VM Name</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">{formData.name || 'not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-200 uppercase">{formData.provider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-200">{formData.configuration.region}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Instance</span>
                <span className="text-gray-200">{formData.configuration.instance_type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Est. Cost</span>
                <span className="text-blue-300">{selectedInstanceType?.cost ?? 'n/a'}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-800/70 flex items-center justify-between">
                <span className="text-gray-500">Project</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">
                  {projectMode === 'new' ? newProjectName || 'new project' : selectedProject?.name || 'not selected'}
                </span>
              </div>
            </div>
          </div>

          {(projectError || createMutation.isError || submitError) && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>{projectError || submitError || 'Failed to create VM resource. Please try again.'}</p>
            </div>
          )}

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`cursor-pointer w-full px-4 py-3 rounded-lg text-sm font-semibold text-white transition-colors ${
                createMutation.isPending
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {createMutation.isPending ? 'Creating VM...' : 'Create Virtual Machine'}
            </button>
            <Link
              to="/resources/vms"
              className="block w-full rounded-lg border border-gray-700/70 bg-gray-800/60 px-4 py-3 text-center text-sm font-medium text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Link>
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/10 p-3 text-xs text-gray-300">
              Terraform will queue this VM and track provisioning logs in Deployments.
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
};

export default CreateVMPage;
