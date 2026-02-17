import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { normalizeLogText } from '../utils/terraformOutput';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import {
  Terminal,
  RefreshCw,
  Server,
  HardDrive,
  Network,
  Layers3,
  ExternalLink,
} from 'lucide-react';

interface Deployment {
  id: number;
  resource_id: number;
  resource_name: string;
  provider: string;
  resource_type: string;
  status: string;
  project_id: number;
  started_at: string;
  completed_at?: string | null;
  duration_seconds?: number | null;
  has_logs: boolean;
  log_line_count: number;
}

interface DeploymentDetail extends Deployment {
  logs: string;
  configuration: Record<string, unknown>;
  terraform_output: Record<string, unknown>;
}

interface ResourceRecord {
  id: number;
  name: string;
  provider: string;
  type: string;
  status: string;
  project_id: number;
  created_at: string;
}

const asItemsArray = (payload: unknown): unknown[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const items = (payload as { items?: unknown[] }).items;
    if (Array.isArray(items)) return items;
  }
  return [];
};

const normalizeDeployment = (item: unknown): Deployment => {
  const value = (item ?? {}) as Record<string, unknown>;
  return {
    id: Number(value.id ?? 0),
    resource_id: Number(value.resource_id ?? value.id ?? 0),
    resource_name: String(value.resource_name ?? 'Unnamed resource'),
    provider: String(value.provider ?? '').toLowerCase(),
    resource_type: String(value.resource_type ?? 'resource'),
    status: String(value.status ?? 'pending').toLowerCase(),
    project_id: Number(value.project_id ?? 0),
    started_at: String(value.started_at ?? ''),
    completed_at: value.completed_at ? String(value.completed_at) : null,
    duration_seconds:
      typeof value.duration_seconds === 'number'
        ? value.duration_seconds
        : value.duration_seconds
          ? Number(value.duration_seconds)
          : null,
    has_logs: Boolean(value.has_logs),
    log_line_count: Number(value.log_line_count ?? 0),
  };
};

const normalizeDeploymentDetail = (item: unknown): DeploymentDetail => {
  const base = normalizeDeployment(item);
  const value = (item ?? {}) as Record<string, unknown>;
  const asObject = (data: unknown): Record<string, unknown> =>
    data && typeof data === 'object' && !Array.isArray(data) ? (data as Record<string, unknown>) : {};

  return {
    ...base,
    logs: typeof value.logs === 'string' ? value.logs : '',
    configuration: asObject(value.configuration),
    terraform_output: asObject(value.terraform_output),
  };
};

const normalizeResource = (item: unknown): ResourceRecord => {
  const value = (item ?? {}) as Record<string, unknown>;
  return {
    id: Number(value.id ?? 0),
    name: String(value.name ?? 'Unnamed resource'),
    provider: String(value.provider ?? '').toLowerCase(),
    type: String(value.type ?? 'resource').toLowerCase(),
    status: String(value.status ?? 'pending').toLowerCase(),
    project_id: Number(value.project_id ?? 0),
    created_at: String(value.created_at ?? ''),
  };
};

const CloudConsole: React.FC = () => {
  const [selectedDeploymentId, setSelectedDeploymentId] = React.useState<number | null>(null);

  const {
    data: deployments,
    isLoading: deploymentsLoading,
    isError: deploymentsError,
    refetch: refetchDeployments,
  } = useQuery<Deployment[]>({
    queryKey: ['deployments', 'console'],
    queryFn: async () => {
      const response = await axios.get('/deployments/');
      return asItemsArray(response.data).map(normalizeDeployment);
    },
    refetchInterval: 5000,
  });

  const {
    data: resources,
    isLoading: resourcesLoading,
    isError: resourcesError,
    refetch: refetchResources,
  } = useQuery<ResourceRecord[]>({
    queryKey: ['resources', 'console'],
    queryFn: async () => {
      const response = await axios.get('/resources/?limit=500');
      return asItemsArray(response.data)
        .map(normalizeResource)
        .sort((a, b) => (Date.parse(b.created_at) || 0) - (Date.parse(a.created_at) || 0));
    },
    refetchInterval: 7000,
  });

  const {
    data: deploymentDetail,
    isLoading: detailLoading,
    refetch: refetchDetail,
  } = useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', selectedDeploymentId, 'console'],
    enabled: selectedDeploymentId !== null,
    queryFn: async () => {
      if (selectedDeploymentId === null) {
        throw new Error('No deployment selected');
      }
      const response = await axios.get(`/deployments/${selectedDeploymentId}`);
      return normalizeDeploymentDetail(response.data);
    },
    refetchInterval: 4000,
  });

  React.useEffect(() => {
    if (!deployments || deployments.length === 0) return;
    if (!selectedDeploymentId || !deployments.some((item) => item.id === selectedDeploymentId)) {
      setSelectedDeploymentId(deployments[0].id);
    }
  }, [deployments, selectedDeploymentId]);

  const refreshAll = () => {
    void refetchDeployments();
    void refetchResources();
    if (selectedDeploymentId !== null) {
      void refetchDetail();
    }
  };

  const terminalCommand = (deployment: Deployment) =>
    `cloudorch provision --provider ${deployment.provider} --type ${deployment.resource_type} --name "${deployment.resource_name}" --project ${deployment.project_id}`;
  const formattedDetailLogs = React.useMemo(
    () => normalizeLogText(deploymentDetail?.logs ?? ''),
    [deploymentDetail?.logs]
  );

  const resourcesCount = resources?.length ?? 0;
  const vmCount = resources?.filter((item) => item.type === 'vm').length ?? 0;
  const storageCount = resources?.filter((item) => item.type === 'storage').length ?? 0;
  const networkCount =
    resources?.filter((item) => item.type === 'network' || item.type === 'vpc' || item.type === 'resource_group')
      .length ?? 0;

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="cloud-console"
        tone="cyan"
        eyebrow="Live provisioning console"
        eyebrowIcon={<Terminal className="h-3.5 w-3.5" />}
        title="Cloud Console"
        titleIcon={<Terminal className="w-8 h-8 text-cyan-300" />}
        description="Live command-style view of provisioning jobs, logs, and created resource records."
        chips={[
          { label: `${deployments?.length ?? 0} deployments`, tone: 'cyan' },
          { label: `${resourcesCount} resources`, tone: 'blue' },
        ]}
        actions={
          <button
            onClick={refreshAll}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 rounded-lg border border-cyan-500/20 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${(deploymentsLoading || resourcesLoading) ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        }
      />

      <PageGuide
        title="About Cloud Console"
        purpose="Cloud Console streams real provisioning jobs and resource records from the backend in a terminal-style interface."
        actions={[
          'watch command history for each deployment',
          'open live logs from Terraform/orchestration output',
          'verify resources created across providers in real time',
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4">
          <p className="text-xs text-gray-500">Total Resources</p>
          <p className="text-2xl font-semibold text-white mt-1">{resourcesCount}</p>
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Virtual Machines</p>
            <p className="text-xl font-semibold text-white mt-1">{vmCount}</p>
          </div>
          <Server className="w-5 h-5 text-blue-400" />
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Storage</p>
            <p className="text-xl font-semibold text-white mt-1">{storageCount}</p>
          </div>
          <HardDrive className="w-5 h-5 text-purple-400" />
        </div>
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500">Networks</p>
            <p className="text-xl font-semibold text-white mt-1">{networkCount}</p>
          </div>
          <Network className="w-5 h-5 text-emerald-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="xl:col-span-2 bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 rounded-full bg-red-400" />
              <span className="w-3 h-3 rounded-full bg-yellow-400" />
              <span className="w-3 h-3 rounded-full bg-green-400" />
              <span className="ml-3 text-xs text-gray-400 font-mono">command-history.terminal</span>
            </div>
            <Link
              to="/deployments"
              className="cursor-pointer text-xs text-cyan-300 hover:text-cyan-200 inline-flex items-center space-x-1"
            >
              <span>Open Deployments</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="p-3 max-h-[28rem] overflow-auto space-y-2 bg-[#0b0d12]">
            {deploymentsError ? (
              <p className="text-sm text-red-400 font-mono">Failed to load deployment commands.</p>
            ) : (deployments ?? []).length === 0 ? (
              <p className="text-sm text-gray-500 font-mono">No deployment commands yet. Create a resource to start.</p>
            ) : (
              (deployments ?? []).map((deployment) => (
                <button
                  key={deployment.id}
                  onClick={() => setSelectedDeploymentId(deployment.id)}
                  className={`cursor-pointer w-full text-left rounded-lg border p-3 transition-colors ${
                    selectedDeploymentId === deployment.id
                      ? 'border-cyan-500/40 bg-cyan-500/10'
                      : 'border-gray-800/60 hover:border-gray-700/80 hover:bg-gray-900/60'
                  }`}
                >
                  <p className="font-mono text-xs text-gray-500 mb-1">
                    [{deployment.started_at ? new Date(deployment.started_at).toLocaleTimeString() : '--:--:--'}]
                  </p>
                  <p className="font-mono text-sm text-cyan-300 break-all">
                    $ {terminalCommand(deployment)}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <StatusBadge status={deployment.status as any} size="sm" />
                    <span className="text-[11px] text-gray-500 font-mono">
                      {deployment.has_logs ? `${deployment.log_line_count} log lines` : 'no logs yet'}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="xl:col-span-3 bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-red-400" />
            <span className="w-3 h-3 rounded-full bg-yellow-400" />
            <span className="w-3 h-3 rounded-full bg-green-400" />
            <span className="ml-3 text-xs text-gray-400 font-mono">
              {deploymentDetail ? `deployment-${deploymentDetail.id}.log` : 'live-output.log'}
            </span>
          </div>

          <div className="p-4 bg-[#0b0d12] font-mono text-sm text-green-200 max-h-[28rem] overflow-auto">
            {detailLoading ? (
              <p className="text-gray-500">Loading live output...</p>
            ) : deploymentDetail ? (
              <div className="space-y-3">
                <div className="text-gray-400">
                  <span className="text-cyan-300">$ deployment inspect --id {deploymentDetail.id}</span>
                  <div className="mt-2 flex items-center space-x-3">
                    <ProviderIcon provider={deploymentDetail.provider as any} size="sm" />
                    <span>{deploymentDetail.resource_name}</span>
                    <StatusBadge status={deploymentDetail.status as any} size="sm" />
                  </div>
                </div>
                <pre className="whitespace-pre-wrap break-all">
                  {formattedDetailLogs || 'No logs available yet. Provisioning output will appear here when available.'}
                </pre>
              </div>
            ) : (
              <p className="text-gray-500">Select a command on the left to see live output.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-800/50 bg-[#111319] flex items-center space-x-2">
          <Layers3 className="w-4 h-4 text-cyan-300" />
          <span className="text-sm font-semibold text-white">Created Resources</span>
          <span className="text-xs text-gray-500">/resources API</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#111319] text-gray-500">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Name</th>
                <th className="text-left px-4 py-3 font-medium">Provider</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Created</th>
                <th className="text-left px-4 py-3 font-medium">Logs</th>
              </tr>
            </thead>
            <tbody>
              {resourcesError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-red-400">
                    Failed to load resources
                  </td>
                </tr>
              ) : (resources ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    No resources created yet
                  </td>
                </tr>
              ) : (
                (resources ?? []).slice(0, 20).map((resource) => (
                  <tr key={resource.id} className="border-t border-gray-800/50 hover:bg-gray-900/40 transition-colors">
                    <td className="px-4 py-3 text-gray-200">{resource.name}</td>
                    <td className="px-4 py-3">
                      <ProviderIcon provider={resource.provider as any} size="sm" showLabel />
                    </td>
                    <td className="px-4 py-3 text-gray-300 capitalize">{resource.type}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={resource.status as any} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {resource.created_at ? new Date(resource.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/deployments/${resource.id}`}
                        className="cursor-pointer text-cyan-300 hover:text-cyan-200 text-xs inline-flex items-center space-x-1"
                      >
                        <span>Open</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CloudConsole;
