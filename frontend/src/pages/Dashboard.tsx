import React from 'react';
import CreateResource from '../components/CreateResource';
import ResourceList from '../components/ResourceList';
import CostCharts from '../components/CostCharts';
import { motion } from 'framer-motion';
import { Activity, Server, DollarSign, Database, RefreshCw, Cloud, AlertCircle } from 'lucide-react';

import api from '../api/axios';
import { useState, useEffect } from 'react';

interface DashboardStats {
  total_resources: number;
  active_vms: number;
  total_storage: number;
  total_networks: number;
  estimated_monthly_cost: number;
  provider_breakdown: Array<{provider: string; count: number; vms: number; storage: number}>;
  cost_by_provider: Array<{provider: string; cost: number}>;
  cost_by_service: Array<{service: string; cost: number}>;
  region_distribution: Array<{region: string; count: number}>;
  provider_health: Array<{provider: string; status: string; response_time_ms: number; last_check: string; error_message: string | null}>;
  recent_activity: Array<{resource_name: string; provider: string; type: string; status: string; region: string; last_synced: string}>;
  last_updated: string;
}

const Dashboard: React.FC = () => {
  const [statsData, setStatsData] = useState<DashboardStats>({
    total_resources: 0,
    active_vms: 0,
    total_storage: 0,
    total_networks: 0,
    estimated_monthly_cost: 0,
    provider_breakdown: [],
    cost_by_provider: [],
    cost_by_service: [],
    region_distribution: [],
    provider_health: [],
    recent_activity: [],
    last_updated: new Date().toISOString()
  });
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/stats');
      setStatsData(res.data);
    } catch (e) {
      console.error("Failed to fetch dashboard stats", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    try {
      setSyncing(true);
      await api.post('/dashboard/sync/trigger');
      // Wait a bit then refresh stats
      setTimeout(fetchStats, 3000);
    } catch (e) {
      console.error("Failed to trigger sync", e);
      alert("Failed to trigger sync. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const stats = [
    { label: 'Total Resources', value: statsData.total_resources.toString(), icon: Cloud, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Active VMs', value: statsData.active_vms.toString(), icon: Server, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Storage Buckets', value: statsData.total_storage.toString(), icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'Monthly Cost', value: `$${statsData.estimated_monthly_cost.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  const getHealthColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400 bg-green-500/10 border-green-500/30';
      case 'degraded': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
      case 'error': return 'text-red-400 bg-red-500/10 border-red-500/30';
      default: return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
           <p className="text-gray-400 mt-1">Real-time insights from AWS, Azure, and GCP</p>
        </div>
        <button 
          onClick={handleManualSync}
          disabled={syncing}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          <span>{syncing ? 'Syncing...' : 'Sync Now'}</span>
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4 rounded-xl flex items-center space-x-4"
          >
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm text-gray-400">{stat.label}</p>
              <h3 className="text-xl font-bold text-white">{loading ? '...' : stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Provider Health */}
      {statsData.provider_health.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-4 rounded-xl"
        >
          <h3 className="text-lg font-bold text-white mb-3 flex items-center space-x-2">
            <Activity className="w-5 h-5" />
            <span>Provider Health</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {statsData.provider_health.map((health, idx) => (
              <div key={idx} className={`p-3 rounded-lg border ${getHealthColor(health.status)}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold uppercase text-sm">{health.provider}</span>
                  <span className="text-xs capitalize">{health.status}</span>
                </div>
                <div className="text-xs text-gray-400">
                  Response: {health.response_time_ms}ms
                </div>
                {health.error_message && (
                  <div className="mt-2 text-xs text-red-400 flex items-start space-x-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>{health.error_message}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Charts Section */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.5 }}
         className="mt-6"
      >
        <CostCharts 
            providerData={statsData.cost_by_provider.map(p => ({ name: p.provider, cost: p.cost }))} 
            serviceData={statsData.cost_by_service.map(s => ({ name: s.service, value: s.cost }))}
        />
      </motion.div>

      {/* Recent Activity */}
      {statsData.recent_activity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-4 rounded-xl"
        >
          <h3 className="text-lg font-bold text-white mb-3">Recent Activity</h3>
          <div className="space-y-2">
            {statsData.recent_activity.slice(0, 5).map((activity, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center space-x-3">
                  {activity.type === 'vm' ? <Server className="w-4 h-4 text-blue-400" /> : <Database className="w-4 h-4 text-purple-400" />}
                  <div>
                    <p className="text-sm font-medium text-white">{activity.resource_name}</p>
                    <p className="text-xs text-gray-400">{activity.region}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${
                    activity.provider === 'aws' ? 'text-orange-400 bg-orange-500/10' :
                    activity.provider === 'azure' ? 'text-blue-400 bg-blue-500/10' :
                    'text-green-400 bg-green-500/10'
                  }`}>
                    {activity.provider}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(activity.last_synced).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
             <div className="sticky top-6">
                <CreateResource />
             </div>
        </div>
        <div className="lg:col-span-2">
            <ResourceList />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
