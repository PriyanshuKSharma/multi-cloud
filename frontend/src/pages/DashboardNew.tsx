import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import MetricCard from '../components/ui/MetricCard';
import StatusBadge from '../components/ui/StatusBadge';
import ProviderIcon from '../components/ui/ProviderIcon';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import {
  Server,
  Database,
  DollarSign,
  Layers,
  Activity,
  RefreshCw,
  Terminal,
  AlertCircle,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { motion } from 'framer-motion';

interface DashboardStats {
  total_resources: number;
  active_vms: number;
  total_storage: number;
  total_networks: number;
  estimated_monthly_cost: number;
  provider_breakdown: Array<{
    provider: string;
    count: number;
    vms: number;
    storage: number;
  }>;
  cost_by_provider: Array<{
    provider: string;
    cost: number;
  }>;
  cost_by_service: Array<{
    service: string;
    cost: number;
  }>;
  region_distribution: Array<{
    region: string;
    count: number;
  }>;
  provider_health: Array<{
    provider: string;
    status: string;
    response_time_ms: number;
    last_check: string;
    error_message: string | null;
  }>;
  recent_activity: Array<{
    resource_name: string;
    provider: string;
    type: string;
    status: string;
    region: string;
    last_synced: string;
  }>;
  last_updated: string;
}

const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useQuery<DashboardStats>({
    queryKey: ['dashboard', 'stats'],
    queryFn: async () => {
      const response = await axios.get('/dashboard/stats');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const COLORS = {
    aws: '#FF9900',
    azure: '#0078D4',
    gcp: '#4285F4',
  };

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Failed to load dashboard</h3>
            <p className="text-sm text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'An error occurred'}
            </p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8">
      <PageHero
        id="dashboard"
        tone="blue"
        eyebrow="Multi-cloud command center"
        eyebrowIcon={<Activity className="h-3.5 w-3.5" />}
        title="Dashboard"
        titleIcon={<Layers className="w-8 h-8 text-blue-300" />}
        description="Multi-cloud resource overview, cost trends, provider health, and activity insights."
        chips={[
          { label: `${stats?.total_resources ?? 0} total resources`, tone: 'blue' },
          { label: `${stats?.active_vms ?? 0} active VMs`, tone: 'emerald' },
          { label: `$${stats?.estimated_monthly_cost?.toFixed(2) ?? '0.00'} monthly`, tone: 'orange' },
        ]}
        actions={
          <>
            <Link
              to="/console"
              className="flex-1 md:flex-none justify-center cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/20 transition-all duration-200"
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Cloud Console</span>
            </Link>
            <button
              onClick={() => refetch()}
              className="flex-1 md:flex-none justify-center cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About Dashboard"
        purpose="This dashboard gives a real-time summary of your multi-cloud estate and platform health."
        actions={[
          'monitor VM, storage, network, and cost KPIs',
          'track provider health and recent activity',
          'refresh data to validate current backend sync status',
        ]}
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <MetricCard
          title="Total Resources"
          value={stats?.total_resources || 0}
          change={{ value: 5, label: 'added today', type: 'increase' }}
          icon={Layers}
          iconColor="text-blue-500"
          loading={isLoading}
        />
        <MetricCard
          title="Active VMs"
          value={stats?.active_vms || 0}
          change={{ value: 2, label: 'running', type: 'increase' }}
          icon={Server}
          iconColor="text-green-500"
          loading={isLoading}
        />
        <MetricCard
          title="Storage Resources"
          value={stats?.total_storage || 0}
          change={{ value: 1, label: 'bucket removed', type: 'decrease' }}
          icon={Database}
          iconColor="text-purple-500"
          loading={isLoading}
        />
        <MetricCard
          title="Monthly Cost"
          value={`$${stats?.estimated_monthly_cost?.toFixed(2) || '0.00'}`}
          change={{ value: 8.5, label: 'vs last month', type: 'increase' }}
          icon={DollarSign}
          iconColor="text-yellow-500"
          loading={isLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Provider Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Multi-Cloud Distribution</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats?.provider_breakdown || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry: any) => `${String(entry?.provider || '').toUpperCase()}: ${entry?.count ?? 0}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(stats?.provider_breakdown || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[entry.provider as keyof typeof COLORS]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-6 grid grid-cols-3 gap-4">
            {stats?.provider_breakdown.map((provider) => (
              <div key={provider.provider} className="text-center">
                <ProviderIcon provider={provider.provider as any} size="sm" />
                <p className="text-sm font-semibold text-gray-300 mt-2">{provider.count}</p>
                <p className="text-xs text-gray-500">resources</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Cost by Provider */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Cost by Provider</h3>
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.cost_by_provider || []}>
                  <XAxis dataKey="provider" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1d',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="cost" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>
      </div>

      {/* Provider Health & Recent Activity */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
        {/* Provider Health */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Cloud Provider Health</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.provider_health.map((provider) => (
                <div
                  key={provider.provider}
                  className="flex items-center justify-between p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <ProviderIcon provider={provider.provider as any} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-gray-300">{provider.provider.toUpperCase()}</p>
                      <p className="text-xs text-gray-500">{provider.response_time_ms}ms response time</p>
                    </div>
                  </div>
                  <StatusBadge status={provider.status as any} size="sm" />
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6">Recent Activity</h3>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-800/50 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {stats?.recent_activity.slice(0, 5).map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
                >
                  <Activity className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-300 truncate">{activity.resource_name}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <ProviderIcon provider={activity.provider as any} size="sm" />
                      <StatusBadge status={activity.status as any} size="sm" />
                      <span className="text-xs text-gray-500">• {activity.region}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(activity.last_synced).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Last Updated */}
      {stats?.last_updated && (
        <div className="text-center text-sm text-gray-500">
          Last updated: {new Date(stats.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
