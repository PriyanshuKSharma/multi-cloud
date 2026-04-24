import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageHero from '../../components/ui/PageHero';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Network,
  Plus,
  Search,
  RefreshCw,
  Globe,
  Trash2,
  Settings,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NetworkResource {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
  source: 'inventory' | 'provisioning';
  metadata: {
    cidr_block?: string;
    subnet_count?: number;
    vpc_id?: string;
    internet_gateway?: boolean;
    nat_gateway?: boolean;
    dns_enabled?: boolean;
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
  terraform_output?: Record<string, unknown>;
  created_at: string;
}



const normalizeInventoryNetwork = (item: any): NetworkResource => {
  const metadata = item.metadata ?? {};
  
  return {
    id: item.id,
    resource_id: item.resource_id ?? '',
    resource_name: item.resource_name ?? item.name ?? 'Unnamed Network',
    provider: String(item.provider ?? '').toLowerCase(),
    region: item.region ?? 'unknown',
    status: item.status ?? 'unknown',
    source: 'inventory',
    metadata: {
      cidr_block: metadata.cidr_block ?? item.cidr_block,
      subnet_count: metadata.subnet_count ?? item.subnet_count,
      vpc_id: metadata.vpc_id ?? item.vpc_id,
      internet_gateway: metadata.internet_gateway ?? item.internet_gateway,
      nat_gateway: metadata.nat_gateway ?? item.nat_gateway,
      dns_enabled: metadata.dns_enabled ?? item.dns_enabled,
      tags: metadata.tags ?? item.tags,
    },
    created_at: item.created_at ?? '',
    last_synced: item.last_synced ?? item.last_synced_at ?? '',
  };
};

const normalizeProvisionedNetwork = (item: ProvisionedResource): NetworkResource => {
  const config = item.configuration ?? {};
  const regionValue = config.region ?? config.location;

  return {
    id: item.id,
    resource_id: String(item.id),
    resource_name: item.name || 'Unnamed Network',
    provider: String(item.provider ?? '').toLowerCase(),
    region: typeof regionValue === 'string' ? regionValue : 'unknown',
    status: item.status || 'pending',
    source: 'provisioning',
    metadata: {
      cidr_block: typeof config.cidr === 'string' ? config.cidr : (typeof config.cidr_block === 'string' ? config.cidr_block : undefined),
      subnet_count: undefined,
      vpc_id: undefined,
      internet_gateway: undefined,
      nat_gateway: typeof config.nat_gateway === 'boolean' ? config.nat_gateway : undefined,
      dns_enabled: typeof config.dns_enabled === 'boolean' ? config.dns_enabled : undefined,
      tags: undefined,
    },
    created_at: item.created_at ?? '',
    last_synced: item.created_at ?? '',
  };
};

const NetworksPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    search: '',
  });

  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [networkToDelete, setNetworkToDelete] = React.useState<NetworkResource | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const { data: networks, isLoading, error, refetch } = useQuery<NetworkResource[]>({
    queryKey: ['inventory', 'networks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      
      const [inventoryResponse, resourcesResponse] = await Promise.all([
        axios.get(`/inventory/networks?${params.toString()}`),
        axios.get('/resources/?limit=500'),
      ]);

      const inventoryPayload = inventoryResponse.data;
      const inventoryItems = (
        Array.isArray(inventoryPayload)
          ? inventoryPayload
          : Array.isArray(inventoryPayload?.items)
            ? inventoryPayload.items
            : []
      ).map(normalizeInventoryNetwork);

      const resourcesPayload = resourcesResponse.data;
      const provisionedResources = (
        Array.isArray(resourcesPayload)
          ? resourcesPayload
          : Array.isArray(resourcesPayload?.items)
            ? resourcesPayload.items
            : []
      ) as ProvisionedResource[];

      const provisionedItems = provisionedResources
        .filter((item) => ['network', 'vpc', 'resource_group'].includes(String(item.type).toLowerCase()))
        .map(normalizeProvisionedNetwork)
        .filter((item: NetworkResource) => (filters.provider ? item.provider === filters.provider : true))
        .filter((item: NetworkResource) => (filters.region ? item.region === filters.region : true));

      const mergedMap = new Map<string, NetworkResource>();
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
    refetchInterval: 30000,
  });

  const filteredNetworks = (networks ?? []).filter((item) =>
    item.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  const deleteMutation = useMutation({
    mutationFn: async (item: NetworkResource) => {
      if (item.source === 'provisioning') {
        await axios.delete(`/resources/${item.id}`);
      } else {
        // Mock fallback if user tries to delete inventory via network API
        // Real platforms might not allow deleting synced resources without un-syncing
        throw new Error('Deletion of synced inventory networks is not supported via this console yet. Please delete via cloud provider.');
      }
    },
    onMutate: (item) => {
      setDeletingId(item.id);
      setActionMessage(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'networks'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      setActionMessage({ type: 'success', text: 'Network scheduled for deletion' });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail || error.message;
      setActionMessage({ type: 'error', text: typeof detail === 'string' ? detail : 'Failed to delete network.' });
    },
    onSettled: () => {
      setDeletingId(null);
      setNetworkToDelete(null);
    },
  });

  const confirmDelete = () => {
    if (networkToDelete) {
      deleteMutation.mutate(networkToDelete);
    }
  };

  const handleConfigure = (item: NetworkResource) => {
    navigate(`/resources/networks/${item.id}`);
  };

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="networks"
        tone="cyan"
        eyebrow="Network topology and controls"
        eyebrowIcon={<Network className="h-3.5 w-3.5" />}
        title="Networks"
        titleIcon={<Network className="w-8 h-8 text-cyan-400" />}
        description="Manage virtual networks, gateways, and CIDR segmentation across connected providers."
        chips={[
          { label: `${networks?.length ?? 0} discovered`, tone: 'cyan' },
          { label: `${filteredNetworks.length} visible`, tone: 'blue' },
        ]}
        guide={{
          title: 'About Networks',
          purpose: 'Networks tracks virtual networks, VPCs, and networking foundations used by your cloud resources.',
          actions: [
            'filter network resources by provider and region',
            'inspect CIDR, gateway, and DNS metadata',
            'provision new network topology from the create flow',
          ],
        }}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <Link
              to="/resources/networks/create"
              className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Network</span>
            </Link>
          </>
        }
      />

      <AnimatePresence>
        {actionMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`p-4 rounded-xl flex items-center space-x-3 mb-4 ${
              actionMessage.type === 'error'
                ? 'bg-red-500/10 border border-red-500/20 text-red-400'
                : 'bg-green-500/10 border border-green-500/20 text-green-400'
            }`}
          >
            {actionMessage.type === 'error' ? (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            )}
            <div className="flex-1 text-sm font-medium">{actionMessage.text}</div>
            <button
              onClick={() => setActionMessage(null)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filters */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search networks..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
            />
          </div>

          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>

          <select
            value={filters.region}
            onChange={(e) => setFilters({ ...filters, region: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          >
            <option value="">All Regions</option>
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="ap-south-1">ap-south-1</option>
          </select>
        </div>
      </div>

      {/* Networks List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load networks</p>
        </div>
      ) : filteredNetworks && filteredNetworks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredNetworks.map((item, index) => (
            <motion.div
              key={`${item.source}-${item.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300 group relative"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4 flex-1">
                  <ProviderIcon provider={item.provider as any} size="lg" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <button 
                        onClick={() => handleConfigure(item)} 
                        className="text-lg font-semibold text-white truncate hover:text-cyan-400 hover:underline cursor-pointer text-left"
                      >
                        {item.resource_name}
                      </button>
                      <StatusBadge status={item.status as any} size="sm" />
                      {item.source === 'provisioning' && (
                        <span className="px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 text-[10px] uppercase font-bold rounded border border-cyan-500/20">
                          Provisioned
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{item.region}</span>
                      {item.metadata.cidr_block && (
                        <>
                          <span>•</span>
                          <span className="font-mono">{item.metadata.cidr_block}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Subnets</p>
                  <p className="text-sm font-medium text-gray-300">{item.metadata.subnet_count || 0}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Internet Gateway</p>
                  <p className="text-sm font-medium text-gray-300">
                    {item.metadata.internet_gateway === true || item.metadata.internet_gateway?.toString() === 'true' ? (
                      <span className="text-green-400">✓ Yes</span>
                    ) : (
                      <span className="text-gray-500">✗ No</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">NAT Gateway</p>
                  <p className="text-sm font-medium text-gray-300">
                    {item.metadata.nat_gateway === true || item.metadata.nat_gateway?.toString() === 'true' ? (
                      <span className="text-green-400">✓ Yes</span>
                    ) : (
                      <span className="text-gray-500">✗ No</span>
                    )}
                  </p>
                </div>
              </div>

              {Array.isArray(item.metadata.tags) && item.metadata.tags.length > 0 ? (
                <div className="flex items-center space-x-2 mb-4">
                  {item.metadata.tags.slice(0, 3).map((tag: any, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded border border-gray-700/50"
                    >
                      {tag.key}: {tag.value}
                    </span>
                  ))}
                </div>
              ) : item.metadata.tags && typeof item.metadata.tags === 'object' && Object.keys(item.metadata.tags).length > 0 ? (
                <div className="flex items-center space-x-2 mb-4">
                  {Object.entries(item.metadata.tags).slice(0, 3).map(([key, value]) => (
                    <span
                      key={key}
                      className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded border border-gray-700/50"
                    >
                      {key}: {String(value)}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex items-center justify-start space-x-2 pt-4 border-t border-gray-800/50">
                <button 
                  onClick={() => handleConfigure(item)}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-xs text-gray-300 transition-colors cursor-pointer"
                >
                  <Settings className="w-3 h-3" />
                  <span>Details</span>
                </button>
                <button 
                  onClick={() => setNetworkToDelete(item)}
                  disabled={deletingId === item.id}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === item.id ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <Globe className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No networks found</h3>
          <p className="text-sm text-gray-500 mb-6">Get started by creating your first network</p>
          <Link
            to="/resources/networks/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Network</span>
          </Link>
        </div>
      )}

      {filteredNetworks && filteredNetworks.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredNetworks.length} of {networks?.length || 0} networks
        </div>
      )}

      <ConfirmDialog
        open={!!networkToDelete}
        onCancel={() => setNetworkToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Network"
        message={`Are you sure you want to delete "${networkToDelete?.resource_name}"? This action cannot be undone.`}
        confirmLabel="Delete Network"
        tone="danger"
        isLoading={deleteMutation.isPending}
      />

    </div>
  );
};

export default NetworksPage;
