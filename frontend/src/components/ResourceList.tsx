import React, { useEffect, useState } from 'react';
import api from '../api/axios';

import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import ResourceLogs from './ResourceLogs';

interface Resource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  details: string; // This is a JSON string in the initial mock, but API returns 'terraform_output' object
  terraform_output: any; // Add this
}

const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await api.get('/resources/');
        setResources(response.data);
      } catch (error) {
        console.error('Failed to fetch resources', error);
      }
    };
    
    fetchResources();
    // Poll every 5 seconds for status updates
    const interval = setInterval(fetchResources, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRowClick = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation(); // Don't trigger row click
    if (!window.confirm('Are you sure you want to delete this resource record?')) return;

    try {
      await api.delete(`/resources/${id}`);
      setResources(resources.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete resource', error);
      alert('Failed to delete resource record');
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
         <h2 className="text-xl font-bold text-white">Resource Inventory</h2>
         <span className="text-sm text-gray-400">{resources.length} active nodes</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-800/50 text-gray-400 uppercase text-xs">
            <tr>
              <th className="p-4 font-semibold">Name</th>
              <th className="p-4 font-semibold">Type</th>
              <th className="p-4 font-semibold">Provider</th>
              <th className="p-4 font-semibold">Status</th>
              <th className="p-4 font-semibold">IP Address</th>
              <th className="p-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700/50 text-sm">
            {resources.length === 0 ? (
               <tr>
                <td colSpan={5} className="p-8 text-center text-gray-500">
                    No resources found. Deploy one to get started.
                </td>
               </tr>
            ) : resources.map((res) => (
              <tr 
                key={res.id} 
                onClick={() => handleRowClick(res)}
                className="hover:bg-gray-700/30 transition-colors cursor-pointer group"
              >
                <td className="p-4 font-medium text-white group-hover:text-blue-400 transition-colors">{res.name}</td>
                <td className="p-4 text-gray-300 capitalize">{res.type}</td>
                <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold uppercase ${
                        res.provider === 'aws' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        res.provider === 'azure' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                        'bg-green-500/10 text-green-400 border border-green-500/20'
                    }`}>
                        {res.provider}
                    </span>
                </td>
                <td className="p-4">
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    res.status === 'active' ? 'bg-emerald-500/10 text-emerald-400' : 
                    res.status === 'pending' || res.status === 'provisioning' ? 'bg-yellow-500/10 text-yellow-400 animate-pulse' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {res.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                    {(res.status === 'pending' || res.status === 'provisioning') && <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />}
                    <span>{res.status}</span>
                  </span>
                </td>
                <td className="p-4 text-gray-400 font-mono text-xs">
                  {res.terraform_output?.ip || '-'}
                </td>
                <td className="p-4 text-right">
                  {res.status !== 'active' && (
                    <button 
                      onClick={(e) => handleDelete(e, res.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
                      title="Delete Record"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>

    <ResourceLogs 
        isOpen={!!selectedResource} 
        onClose={() => setSelectedResource(null)}
        logs={selectedResource?.terraform_output?.logs || "No logs available yet..."} 
        resourceName={selectedResource?.name || ""}
    />
    </>
  );
};

export default ResourceList;
