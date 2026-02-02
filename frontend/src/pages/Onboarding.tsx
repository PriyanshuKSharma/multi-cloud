import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../api/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { User, Cloud, Rocket } from 'lucide-react';

const onboardingSchema = z.object({
  aws_access_key: z.string().min(1, 'Access Key ID is required'),
  aws_secret_key: z.string().min(1, 'Secret Access Key is required'),
  aws_region: z.string().optional(),
});

type OnboardingInputs = z.infer<typeof onboardingSchema>;

const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<OnboardingInputs>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      aws_region: 'us-east-1',
    }
  });

  const onSubmit = async (data: OnboardingInputs) => {
    try {
      await api.post('/auth/connect-cloud', data);
      navigate('/');
    } catch (error) {
      console.error(error);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const steps = [
    { title: 'Core Identity', icon: User },
    { title: 'Cloud Uplink', icon: Cloud },
    { title: 'Initialize', icon: Rocket },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent relative z-10">
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] blur-[150px] rounded-full -z-10 transition-colors duration-1000 ${
        step === 1 ? 'bg-blue-600/10' : step === 2 ? 'bg-purple-600/10' : 'bg-emerald-600/10'
      }`} />

      <motion.div 
        layout
        className="w-full max-w-2xl glass-panel p-10 md:p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1.5 bg-white/5 overflow-hidden">
             <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"
                animate={{ width: `${(step / 3) * 100}%` }}
                transition={{ duration: 0.8, ease: "circOut" }}
             />
        </div>

        <div className="flex justify-between items-center mb-12 relative">
            {steps.map((s, i) => (
                <div key={i} className="flex flex-col items-center space-y-3 relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${
                        step > i + 1 ? 'bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' :
                        step === i + 1 ? 'border-blue-400 text-blue-400 bg-blue-400/10 shadow-[0_0_20px_rgba(96,165,250,0.2)]' :
                        'border-white/5 text-gray-600 bg-white/5'
                    }`}>
                        <s.icon size={22} className={step === i + 1 ? 'animate-pulse' : ''} />
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                        step === i + 1 ? 'text-blue-400' : 'text-gray-600'
                    }`}>
                        {s.title}
                    </span>
                </div>
            ))}
            <div className="absolute top-[24px] left-[15%] right-[15%] h-[2px] bg-white/5 -z-0" />
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter">System Access Override</h2>
                    <p className="text-gray-400">Please provide your operational credentials for the multi-cloud relay.</p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Universal Key (Access Key)</label>
                        <input {...register('aws_access_key')} className="input-field w-full" placeholder="AKIA..." />
                        {errors.aws_access_key && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.aws_access_key.message}</p>}
                    </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white tracking-tighter">Uplink Encryption</h2>
                    <p className="text-gray-400">Secure your connection with the galaxy's clusters.</p>
                </div>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Private Cipher (Secret Key)</label>
                        <input {...register('aws_secret_key')} type="password" className="input-field w-full" placeholder="••••••••" />
                        {errors.aws_secret_key && <p className="text-red-400 text-xs mt-1 font-bold ml-1">{errors.aws_secret_key.message}</p>}
                    </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6 text-center py-6"
              >
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                    <Rocket className="w-12 h-12 text-emerald-400 animate-bounce" />
                </div>
                <h2 className="text-4xl font-black text-white glow-text tracking-tighter mb-4">Node Primed</h2>
                <p className="text-gray-400 max-w-sm mx-auto mb-8 font-medium">Your credentials have been encrypted and stored in the nebula vault. Ready to orchestrate.</p>
                
                <div className="p-6 bg-white/[0.03] rounded-3xl border border-white/5 text-left mb-8">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">Final Confirmation</p>
                    <p className="text-gray-300 font-medium text-sm leading-relaxed">By clicking finish, you authorize Nebula to proxy requests to your cloud providers using Terraform under the hood.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex justify-between items-center pt-6 border-t border-white/5">
            {step > 1 ? (
              <button 
                type="button" 
                onClick={prevStep}
                className="px-8 py-3.5 rounded-2xl text-gray-400 font-bold hover:text-white hover:bg-white/5 transition-all"
              >
                Previous Stage
              </button>
            ) : <div />}
            
            {step < 3 ? (
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="button" 
                onClick={nextStep}
                className="btn-primary"
              >
                Next Stage
              </motion.button>
            ) : (
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(16, 185, 129, 0.4)" }}
                whileTap={{ scale: 0.95 }}
                type="submit" 
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 px-10 rounded-2xl shadow-lg transition-all"
              >
                {isSubmitting ? 'Initializing Node...' : 'Start Orchestration'}
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Onboarding;
