import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import PageHero from '../../components/ui/PageHero';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  readCurrentProjectId,
  setCurrentProject,
} from '../../utils/currentProject';
import {
  Network,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader,
  Plus,
  Trash2,
  CheckCircle
} from 'lucide-react';

const regions = {
  aws: [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
    { value: 'eu-west-1', label: 'EU West (Ireland)' },
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
    { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' },
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

interface CreateNetworkForm {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  resources_to_create: 'vpc_only' | 'vpc_and_more';
  ipv4_allocation: 'manual' | 'ipam';
  cidr_block: string;
  ipv6_allocation: 'none' | 'ipam' | 'amazon_provided' | 'owned_by_me';
  tenancy: 'default' | 'dedicated';
  encryption_control: 'none' | 'monitor' | 'enforce';
  enable_dns: boolean;
  enable_nat: boolean;
  tags: { key: string; value: string }[];
}

interface ProjectOption {
  id: number;
  name: string;
}

const CreateNetwork: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [projectMode, setProjectMode] = React.useState<'current' | 'new'>('current');
  const [selectedProjectId, setSelectedProjectId] = React.useState<number | ''>('');
  const [newProjectName, setNewProjectName] = React.useState('');
  const [newProjectDescription, setNewProjectDescription] = React.useState('');
  const [projectError, setProjectError] = React.useState<string | null>(null);

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'create-network'],
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
  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateNetworkForm>({
    defaultValues: {
      provider: 'aws',
      region: 'us-east-1',
      resources_to_create: 'vpc_only',
      ipv4_allocation: 'manual',
      cidr_block: '10.0.0.0/16',
      ipv6_allocation: 'none',
      tenancy: 'default',
      encryption_control: 'none',
      enable_dns: true,
      enable_nat: false,
      tags: [],
    }
  });

  const { fields: tagFields, append: appendTag, remove: removeTag } = useFieldArray({
    control,
    name: "tags"
  });

  const selectedProvider = watch('provider');
  const networkName = watch('name');
  const selectedRegion = watch('region');
  const cidrBlock = watch('cidr_block');
  const dnsEnabled = watch('enable_dns');
  const natEnabled = watch('enable_nat');
  const ipv4Allocation = watch('ipv4_allocation');

  const applyCidrPreset = (cidr: string) => {
    setValue('cidr_block', cidr, { shouldDirty: true });
  };

  // Update region when provider changes
  React.useEffect(() => {
    const defaultRegion = regions[selectedProvider][0].value;
    setValue('region', defaultRegion);
  }, [selectedProvider, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateNetworkForm & { resolved_project_id: number }) => {
      const payload = {
        name: data.name,
        provider: data.provider,
        type: 'network', 
        project_id: data.resolved_project_id,
        configuration: {
            region: data.region,
            resources_to_create: data.resources_to_create,
            ipv4_allocation: data.ipv4_allocation,
            cidr_block: data.cidr_block,
            ipv6_allocation: data.ipv6_allocation,
            tenancy: data.tenancy,
            encryption_control: data.encryption_control,
            dns_enabled: data.enable_dns,
            nat_gateway: data.enable_nat,
            tags: data.tags,
        }
      };
      return await axios.post('/resources/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'networks'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      navigate('/resources/networks');
    },
  });

  const resolveProjectId = async (): Promise<number | null> => {
    if (projectMode === 'new') {
      const trimmedName = newProjectName.trim();
      if (!trimmedName) {
        setProjectError('New project name is required.');
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
      setProjectError('Select a project or create a new one.');
      return null;
    }
    return projectId;
  };

  const onSubmit = async (data: CreateNetworkForm) => {
    setProjectError(null);
    const resolved_project_id = await resolveProjectId();
    if (!resolved_project_id) return;
    
    createMutation.mutate({ ...data, resolved_project_id });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <PageHero
        id="create-network"
        tone="cyan"
        eyebrow="Provision networking fabric"
        eyebrowIcon={<Network className="h-3.5 w-3.5" />}
        title="Create Virtual Network"
        titleIcon={<Network className="w-8 h-8 text-cyan-400" />}
        description="Provision a new VPC/VNET and define DNS, NAT, and CIDR behavior."
        chips={[
          { label: `provider: ${selectedProvider.toUpperCase()}`, tone: 'cyan' },
          { label: `region: ${watch('region')}`, tone: 'blue' },
        ]}
        guide={{
          title: 'About Create Network',
          purpose: 'Create network foundations for your workloads, including CIDR design and core networking controls.',
          actions: [
            'select provider and deployment region',
            'define CIDR and gateway behavior',
            'provision network resources for compute and storage',
          ],
        }}
        actions={
          <button
            onClick={() => navigate('/resources/networks')}
            className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
          >
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back to Networks
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Cloud Provider</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['aws', 'azure', 'gcp'] as const).map((provider) => (
                <label
                  key={provider}
                  className={`relative flex flex-col items-center p-4 cursor-pointer rounded-lg border transition-colors ${
                    selectedProvider === provider
                      ? 'border-cyan-500/60 bg-cyan-500/10'
                      : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'
                  }`}
                >
                  <input type="radio" value={provider} {...register('provider')} className="hidden" />
                  <span className="font-medium text-white">{provider.toUpperCase()}</span>
                  {selectedProvider === provider && (
                    <div className="absolute top-2 right-2 text-cyan-400">
                      <Check className="w-4 h-4" />
                    </div>
                  )}
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/60 rounded-2xl p-6 space-y-6">
            <h2 className="text-lg font-semibold text-white">VPC Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-2">Resources to create</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="vpc_only" {...register('resources_to_create')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    VPC only
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="vpc_and_more" {...register('resources_to_create')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    VPC and more
                  </label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Name tag</label>
                <p className="text-xs text-gray-500 mb-2">Creates a tag with a key of 'Name' and a value that you specify.</p>
                <input
                  type="text"
                  {...register('name', { required: 'Network name is required' })}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  placeholder="my-vpc-network"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Region</label>
                <p className="text-xs text-gray-500 mb-2">Deployment region for this network.</p>
                <select
                  {...register('region')}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                >
                  {regions[selectedProvider]?.map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-4">
                <label className="block text-xs uppercase tracking-wider text-gray-400">IPv4 CIDR block</label>
                
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="manual" {...register('ipv4_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    IPv4 CIDR manual input
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="ipam" {...register('ipv4_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    IPAM-allocated IPv4 CIDR block
                  </label>
                </div>
                
                {ipv4Allocation === 'manual' && (
                  <div className="mt-3">
                    <label className="block text-sm text-gray-300 mb-2">IPv4 CIDR</label>
                    <input
                      type="text"
                      {...register('cidr_block', {
                        required: 'CIDR block is required',
                        pattern: {
                          value: /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
                          message: 'Invalid CIDR format (e.g., 10.0.0.0/16)',
                        },
                      })}
                      className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="10.0.0.0/16"
                    />
                    <p className="text-xs text-gray-500 mt-1">CIDR block size must be between /16 and /28.</p>
                    {errors.cidr_block && (
                      <p className="mt-1 text-xs text-red-400 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {errors.cidr_block.message}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {['10.0.0.0/16', '172.16.0.0/16', '192.168.0.0/24'].map((cidr) => (
                        <button
                          key={cidr}
                          type="button"
                          onClick={() => applyCidrPreset(cidr)}
                          className="cursor-pointer rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-200 hover:bg-cyan-500/15"
                        >
                          Use {cidr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-800/50">
                <label className="block text-xs uppercase tracking-wider text-gray-400">IPv6 CIDR block</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="none" {...register('ipv6_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    No IPv6 CIDR block
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="ipam" {...register('ipv6_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    IPAM-allocated IPv6 CIDR block
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="amazon_provided" {...register('ipv6_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    Amazon-provided IPv6 CIDR block
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="owned_by_me" {...register('ipv6_allocation')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    IPv6 CIDR owned by me
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-800/50">
                <label className="block text-xs uppercase tracking-wider text-gray-400">Tenancy</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="default" {...register('tenancy')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    Default
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="dedicated" {...register('tenancy')} className="text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    Dedicated
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-800/50">
                <div className="flex items-center gap-2">
                  <label className="block text-xs uppercase tracking-wider text-gray-400">VPC encryption control ($)</label>
                </div>
                <p className="text-xs text-gray-500">Monitor mode provides visibility into encryption status without blocking traffic. Enforce mode prevents unencrypted traffic. Additional charges apply.</p>
                <div className="flex flex-col gap-3">
                  <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="none" {...register('encryption_control')} className="mt-1 text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    <div>
                      <span className="font-medium text-gray-200">None</span>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="monitor" {...register('encryption_control')} className="mt-1 text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    <div>
                      <span className="font-medium text-gray-200">Monitor mode</span>
                      <p className="text-xs text-gray-500 mt-1">See which resources in your VPC are unencrypted but allow the creation of unencrypted resources.</p>
                    </div>
                  </label>
                  <label className="flex items-start gap-2 cursor-pointer text-sm text-gray-300">
                    <input type="radio" value="enforce" {...register('encryption_control')} className="mt-1 text-cyan-500 focus:ring-cyan-500 bg-gray-800 border-gray-700" />
                    <div>
                      <span className="font-medium text-gray-200">Enforce mode</span>
                      <p className="text-xs text-gray-500 mt-1">Requires all resources, except exclusions, in your VPC to be encryption-capable and blocks creation of unencrypted resources.</p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4 pt-4 border-t border-gray-800/50">
                <div>
                  <h3 className="text-sm font-semibold text-white">Tags</h3>
                  <p className="text-xs text-gray-500 mt-1">A tag is a label that you assign to an AWS resource. Each tag consists of a key and an optional value. You can use tags to search and filter your resources or track your AWS costs.</p>
                </div>
                
                {tagFields.length === 0 ? (
                  <div className="py-4 text-center border border-dashed border-gray-700/50 rounded-lg">
                    <p className="text-sm text-gray-500">No tags associated with the resource</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {tagFields.map((field, index) => (
                      <div key={field.id} className="flex items-start gap-3">
                        <div className="flex-1">
                          <input
                            {...register(`tags.${index}.key` as const, { required: true })}
                            placeholder="Key"
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                          />
                        </div>
                        <div className="flex-1">
                          <input
                            {...register(`tags.${index}.value` as const)}
                            placeholder="Value"
                            className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="p-2 text-gray-400 hover:text-red-400 bg-gray-800/50 border border-gray-700/50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => appendTag({ key: '', value: '' })}
                  className="flex items-center text-sm text-cyan-400 hover:text-cyan-300 font-medium transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add new tag
                </button>
              </div>

            </div>

            <div className="space-y-3 pt-6 border-t border-gray-800/50">
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-800/40 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-white">Enable DNS Options</h3>
                  <p className="text-xs text-gray-400">DNS hostnames and resolution.</p>
                </div>
                <div className="relative">
                  <input type="checkbox" {...register('enable_dns')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:content-[''] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-cyan-600" />
                </div>
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-800 bg-gray-900/20 cursor-pointer hover:bg-gray-800/40 transition-colors">
                <div>
                  <h3 className="text-sm font-medium text-white">Create NAT Gateway</h3>
                  <p className="text-xs text-gray-400">Internet access for private subnets.</p>
                </div>
                <div className="relative">
                  <input type="checkbox" {...register('enable_nat')} className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:absolute after:top-[2px] after:left-[2px] after:content-[''] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all peer-checked:bg-cyan-600" />
                </div>
              </label>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-24">
          {/* Project Assignment Section */}
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-semibold tracking-wide text-gray-200">Project Assignment</h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProjectMode('current')}
                className={`cursor-pointer rounded-lg border px-3 py-2 text-xs transition-colors ${
                  projectMode === 'current'
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-100'
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
                    ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-100'
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
                className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 disabled:opacity-60"
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
                  className="w-full px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
                <textarea
                  value={newProjectDescription}
                  onChange={(event) => setNewProjectDescription(event.target.value)}
                  rows={2}
                  placeholder="Description (optional)"
                  className="w-full resize-none px-3 py-2.5 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>
            )}
          </div>
          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-gray-200 mb-3">Live Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Network</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">{networkName || 'not set'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Provider</span>
                <span className="text-gray-200 uppercase">{selectedProvider}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">Region</span>
                <span className="text-gray-200">{selectedRegion}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500">CIDR</span>
                <span className="text-cyan-300">{cidrBlock}</span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-800/70 flex items-center justify-between">
                <span className="text-gray-500">Project</span>
                <span className="text-gray-200 truncate max-w-[170px] text-right">
                  {projectMode === 'new' ? newProjectName || 'new project' : projects.find(p => p.id === (typeof selectedProjectId === 'number' ? selectedProjectId : Number(selectedProjectId)))?.name || 'not selected'}
                </span>
              </div>
              <div className="pt-2 mt-2 border-t border-gray-800/70">
                <p className="text-gray-500 text-xs">
                  DNS: {dnsEnabled ? 'enabled' : 'disabled'} | NAT: {natEnabled ? 'enabled' : 'disabled'}
                </p>
              </div>
            </div>
          </div>

          {(projectError || createMutation.isError) && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Failed to create network</p>
                <p className="mt-1 text-red-300/80 text-xs">
                  {projectError || (createMutation.error as any)?.response?.data?.detail || 'Please verify CIDR and provider permissions.'}
                </p>
              </div>
            </div>
          )}

          <div className="bg-[#101015] border border-gray-800/70 rounded-2xl p-5 space-y-3">
            <button
              type="submit"
              disabled={createMutation.isPending}
              className={`cursor-pointer w-full flex items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold text-white transition-colors ${
                createMutation.isPending
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-600'
              }`}
            >
              {createMutation.isPending ? (
                <>
                  <Loader className="w-4 h-4 animate-spin mr-2" />
                  Provisioning...
                </>
              ) : (
                'Create Network'
              )}
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/networks')}
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

export default CreateNetwork;
