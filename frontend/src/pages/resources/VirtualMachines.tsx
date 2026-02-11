import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import {
  Server,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Play,
  Square,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VM {
  id: number;
  resource_id: string;
  resource_name: string;
  provider: string;
  region: string;
  status: string;
  metadata: {
    instance_type?: string;
    public_ip?: string;
    private_ip?: string;
    cost_per_hour?: number;
    tags?: Record<string, string>;
  };
  created_at: string;
  last_synced: string;
}

const normalizeVm = (vm: any): VM => {
  const metadata = vm.metadata ?? {};

  return {
    id: vm.id,
    resource_id: vm.resource_id ?? '',
    resource_name: vm.resource_name ?? vm.name ?? 'Unnamed VM',
    provider: String(vm.provider ?? '').toLowerCase(),
    region: vm.region ?? 'unknown',
    status: vm.status ?? 'unknown',
    metadata: {
      instance_type: metadata.instance_type ?? vm.instance_type,
      public_ip: metadata.public_ip ?? vm.public_ip,
      private_ip: metadata.private_ip ?? vm.private_ip,
      cost_per_hour: metadata.cost_per_hour ?? vm.cost_per_hour,
      tags: metadata.tags ?? vm.tags,
    },
    created_at: vm.created_at ?? '',
    last_synced: vm.last_synced ?? vm.last_synced_at ?? '',
  };
};

const VirtualMachinesPage: React.FC = () => {
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    status: '',
    search: '',
  });

  const { data: vms, isLoading, error, refetch } = useQuery<VM[]>({
    queryKey: ['inventory', 'vms', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);
      if (filters.status) params.append('status', filters.status);
      
      const response = await axios.get(`/inventory/vms?${params.toString()}`);
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map(normalizeVm);
    },
    refetchInterval: 30000,
  });

  const filteredVMs = (vms ?? []).filter((vm) =>
    vm.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center space-x-3">
            <Server className="w-8 h-8 text-blue-500" />
            <span>Virtual Machines</span>
          </h1>
          <p className="text-gray-400 mt-1">Manage your multi-cloud virtual machines</p>
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
            to="/resources/vms/create"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">Create VM</span>
          </Link>
        </div>
      </div>

      <PageGuide
        title="About Virtual Machines"
        purpose="Virtual Machines lists compute instances across all connected providers with current operational state."
        actions={[
          'filter by provider, region, and status',
          'inspect key metadata such as IPs, tags, and cost',
          'open instance detail pages and start new VM provisioning',
        ]}
      />

      {/* Filters */}
      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search VMs..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>

          {/* Provider Filter */}
          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
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
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Regions</option>
            <option value="us-east-1">us-east-1</option>
            <option value="us-west-2">us-west-2</option>
            <option value="eu-west-1">eu-west-1</option>
            <option value="eastus">eastus</option>
            <option value="westus">westus</option>
            <option value="us-central1">us-central1</option>
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            <option value="">All Statuses</option>
            <option value="running">Running</option>
            <option value="stopped">Stopped</option>
            <option value="pending">Pending</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* VM List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load virtual machines</p>
        </div>
      ) : filteredVMs && filteredVMs.length > 0 ? (
        <div className="space-y-4">
          {filteredVMs.map((vm, index) => (
            <motion.div
              key={vm.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300 group"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Provider Icon */}
                  <ProviderIcon provider={vm.provider as any} size="lg" />

                  {/* VM Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Link
                        to={`/resources/vms/${vm.id}`}
                        className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                      >
                        {vm.resource_name}
                      </Link>
                      <StatusBadge status={vm.status as any} size="sm" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                      <div>
                        <p className="text-xs text-gray-500">Instance Type</p>
                        <p className="text-sm font-medium text-gray-300">{vm.metadata.instance_type || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Public IP</p>
                        <p className="text-sm font-medium text-gray-300">{vm.metadata.public_ip || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Region</p>
                        <p className="text-sm font-medium text-gray-300">{vm.region}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Cost/Hour</p>
                        <p className="text-sm font-medium text-gray-300">
                          ${vm.metadata.cost_per_hour?.toFixed(4) || '0.0000'}
                        </p>
                      </div>
                    </div>

                    {vm.metadata.tags && Object.keys(vm.metadata.tags).length > 0 && (
                      <div className="flex items-center space-x-2 mt-4">
                        {Object.entries(vm.metadata.tags).slice(0, 3).map(([key, value]) => (
                          <span
                            key={key}
                            className="px-2 py-1 bg-gray-800/50 text-xs text-gray-400 rounded border border-gray-700/50"
                          >
                            {key}: {value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors" title="Start">
                    <Play className="w-4 h-4 text-green-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors" title="Stop">
                    <Square className="w-4 h-4 text-yellow-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4 text-red-400" />
                  </button>
                  <button className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <Server className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No virtual machines found</h3>
          <p className="text-sm text-gray-500 mb-6">Get started by creating your first VM</p>
          <Link
            to="/resources/vms/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create VM</span>
          </Link>
        </div>
      )}

      {/* Pagination */}
      {filteredVMs && filteredVMs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredVMs.length} of {vms?.length || 0} virtual machines
          </p>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              Previous
            </button>
            <button className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">1</button>
            <button className="px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              2
            </button>
            <button className="px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VirtualMachinesPage;
