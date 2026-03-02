import React from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import PageGuide from '../../components/ui/PageGuide';
import PageHero from '../../components/ui/PageHero';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import {
  Zap,
  Plus,
  Search,
  RefreshCw,
  Timer,
  MemoryStick,
  Code2,
  Trash2,
  ArrowUpRight,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface FunctionResource {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  configuration?: Record<string, unknown>;
  created_at: string;
}

interface NormalizedFunction {
  id: number;
  name: string;
  provider: string;
  status: string;
  runtime: string;
  timeoutSeconds?: number;
  memoryMb?: number;
  createdAt: string;
}

const normalizeFunction = (resource: FunctionResource): NormalizedFunction => {
  const configuration = resource.configuration ?? {};
  const runtimeValue = configuration.runtime ?? configuration.runtime_version ?? 'unknown';
  const timeoutValue = configuration.timeout ?? configuration.timeout_seconds;
  const memoryValue = configuration.memory_size ?? configuration.memory_mb;

  return {
    id: resource.id,
    name: resource.name ?? 'Unnamed Function',
    provider: String(resource.provider ?? '').toLowerCase(),
    status: String(resource.status ?? 'unknown').toLowerCase(),
    runtime: String(runtimeValue),
    timeoutSeconds: typeof timeoutValue === 'number' ? timeoutValue : undefined,
    memoryMb: typeof memoryValue === 'number' ? memoryValue : undefined,
    createdAt: resource.created_at ?? '',
  };
};

const FunctionsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = React.useState({
    provider: '',
    status: '',
    search: '',
  });
  const [functionToDelete, setFunctionToDelete] = React.useState<NormalizedFunction | null>(null);
  const [actionMessage, setActionMessage] = React.useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/resources/${id}`);
    },
    onSuccess: () => {
      setActionMessage({ type: 'success', text: 'Function deleted successfully.' });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setActionMessage({
        type: 'error',
        text: typeof detail === 'string' ? detail : 'Failed to delete function resource.',
      });
    },
  });

  const { data: functions, isLoading, error, refetch } = useQuery<NormalizedFunction[]>({
    queryKey: ['resources', 'functions', filters],
    queryFn: async () => {
      const response = await axios.get('/resources/?limit=500');
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];

      return (items as FunctionResource[])
        .filter((item) => String(item.type ?? '').toLowerCase() === 'faas')
        .map(normalizeFunction)
        .filter((item) => (filters.provider ? item.provider === filters.provider : true))
        .filter((item) => (filters.status ? item.status === filters.status : true))
        .filter((item) => item.name.toLowerCase().includes(filters.search.toLowerCase()))
        .sort((a, b) => {
          const aDate = Date.parse(a.createdAt || '') || 0;
          const bDate = Date.parse(b.createdAt || '') || 0;
          return bDate - aDate;
        });
    },
    refetchInterval: 15000,
  });

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="functions"
        tone="orange"
        eyebrow="FaaS inventory and runtime controls"
        eyebrowIcon={<Zap className="h-3.5 w-3.5" />}
        title="Serverless Functions"
        titleIcon={<Zap className="w-8 h-8 text-orange-400" />}
        description="Track and manage function deployments across AWS Lambda, Azure Functions, and Google Cloud Functions."
        chips={[
          { label: `${functions?.length ?? 0} functions`, tone: 'orange' },
          {
            label: `${(functions ?? []).filter((item) => item.status === 'active').length} active`,
            tone: 'emerald',
          },
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
              to="/resources/functions/create"
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Create Function</span>
            </Link>
          </>
        }
      />

      <PageGuide
        title="About Serverless Functions"
        purpose="Functions are lightweight event-driven workloads where runtime, timeout, and memory are managed as infrastructure."
        actions={[
          'create new provider-native function runtimes',
          'monitor deployment state and runtime profile',
          'open deployment traces for execution logs',
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

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search functions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            />
          </div>

          <select
            value={filters.provider}
            onChange={(e) => setFilters({ ...filters, provider: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">All Providers</option>
            <option value="aws">AWS</option>
            <option value="azure">Azure</option>
            <option value="gcp">GCP</option>
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="provisioning">Provisioning</option>
            <option value="active">Active</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
          <p className="text-red-400">Failed to load functions</p>
        </div>
      ) : functions && functions.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {functions.map((fn, index) => (
            <motion.div
              key={fn.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <ProviderIcon provider={fn.provider as any} size="lg" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white truncate">{fn.name}</h3>
                    <p className="text-xs text-gray-500 uppercase mt-1">{fn.provider}</p>
                  </div>
                </div>
                <StatusBadge status={fn.status as any} size="sm" />
              </div>

              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Code2 className="w-3 h-3" />
                    Runtime
                  </p>
                  <p className="text-sm text-gray-200 truncate">{fn.runtime}</p>
                </div>
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    Timeout
                  </p>
                  <p className="text-sm text-gray-200">{fn.timeoutSeconds ?? '-'}s</p>
                </div>
                <div className="rounded-lg border border-gray-800/70 bg-gray-900/30 px-3 py-2">
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <MemoryStick className="w-3 h-3" />
                    Memory
                  </p>
                  <p className="text-sm text-gray-200">{fn.memoryMb ?? '-'} MB</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link
                  to={`/deployments/${fn.id}`}
                  className="inline-flex items-center gap-2 text-sm text-orange-300 hover:text-orange-200 transition-colors"
                >
                  View deployment
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
                <button
                  onClick={() => setFunctionToDelete(fn)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/20"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <Zap className="w-14 h-14 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-300 mb-2">No functions found</h3>
          <p className="text-sm text-gray-500 mb-6">Create your first serverless function to get started.</p>
          <Link
            to="/resources/functions/create"
            className="inline-flex items-center space-x-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Create Function</span>
          </Link>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(functionToDelete)}
        title="Delete Function"
        message={
          functionToDelete
            ? `Delete "${functionToDelete.name}"? This removes the deployment record from the platform.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (!functionToDelete) return;
          await deleteMutation.mutateAsync(functionToDelete.id);
          setFunctionToDelete(null);
        }}
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setFunctionToDelete(null);
          }
        }}
      />
    </div>
  );
};

export default FunctionsPage;
