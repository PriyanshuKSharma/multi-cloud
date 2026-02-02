import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ChevronRight, ChevronLeft, Rocket, Shield, Globe, Box } from 'lucide-react';
import api from '../api/axios';

const resourceSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  provider: z.enum(["aws", "azure", "gcp"]),
  type: z.enum(["vm", "storage"]),
  configuration: z.object({
    region: z.string().optional(),
    instance_type: z.string().optional(),
    bucket_name: z.string().optional()
  })
});

type ResourceFormInputs = z.infer<typeof resourceSchema>;

const CreateResource: React.FC = () => {
  const [step, setStep] = useState(1);
  const { register, handleSubmit, watch, trigger, formState: { errors, isSubmitting }, reset } = useForm<ResourceFormInputs>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      provider: 'aws',
      type: 'vm',
      configuration: { region: 'us-east-1' }
    }
  });

  const selectedType = watch('type');
  const selectedProvider = watch('provider');

  const nextStep = async () => {
    const fieldsToValidate = step === 1 ? ['name', 'provider', 'type'] : [];
    const isValid = await trigger(fieldsToValidate as any);
    if (isValid) setStep(2);
  };

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
      setStep(1);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="glass-card p-0 rounded-[2.5rem] border-white/5 shadow-2xl relative overflow-hidden flex flex-col max-h-[600px]">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-[5rem] -mr-10 -mt-10 pointer-events-none" />
      
      {/* Step Indicator Header */}
      <div className="p-8 border-b border-white/5 bg-white/[0.01]">
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <Box className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Provision Node</h3>
            </div>
            <div className="flex items-center space-x-2">
                {[1, 2].map((s) => (
                    <div key={s} className={`h-1 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-4 bg-white/10'}`} />
                ))}
            </div>
        </div>
      </div>

      {/* Scrollable Form Container */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4">Identification & Stack</p>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Node Identifier</label>
                        <input 
                            {...register('name')} 
                            className="input-field w-full" 
                            placeholder="nebula-node-01" 
                        />
                        {errors.name && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.name.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Cloud Provider</label>
                            <select {...register('provider')} className="input-field w-full cursor-pointer appearance-none">
                                <option value="aws" className="bg-[#1a1b1e]">AWS (Amazon)</option>
                                <option value="azure" className="bg-[#1a1b1e]">Microsoft Azure</option>
                                <option value="gcp" className="bg-[#1a1b1e]">Google Cloud</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Fleet Type</label>
                            <select {...register('type')} className="input-field w-full cursor-pointer appearance-none">
                                <option value="vm" className="bg-[#1a1b1e]">Compute Instance</option>
                                <option value="storage" className="bg-[#1a1b1e]">Object Storage</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button 
                        type="button" 
                        onClick={nextStep}
                        className="btn-primary w-full flex items-center justify-center space-x-2"
                    >
                        <span>Configure Uplink</span>
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 space-y-6">
                    <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-blue-400/70" />
                        <p className="text-[10px] font-black text-blue-400/70 uppercase tracking-[0.2em]">Regional Protocol</p>
                    </div>
                    
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Deployment Region</label>
                        <input 
                            {...register('configuration.region')} 
                            className="input-field w-full text-sm py-2" 
                            placeholder={selectedProvider === 'aws' ? 'us-east-1' : 'eastus'}
                        />
                    </div>

                    {selectedType === 'vm' && (
                        <div className="space-y-2">
                             <div className="flex items-center space-x-2 mb-1">
                                <Shield className="w-3 h-3 text-emerald-400/70" />
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Instance Profile</label>
                             </div>
                            <input 
                                {...register('configuration.instance_type')} 
                                className="input-field w-full text-sm py-2" 
                                placeholder="t3.medium / Standard_D2" 
                            />
                        </div>
                    )}
                </div>

                <div className="flex space-x-3 pt-4">
                    <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="px-6 py-2.5 rounded-xl border border-white/5 text-gray-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <motion.button 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit" 
                        disabled={isSubmitting}
                        className="btn-primary flex-1 flex items-center justify-center space-x-2"
                    >
                        <Rocket className={`w-4 h-4 ${isSubmitting ? 'animate-bounce' : ''}`} />
                        <span>{isSubmitting ? 'Deploying...' : 'Initiate Launch'}</span>
                    </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>
      </div>
    </div>
  );
};

export default CreateResource;
