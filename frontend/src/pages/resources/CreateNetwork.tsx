import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import {
  Network,
  ArrowLeft,
  Check,
  AlertCircle,
  Loader,
} from 'lucide-react';


const regions = {
  aws: [
    { value: 'us-east-1', label: 'US East (N. Virginia)' },
    { value: 'us-west-2', label: 'US West (Oregon)' },
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

interface CreateNetworkForm {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  cidr_block: string;
  enable_dns: boolean;
  enable_nat: boolean;
}

const CreateNetwork: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<CreateNetworkForm>({
    defaultValues: {
      provider: 'aws',
      region: 'us-east-1',
      cidr_block: '10.0.0.0/16',
      enable_dns: true,
      enable_nat: false,
    }
  });

  const selectedProvider = watch('provider');
  const networkName = watch('name');
  const selectedRegion = watch('region');
  const cidrBlock = watch('cidr_block');
  const dnsEnabled = watch('enable_dns');
  const natEnabled = watch('enable_nat');

  const applyCidrPreset = (cidr: string) => {
    setValue('cidr_block', cidr, { shouldDirty: true });
  };

  // Update region when provider changes
  React.useEffect(() => {
    const defaultRegion = regions[selectedProvider][0].value;
    setValue('region', defaultRegion);
  }, [selectedProvider, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateNetworkForm) => {
      const payload = {
        name: data.name,
        provider: data.provider,
        region: data.region,
        metadata: {
            cidr: data.cidr_block,
            dns_enabled: data.enable_dns,
            nat_gateway: data.enable_nat
        }
      };
      return await axios.post('/inventory/networks', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'networks'] });
      navigate('/resources/networks');
    },
  });

  const onSubmit = (data: CreateNetworkForm) => {
    createMutation.mutate(data);
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

      <PageGuide
        title="About Create Network"
        purpose="Create network foundations for your workloads, including CIDR design and core networking controls."
        actions={[
          'select provider and deployment region',
          'define CIDR and gateway behavior',
          'provision network resources for compute and storage',
        ]}
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
            <h2 className="text-lg font-semibold text-white">Network Settings</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">Network Name</label>
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

              <div className="md:col-span-2">
                <label className="block text-xs uppercase tracking-wider text-gray-400 mb-2">CIDR Block</label>
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
                {errors.cidr_block && (
                  <p className="mt-1 text-xs text-red-400 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.cidr_block.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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

            <div className="space-y-3 pt-2 border-t border-gray-800/50">
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
              <div className="pt-2 mt-2 border-t border-gray-800/70">
                <p className="text-gray-500 text-xs">
                  DNS: {dnsEnabled ? 'enabled' : 'disabled'} | NAT: {natEnabled ? 'enabled' : 'disabled'}
                </p>
              </div>
            </div>
          </div>

          {createMutation.isError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Failed to create network. Please verify CIDR and provider permissions.</p>
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
