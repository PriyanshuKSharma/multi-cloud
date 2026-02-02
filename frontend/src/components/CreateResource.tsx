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
    <div className="glass-card p-8 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-10 -mt-10" />
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Provider</label>
            <select {...register('provider')} className="input-field w-full cursor-pointer appearance-none">
              <option value="aws" className="bg-[#1a1b1e]">AWS (Amazon)</option>
              <option value="azure" className="bg-[#1a1b1e]">Microsoft Azure</option>
              <option value="gcp" className="bg-[#1a1b1e]">Google Cloud</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Fleet Type</label>
            <select {...register('type')} className="input-field w-full cursor-pointer appearance-none">
              <option value="vm" className="bg-[#1a1b1e]">Compute Instance</option>
              <option value="storage" className="bg-[#1a1b1e]">Object Storage</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] ml-1">Node Identifier</label>
          <input 
            {...register('name')} 
            className="input-field w-full" 
            placeholder="nebula-node-01" 
          />
          {errors.name && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.name.message}</p>}
        </div>

        {/* Advanced Config Section */}
        <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-4">
          <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.2em]">Core Configuration</p>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Region</label>
            <input {...register('configuration.region')} className="input-field w-full text-sm py-2" />
          </div>

          {selectedType === 'vm' && (
             <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instance Profile</label>
              <input 
                {...register('configuration.instance_type')} 
                className="input-field w-full text-sm py-2" 
                placeholder="t3.medium / Standard_D2" 
              />
            </div>
          )}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit" 
          disabled={isSubmitting}
          className="btn-primary w-full group overflow-hidden"
        >
          <span className="relative z-10">{isSubmitting ? 'Initializing Node...' : 'Deploy to Cluster'}</span>
        </motion.button>
      </form>
    </div>
  );
};

export default CreateResource;
