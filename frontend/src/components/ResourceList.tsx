import React, { useEffect, useState } from 'react';
import api from '../api/axios';

import { motion } from 'framer-motion';

interface Resource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  created_at: string;
}

const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);

  const fetchResources = async () => {
    try {
      const response = await api.get('/resources/');
      setResources(response.data);
    } catch (error) {
      console.error("Failed to fetch resources");
    }
  };

  useEffect(() => {
    fetchResources();
    const interval = setInterval(fetchResources, 5000); // Poll every 5s for status updates
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'active': return 'text-green-400';
      case 'failed': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700 mt-6">
      <h2 className="text-xl font-bold mb-4 text-white">Your Resources</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-gray-300">
          <thead className="text-gray-400 uppercase text-xs border-b border-gray-700">
            <tr>
              <th className="px-4 py-2">Name</th>
              <th className="px-4 py-2">Provider</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Created At</th>
            </tr>
          </thead>
          <tbody>
            {resources.map((res) => (
              <tr key={res.id} className="border-b border-gray-700 hover:bg-gray-700">
                <td className="px-4 py-3 font-medium text-white">{res.name}</td>
                <td className="px-4 py-3 capitalize">{res.provider}</td>
                <td className="px-4 py-3 capitalize">{res.type}</td>
                <td className={`px-4 py-3 capitalize font-bold ${getStatusColor(res.status)}`}>{res.status}</td>
                <td className="px-4 py-3 text-sm">{new Date(res.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {resources.length === 0 && (
                <tr>
                    <td colSpan={5} className="text-center py-4 text-gray-500">No resources found. Create one above!</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResourceList;
