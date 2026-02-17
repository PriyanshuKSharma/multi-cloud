import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { formatTerraformOutput, normalizeLogText } from '../utils/terraformOutput';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import {
  ArrowLeft,
  RefreshCw,
  Copy,
  Terminal,
  AlertCircle,
  CalendarClock,
  Cloud,
  Boxes,
  Activity,
} from 'lucide-react';

interface DeploymentDetail {
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
  logs: string;
  configuration: Record<string, unknown>;
  terraform_output: Record<string, unknown>;
}

const normalizeDeploymentDetail = (deployment: unknown): DeploymentDetail => {
  const item = (deployment ?? {}) as Record<string, unknown>;
  const asObject = (value: unknown): Record<string, unknown> =>
    value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

  return {
    id: Number(item.id ?? 0),
    resource_id: Number(item.resource_id ?? item.id ?? 0),
    resource_name: String(item.resource_name ?? 'Unnamed Resource'),
    provider: String(item.provider ?? '').toLowerCase(),
    resource_type: String(item.resource_type ?? 'resource'),
    status: String(item.status ?? 'pending'),
    project_id: Number(item.project_id ?? 0),
    started_at: String(item.started_at ?? new Date().toISOString()),
    completed_at: item.completed_at ? String(item.completed_at) : null,
    duration_seconds:
      typeof item.duration_seconds === 'number'
        ? item.duration_seconds
        : item.duration_seconds
          ? Number(item.duration_seconds)
          : null,
    has_logs: Boolean(item.has_logs),
    log_line_count: Number(item.log_line_count ?? 0),
    logs: typeof item.logs === 'string' ? item.logs : '',
    configuration: asObject(item.configuration),
    terraform_output: asObject(item.terraform_output),
  };
};

const prettyJson = (value: Record<string, unknown>) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return '{}';
  }
};

const DeploymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const logsRef = React.useRef<HTMLDivElement | null>(null);

  const { data: deployment, isLoading, isError, error, refetch, isFetching } = useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const response = await axios.get(`/deployments/${id}`);
      return normalizeDeploymentDetail(response.data);
    },
    refetchInterval: 10000,
  });

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard may fail in insecure contexts; keep UX non-blocking.
    }
  };

  const formattedLogs = React.useMemo(
    () => normalizeLogText(deployment?.logs ?? ''),
    [deployment?.logs]
  );
  const formattedTerraformOutput = React.useMemo(
    () => formatTerraformOutput(deployment?.terraform_output ?? {}, { omitLogsKey: true }),
    [deployment?.terraform_output]
  );

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 bg-[#0f0f11] border border-gray-800/50 rounded-lg animate-pulse" />
        <div className="h-64 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
        <div className="h-80 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError || !deployment) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Deployment not found</h3>
            <p className="text-sm text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'Unable to load deployment details'}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => refetch()}
                className="cursor-pointer px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/deployments"
                className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Back to Deployments
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id={`deployment-detail-${deployment.id}`}
        tone="orange"
        eyebrow="Deployment execution details"
        eyebrowIcon={<Cloud className="h-3.5 w-3.5" />}
        title={deployment.resource_name}
        titleIcon={<Boxes className="w-8 h-8 text-orange-300" />}
        description={`Deployment #${deployment.id} • ${deployment.resource_type}`}
        chips={[
          { label: deployment.provider.toUpperCase(), tone: 'orange' },
          { label: deployment.status, tone: deployment.status.toLowerCase() === 'failed' ? 'pink' : 'emerald' },
          { label: `${deployment.log_line_count} log lines`, tone: 'cyan' },
        ]}
        actions={
          <>
            <Link
              to="/deployments"
              className="cursor-pointer flex items-center rounded-lg border border-gray-700/60 bg-gray-800/60 px-4 py-2 text-sm text-gray-200 transition-colors hover:bg-gray-800"
              aria-label="Back to deployments"
            >
              <ArrowLeft className="mr-2 w-4 h-4 text-gray-400" />
              Back
            </Link>
            <button
              onClick={() => refetch()}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button
              onClick={() => logsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg border border-blue-500/20 transition-colors"
            >
              <Terminal className="w-4 h-4" />
              <span className="text-sm font-medium">Open Logs</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About This Deployment"
        purpose="Deployment details show the exact payload sent to Terraform and the resulting state/log output."
        actions={[
          'inspect deployment metadata and status',
          'review configuration and Terraform output JSON',
          'read complete logs for troubleshooting',
        ]}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <Activity className="w-5 h-5 text-blue-400" />
            <span>Deployment Metadata</span>
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Resource ID</span>
              <span className="text-gray-200 font-mono">{deployment.resource_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Project ID</span>
              <span className="text-gray-200 font-mono">{deployment.project_id}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Provider</span>
              <span className="text-gray-200 capitalize">{deployment.provider}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Type</span>
              <span className="text-gray-200 capitalize">{deployment.resource_type}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Started</span>
              <span className="text-gray-200">{new Date(deployment.started_at).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Completed</span>
              <span className="text-gray-200">
                {deployment.completed_at ? new Date(deployment.completed_at).toLocaleString() : 'In progress'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Duration</span>
              <span className="text-gray-200">
                {deployment.duration_seconds !== null && deployment.duration_seconds !== undefined
                  ? `${deployment.duration_seconds}s`
                  : 'N/A'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-500">Log lines</span>
              <span className="text-gray-200">{deployment.log_line_count}</span>
            </div>
          </div>
        </div>

        <div className="xl:col-span-2 space-y-6">
          <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-cyan-400" />
                <span>Configuration</span>
              </h3>
              <button
                onClick={() => copyText(prettyJson(deployment.configuration))}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
                title="Copy configuration JSON"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-[#0b0d12] border border-gray-800/50 rounded-lg p-4 overflow-auto font-mono">
              {prettyJson(deployment.configuration)}
            </pre>
          </div>

          <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                <Boxes className="w-5 h-5 text-violet-400" />
                <span>Terraform Output</span>
              </h3>
              <button
                onClick={() => copyText(formattedTerraformOutput)}
                className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
                title="Copy Terraform output JSON"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <pre className="text-sm text-gray-300 bg-[#0b0d12] border border-gray-800/50 rounded-lg p-4 overflow-auto font-mono">
              {formattedTerraformOutput}
            </pre>
          </div>
        </div>
      </div>

      <div ref={logsRef} className="bg-[#0f0f11] border border-gray-800/50 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
            <CalendarClock className="w-5 h-5 text-emerald-400" />
            <span>Deployment Logs</span>
          </h3>
          <button
            onClick={() => copyText(formattedLogs)}
            className="cursor-pointer p-2 rounded-lg hover:bg-gray-800/60 text-gray-400 hover:text-white transition-colors"
            title="Copy logs"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
        <div className="p-4 bg-[#0b0d12]">
          <pre className="text-sm text-green-200 font-mono whitespace-pre-wrap break-all max-h-[28rem] overflow-auto">
            {formattedLogs || 'No logs available for this deployment yet.'}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default DeploymentDetailPage;
