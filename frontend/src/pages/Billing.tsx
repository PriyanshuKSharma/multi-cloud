
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import PageGuide from '../components/ui/PageGuide';

import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  RefreshCw,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const BillingPage: React.FC = () => {
  const { data: billing, refetch, isFetching } = useQuery({
    queryKey: ['billing'],
    queryFn: async () => {
      const response = await axios.get('/billing/overview');
      return response.data;
    },
  });

  const currentMonth = billing?.current_month_cost || 0;
  const lastMonth = billing?.last_month_cost || 0;
  const change = lastMonth > 0 ? ((currentMonth - lastMonth) / lastMonth) * 100 : 0;

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <DollarSign className="w-8 h-8 text-yellow-500" />
            <span>Cost & Billing</span>
          </h1>
          <p className="text-gray-400 mt-1">Monitor your multi-cloud spending and costs</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 disabled:opacity-60 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <button
            type="button"
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm font-medium">Export Report</span>
          </button>
        </div>
      </div>

      <PageGuide
        title="About Cost & Billing"
        purpose="This page helps you understand spending trends across cloud providers and services."
        actions={[
          'track current and historical monthly costs',
          'compare provider-level cost distribution',
          'review spend trend to identify anomalies',
        ]}
      />

      {/* Cost Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-400">Current Month</p>
            <Calendar className="w-4 h-4 text-gray-500" />
          </div>
          <h3 className="text-3xl font-bold text-white mb-2">${currentMonth.toFixed(2)}</h3>
          <div className="flex items-center space-x-2">
            {change >= 0 ? (
              <TrendingUp className="w-4 h-4 text-red-400" />
            ) : (
              <TrendingDown className="w-4 h-4 text-green-400" />
            )}
            <span className={`text-sm font-semibold ${change >= 0 ? 'text-red-400' : 'text-green-400'}`}>
              {Math.abs(change).toFixed(1)}% vs last month
            </span>
          </div>
        </div>

        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4">Last Month</p>
          <h3 className="text-3xl font-bold text-white">${lastMonth.toFixed(2)}</h3>
        </div>

        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
          <p className="text-sm text-gray-400 mb-4">Projected (End of Month)</p>
          <h3 className="text-3xl font-bold text-white">${(currentMonth * 1.2).toFixed(2)}</h3>
        </div>
      </div>

      {/* Cost by Provider */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Cost by Provider</h3>
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={billing?.cost_by_provider || []}>
              <XAxis dataKey="provider" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="cost" fill="#eab308" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Cost Trend */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Cost Trend (Last 30 Days)</h3>
        <div className="h-64 min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <LineChart data={billing?.cost_trend || []}>
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1a1a1d',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line type="monotone" dataKey="cost" stroke="#eab308" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
