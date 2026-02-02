import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { X, Shield, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AddCredentialModal: React.FC<AddCredentialModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/credentials/', {
        provider: 'aws',
        name: data.name || 'AWS Account',
        data: {
          access_key: data.access_key,
          secret_key: data.secret_key,
          region: data.region || 'us-east-1'
        }
      });
      reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-lg glass-panel p-10 rounded-[3rem] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-500" />
            
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-1">
                <h2 className="text-3xl font-black text-white flex items-center tracking-tighter">
                  <Shield className="w-8 h-8 mr-4 text-blue-400" />
                  Uplink Configuration
                </h2>
                <p className="text-gray-400 font-medium">Provision a new AWS cluster node.</p>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-2xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Alias Name</label>
                <input 
                  {...register('name', { required: 'Name is required' })} 
                  className={`input-field w-full ${errors.name ? 'border-red-500/50' : ''}`}
                  placeholder="e.g. Andromeda Cluster" 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Access Key ID</label>
                    <input 
                      {...register('access_key', { required: 'Access Key is required' })} 
                      className={`input-field w-full ${errors.access_key ? 'border-red-500/50' : ''}`}
                      placeholder="AKIA..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Default Region</label>
                    <input 
                      {...register('region')} 
                      className="input-field w-full"
                      placeholder="us-east-1" 
                      defaultValue="us-east-1"
                    />
                  </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Secret Access Key</label>
                <div className="relative group">
                    <input 
                      {...register('secret_key', { required: 'Secret Key is required' })} 
                      type="password" 
                      className={`input-field w-full pl-12 ${errors.secret_key ? 'border-red-500/50' : ''}`}
                      placeholder="••••••••••••••••••••" 
                    />
                    <Key size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" />
                </div>
              </div>

              <div className="pt-8 flex flex-col space-y-4">
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  className="btn-primary w-full py-4 text-lg font-bold"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                       <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mr-3" />
                       Initializing...
                    </span>
                  ) : 'Establish Uplink'}
                </motion.button>
                <div className="flex items-center justify-center space-x-2 text-gray-500">
                    <Shield size={12} />
                    <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encryption Enabled</span>
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddCredentialModal;
