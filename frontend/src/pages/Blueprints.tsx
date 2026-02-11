import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import {
  FileCode,
  Plus,
  RefreshCw,
  Copy,
  Play,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Blueprint {
  id: number;
  name: string;
  description: string;
  provider: string;
  resource_type: string;
  uses_count: number;
  created_at: string;
}

const BlueprintsPage: React.FC = () => {
  const { data: blueprints, isLoading, refetch } = useQuery<Blueprint[]>({
    queryKey: ['blueprints'],
    queryFn: async () => {
      const response = await axios.get('/blueprints');
      const payload = response.data;
      return Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
    },
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <FileCode className="w-8 h-8 text-pink-500" />
            <span>Blueprints</span>
          </h1>
          <p className="text-gray-400 mt-1">Reusable infrastructure templates and configurations</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all">
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Blueprint</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (blueprints ?? []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blueprints?.map((blueprint, index) => (
            <motion.div
              key={blueprint.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-pink-500/10 rounded-lg">
                  <FileCode className="w-6 h-6 text-pink-500" />
                </div>
                <span className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded">
                  {blueprint.provider.toUpperCase()}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-white mb-2">{blueprint.name}</h3>
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">{blueprint.description}</p>

              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500">{blueprint.resource_type}</span>
                <span className="text-xs text-gray-500">Used {blueprint.uses_count} times</span>
              </div>

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-xs transition-colors">
                  <Play className="w-3 h-3" />
                  <span>Deploy</span>
                </button>
                <button className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-xs transition-colors">
                  <Copy className="w-3 h-3" />
                  <span>Clone</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <FileCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No blueprints yet</h3>
          <p className="text-sm text-gray-500 mb-6">Create reusable templates for your infrastructure</p>
          <button className="inline-flex items-center space-x-2 px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg transition-all">
            <Plus className="w-4 h-4" />
            <span className="font-medium">New Blueprint</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BlueprintsPage;
