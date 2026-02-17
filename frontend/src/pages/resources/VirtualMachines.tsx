import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Server,
  Plus,
  Search,
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
  source: 'inventory' | 'provisioning';
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

interface ProvisionedVMResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  configuration?: Record<string, unknown>;
  created_at: string;
}

const normalizeVmStatus = (status: string): string => {
  if (!status) return 'unknown';
  return status.toLowerCase();
};

const matchesStatusFilter = (status: string, filter: string): boolean => {
  if (!filter) return true;

  const normalizedStatus = normalizeVmStatus(status);
  if (filter === 'running') {
    return normalizedStatus === 'running' || normalizedStatus === 'active';
  }
  if (filter === 'pending') {
    return ['pending', 'provisioning', 'in_progress'].includes(normalizedStatus);
  }
  if (filter === 'terminated') {
    return ['terminated', 'deleted', 'destroyed'].includes(normalizedStatus);
  }

  return normalizedStatus === filter;
};

const normalizeInventoryVm = (vm: any): VM => {
  const metadata = vm.metadata ?? {};

  return {
    id: vm.id,
    resource_id: vm.resource_id ?? '',
    resource_name: vm.resource_name ?? vm.name ?? 'Unnamed VM',
    provider: String(vm.provider ?? '').toLowerCase(),
    region: vm.region ?? 'unknown',
    status: normalizeVmStatus(vm.status ?? 'unknown'),
    source: 'inventory',
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

const normalizeProvisionedVm = (resource: ProvisionedVMResource): VM => {
  const config = resource.configuration ?? {};
  const regionValue = config.region ?? config.zone ?? config.location;
  const instanceTypeValue = config.instance_type ?? config.vm_size ?? config.machine_type;
  const publicIpValue = config.public_ip;
  const privateIpValue = config.private_ip;
  const costValue = config.cost_per_hour;
  const tagsValue = config.tags;

  return {
    id: resource.id,
    resource_id: String(resource.id),
    resource_name: resource.name || 'Unnamed VM',
    provider: String(resource.provider ?? '').toLowerCase(),
    region: typeof regionValue === 'string' ? regionValue : 'unknown',
    status: normalizeVmStatus(resource.status || 'pending'),
    source: 'provisioning',
    metadata: {
      instance_type: typeof instanceTypeValue === 'string' ? instanceTypeValue : undefined,
      public_ip: typeof publicIpValue === 'string' ? publicIpValue : undefined,
      private_ip: typeof privateIpValue === 'string' ? privateIpValue : undefined,
      cost_per_hour: typeof costValue === 'number' ? costValue : undefined,
      tags:
        tagsValue && typeof tagsValue === 'object' && !Array.isArray(tagsValue)
          ? (tagsValue as Record<string, string>)
          : undefined,
    },
    created_at: resource.created_at ?? '',
    last_synced: resource.created_at ?? '',
  };
};

const VirtualMachinesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState({
    provider: '',
    region: '',
    status: '',
    search: '',
  });
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [vmToDelete, setVmToDelete] = React.useState<VM | null>(null);

  const startMutation = useMutation({
    mutationFn: async (vm: VM) => {
      await axios.post(`/resources/${vm.id}/vm/start`);
      return vm;
    },
    onSuccess: (vm) => {
      setActionMessage({ type: 'success', text: `Start requested for "${vm.resource_name}".` });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any, vm) => {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : `Failed to start "${vm.resource_name}".`,
      });
    },
  });

  const stopMutation = useMutation({
    mutationFn: async (vm: VM) => {
      await axios.post(`/resources/${vm.id}/vm/stop`);
      return vm;
    },
    onSuccess: (vm) => {
      setActionMessage({ type: 'success', text: `Stop requested for "${vm.resource_name}".` });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any, vm) => {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : `Failed to stop "${vm.resource_name}".`,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (vm: VM) => {
      await axios.delete(`/resources/${vm.id}/vm`);
      return vm;
    },
    onSuccess: (vm) => {
      setActionMessage({ type: 'success', text: `"${vm.resource_name}" deleted successfully.` });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any, vm) => {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : `Failed to delete "${vm.resource_name}".`,
      });
    },
  });

  const { data: vms, isLoading, error, refetch } = useQuery<VM[]>({
    queryKey: ['inventory', 'vms', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.provider) params.append('provider', filters.provider);
      if (filters.region) params.append('region', filters.region);

      const [inventoryResponse, resourcesResponse] = await Promise.all([
        axios.get(`/inventory/vms?${params.toString()}`),
        axios.get('/resources/?limit=500'),
      ]);

      const inventoryPayload = inventoryResponse.data;
      const inventoryItems = (
        Array.isArray(inventoryPayload)
          ? inventoryPayload
          : Array.isArray(inventoryPayload?.items)
            ? inventoryPayload.items
            : []
      ).map(normalizeInventoryVm);

      const resourcesPayload = resourcesResponse.data;
      const provisionedResources = (
        Array.isArray(resourcesPayload)
          ? resourcesPayload
          : Array.isArray(resourcesPayload?.items)
            ? resourcesPayload.items
            : []
      ) as ProvisionedVMResource[];

      const provisionedVmItems = provisionedResources
        .filter((item) => String(item.type).toLowerCase() === 'vm')
        .map(normalizeProvisionedVm)
        .filter((item) => (filters.provider ? item.provider === filters.provider : true))
        .filter((item) => (filters.region ? item.region === filters.region : true));

      const mergedMap = new Map<string, VM>();
      for (const item of inventoryItems) {
        const key = `${item.provider}:${item.resource_name}:${item.region}`.toLowerCase();
        mergedMap.set(key, item);
      }
      for (const item of provisionedVmItems) {
        const key = `${item.provider}:${item.resource_name}:${item.region}`.toLowerCase();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, item);
        }
      }

      return [...mergedMap.values()]
        .filter((item) => matchesStatusFilter(item.status, filters.status))
        .sort((a, b) => {
          const aDate = Date.parse(a.last_synced || a.created_at || '') || 0;
          const bDate = Date.parse(b.last_synced || b.created_at || '') || 0;
          return bDate - aDate;
        });
    },
    refetchInterval: 30000,
  });

  const filteredVMs = (vms ?? []).filter((vm) =>
    vm.resource_name.toLowerCase().includes(filters.search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="virtual-machines"
        tone="blue"
        eyebrow="Compute inventory and control"
        eyebrowIcon={<Server className="h-3.5 w-3.5" />}
        title="Virtual Machines"
        titleIcon={<Server className="w-8 h-8 text-blue-400" />}
        description="Manage multi-cloud virtual machines with lifecycle controls, metadata, and deployment linkage."
        chips={[
          { label: `${vms?.length ?? 0} total`, tone: 'blue' },
          { label: `${filteredVMs.length} filtered`, tone: 'cyan' },
          { label: `${(vms ?? []).filter((vm) => ['running', 'active'].includes(vm.status)).length} running`, tone: 'emerald' },
        ]}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <Link
              to="/resources/vms/create"
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create VM</span>
            </Link>
          </>
        }
      />

      <PageGuide
        title="About Virtual Machines"
        purpose="Virtual Machines lists compute instances across all connected providers with current operational state."
        actions={[
          'filter by provider, region, and status',
          'inspect key metadata such as IPs, tags, and cost',
          'open instance detail pages and start new VM provisioning',
        ]}
      />

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
            <option value="ap-south-1">ap-south-1</option>
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
            <option value="provisioning">Provisioning</option>
            <option value="failed">Failed</option>
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
          {filteredVMs.map((vm, index) => {
            const normalizedStatus = vm.status.toLowerCase();
            const isManagedResource = vm.source === 'provisioning';
            const canStart = isManagedResource && ['stopped', 'inactive'].includes(normalizedStatus);
            const canStop = isManagedResource && ['active', 'running', 'provisioning', 'pending'].includes(normalizedStatus);
            const isStartLoading = startMutation.isPending && startMutation.variables?.id === vm.id;
            const isStopLoading = stopMutation.isPending && stopMutation.variables?.id === vm.id;
            const isDeleteLoading = deleteMutation.isPending && deleteMutation.variables?.id === vm.id;
            const isAnyLoading = isStartLoading || isStopLoading || isDeleteLoading;

            return (
              <motion.div
                key={vm.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <ProviderIcon provider={vm.provider as any} size="lg" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Link
                          to={vm.source === 'provisioning' ? `/deployments/${vm.id}` : `/resources/vms/${vm.id}`}
                          className="text-lg font-semibold text-white hover:text-blue-400 transition-colors"
                        >
                          {vm.resource_name}
                        </Link>
                        <StatusBadge status={vm.status as any} size="sm" />
                        {vm.source === 'provisioning' && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                            Provisioning
                          </span>
                        )}
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

                      {vm.source === 'provisioning' && (
                        <p className="text-xs text-cyan-300/80 mt-3">
                          Created from provisioning jobs. Click the VM name to view deployment logs.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={canStart ? 'Start' : 'Start is available for managed stopped VMs'}
                      disabled={!canStart || isAnyLoading}
                      onClick={() => startMutation.mutate(vm)}
                    >
                      <Play className="w-4 h-4 text-green-400" />
                    </button>
                    <button
                      className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={canStop ? 'Stop' : 'Stop is available for managed running VMs'}
                      disabled={!canStop || isAnyLoading}
                      onClick={() => stopMutation.mutate(vm)}
                    >
                      <Square className="w-4 h-4 text-yellow-400" />
                    </button>
                    <button
                      className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isManagedResource ? 'Delete' : 'Delete is available for managed VMs'}
                      disabled={!isManagedResource || isAnyLoading}
                      onClick={() => setVmToDelete(vm)}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <button
                      className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
                      title={`Status: ${vm.status}`}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
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

      {filteredVMs && filteredVMs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {filteredVMs.length} of {vms?.length || 0} virtual machines
          </p>
          <div className="flex items-center space-x-2">
            <button className="cursor-pointer px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              Previous
            </button>
            <button className="cursor-pointer px-3 py-2 bg-blue-500 text-white rounded-lg text-sm">1</button>
            <button className="cursor-pointer px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              2
            </button>
            <button className="cursor-pointer px-3 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors">
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={vmToDelete !== null}
        title="Delete Virtual Machine"
        message={
          vmToDelete
            ? `Delete "${vmToDelete.resource_name}" from cloud and remove it from your resources list?`
            : ''
        }
        confirmLabel="Delete VM"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={
          vmToDelete !== null &&
          deleteMutation.isPending &&
          deleteMutation.variables?.id === vmToDelete.id
        }
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setVmToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!vmToDelete) return;
          deleteMutation.mutate(vmToDelete, {
            onSettled: () => setVmToDelete(null),
          });
        }}
      />
    </div>
  );
};

export default VirtualMachinesPage;
