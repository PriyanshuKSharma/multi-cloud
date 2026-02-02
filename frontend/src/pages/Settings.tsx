import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AddCredentialModal from '../components/AddCredentialModal';
import { motion } from 'framer-motion';
import { Trash2, Plus, Shield, Cloud } from 'lucide-react';

interface Credential {
  id: number;
  name: string;
  provider: string;
  created_at: string;
}

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    try {
      const res = await api.get('/credentials/');
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const deleteCredential = async (id: number) => {
    if(!confirm('Are you sure you want to decouple this cluster?')) return;
    try {
      await api.delete(`/credentials/${id}`);
      fetchCredentials();
    } catch (err) {
        console.error(err);
    }
  }

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-4xl font-black text-white glow-text tracking-tighter">Command Center</h1>
        <p className="text-gray-400 font-medium">Configure your cloud integration and security protocols.</p>
      </div>

      <div className="glass-panel p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/50 to-transparent" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-white flex items-center tracking-tight">
                    <Shield className="w-6 h-6 mr-3 text-blue-400" />
                    Cloud Uplinks
                </h2>
                <p className="text-sm text-gray-500 max-w-md">Securely manage your AWS, Azure, and GCP credentials used for orchestration.</p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary"
            >
                <Plus className="w-5 h-5 mr-2" />
                <span>Initialize New Uplink</span>
            </button>
        </div>

        <AddCredentialModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchCredentials} 
        />

        <div className="grid gap-4">
            {credentials.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] rounded-[2rem] border border-dashed border-white/5">
                    <p className="text-gray-500 font-medium italic">No active uplinks detected in this sector.</p>
                </div>
            ) : credentials.map(cred => (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={cred.id} 
                    className="group flex justify-between items-center p-6 bg-white/[0.03] hover:bg-white/[0.06] rounded-3xl border border-white/5 transition-all duration-300"
                >
                    <div className="flex items-center space-x-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner ${
                             cred.provider === 'aws' ? 'bg-orange-500/10 text-orange-500' : 'bg-blue-500/10 text-blue-500'
                         }`}>
                             {cred.provider === 'aws' ? <Cloud size={24} /> : <div className="font-black text-xl">A</div>}
                         </div>
                         <div>
                             <p className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{cred.name}</p>
                             <div className="flex items-center space-x-2 mt-1">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{cred.provider}</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Added {new Date(cred.created_at).toLocaleDateString()}</span>
                             </div>
                         </div>
                    </div>
                    <button 
                        onClick={() => deleteCredential(cred.id)} 
                        className="opacity-0 group-hover:opacity-100 p-3 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all duration-300"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </motion.div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Security Ledger</h3>
              <p className="text-sm text-gray-500 leading-relaxed">All credentials are encrypted using AES-256 and stored in isolation. Access is restricted to session-based orchestration requests.</p>
          </div>
          <div className="glass-panel p-8 rounded-[2rem] border-white/5 space-y-4">
              <h3 className="text-lg font-bold text-white">Audit Protocol</h3>
              <p className="text-sm text-gray-500 leading-relaxed">Detailed logs for every resource creation, deletion, and modification are captured for compliance and incident response.</p>
          </div>
      </div>
    </div>
  );
};

export default Settings;
