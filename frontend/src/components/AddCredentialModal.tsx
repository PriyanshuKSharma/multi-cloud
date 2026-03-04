import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { X, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdCredential?: { id: number; name: string; provider: string }) => void;
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
    ],
    gcp: [
      { id: 'us-central1', name: 'US Central (Iowa)' },
      { id: 'us-east1', name: 'US East (South Carolina)' },
      { id: 'europe-west1', name: 'Europe West (Belgium)' },
      { id: 'asia-south1', name: 'Asia South (Mumbai)' },
    ]
};

const AddCredentialModal: React.FC<AddCredentialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, watch, setValue } = useForm<any>({
      defaultValues: {
          provider: 'aws',
          region: 'us-east-1'
      }
  });

  const provider = watch('provider');

  React.useEffect(() => {
    if (provider === 'aws') {
      setValue('region', 'us-east-1');
    } else if (provider === 'azure') {
      setValue('region', 'eastus');
    } else {
      setValue('region', 'us-central1');
    }
  }, [provider, setValue]);

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
      } else if (data.provider === 'gcp') {
          let parsedServiceAccount: any = data.service_account_json;
          if (typeof parsedServiceAccount === 'string') {
              try {
                  parsedServiceAccount = JSON.parse(parsedServiceAccount);
              } catch {
                  throw new Error('Invalid GCP service account JSON');
              }
          }
          payload.data = {
              project_id: data.project_id || parsedServiceAccount?.project_id,
              service_account_json: parsedServiceAccount,
              region: data.region
          };
      }

      const response = await api.post('/credentials/', payload);
      reset();
      const created = response?.data as Partial<{ id: number; name: string; provider: string }> | undefined;
      onSuccess(
        created && typeof created === 'object'
          ? {
              id: Number(created.id ?? 0),
              name: String(created.name ?? data.name ?? 'Cloud Account'),
              provider: String(created.provider ?? data.provider ?? 'aws').toLowerCase(),
            }
          : {
              id: 0,
              name: String(data.name ?? 'Cloud Account'),
              provider: String(data.provider ?? 'aws').toLowerCase(),
            }
      );
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
                   ) : provider === 'azure' ? (
                      <>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Tenant ID</label>
                            <input
                              {...register('tenant_id')}
                              className="input-field w-full p-2.5"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Subscription ID</label>
                            <input
                              {...register('subscription_id')}
                              className="input-field w-full p-2.5"
                              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Client ID</label>
                            <input
                              {...register('client_id')}
                              className="input-field w-full p-2.5"
                              placeholder="App registration client ID"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Client Secret</label>
                            <input
                              {...register('client_secret')}
                              type="password"
                              className="input-field w-full p-2.5"
                              placeholder="••••"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-1 ml-1">Default Region</label>
                          <select {...register('region')} className="input-field w-full p-2.5 cursor-pointer appearance-none">
                            {REGIONS.azure.map(r => (
                              <option key={r.id} value={r.id} className="bg-[#1a1b1e]">{r.name} ({r.id})</option>
                            ))}
                          </select>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Project ID</label>
                          <input
                            {...register('project_id')}
                            className="input-field w-full p-2.5"
                            placeholder="my-gcp-project-id"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-blue-400/80 uppercase tracking-widest mb-1 ml-1">Default Region</label>
                          <select {...register('region')} className="input-field w-full p-2.5 cursor-pointer appearance-none">
                            {REGIONS.gcp.map(r => (
                              <option key={r.id} value={r.id} className="bg-[#1a1b1e]">{r.name} ({r.id})</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1 ml-1">Service Account JSON</label>
                          <textarea
                            {...register('service_account_json')}
                            rows={6}
                            className="input-field w-full p-2.5 font-mono text-xs"
                            placeholder='{"type":"service_account","project_id":"..."}'
                          />
                        </div>
                      </>
                    )}
               </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-primary w-full py-3.5"
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
