import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from '../../api/axios';
import StatusBadge from '../../components/ui/StatusBadge';
import ProviderIcon from '../../components/ui/ProviderIcon';
import {
  ArrowLeft,
  Server,
  Play,
  Square,
  Trash2,
  Copy,
  RefreshCw,
  Shield,
  Tag,
  FileCode,
  Activity,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface VMDetail {
  id: number;
  resource_id: string;
  resource_name: string;
  resource_type: string;
  provider: string;
  region: string;
  status: string;
  metadata: {
    instance_type?: string;
    public_ip?: string;
    private_ip?: string;
    vpc_id?: string;
    subnet_id?: string;
    security_groups?: string[];
    launch_time?: string;
    cost_per_hour?: number;
    tags?: Record<string, string>;
  };
  created_at: string;
  last_synced: string;
}

const VMDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const { data: vm, isLoading, error, refetch } = useQuery<VMDetail>({
    queryKey: ['inventory', 'vm', id],
    queryFn: async () => {
      const response = await axios.get(`/inventory/${id}`);
      return response.data;
    },
    refetchInterval: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await axios.delete(`/resources/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory', 'vms'] });
      navigate('/resources/vms');
    },
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // TODO: Show toast notification
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-6">
          <div className="h-12 bg-gray-800/50 rounded-lg animate-pulse"></div>
          <div className="h-64 bg-gray-800/50 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-gray-800/50 rounded-xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error || !vm) {
    return (
      <div className="p-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-red-400">Failed to load VM details</h3>
            <p className="text-sm text-gray-400 mt-1">
              {error instanceof Error ? error.message : 'VM not found'}
            </p>
            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm font-medium transition-colors"
              >
                Try Again
              </button>
              <Link
                to="/resources/vms"
                className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-sm font-medium transition-colors"
              >
                Back to VMs
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/resources/vms"
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold text-white">{vm.resource_name}</h1>
              <StatusBadge status={vm.status as any} size="md" />
            </div>
            <div className="flex items-center space-x-3 mt-2">
              <ProviderIcon provider={vm.provider as any} size="sm" showLabel />
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">{vm.region}</span>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-400">{vm.resource_id}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => refetch()}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all duration-200"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="text-sm font-medium">Refresh</span>
          </button>
          {vm.status === 'stopped' && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-lg border border-green-500/20 transition-all duration-200">
              <Play className="w-4 h-4" />
              <span className="text-sm font-medium">Start</span>
            </button>
          )}
          {vm.status === 'running' && (
            <button className="flex items-center space-x-2 px-4 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 rounded-lg border border-yellow-500/20 transition-all duration-200">
              <Square className="w-4 h-4" />
              <span className="text-sm font-medium">Stop</span>
            </button>
          )}
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg border border-red-500/20 transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">Destroy</span>
          </button>
        </div>
      </div>

      {/* Overview & Security */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-400" />
            <span>Overview</span>
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Instance Type</p>
              <p className="text-sm font-medium text-gray-300">{vm.metadata.instance_type || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Public IP</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-300">{vm.metadata.public_ip || 'N/A'}</p>
                {vm.metadata.public_ip && (
                  <button
                    onClick={() => copyToClipboard(vm.metadata.public_ip!)}
                    className="p-1 hover:bg-gray-800/50 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Private IP</p>
              <div className="flex items-center space-x-2">
                <p className="text-sm font-medium text-gray-300">{vm.metadata.private_ip || 'N/A'}</p>
                {vm.metadata.private_ip && (
                  <button
                    onClick={() => copyToClipboard(vm.metadata.private_ip!)}
                    className="p-1 hover:bg-gray-800/50 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3 text-gray-500" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">VPC</p>
              <p className="text-sm font-medium text-gray-300">{vm.metadata.vpc_id || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Subnet</p>
              <p className="text-sm font-medium text-gray-300">{vm.metadata.subnet_id || 'N/A'}</p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Launch Time</p>
              <p className="text-sm font-medium text-gray-300">
                {vm.metadata.launch_time ? new Date(vm.metadata.launch_time).toLocaleString() : 'N/A'}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-1">Cost per Hour</p>
              <p className="text-sm font-medium text-gray-300">
                ${vm.metadata.cost_per_hour?.toFixed(4) || '0.0000'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span>Security</span>
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-500 mb-2">Security Groups</p>
              {vm.metadata.security_groups && vm.metadata.security_groups.length > 0 ? (
                <div className="space-y-2">
                  {vm.metadata.security_groups.map((sg, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 bg-gray-800/30 rounded-lg text-sm text-gray-300"
                    >
                      {sg}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No security groups</p>
              )}
            </div>

            <div>
              <p className="text-xs text-gray-500 mb-2">Firewall Rules</p>
              <div className="space-y-2">
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-sm text-gray-300">
                  SSH (22) from 0.0.0.0/0
                </div>
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-sm text-gray-300">
                  HTTP (80) from 0.0.0.0/0
                </div>
                <div className="px-3 py-2 bg-gray-800/30 rounded-lg text-sm text-gray-300">
                  HTTPS (443) from 0.0.0.0/0
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tags */}
      {vm.metadata.tags && Object.keys(vm.metadata.tags).length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
            <Tag className="w-5 h-5 text-purple-400" />
            <span>Tags</span>
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(vm.metadata.tags).map(([key, value]) => (
              <div key={key} className="px-4 py-3 bg-gray-800/30 rounded-lg">
                <p className="text-xs text-gray-500 mb-1">{key}</p>
                <p className="text-sm font-medium text-gray-300">{value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Terraform State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <FileCode className="w-5 h-5 text-yellow-400" />
          <span>Terraform State</span>
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Status</p>
              <StatusBadge status="active" size="sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Apply</p>
              <p className="text-sm font-medium text-gray-300">
                {new Date(vm.created_at).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">State Version</p>
              <p className="text-sm font-medium text-gray-300">3</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 text-sm font-medium transition-colors">
              View Full State
            </button>
            <button className="px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 text-sm font-medium transition-colors">
              Download State
            </button>
          </div>
        </div>
      </motion.div>

      {/* Live Logs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-400" />
          <span>Live Logs</span>
        </h3>

        <div className="bg-black/50 rounded-lg p-4 font-mono text-xs text-gray-400 space-y-1">
          <div>[{new Date().toISOString()}] Instance running</div>
          <div>[{new Date(Date.now() - 900000).toISOString()}] Health check passed</div>
          <div>[{new Date(Date.now() - 1800000).toISOString()}] Security group updated</div>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1d] border border-gray-800/50 rounded-xl p-6 max-w-md w-full mx-4"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Destroy Virtual Machine?</h3>
            <p className="text-sm text-gray-400 mb-6">
              Are you sure you want to destroy <strong>{vm.resource_name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  deleteMutation.mutate();
                  setShowDeleteConfirm(false);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Destroying...' : 'Destroy'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default VMDetailPage;
