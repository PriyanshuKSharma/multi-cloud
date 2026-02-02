import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import AddCredentialModal from '../components/AddCredentialModal';
import { Trash2, Plus, Shield } from 'lucide-react';

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
    if(!confirm('Are you sure?')) return;
    try {
      await api.delete(`/credentials/${id}`);
      fetchCredentials();
    } catch (err) {
        console.error(err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Settings</h1>

      <div className="glass-card p-6 rounded-xl">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                Cloud Credentials
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="btn-primary text-sm flex items-center space-x-2"
            >
                <Plus className="w-4 h-4" />
                <span>Add New</span>
            </button>
        </div>

        <AddCredentialModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={fetchCredentials} 
        />

        <div className="space-y-3">
            {credentials.length === 0 ? (
                <p className="text-gray-500 italic">No credentials connected.</p>
            ) : credentials.map(cred => (
                <div key={cred.id} className="flex justify-between items-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div className="flex items-center space-x-3">
                         <div className={`w-2 h-2 rounded-full ${cred.provider === 'aws' ? 'bg-orange-500' : 'bg-blue-500'}`} />
                         <div>
                             <p className="font-medium text-white">{cred.name}</p>
                             <p className="text-xs text-gray-400 uppercase">{cred.provider} • Added {new Date(cred.created_at).toLocaleDateString()}</p>
                         </div>
                    </div>
                    <button onClick={() => deleteCredential(cred.id)} className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default Settings;
