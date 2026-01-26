import React from 'react';
import { useAuth } from '../context/AuthContext';
import CreateResource from '../components/CreateResource';
import ResourceList from '../components/ResourceList';
import CostCharts from '../components/CostCharts';

const Dashboard: React.FC = () => {
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-900 text-white font-sans">
      <nav className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
            <span className="text-2xl">☁️</span>
            <h1 className="text-xl font-bold tracking-tight">Multi-Cloud Orchestrator</h1>
        </div>
        <button 
          onClick={logout}
          className="px-4 py-2 text-sm bg-red-600/10 text-red-400 border border-red-600/20 rounded hover:bg-red-600/20 transition"
        >
          Logout
        </button>
      </nav>

      <div className="container mx-auto p-6 max-w-6xl">
        <CostCharts />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="md:col-span-1">
                <CreateResource />
            </div>
            <div className="md:col-span-2">
                <ResourceList />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
