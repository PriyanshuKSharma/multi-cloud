import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import StatusBadge from '../components/ui/StatusBadge';
import ProviderIcon from '../components/ui/ProviderIcon';
import PageGuide from '../components/ui/PageGuide';
import {
  Rocket,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Deployment {
  id: number;
  resource_name: string;
  provider: string;
  status: string;
  started_at: string;
  completed_at?: string;
  duration_seconds?: number;
  logs?: string[];
}

const DeploymentsPage: React.FC = () => {
  const { data: deployments, isLoading, refetch } = useQuery<Deployment[]>({
    queryKey: ['deployments'],
    queryFn: async () => {
      const response = await axios.get('/deployments');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
    refetchInterval: 10000,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'running':
      case 'in_progress':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Rocket className="w-8 h-8 text-orange-500" />
            <span>Deployments</span>
          </h1>
          <p className="text-gray-400 mt-1">Track your infrastructure deployments and provisioning</p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh</span>
        </button>
      </div>

      <PageGuide
        title="About Deployments"
        purpose="Deployments track infrastructure changes executed by Terraform and orchestration workers."
        actions={[
          'monitor running and completed deployment jobs',
          'inspect status by resource and provider',
          'open logs for troubleshooting and audit',
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (deployments ?? []).length > 0 ? (
        <div className="space-y-4">
          {deployments?.map((deployment, index) => (
            <motion.div
              key={deployment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(deployment.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{deployment.resource_name}</h3>
                      <StatusBadge status={deployment.status as any} size="sm" />
                      <ProviderIcon provider={deployment.provider as any} size="sm" />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Started {new Date(deployment.started_at).toLocaleString()}</span>
                      {deployment.duration_seconds && (
                        <>
                          <span>•</span>
                          <span>Duration: {deployment.duration_seconds}s</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
                  View Logs
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <Rocket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No deployments yet</h3>
          <p className="text-sm text-gray-500">Deployments will appear here when you create resources</p>
        </div>
      )}
    </div>
  );
};

export default DeploymentsPage;
