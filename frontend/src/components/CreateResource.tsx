import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';

const resourceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  provider: z.enum(["aws", "azure", "gcp"]),
  type: z.enum(["vm", "storage"]),
  configuration: z.object({
    // Simplified specific config handling for MVP
    region: z.string().optional(),
    instance_type: z.string().optional(),
    bucket_name: z.string().optional()
  })
});

type ResourceFormInputs = z.infer<typeof resourceSchema>;

const CreateResource: React.FC = () => {
  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      provider: 'aws',
      type: 'vm',
      configuration: { region: 'us-east-1' }
    }
  });

  const selectedType = watch('type');

  const onSubmit = async (data: ResourceFormInputs) => {
    try {
      // Clean up config based on type
      const config: any = { ...data.configuration };
      let resourceName = data.name;

      if (data.type === 'vm') {
        config.instance_name = resourceName;
        // Mock AMI for AWS
        if (data.provider === 'aws') config.ami = "ami-0c55b159cbfafe1f0";
      } else {
        // S3 Buckets MUST be lowercase
        resourceName = resourceName.toLowerCase().replace(/\s+/g, '-');
        config.bucket_name = resourceName;
      }
      
      await api.post('/resources', {
        ...data,
        name: resourceName,
        project_id: 0, // Default project for MVP
        configuration: config
      });
      alert('Resource creation started!');
      reset();
    } catch (error) {
      console.error(error);
      alert('Failed to create resource');
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
      <h2 className="text-xl font-bold mb-4 text-white">Provision New Resource</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Provider</label>
            <select {...register('provider')} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600">
              <option value="aws">AWS</option>
              <option value="azure">Azure</option>
              <option value="gcp">Google Cloud</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Type</label>
            <select {...register('type')} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600">
              <option value="vm">Virtual Machine</option>
              <option value="storage">Object Storage</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">Resource Name</label>
          <input {...register('name')} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600" placeholder="my-resource-01" />
          {errors.name && <p className="text-red-400 text-sm">{errors.name.message}</p>}
        </div>

        {/* Dynamic Config Fields */}
        <div className="p-4 bg-gray-750 rounded border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-2">Configuration</h3>
          
          <div className="mb-2">
            <label className="block text-gray-400 text-sm mb-1">Region</label>
            <input {...register('configuration.region')} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600" />
          </div>

          {selectedType === 'vm' && (
             <div className="mb-2">
              <label className="block text-gray-400 text-sm mb-1">Instance Type / Size</label>
              <input {...register('configuration.instance_type')} className="w-full bg-gray-700 text-white rounded p-2 border border-gray-600" placeholder="t2.micro / Standard_F2" />
            </div>
          )}
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold disabled:opacity-50"
        >
          {isSubmitting ? 'Provisioning...' : 'Deploy Resource'}
        </button>
      </form>
    </div>
  );
};

export default CreateResource;
