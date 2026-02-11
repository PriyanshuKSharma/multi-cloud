import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import {
  Network,
  Plus,
  Search,
  RefreshCw,
  Globe,
  Trash2,
  Settings,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface NetworkResource {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
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

const normalizeNetwork = (item: any): NetworkResource => {
  const metadata = item.metadata ?? {};
  
  return {
    id: item.id,
    resource_id: item.resource_id ?? '',
    resource_name: item.resource_name ?? item.name ?? 'Unnamed Network',
    provider: String(item.provider ?? '').toLowerCase(),
    region: item.region ?? 'unknown',
    status: item.status ?? 'unknown',
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

const NetworksPage: React.FC = () => {
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    search: '',
  });

  const { data: networks, isLoading, error, refetch } = useQuery<NetworkResource[]>({
    queryKey: ['inventory', 'networks', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      
      const response = await axios.get(`/inventory/networks?${params.toString()}`);
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map(normalizeNetwork);
    },
    refetchInterval: 30000,
  });

  const filteredNetworks = (networks ?? []).filter((item) =>
    item.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Network className="w-8 h-8 text-cyan-500" />
            <span>Networks</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage your multi-cloud virtual networks and VPCs</p>
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
            to="/resources/networks/create"
            className="flex items-center space-x-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create Network</span>
          </Link>
        </div>
      </div>

      <PageGuide
        title="About Networks"
        purpose="Networks tracks virtual networks, VPCs, and networking foundations used by your cloud resources."
        actions={[
          'filter network resources by provider and region',
          'inspect CIDR, gateway, and DNS metadata',
          'provision new network topology from the create flow',
        ]}
      />

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
                      <h3 className="text-lg font-semibold text-white truncate">
                        {item.resource_name}
                      </h3>
                      <StatusBadge status={item.status as any} size="sm" />
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
                    {item.metadata.internet_gateway ? (
                      <span className="text-green-400">✓ Yes</span>
                    ) : (
                      <span className="text-gray-500">✗ No</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">NAT Gateway</p>
                  <p className="text-sm font-medium text-gray-300">
                    {item.metadata.nat_gateway ? (
                      <span className="text-green-400">✓ Yes</span>
                    ) : (
                      <span className="text-gray-500">✗ No</span>
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
                  <Settings className="w-3 h-3" />
                  <span>Configure</span>
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
    </div>
  );
};

export default NetworksPage;
