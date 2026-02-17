import React, { useEffect, useState } from 'react';
import api from '../api/axios';

import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronLeft, ChevronRight, Server, Database, Activity, AlertCircle } from 'lucide-react';
import ResourceLogs from './ResourceLogs';
import ConfirmDialog from './ui/ConfirmDialog';

interface Resource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  details: string;
  terraform_output: any;
}

const ITEMS_PER_PAGE = 6;

const ResourceList: React.FC = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleResourceClick = (resource: Resource) => {
    setSelectedResource(resource);
  };

  const openDeleteConfirm = (e: React.MouseEvent, resource: Resource) => {
    e.stopPropagation();
    setDeleteError(null);
    setResourceToDelete(resource);
  };

  const handleDelete = async () => {
    if (!resourceToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/resources/${resourceToDelete.id}`);
      setResources(resources.filter((r) => r.id !== resourceToDelete.id));
      setResourceToDelete(null);
    } catch (error) {
      console.error('Failed to delete resource', error);
      setDeleteError('Failed to delete resource record');
    } finally {
      setIsDeleting(false);
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(resources.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedResources = resources.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Server className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/30';
      case 'pending':
      case 'provisioning': return 'from-yellow-500/20 to-yellow-600/10 border-yellow-500/30';
      case 'failed': return 'from-red-500/20 to-red-600/10 border-red-500/30';
      default: return 'from-gray-500/20 to-gray-600/10 border-gray-500/30';
    }
  };

  return (
    <>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-card rounded-2xl overflow-hidden border border-white/10"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-700/50 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-white">Resource Fleet</h2>
            <span className="px-3 py-1 bg-blue-500/10 text-blue-400 rounded-full text-sm font-medium border border-blue-500/20">
              {resources.length} nodes
            </span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex bg-gray-800/50 rounded-lg p-1">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'cards' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  viewMode === 'table' 
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Table
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {deleteError && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {deleteError}
            </div>
          )}
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-400 mb-2">No Resources Deployed</h3>
              <p className="text-gray-500">Deploy your first resource to get started with the platform.</p>
            </div>
          ) : (
            <>
              {viewMode === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence mode="popLayout">
                    {paginatedResources.map((resource, index) => (
                      <motion.div
                        key={resource.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleResourceClick(resource)}
                        className={`relative p-5 rounded-xl bg-gradient-to-br ${getStatusColor(resource.status)} border cursor-pointer hover:scale-[1.02] transition-all duration-200 group`}
                      >
                        {/* Status Indicator */}
                        <div className="absolute top-3 right-3">
                          <div className={`flex items-center space-x-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                            resource.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 
                            resource.status === 'pending' || resource.status === 'provisioning' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {getStatusIcon(resource.status)}
                            <span className="capitalize">{resource.status}</span>
                          </div>
                        </div>

                        {/* Resource Icon */}
                        <div className="mb-4">
                          {resource.type === 'storage' ? (
                            <Database className="w-8 h-8 text-white/80" />
                          ) : (
                            <Server className="w-8 h-8 text-white/80" />
                          )}
                        </div>

                        {/* Resource Info */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-white text-lg truncate group-hover:text-blue-300 transition-colors">
                            {resource.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-300 capitalize">
                              {resource.type}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                              resource.provider === 'aws' ? 'text-orange-400' :
                              resource.provider === 'azure' ? 'text-blue-400' :
                              'text-green-400'
                            }`}>
                              {resource.provider}
                            </span>
                          </div>
                          
                          {resource.terraform_output?.ip && (
                            <div className="pt-2 border-t border-white/10">
                              <p className="text-xs text-gray-400">IP Address</p>
                              <p className="font-mono text-sm text-white">{resource.terraform_output.ip}</p>
                            </div>
                          )}
                        </div>

                        {/* Delete Button */}
                        {resource.status !== 'active' && (
                          <button 
                            onClick={(e) => openDeleteConfirm(e, resource)}
                            className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            title="Delete Record"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              ) : (
                /* Table View */
                <div className="overflow-x-auto rounded-lg border border-gray-700/50">
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
                      {paginatedResources.map((res) => (
                        <tr 
                          key={res.id} 
                          onClick={() => handleResourceClick(res)}
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
                                onClick={(e) => openDeleteConfirm(e, res)}
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
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-700/50">
                  <div className="text-sm text-gray-400">
                    Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, resources.length)} of {resources.length} resources
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                            currentPage === page
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                              : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg bg-gray-800/50 text-gray-400 hover:text-white hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <ResourceLogs 
        isOpen={!!selectedResource} 
        onClose={() => setSelectedResource(null)}
        logs={selectedResource?.terraform_output?.logs || "No logs available yet..."} 
        resourceName={selectedResource?.name || ""}
      />

      <ConfirmDialog
        open={resourceToDelete !== null}
        title="Delete Resource Record"
        message={
          resourceToDelete
            ? `Delete resource "${resourceToDelete.name}"? This removes the record from the platform.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={isDeleting}
        onCancel={() => {
          if (!isDeleting) setResourceToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default ResourceList;
