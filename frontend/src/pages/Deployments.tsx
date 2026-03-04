import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import StatusBadge from '../components/ui/StatusBadge';
import ProviderIcon from '../components/ui/ProviderIcon';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import ResourceLogs from '../components/ResourceLogs';
import {
  Rocket,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
  FileCode,
  Eye,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Deployment {
  id: number;
  resource_id: number;
  resource_name: string;
  provider: string;
  resource_type: string;
  status: string;
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

const normalizeDeployment = (deployment: unknown): Deployment => {
  const item = (deployment ?? {}) as Record<string, unknown>;

  return {
    id: Number(item.id ?? 0),
    resource_id: Number(item.resource_id ?? item.id ?? 0),
    resource_name: String(item.resource_name ?? 'Unnamed Resource'),
    provider: String(item.provider ?? '').toLowerCase(),
    resource_type: String(item.resource_type ?? 'resource'),
    status: String(item.status ?? 'pending'),
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
  };
};

const normalizeDeploymentDetail = (deployment: unknown): DeploymentDetail => {
  const normalized = normalizeDeployment(deployment);
  const item = (deployment ?? {}) as Record<string, unknown>;

  return {
    ...normalized,
    logs: typeof item.logs === 'string' ? item.logs : '',
    configuration:
      item.configuration && typeof item.configuration === 'object' && !Array.isArray(item.configuration)
        ? (item.configuration as Record<string, unknown>)
        : {},
    terraform_output:
      item.terraform_output && typeof item.terraform_output === 'object' && !Array.isArray(item.terraform_output)
        ? (item.terraform_output as Record<string, unknown>)
        : {},
  };
};

const DeploymentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedDeploymentId, setSelectedDeploymentId] = React.useState<number | null>(null);
  const [isLogsOpen, setIsLogsOpen] = React.useState(false);
  const [deletingId, setDeletingId] = React.useState<number | null>(null);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [deploymentToDelete, setDeploymentToDelete] = React.useState<Deployment | null>(null);
  
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await axios.delete(`/resources/${id}`);
    },
    onMutate: (id) => {
      setDeletingId(id);
      setDeleteError(null);
    },
    onSuccess: (_, id) => {
      if (selectedDeploymentId === id) {
        setIsLogsOpen(false);
        setSelectedDeploymentId(null);
      }
      queryClient.invalidateQueries({ queryKey: ['deployments'] });
      queryClient.invalidateQueries({ queryKey: ['resources'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'storage'] });
      queryClient.invalidateQueries({ queryKey: ['inventory', 'networks'] });
    },
    onError: (error: any) => {
      const detail = error?.response?.data?.detail;
      setDeleteError(typeof detail === 'string' ? detail : 'Failed to delete resource record.');
    },
    onSettled: () => {
      setDeletingId(null);
    },
  });

  const { data: deployments, isLoading, refetch } = useQuery<Deployment[]>({
    queryKey: ['deployments'],
    queryFn: async () => {
      const response = await axios.get('/deployments/');
      const payload = response.data;
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.items) ? payload.items : [];
      return items.map(normalizeDeployment);
    },
    refetchInterval: 10000,
  });

  const { data: deploymentDetail, isFetching: isLogsFetching } = useQuery<DeploymentDetail>({
    queryKey: ['deployments', 'detail', selectedDeploymentId],
    enabled: selectedDeploymentId !== null && isLogsOpen,
    queryFn: async () => {
      if (selectedDeploymentId === null) {
        throw new Error('No deployment selected');
      }
      const response = await axios.get(`/deployments/${selectedDeploymentId}`);
      return normalizeDeploymentDetail(response.data);
    },
    refetchInterval: isLogsOpen ? 5000 : false,
  });

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'completed':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'failed':
      case 'error':
        return <XCircle className="w-5 h-5 text-red-400" />;
      case 'provisioning':
      case 'running':
      case 'in_progress':
        return <Loader className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const openLogs = (deploymentId: number) => {
    setSelectedDeploymentId(deploymentId);
    setIsLogsOpen(true);
  };

  const closeLogs = () => {
    setIsLogsOpen(false);
  };

  const isFailedDeployment = (status: string) => {
    const normalized = status.toLowerCase();
    return normalized === 'failed' || normalized === 'error';
  };

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="deployments"
        tone="orange"
        eyebrow="Terraform and orchestration jobs"
        eyebrowIcon={<Rocket className="h-3.5 w-3.5" />}
        title="Deployments"
        titleIcon={<Rocket className="w-8 h-8 text-orange-400" />}
        description="Track infrastructure deployments, audit logs, and resource-level provisioning outcomes."
        chips={[
          { label: `${deployments?.length ?? 0} jobs`, tone: 'orange' },
          { label: `${(deployments ?? []).filter((item) => isFailedDeployment(item.status)).length} failed`, tone: 'pink' },
        ]}
        actions={
          <button
            onClick={() => refetch()}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
        }
      />

      <PageGuide
        title="About Deployments"
        purpose="Deployments track infrastructure changes executed by Terraform and orchestration workers."
        actions={[
          'monitor running and completed deployment jobs',
          'inspect status by resource and provider',
          'open logs, drill into each resource, and delete failed provisioning records',
        ]}
      />

      {deleteError && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {deleteError}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (deployments ?? []).length > 0 ? (
        <div className="space-y-4">
          {deployments?.map((deployment, index) => (
            <motion.div
              key={deployment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(deployment.status)}
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="text-lg font-semibold text-white">{deployment.resource_name}</h3>
                      <StatusBadge status={deployment.status as any} size="sm" />
                      <ProviderIcon provider={deployment.provider as any} size="sm" />
                      <span className="px-2 py-0.5 rounded-md text-xs border border-gray-700/60 bg-gray-800/60 text-gray-300 capitalize">
                        {deployment.resource_type}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-400">
                      <span>Started {new Date(deployment.started_at).toLocaleString()}</span>
                      {deployment.duration_seconds !== null && deployment.duration_seconds !== undefined && (
                        <>
                          <span>•</span>
                          <span>Duration: {deployment.duration_seconds}s</span>
                        </>
                      )}
                      {deployment.has_logs && (
                        <>
                          <span>•</span>
                          <span>{deployment.log_line_count} log lines</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => openLogs(deployment.id)}
                    className="cursor-pointer px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm transition-colors"
                  >
                    View Logs
                  </button>
                  <Link
                    to={`/deployments/${deployment.id}`}
                    className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 rounded-lg text-sm border border-blue-500/20 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View Resource</span>
                  </Link>
                  {isFailedDeployment(deployment.status) && (
                    <button
                      onClick={() => setDeploymentToDelete(deployment)}
                      className="cursor-pointer inline-flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-sm border border-red-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                      disabled={deletingId === deployment.id}
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>{deletingId === deployment.id ? 'Deleting...' : 'Delete Failed'}</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <FileCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No deployments yet</h3>
          <p className="text-sm text-gray-500">Create VM/Storage/Network/Function resources and Terraform runs will appear here</p>
        </div>
      )}

      <ResourceLogs
        isOpen={isLogsOpen}
        onClose={closeLogs}
        logs={
          isLogsFetching
            ? 'Loading deployment logs...'
            : deploymentDetail?.logs || 'No logs available for this deployment yet.'
        }
        resourceName={deploymentDetail?.resource_name || 'Deployment'}
      />

      <ConfirmDialog
        open={deploymentToDelete !== null}
        title="Delete Failed Resource"
        message={
          deploymentToDelete
            ? `Delete failed resource "${deploymentToDelete.resource_name}"? This removes it from your deployment/resource history.`
            : ''
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={
          deploymentToDelete !== null &&
          deletingId === deploymentToDelete.id &&
          deleteMutation.isPending
        }
        onCancel={() => {
          if (!deleteMutation.isPending) {
            setDeploymentToDelete(null);
          }
        }}
        onConfirm={() => {
          if (!deploymentToDelete) return;
          deleteMutation.mutate(deploymentToDelete.id, {
            onSettled: () => setDeploymentToDelete(null),
          });
        }}
      />
    </div>
  );
};

export default DeploymentsPage;
