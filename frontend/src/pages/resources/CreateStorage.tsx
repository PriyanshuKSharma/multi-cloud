import React from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import PageGuide from '../../components/ui/PageGuide';
import {
  Database,
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

interface CreateStorageForm {
  name: string;
  provider: 'aws' | 'azure' | 'gcp';
  region: string;
  check_public_access: boolean;
  versioning_enabled: boolean;
  encryption_enabled: boolean;
}

const CreateStorage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
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

  // Update region when provider changes
  React.useEffect(() => {
    const defaultRegion = regions[selectedProvider][0].value;
    setValue('region', defaultRegion);
  }, [selectedProvider, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateStorageForm) => {
      const payload = {
        name: data.name,
        provider: data.provider,
        region: data.region,
        metadata: {
            public_access: data.check_public_access,
            versioning: data.versioning_enabled,
            encryption: data.encryption_enabled
        }
      };
      return await axios.post('/inventory/storage', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      navigate('/resources/storage');
    },
  });

  const onSubmit = (data: CreateStorageForm) => {
    createMutation.mutate(data);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => navigate('/resources/storage')}
          className="flex items-center text-gray-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Storage
        </button>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-purple-500" />
          Create Storage Bucket
        </h1>
        <p className="text-gray-400 mt-2">Provision a new object storage bucket</p>
      </div>

      <PageGuide
        title="About Create Storage"
        purpose="This form provisions object storage buckets across AWS, Azure, and GCP."
        actions={[
          'pick provider and region',
          'set access, versioning, and encryption options',
          'create a storage resource that appears in inventory',
        ]}
      />

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
                    ? 'border-purple-500 bg-purple-500/10'
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
                  <div className="absolute top-2 right-2 text-purple-500">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Basic Configuration */}
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-6">
          <h2 className="text-lg font-semibold text-white mb-4">Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">
                Bucket Name
              </label>
              <input
                type="text"
                {...register('name', { 
                  required: 'Bucket name is required',
                  pattern: {
                    value: /^[a-z0-9][a-z0-9-.]*[a-z0-9]$/,
                    message: "Invalid bucket name format"
                  }
                })}
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                placeholder="my-unique-bucket-name"
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
                className="w-full px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              >
                {regions[selectedProvider]?.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-800/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Public Access</h3>
                <p className="text-sm text-gray-400">Allow public read access to objects</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('check_public_access')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Versioning</h3>
                <p className="text-sm text-gray-400">Keep multiple variants of an object</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('versioning_enabled')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Encryption</h3>
                <p className="text-sm text-gray-400">Encrypt objects at rest</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" {...register('encryption_enabled')} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
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
                : 'bg-purple-500 hover:bg-purple-600 shadow-lg shadow-purple-500/20'}
            `}
          >
            {createMutation.isPending ? (
              <>
                <Loader className="w-5 h-5 animate-spin mr-2" />
                Provisioning...
              </>
            ) : (
              'Create Bucket'
            )}
          </button>
        </div>
        
        {createMutation.isError && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            Failed to create storage bucket. Please try again.
          </div>
        )}
      </form>
    </div>
  );
};

export default CreateStorage;
