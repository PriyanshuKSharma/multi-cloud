import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AddCredentialModal from '../components/AddCredentialModal';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import { Trash2, Plus, Shield, Key, Calendar, Cloud, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Credential {
  id: number;
  name: string;
  provider: string;
  created_at: string;
}

const Settings: React.FC = () => {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCredentials();
  }, []);

  const fetchCredentials = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/credentials/');
      setCredentials(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCredential = async (id: number) => {
    if (!confirm('Are you sure you want to disconnect these credentials? This might affect active resources.')) return;
    try {
      await api.delete(`/credentials/${id}`);
      fetchCredentials();
    } catch (err) {
      console.error(err);
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider.toLowerCase()) {
      case 'aws': return <Cloud className="w-5 h-5 text-orange-400" />;
      case 'azure': return <Cloud className="w-5 h-5 text-blue-400" />;
      case 'gcp': return <Cloud className="w-5 h-5 text-green-400" />;
      default: return <Key className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto space-y-8 pb-12"
    >
      <PageHero
        id="settings"
        tone="indigo"
        eyebrow="Global account controls"
        eyebrowIcon={<Shield className="h-3.5 w-3.5" />}
        title="Security & Settings"
        titleIcon={<Shield className="w-8 h-8 text-indigo-300" />}
        description="Manage cloud credentials and security posture for provisioning and API operations."
        chips={[
          { label: `${credentials.length} credentials`, tone: 'indigo' },
          { label: isLoading ? 'syncing...' : 'synced', tone: isLoading ? 'default' : 'emerald' },
        ]}
      />

      <PageGuide
        title="About Settings"
        purpose="Settings centralizes security controls and cloud credential management for this account."
        actions={[
          'connect or disconnect cloud credentials',
          'review provider access entries and creation timestamps',
          'maintain secure access posture for provisioning workflows',
        ]}
      />

      {/* Credentials Card */}
      <div className="glass-card overflow-hidden rounded-2xl border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/5 bg-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white leading-tight">Cloud Credentials</h2>
              <p className="text-xs text-gray-400">Connect and manage your multi-cloud access keys</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center space-x-2 group whitespace-nowrap"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Connect Provider</span>
          </button>
        </div>

        <div className="p-6">
          <AnimatePresence mode="popLayout">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
                <p className="text-gray-500 text-sm">Loading credentials...</p>
              </div>
            ) : credentials.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 bg-gray-800/50 rounded-full flex items-center justify-center mb-4 border border-gray-700/50">
                  <Key className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-300">No Credentials Found</h3>
                <p className="text-gray-500 max-w-xs mx-auto mt-2">
                  Connect your first cloud account to start deploying resources across AWS, Azure, or GCP.
                </p>
              </motion.div>
            ) : (
              <div className="grid gap-4">
                {credentials.map((cred, idx) => (
                  <motion.div 
                    key={cred.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 bg-gray-900/40 hover:bg-gray-800/60 rounded-xl border border-gray-800/50 hover:border-blue-500/30 transition-all duration-300"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl bg-gray-800/80 border border-gray-700 group-hover:border-blue-500/20 transition-colors`}>
                        {getProviderIcon(cred.provider)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-bold text-white text-lg">{cred.name}</p>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            cred.provider === 'aws' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 
                            cred.provider === 'azure' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 
                            'bg-green-500/10 text-green-400 border border-green-500/20'
                          }`}>
                            {cred.provider}
                          </span>
                        </div>
                        <div className="flex items-center mt-1 text-gray-400 space-x-4 text-xs">
                          <span className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1" />
                            {new Date(cred.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center">
                            <Info className="w-3 h-3 mr-1" />
                            ID: #{cred.id}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => deleteCredential(cred.id)} 
                      className="mt-4 sm:mt-0 p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      title="Delete Credential"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AddCredentialModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={fetchCredentials} 
      />

      {/* Info Notice */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 flex items-start space-x-3">
        <Info className="w-5 h-5 text-blue-400 mt-0.5" />
        <p className="text-sm text-gray-400 leading-relaxed">
          Your credentials are encrypted at rest and never shared with 3rd parties. We only use them to communicate with the cloud provider APIs during resource provisioning.
        </p>
      </div>
    </motion.div>
    );
};

export default Settings;
