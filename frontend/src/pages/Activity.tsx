import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import {
  Activity as ActivityIcon,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ActivityItem {
  id: number;
  resource_name: string;
  provider: string;
  action: string;
  status: string;
  timestamp: string;
  user: string;
}

const ActivityPage: React.FC = () => {
  const { data: activities, isLoading, refetch } = useQuery<ActivityItem[]>({
    queryKey: ['activity'],
    queryFn: async () => {
      const response = await axios.get('/activity');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="activity"
        tone="emerald"
        eyebrow="Audit and event stream"
        eyebrowIcon={<ActivityIcon className="h-3.5 w-3.5" />}
        title="Activity Timeline"
        titleIcon={<ActivityIcon className="w-8 h-8 text-emerald-400" />}
        description="Track user actions, deployment events, and status transitions across cloud resources."
        chips={[
          { label: `${activities?.length ?? 0} events`, tone: 'emerald' },
        ]}
        actions={
          <>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filter</span>
            </button>
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About Activity"
        purpose="Activity timeline records operational events across resources, deployments, and integrations."
        actions={[
          'monitor recent changes in near real-time',
          'validate who triggered which action',
          'inspect status progression by provider and resource',
        ]}
      />

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (activities ?? []).length > 0 ? (
        <div className="space-y-4">
          {activities?.map((activity, index) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <ProviderIcon provider={activity.provider as any} size="md" />
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="text-gray-400 text-sm">{activity.user}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-white font-medium">{activity.action}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-300">{activity.resource_name}</span>
                      <StatusBadge status={activity.status as any} size="sm" />
                    </div>
                    
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <ActivityIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No activity yet</h3>
          <p className="text-sm text-gray-500">Activity will appear here when you create or modify resources</p>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
