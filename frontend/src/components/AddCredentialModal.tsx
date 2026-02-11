import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REGIONS = {
    aws: [
      { id: 'us-east-1', name: 'US East (N. Virginia)' },
      { id: 'us-west-2', name: 'US West (Oregon)' },
      { id: 'eu-west-1', name: 'Europe (Ireland)' },
      { id: 'ap-south-1', name: 'Asia Pacific (Mumbai)' },
      { id: 'ap-southeast-1', name: 'Asia Pacific (Singapore)' },
    ],
    azure: [
      { id: 'eastus', name: 'East US' },
      { id: 'westus2', name: 'West US 2' },
      { id: 'westeurope', name: 'West Europe' },
      { id: 'centralindia', name: 'Central India' },
      { id: 'southeastasia', name: 'Southeast Asia' },
    ]
};

const AddCredentialModal: React.FC<AddCredentialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<any>({
      defaultValues: {
          provider: 'aws',
          region: 'us-east-1'
      }
  });

  const provider = watch('provider');

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const payload: any = {
        provider: data.provider,
        name: data.name,
        data: {}
      };

      if (data.provider === 'aws') {
          payload.data = {
              access_key: data.access_key,
              secret_key: data.secret_key,
              region: data.region
          };
      } else if (data.provider === 'azure') {
          payload.data = {
              tenant_id: data.tenant_id,
              client_id: data.client_id,
              client_secret: data.client_secret,
              subscription_id: data.subscription_id,
              region: data.region
          };
      }

      await api.post('/credentials/', payload);
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(`Failed to save ${data.provider.toUpperCase()} credentials`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full max-w-lg glass-panel p-8 rounded-3xl shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Add Cloud Credential
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Account Name</label>
                     <input 
                       {...register('name', { required: 'Name is required' })} 
                       className="input-field w-full p-2.5"
                       placeholder="e.g. Production" 
                     />
                   </div>
                   <div>
                     <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 ml-1">Provider</label>
                     <select {...register('provider')} className="input-field w-full p-2.5 cursor-pointer appearance-none">
                         <option value="aws" className="bg-[#1a1b1e]">AWS</option>
                         <option value="azure" className="bg-[#1a1b1e]">Azure</option>
                         <option value="gcp" className="bg-[#1a1b1e]">GCP</option>
                     </select>
                   </div>
               </div>

               <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/5 space-y-4">
                   {provider === 'aws' ? (
                       <>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Access Key ID</label>
                                 <input 
                                   {...register('access_key')} 
                                   className="input-field w-full p-2.5" 
                                   placeholder="AKIA..." 
                                 />
                             </div>
                             <div>
                                 <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Secret Access Key</label>
                                 <input 
                                   {...register('secret_key')} 
                                   type="password" 
                                   className="input-field w-full p-2.5" 
                                   placeholder="••••" 
                                 />
                             </div>
                         </div>
                         <div>
                             <label className="block text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-1 ml-1">Default Region</label>
                             <select {...register('region')} className="input-field w-full p-2.5 cursor-pointer appearance-none">
                                 {REGIONS.aws.map(r => (
                                     <option key={r.id} value={r.id} className="bg-[#1a1b1e]">{r.name} ({r.id})</option>
                                 ))}
                             </select>
                         </div>
                       </>
                   ) : (
                       <div className="text-center py-8">
                         <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-800/50 mb-3">
                           <Shield className="w-6 h-6 text-gray-500" />
                         </div>
                         <h3 className="text-lg font-medium text-white mb-1">Coming Soon</h3>
                         <p className="text-sm text-gray-400">
                           Support for {provider === 'azure' ? 'Microsoft Azure' : 'Google Cloud Platform'} is currently under development.
                         </p>
                       </div>
                   )}
               </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading || provider !== 'aws'} 
                  className={`btn-primary w-full py-3.5 ${provider !== 'aws' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loading ? 'Verifying...' : 'Save Credentials'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddCredentialModal;
