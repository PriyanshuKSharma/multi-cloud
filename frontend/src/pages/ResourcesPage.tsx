import React from 'react';
import ResourceList from '../components/ResourceList';

const ResourcesPage: React.FC = () => {
  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-white glow-text tracking-tighter">Resource Fleet</h1>
          <p className="text-gray-400 font-medium">Manage and monitor all active deployments across clusters.</p>
        </div>
      </div>
      
      <div className="space-y-6">
        <ResourceList pageSize={6} />
      </div>
    </div>
  );
};

export default ResourcesPage;
