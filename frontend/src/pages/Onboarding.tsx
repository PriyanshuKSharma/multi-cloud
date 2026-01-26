import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../api/axios';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Shield, Key } from 'lucide-react';

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset } = useForm();

  const onSubmitAws = async (data: any) => {
    setLoading(true);
    try {
      await api.post('/credentials/', {
        provider: 'aws',
        name: 'My AWS Account',
        data: {
          access_key: data.access_key,
          secret_key: data.secret_key,
          region: data.region || 'us-east-1'
        }
      });
      setStep(2);
    } catch (err) {
      console.error(err);
      alert('Failed to save AWS credentials');
    } finally {
        setLoading(false);
    }
  };
  
  const skipStep = () => {
      if (step < 3) setStep(step + 1);
      else navigate('/');
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full glass-card rounded-2xl p-8">
        <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 mb-4">
                <Shield className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Connect Your Clouds</h1>
            <p className="text-gray-400 mt-2">Nebula needs access to your cloud accounts to provision resources.</p>
        </div>

        {/* Steps Indicator */}
        <div className="flex justify-between mb-8 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-800 -z-10 rounded-full" />
            {[1, 2, 3].map((s) => (
                <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'
                }`}>
                    {step > s ? <CheckCircle className="w-6 h-6" /> : s}
                </div>
            ))}
        </div>

        {/* Step 1: AWS */}
        {step === 1 && (
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🔶</span> Amazon Web Services (AWS)
                </h2>
                <form onSubmit={handleSubmit(onSubmitAws)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Access Key ID</label>
                        <input {...register('access_key')} className="input-field w-full p-3" placeholder="AKIA..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Secret Access Key</label>
                        <input {...register('secret_key')} type="password" className="input-field w-full p-3" placeholder="wJalr..." />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Default Region</label>
                        <input {...register('region')} className="input-field w-full p-3" placeholder="us-east-1" defaultValue="us-east-1" />
                    </div>
                    
                    <div className="pt-4 flex space-x-4">
                        <button type="button" onClick={skipStep} className="px-6 py-2 rounded text-gray-400 hover:text-white">Skip</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1">
                            {loading ? 'Verifying...' : 'Save & Continue'}
                        </button>
                    </div>
                </form>
            </motion.div>
        )}

        {/* Step 2: Azure (Placeholder for now) */}
        {step === 2 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🔷</span> Microsoft Azure
                </h2>
                <div className="p-6 bg-gray-800/50 rounded-xl text-center border border-dashed border-gray-700">
                    <p className="text-gray-400 mb-4">Azure configuration Coming Soon.</p>
                    <button onClick={skipStep} className="btn-primary">Continue</button>
                </div>
             </motion.div>
        )}

        {/* Step 3: GCP (Placeholder for now) */}
        {step === 3 && (
             <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <h2 className="text-xl font-bold text-white mb-4 flex items-center">
                    <span className="mr-2">🌈</span> Google Cloud Platform
                </h2>
                 <div className="p-6 bg-gray-800/50 rounded-xl text-center border border-dashed border-gray-700">
                    <p className="text-gray-400 mb-4">GCP configuration Coming Soon.</p>
                    <button onClick={() => navigate('/')} className="btn-primary">Finish Setup</button>
                </div>
             </motion.div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
