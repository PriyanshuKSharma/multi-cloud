import React, { useEffect, useState } from 'react';
import api from '../api/axios';

import { motion } from 'framer-motion';
import { Trash2, Server, ChevronLeft, ChevronRight } from 'lucide-react';
import ResourceLogs from './ResourceLogs';

interface Resource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  details: string; 
  terraform_output: any;
}

interface ResourceListProps {
  pageSize?: number;
}

const ResourceList: React.FC<ResourceListProps> = ({ pageSize = 10 }) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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
    const interval = setInterval(fetchResources, 5000);
    return () => clearInterval(interval);
  }, []);

  // Pagination Logic
  const totalPages = Math.ceil(resources.length / pageSize);
  const currentItems = resources.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [resources.length, totalPages, currentPage]);

  const handleRowClick = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this resource record?')) return;

    try {
      await api.delete(`/resources/${id}`);
      setResources(resources.filter(r => r.id !== id));
    } catch (error) {
      console.error('Failed to delete resource', error);
    }
  };

  return (
    <>
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-[2rem] overflow-hidden border-white/5 shadow-2xl flex flex-col"
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/[0.02] border-b border-white/5">
              <th className="p-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Infrastructure Node</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Network Type</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Core Provider</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Operational State</th>
              <th className="p-6 font-bold text-gray-400 uppercase tracking-widest text-[10px]">Interface IP</th>
              <th className="p-6 text-right font-bold text-gray-400 uppercase tracking-widest text-[10px]">Control</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.03]">
            {currentItems.length === 0 ? (
               <tr>
                <td colSpan={6} className="p-20 text-center">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
                            <Server className="text-gray-600" />
                        </div>
                        <p className="text-gray-500 font-medium">No active nodes detected in the galactic cluster.</p>
                    </div>
                </td>
               </tr>
            ) : currentItems.map((res, index) => (
              <motion.tr 
                key={res.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleRowClick(res)}
                className="hover:bg-white/[0.04] transition-all duration-300 cursor-pointer group"
              >
                <td className="p-6">
                    <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                        <span className="font-bold text-white group-hover:text-blue-400 transition-colors">{res.name}</span>
                    </div>
                </td>
                <td className="p-6">
                    <span className="text-gray-300 font-medium bg-white/5 px-3 py-1 rounded-full text-xs border border-white/5 capitalize">
                        {res.type}
                    </span>
                </td>
                <td className="p-6">
                    <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                            res.provider === 'aws' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            res.provider === 'azure' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        }`}>
                            {res.provider}
                        </span>
                    </div>
                </td>
                <td className="p-6">
                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] font-bold ${
                    res.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                    res.status === 'pending' || res.status === 'provisioning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                        res.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' :
                        res.status === 'pending' || res.status === 'provisioning' ? 'bg-amber-400 animate-ping' :
                        'bg-red-400'
                    }`} />
                    <span className="uppercase tracking-tighter">{res.status}</span>
                  </div>
                </td>
                <td className="p-6 font-mono text-xs text-gray-500 group-hover:text-blue-400/70 transition-colors">
                  {res.terraform_output?.ip || '0.0.0.0'}
                </td>
                <td className="p-6 text-right">
                    <button 
                      onClick={(e) => handleDelete(e, res.id)}
                      className="p-2.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all duration-300 opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={16} />
                    </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-8 py-4 border-t border-white/5 bg-white/[0.01]">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sector</span>
            <span className="text-sm font-bold text-blue-400">{currentPage}</span>
            <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest">of</span>
            <span className="text-sm font-bold text-gray-400">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </motion.div>

    <ResourceLogs 
        isOpen={!!selectedResource} 
        onClose={() => setSelectedResource(null)}
        logs={selectedResource?.terraform_output?.logs || "Synchronizing with uplink..."} 
        resourceName={selectedResource?.name || ""}
    />
    </>
  );
};

export default ResourceList;
