import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import PageGuide from '../components/ui/PageGuide';
import {
  Cloud,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AddCredentialModal from '../components/AddCredentialModal';

interface CloudAccount {
  id: number;
  provider: string;
  account_name: string;
  account_id: string;
  status: string;
  region: string;
  resources_count: number;
  last_synced: string;
  is_default: boolean;
}

const CloudAccountsPage: React.FC = () => {
  const { data: accounts, isLoading, refetch } = useQuery<CloudAccount[]>({
    queryKey: ['cloud-accounts'],
    queryFn: async () => {
      const response = await axios.get('/credentials');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Cloud className="w-8 h-8 text-indigo-500" />
            <span>Cloud Accounts</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage your cloud provider credentials and connections</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Account</span>
          </button>
        </div>
      </div>

      <PageGuide
        title="About Cloud Accounts"
        purpose="Cloud accounts store and validate provider credentials used for inventory sync and provisioning."
        actions={[
          'review connected AWS, Azure, and GCP accounts',
          'check account status and last sync recency',
          'add or remove provider credentials',
        ]}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (accounts ?? []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts?.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all group relative"
            >
              {account.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded">
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start space-x-4 mb-4">
                <ProviderIcon provider={account.provider as any} size="lg" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{account.account_name}</h3>
                  <p className="text-sm text-gray-400 font-mono truncate">{account.account_id}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Status</span>
                  <StatusBadge status={account.status as any} size="sm" />
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Region</span>
                  <span className="text-sm text-gray-300">{account.region}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Resources</span>
                  <span className="text-sm font-semibold text-gray-300">{account.resources_count}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                <span className="text-xs text-gray-500">
                  Synced {new Date(account.last_synced).toLocaleDateString()}
                </span>
                
                <button className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No cloud accounts connected</h3>
          <p className="text-sm text-gray-500 mb-6">Connect your first cloud provider to get started</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Account</span>
          </button>
        </div>
      )}

      <AddCredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default CloudAccountsPage;
