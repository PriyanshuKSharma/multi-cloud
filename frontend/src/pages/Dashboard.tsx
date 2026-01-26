import React from 'react';
import CreateResource from '../components/CreateResource';
import ResourceList from '../components/ResourceList';
import CostCharts from '../components/CostCharts';
import { motion } from 'framer-motion';
import { Activity, Server, DollarSign, Database } from 'lucide-react';

const Dashboard: React.FC = () => {
  // Mock Stats Data
  const stats = [
    { label: 'Active Resources', value: '12', icon: Server, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Total Cost', value: '$245.00', icon: DollarSign, color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Storage Used', value: '1.2 TB', icon: Database, color: 'text-purple-400', bg: 'bg-purple-500/10' },
    { label: 'System Health', value: '100%', icon: Activity, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
           <p className="text-gray-400 mt-1">Real-time insights into your multi-cloud infrastructure.</p>
        </div>
        <button className="btn-primary flex items-center space-x-2">
            <span>Generate Report</span>
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
              <h3 className="text-xl font-bold text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <motion.div 
         initial={{ opacity: 0, scale: 0.98 }}
         animate={{ opacity: 1, scale: 1 }}
         transition={{ delay: 0.4 }}
         className="mt-6"
      >
        <CostCharts />
      </motion.div>

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
