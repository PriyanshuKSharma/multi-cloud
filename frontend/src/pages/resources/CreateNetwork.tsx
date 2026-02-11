import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
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
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/resources/networks')}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Networks
        </button>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Network className="w-8 h-8 text-cyan-500" />
          Create Virtual Network
        </h1>
        <p className="text-gray-400 mt-2">Provision a new VPC or VNET</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Provider Selection */}
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Cloud Provider</h2>
          <div className="grid grid-cols-3 gap-4">
            {['aws', 'azure', 'gcp'].map((provider) => (
              <label
                key={provider}
                className={`
                  relative flex flex-col items-center p-4 cursor-pointer rounded-lg border-2 transition-all
                  ${selectedProvider === provider
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-gray-800 hover:border-gray-700 bg-gray-900/50'}
                `}
              >
                <input
                  type="radio"
                  value={provider}
                  {...register('provider')}
                  className="hidden"
                />
                <span className="capitalize font-medium text-white">{provider.toUpperCase()}</span>
                {selectedProvider === provider && (
                  <div className="absolute top-2 right-2 text-cyan-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white mb-4">Network Settings</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Network Name
              </label>
              <input
                type="text"
                {...register('name', { required: 'Network name is required' })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="my-vpc-network"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Region
              </label>
              <select
                {...register('region')}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                {regions[selectedProvider]?.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                CIDR Block
              </label>
              <input
                type="text"
                {...register('cidr_block', {
                   required: 'CIDR block is required',
                   pattern: {
                     value: /^([0-9]{1,3}\.){3}[0-9]{1,3}(\/([0-9]|[1-2][0-9]|3[0-2]))?$/,
                     message: "Invalid CIDR format (e.g., 10.0.0.0/16)"
                   }
                })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                placeholder="10.0.0.0/16"
              />
              {errors.cidr_block && (
                <p className="mt-1 text-sm text-red-400 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.cidr_block.message}
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Enable DNS Options</h3>
                <p className="text-sm text-gray-400">DNS hostnames and resolution</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enable_dns')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Create NAT Gateway</h3>
                <p className="text-sm text-gray-400">Enable internet access for private subnets</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('enable_nat')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-cyan-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-6">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className={`
              flex items-center px-8 py-3 rounded-lg font-medium text-white transition-all
              ${createMutation.isPending
                ? 'bg-gray-700 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-600 shadow-lg shadow-cyan-500/20'}
            `}
          >
            {createMutation.isPending ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Provisioning...
              </>
            ) : (
              'Create Network'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateNetwork;
