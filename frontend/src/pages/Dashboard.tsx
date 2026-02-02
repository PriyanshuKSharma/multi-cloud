import React from 'react';
import CreateResource from '../components/CreateResource';
import ResourceList from '../components/ResourceList';
import CostCharts from '../components/CostCharts';
import { motion } from 'framer-motion';
import { Activity, Server, DollarSign, Database } from 'lucide-react';

import api from '../api/axios';
import { useState, useEffect } from 'react';

const Dashboard: React.FC = () => {
  const [statsData, setStatsData] = useState({
      active_resources: 0,
      total_cost: '$0.00',
      storage_used: '0 TB',
      system_health: '100%',
      cost_by_provider: [],
      cost_by_service: []
  });

  useEffect(() => {
    const fetchStats = async () => {
        try {
            const res = await api.get('/resources/stats');
            setStatsData({
                active_resources: res.data.active_resources,
                total_cost: res.data.total_cost,
                storage_used: res.data.storage_used,
                system_health: res.data.system_health,
                cost_by_provider: res.data.cost_by_provider || [],
                cost_by_service: res.data.cost_by_service || []
            });
        } catch (e) {
            console.error("Failed to fetch stats", e);
        }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Real Active Instances', value: statsData.active_resources.toString(), icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' },
    { label: 'Estimated Cost', value: statsData.total_cost, icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20' },
    { label: 'Storage Used', value: statsData.storage_used, icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' },
    { label: 'System Health', value: statsData.system_health, icon: Activity, color: 'text-indigo-400', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/20' },
  ];

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
           <h1 className="text-4xl font-bold glow-text tracking-tight">Dashboard Overview</h1>
           <p className="text-gray-400 mt-2 text-lg">Real-time insights into your multi-cloud galaxy.</p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="btn-primary flex items-center space-x-3 w-fit"
        >
            <Activity className="w-5 h-5" />
            <span>Generate Network Report</span>
        </motion.button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
                delay: index * 0.1,
                type: "spring",
                stiffness: 260,
                damping: 20 
            }}
            whileHover={{ y: -5, transition: { duration: 0.2 } }}
            className={`glass-card p-6 rounded-3xl flex flex-col items-start justify-between min-h-[160px] relative overflow-hidden group ${stat.glow}`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-bl-full -mr-8 -mt-8 transition-transform duration-500 group-hover:scale-110" />
            
            <div className={`p-4 rounded-2xl ${stat.bg} mb-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
            </div>
            
            <div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div 
         initial={{ opacity: 0, y: 30 }}
         animate={{ opacity: 1, y: 0 }}
         transition={{ delay: 0.4, duration: 0.8 }}
         className="mt-12"
      >
        <div className="flex items-center space-x-3 mb-6">
            <DollarSign className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-white">Cost Analytics</h2>
        </div>
        <CostCharts 
            providerData={statsData.cost_by_provider} 
            serviceData={statsData.cost_by_service}
        />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-12">
        <div className="lg:col-span-4">
             <div className="sticky top-10">
                <div className="flex items-center space-x-3 mb-6 px-2">
                    <Server className="w-6 h-6 text-purple-400" />
                    <h2 className="text-2xl font-bold text-white">Operations</h2>
                </div>
                <CreateResource />
             </div>
        </div>
        <div className="lg:col-span-8">
            <div className="flex items-center space-x-3 mb-6 px-2">
                <Database className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-bold text-white">Resource Fleet</h2>
            </div>
            <ResourceList pageSize={6} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
