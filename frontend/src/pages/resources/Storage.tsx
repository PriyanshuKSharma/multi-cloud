import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  Terminal,
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
  source: 'inventory' | 'provisioning';
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

interface ProvisionedResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  configuration?: Record<string, unknown>;
  created_at: string;
}

interface StorageObject {
  key: string;
  size: number;
  etag?: string;
  last_modified?: string;
}

const normalizeInventoryStorage = (item: any): StorageResource => {
  const metadata = item.metadata ?? {};
  
  return {
    id: item.id,
    resource_id: item.resource_id ?? '',
    resource_name: item.resource_name ?? item.name ?? 'Unnamed Storage',
    provider: String(item.provider ?? '').toLowerCase(),
    region: item.region ?? 'unknown',
    status: item.status ?? 'unknown',
    source: 'inventory',
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

const normalizeProvisionedStorage = (item: ProvisionedResource): StorageResource => {
  const config = item.configuration ?? {};
  const regionValue = config.region ?? config.location;
  const encryptionEnabled = config.encryption_enabled ?? config.encryption;
  const versioningEnabled = config.versioning_enabled;
  const publicAccess = config.public_access;

  return {
    id: item.id,
    resource_id: String(item.id),
    resource_name: item.name || 'Unnamed Storage',
    provider: String(item.provider ?? '').toLowerCase(),
    region: typeof regionValue === 'string' ? regionValue : 'unknown',
    status: item.status || 'pending',
    source: 'provisioning',
    metadata: {
      bucket_type: 'object-storage',
      size_gb: undefined,
      object_count: undefined,
      storage_class: 'Provisioning',
      versioning_enabled: typeof versioningEnabled === 'boolean' ? versioningEnabled : undefined,
      public_access: typeof publicAccess === 'boolean' ? publicAccess : undefined,
      encryption: typeof encryptionEnabled === 'boolean'
        ? (encryptionEnabled ? 'enabled' : 'disabled')
        : undefined,
      tags: undefined,
    },
    created_at: item.created_at ?? '',
    last_synced: item.created_at ?? '',
  };
};

const normalizeStorageStatus = (status: string): StorageResource['status'] => {
  if (!status) return 'unknown';
  return status.toLowerCase();
};

const StoragePage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    search: '',
  });
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadTarget, setUploadTarget] = React.useState<StorageResource | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const { data: storage, isLoading, error, refetch } = useQuery<StorageResource[]>({
    queryKey: ['inventory', 'storage', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      
      const [inventoryResponse, resourcesResponse] = await Promise.all([
        axios.get(`/inventory/storage?${params.toString()}`),
        axios.get('/resources/?limit=500'),
      ]);

      const inventoryPayload = inventoryResponse.data;
      const inventoryItems = (
        Array.isArray(inventoryPayload)
          ? inventoryPayload
          : Array.isArray(inventoryPayload?.items)
            ? inventoryPayload.items
            : []
      ).map(normalizeInventoryStorage);

      const resourcesPayload = resourcesResponse.data;
      const provisionedResources = (
        Array.isArray(resourcesPayload)
          ? resourcesPayload
          : Array.isArray(resourcesPayload?.items)
            ? resourcesPayload.items
            : []
      ) as ProvisionedResource[];

      const provisionedItems = provisionedResources
        .filter((item) => String(item.type).toLowerCase() === 'storage')
        .map(normalizeProvisionedStorage)
        .filter((item: StorageResource) => (filters.provider ? item.provider === filters.provider : true))
        .filter((item: StorageResource) => (filters.region ? item.region === filters.region : true))
        .map((item: StorageResource) => ({ ...item, status: normalizeStorageStatus(item.status) }));

      const mergedMap = new Map<string, StorageResource>();
      for (const item of inventoryItems) {
        const key = `${item.provider}:${item.resource_name}`.toLowerCase();
        mergedMap.set(key, item);
      }
      for (const item of provisionedItems) {
        const key = `${item.provider}:${item.resource_name}`.toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        }
      }

      return [...mergedMap.values()].sort((a, b) => {
        const aDate = Date.parse(a.last_synced || a.created_at || '') || 0;
        const bDate = Date.parse(b.last_synced || b.created_at || '') || 0;
        return bDate - aDate;
      });
    },
    refetchInterval: 10000,
  });

  const filteredStorage = (storage ?? []).filter((item) =>
    item.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (resourceId: number) => {
      await axios.delete(`/resources/${resourceId}`);
    },
    onMutate: (resourceId) => {
      setDeletingId(resourceId);
      setDeleteError(null);
      setActionMessage(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Failed to delete storage resource record.');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const listStorageObjects = async (resourceId: number): Promise<StorageObject[]> => {
    const response = await axios.get(`/resources/${resourceId}/storage/objects`, {
      params: { max_keys: 200 },
    });
    const payload = response.data;
    const items = Array.isArray(payload?.items) ? payload.items : [];
    return items as StorageObject[];
  };

  const handleDownload = async (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);

    if (item.source !== 'provisioning') {
      setActionMessage({
        type: 'error',
        text: 'Download is available for provisioned storage resources only.',
      });
      return;
    }

    try {
      const objects = await listStorageObjects(item.id);
      if (!objects.length) {
        setActionMessage({
          type: 'error',
          text: `No objects found in bucket "${item.resource_name}". Upload a file first.`,
        });
        return;
      }

      const sampleList = objects.slice(0, 10).map((obj, index) => `${index + 1}. ${obj.key}`).join('\n');
      const defaultKey = objects[0].key;
      const selectedKey = window.prompt(
        `Enter object key to download from "${item.resource_name}".\nAvailable objects:\n${sampleList}`,
        defaultKey
      );
      if (!selectedKey) return;

      const response = await axios.get(`/resources/${item.id}/storage/download`, {
        params: { key: selectedKey },
        responseType: 'blob',
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = selectedKey.split('/').pop() || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);

      setActionMessage({
        type: 'success',
        text: `Downloaded "${selectedKey}" from "${item.resource_name}".`,
      });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Failed to download object from bucket.',
      });
    }
  };

  const handleUploadClick = (item: StorageResource) => {
    setDeleteError(null);
    setActionMessage(null);
    if (item.source !== 'provisioning') {
      setActionMessage({
        type: 'error',
        text: 'Upload is available for provisioned storage resources only.',
      });
      return;
    }
    setUploadTarget(item);
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !uploadTarget) return;

    const suggestedKey = file.name;
    const selectedKey = window.prompt(
      `Enter object key for "${uploadTarget.resource_name}"`,
      suggestedKey
    );
    if (!selectedKey) {
      event.target.value = '';
      setUploadTarget(null);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', selectedKey);

    try {
      await axios.post(`/resources/${uploadTarget.id}/storage/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setActionMessage({
        type: 'success',
        text: `Uploaded "${selectedKey}" to "${uploadTarget.resource_name}".`,
      });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
    } catch (error: any) {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Failed to upload object to bucket.',
      });
    } finally {
      event.target.value = '';
      setUploadTarget(null);
    }
  };

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
          <Link
            to="/console"
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/20 transition-all duration-200"
          >
            <Terminal className="w-4 h-4" />
            <span className="text-sm font-medium">Open Console</span>
          </Link>
          <button
            onClick={() => refetch()}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          <Link
            to="/resources/storage/create"
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-all duration-200"
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

      {deleteError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      {actionMessage && (
        <div
          className={`rounded-xl px-4 py-3 text-sm border ${
            actionMessage.type === 'success'
              ? 'border-green-500/30 bg-green-500/10 text-green-300'
              : 'border-red-500/30 bg-red-500/10 text-red-300'
          }`}
        >
          {actionMessage.text}
        </div>
      )}

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
                      {item.source === 'provisioning' ? (
                        <Link
                          to={`/deployments/${item.id}`}
                          className="text-lg font-semibold text-white hover:text-purple-400 transition-colors truncate"
                        >
                          {item.resource_name}
                        </Link>
                      ) : (
                        <span className="text-lg font-semibold text-white truncate">
                          {item.resource_name}
                        </span>
                      )}
                      <StatusBadge status={item.status as any} size="sm" />
                      {item.source === 'provisioning' && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                          Provisioning
                        </span>
                      )}
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

              {item.source === 'provisioning' && (
                <p className="text-xs text-cyan-300/80 mb-4">
                  Created from provisioning jobs. Click the name to view deployment logs.
                </p>
              )}

              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.source === 'provisioning' ? (
                  <>
                    <button
                      onClick={() => handleDownload(item)}
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      onClick={() => handleUploadClick(item)}
                      className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-xs text-gray-300 transition-colors"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      disabled
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 rounded-lg text-xs text-gray-500 cursor-not-allowed"
                      title="Download is available for provisioned resources"
                    >
                      <Download className="w-3 h-3" />
                      <span>Download</span>
                    </button>
                    <button
                      disabled
                      className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 rounded-lg text-xs text-gray-500 cursor-not-allowed"
                      title="Upload is available for provisioned resources"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Upload</span>
                    </button>
                  </>
                )}
                {item.source === 'provisioning' ? (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Delete failed/provisioned record "${item.resource_name}"? This removes it from deployment/resource history.`
                        )
                      ) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    disabled={deletingId === item.id}
                    className="cursor-pointer flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 rounded-lg text-xs text-gray-500 cursor-not-allowed"
                    title="Managed inventory resources are deleted from provider consoles"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                )}
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

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileSelected}
      />
    </div>
  );
};

export default StoragePage;
