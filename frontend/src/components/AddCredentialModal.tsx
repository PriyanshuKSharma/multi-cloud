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
      alert('Failed to save AWS credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 0 }}
            className="w-full max-w-md glass-panel p-8 rounded-3xl shadow-2xl relative"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Add AWS Credential
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Display Name</label>
                <input 
                  {...register('name', { required: 'Name is required' })} 
                  className={`input-field w-full p-2.5 ${errors.name ? 'border-red-500' : ''}`}
                  placeholder="e.g. My Production AWS" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Access Key ID</label>
                <input 
                  {...register('access_key', { required: 'Access Key is required' })} 
                  className={`input-field w-full p-2.5 ${errors.access_key ? 'border-red-500' : ''}`}
                  placeholder="AKIA..." 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Secret Access Key</label>
                <input 
                  {...register('secret_key', { required: 'Secret Key is required' })} 
                  type="password" 
                  className={`input-field w-full p-2.5 ${errors.secret_key ? 'border-red-500' : ''}`}
                  placeholder="••••••••••••••••••••" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Default Region</label>
                <input 
                  {...register('region')} 
                  className="input-field w-full p-2.5"
                  placeholder="us-east-1" 
                  defaultValue="us-east-1"
                />
              </div>

              <div className="pt-4 flex flex-col space-y-3">
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="btn-primary w-full py-3 flex items-center justify-center"
                >
                  {loading ? (
                    <span className="flex items-center">
                       <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Saving...
                    </span>
                  ) : 'Save Credentials'}
                </button>
                <p className="text-center text-xs text-gray-500">
                  Credentials are encrypted and stored securely.
                </p>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddCredentialModal;
