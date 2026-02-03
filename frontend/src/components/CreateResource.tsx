import React from 'react';
import { motion } from 'framer-motion';
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
      const config: any = { ...data.configuration };
      let resourceName = data.name;

      if (data.type === 'vm') {
        config.instance_name = resourceName;
        if (data.provider === 'aws') config.ami = "ami-0c55b159cbfafe1f0";
      } else {
        resourceName = resourceName.toLowerCase().replace(/\s+/g, '-');
        config.bucket_name = resourceName;
      }
      
      await api.post('/resources', {
        ...data,
        name: resourceName,
        project_id: 0,
        configuration: config
      });
      reset();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card p-6 rounded-2xl border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-[3rem] -mr-8 -mt-8" />
      
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white mb-2">Deploy Resource</h2>
        <p className="text-gray-400 text-sm">Provision infrastructure across cloud providers</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 relative z-10">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Provider</label>
            <select {...register('provider')} className="input-field w-full cursor-pointer appearance-none text-sm py-2.5">
              <option value="aws" className="bg-[#1a1b1e]">AWS</option>
              <option value="azure" className="bg-[#1a1b1e]">Azure</option>
              <option value="gcp" className="bg-[#1a1b1e]">GCP</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Type</label>
            <select {...register('type')} className="input-field w-full cursor-pointer appearance-none text-sm py-2.5">
              <option value="vm" className="bg-[#1a1b1e]">Compute</option>
              <option value="storage" className="bg-[#1a1b1e]">Storage</option>
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Resource Name</label>
          <input 
            {...register('name')} 
            className="input-field w-full text-sm py-2.5" 
            placeholder="my-resource-01" 
          />
          {errors.name && <p className="text-red-400 text-[10px] font-medium mt-1 ml-1">{errors.name.message}</p>}
        </div>

        <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-3">
          <p className="text-[10px] font-bold text-blue-400/70 uppercase tracking-wider">Configuration</p>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1">Region</label>
            <input {...register('configuration.region')} className="input-field w-full text-sm py-2" placeholder="us-east-1" />
          </div>

          {selectedType === 'vm' && (
             <div className="space-y-1.5">
              <label className="text-[10px] font-medium text-gray-500 uppercase tracking-wider ml-1">Instance Type</label>
              <input 
                {...register('configuration.instance_type')} 
                className="input-field w-full text-sm py-2" 
                placeholder="t3.medium" 
              />
            </div>
          )}
        </div>

        <motion.button 
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full group overflow-hidden py-3"
        >
          <span className="relative z-10 font-semibold">
            {isSubmitting ? 'Deploying...' : 'Deploy Resource'}
          </span>
        </motion.button>
      </form>
    </div>
  );
};

export default CreateResource;
