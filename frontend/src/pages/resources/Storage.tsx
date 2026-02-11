import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import {
  Database,
  Plus,
  Search,
  RefreshCw,
  HardDrive,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface StorageResource {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
  metadata: {
    bucket_type?: string;
    size_gb?: number;
    object_count?: number;
    storage_class?: string;
    versioning_enabled?: boolean;
    public_access?: boolean;
    encryption?: string;
    tags?: Record<string, string>;
  };
  created_at: string;
  last_synced: string;
}

const normalizeStorage = (item: any): StorageResource => {
  const metadata = item.metadata ?? {};
  
  return {
    id: item.id,
    resource_id: item.resource_id ?? '',
    resource_name: item.resource_name ?? item.name ?? 'Unnamed Storage',
    provider: String(item.provider ?? '').toLowerCase(),
    region: item.region ?? 'unknown',
    status: item.status ?? 'unknown',
    metadata: {
      bucket_type: metadata.bucket_type ?? item.bucket_type,
      size_gb: metadata.size_gb ?? item.size_gb,
      object_count: metadata.object_count ?? item.object_count,
      storage_class: metadata.storage_class ?? item.storage_class,
      versioning_enabled: metadata.versioning_enabled ?? item.versioning_enabled,
      public_access: metadata.public_access ?? item.public_access,
      encryption: metadata.encryption ?? item.encryption,
      tags: metadata.tags ?? item.tags,
    },
    created_at: item.created_at ?? '',
    last_synced: item.last_synced ?? item.last_synced_at ?? '',
  };
};

const StoragePage: React.FC = () => {
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    search: '',
  });

  const { data: storage, isLoading, error, refetch } = useQuery<StorageResource[]>({
    queryKey: ['inventory', 'storage', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      
      const response = await axios.get(`/inventory/storage?${params.toString()}`);
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map(normalizeStorage);
    },
    refetchInterval: 30000,
  });

  const filteredStorage = (storage ?? []).filter((item) =>
    item.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const formatSize = (sizeGb?: number) => {
    if (!sizeGb) return 'N/A';
    if (sizeGb < 1) return `${(sizeGb * 1024).toFixed(2)} MB`;
    if (sizeGb < 1024) return `${sizeGb.toFixed(2)} GB`;
    return `${(sizeGb / 1024).toFixed(2)} TB`;
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-500" />
            <span>Storage Resources</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage your multi-cloud storage buckets and volumes</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <Link
            to="/resources/storage/create"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Storage</span>
          </Link>
        </div>
      </div>

      <PageGuide
        title="About Storage"
        purpose="Storage shows object and block storage resources discovered from connected cloud accounts."
        actions={[
          'search and filter storage assets by provider and region',
          'review size, object count, and security-related flags',
          'create new storage resources from this page',
        ]}
      />

      {/* Filters */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search storage..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>

          {/* Region Filter */}
          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          >
            <option value="">All Regions</option>
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="eastus">eastus</option>
            <option value="westus">westus</option>
            <option value="us-central1">us-central1</option>
          </select>
        </div>
      </div>

      {/* Storage List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load storage resources</p>
        </div>
      ) : filteredStorage && filteredStorage.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredStorage.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <ProviderIcon provider={item.provider as any} size="lg" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/resources/storage/${item.id}`}
                        className="text-lg font-semibold text-white hover:text-purple-400 transition-colors truncate"
                      >
                        {item.resource_name}
                      </Link>
                      <StatusBadge status={item.status as any} size="sm" />
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{item.region}</span>
                      <span>•</span>
                      <span>{item.metadata.storage_class || 'Standard'}</span>
                      {item.metadata.encryption && (
                        <>
                          <span>•</span>
                          <span className="text-green-400">🔒 Encrypted</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Size</p>
                  <p className="text-sm font-medium text-gray-300">{formatSize(item.metadata.size_gb)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Objects</p>
                  <p className="text-sm font-medium text-gray-300">
                    {item.metadata.object_count?.toLocaleString() || '0'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Access</p>
                  <p className="text-sm font-medium text-gray-300">
                    {item.metadata.public_access ? (
                      <span className="text-yellow-400">Public</span>
                    ) : (
                      <span className="text-green-400">Private</span>
                    )}
                  </p>
                </div>
              </div>

              {item.metadata.tags && Object.keys(item.metadata.tags).length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  {Object.entries(item.metadata.tags).slice(0, 3).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded border border-gray-700/50"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-xs text-gray-300 transition-colors">
                  <Download className="w-3 h-3" />
                  <span>Download</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-xs text-gray-300 transition-colors">
                  <Upload className="w-3 h-3" />
                  <span>Upload</span>
                </button>
                <button className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-colors">
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <HardDrive className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No storage resources found</h3>
          <p className="text-sm text-gray-500 mb-6">Get started by creating your first storage bucket</p>
          <Link
            to="/resources/storage/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Storage</span>
          </Link>
        </div>
      )}

      {/* Summary */}
      {filteredStorage && filteredStorage.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredStorage.length} of {storage?.length || 0} storage resources
          </p>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-2">
              <HardDrive className="w-4 h-4" />
              <span>
                Total Size: {formatSize(filteredStorage.reduce((sum, item) => sum + (item.metadata.size_gb || 0), 0))}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>
                Total Objects: {filteredStorage.reduce((sum, item) => sum + (item.metadata.object_count || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoragePage;
