import React from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useNotifications } from '../context/NotificationContext';
import {
  Cloud,
  Plus,
  RefreshCw,
  Trash2,
  CheckCircle2,
  Globe2,
  Boxes,
  Clock3,
} from 'lucide-react';
import { motion } from 'framer-motion';
import AddCredentialModal from '../components/AddCredentialModal';

interface CloudAccount {
  id: number;
  provider: string;
  account_name: string;
  account_id: string;
  status: string;
  region: string;
  resources_count: number;
  last_synced: string;
  is_default: boolean;
}

interface CreatedCredential {
  id: number;
  name: string;
  provider: string;
}

const normalizeCloudAccount = (item: unknown): CloudAccount => {
  const value = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
  const provider = String(value.provider ?? 'aws').toLowerCase();

  return {
    id: Number(value.id ?? 0),
    provider,
    account_name: String(value.account_name ?? value.name ?? `${provider.toUpperCase()} Account`),
    account_id: String(value.account_id ?? value.id ?? '-'),
    status: String(value.status ?? 'active').toLowerCase(),
    region: String(value.region ?? value.default_region ?? 'global'),
    resources_count:
      typeof value.resources_count === 'number'
        ? value.resources_count
        : value.resources_count
          ? Number(value.resources_count)
          : 0,
    last_synced: String(value.last_synced ?? value.created_at ?? new Date().toISOString()),
    is_default: Boolean(value.is_default),
  };
};

const getErrorDetail = (error: unknown): string | null => {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail
  ) {
    const detail = (error as { response?: { data?: { detail?: unknown } } }).response?.data?.detail;
    if (typeof detail === 'string') return detail;
  }
  return null;
};

const formatSyncRelative = (value: string): string => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return 'Unknown';

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86_400) return `${Math.floor(deltaSeconds / 3600)}h ago`;
  return `${Math.floor(deltaSeconds / 86_400)}d ago`;
};

const formatSyncDate = (value: string): string => {
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) return value;
  return new Date(timestamp).toLocaleString();
};

const CloudAccountsPage: React.FC = () => {
  const { addNotification } = useNotifications();
  const { data: accounts, isLoading, refetch } = useQuery<CloudAccount[]>({
    queryKey: ['cloud-accounts'],
    queryFn: async () => {
      const response = await axios.get('/credentials');
      const payload = response.data;
      const items: unknown[] = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      return items.map(normalizeCloudAccount).filter((item: CloudAccount) => item.id > 0);
    },
  });

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [accountToDelete, setAccountToDelete] = React.useState<CloudAccount | null>(null);
  const [actionError, setActionError] = React.useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (account: CloudAccount) => {
      await axios.delete(`/credentials/${account.id}`);
      return account;
    },
    onSuccess: (account) => {
      setActionError(null);
      setAccountToDelete(null);
      refetch();
      addNotification({
        type: 'success',
        title: 'Cloud Account Disconnected',
        message: `${account.account_name} credentials were removed.`,
        provider: account.provider,
        resourceName: account.account_name,
        status: 'inactive',
        action: 'Cloud account disconnected',
        source: 'system',
      });
    },
    onError: (error, account) => {
      const detail = getErrorDetail(error) ?? 'Failed to disconnect cloud account.';
      setActionError(detail);
      addNotification({
        type: 'error',
        title: 'Disconnect Failed',
        message: detail,
        provider: account.provider,
        resourceName: account.account_name,
        status: 'failed',
        action: 'Cloud account disconnect failed',
        source: 'system',
      });
    },
  });

  const handleModalSuccess = (createdCredential?: CreatedCredential) => {
    refetch();
    const accountName = createdCredential?.name || 'Cloud account';
    const provider = String(createdCredential?.provider || 'aws').toLowerCase();
    addNotification({
      type: 'success',
      title: 'Cloud Account Connected',
      message: `${accountName} credentials were added successfully.`,
      provider,
      resourceName: accountName,
      status: 'active',
      action: 'Cloud account connected',
      source: 'system',
    });
  };

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="cloud-accounts"
        tone="indigo"
        eyebrow="Provider credentials and health"
        eyebrowIcon={<Cloud className="h-3.5 w-3.5" />}
        title="Cloud Accounts"
        titleIcon={<Cloud className="w-8 h-8 text-indigo-400" />}
        description="Manage cloud provider credentials, sync health, and account-level connectivity."
        chips={[
          { label: `${accounts?.length ?? 0} connected`, tone: 'indigo' },
          { label: `${(accounts ?? []).filter((item) => item.status.toLowerCase() === 'active').length} active`, tone: 'emerald' },
        ]}
        actions={
          <>
            <button
              onClick={() => refetch()}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">Add Account</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About Cloud Accounts"
        purpose="Cloud accounts store and validate provider credentials used for inventory sync and provisioning."
        actions={[
          'review connected AWS, Azure, and GCP accounts',
          'check account status and last sync recency',
          'add or remove provider credentials',
        ]}
      />

      {actionError && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {actionError}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="account-skeleton h-48 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : (accounts ?? []).length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts?.map((account, index) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="account-card rounded-xl p-6 transition-all group relative"
            >
              {account.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="px-2 py-1 bg-indigo-500/20 text-indigo-400 text-xs font-medium rounded">
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start space-x-4 mb-4">
                <ProviderIcon provider={account.provider as any} size="lg" />
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white mb-1 truncate">{account.account_name}</h3>
                  <p className="text-sm text-gray-400 font-mono truncate">{account.account_id}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="account-metric rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Status</span>
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={account.status as any} size="sm" />
                    </div>
                  </div>

                  <div className="account-metric rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Region</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-200 capitalize">{account.region}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="account-metric rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
                      <Boxes className="w-3.5 h-3.5" />
                      <span>Resources</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-200">{account.resources_count}</p>
                  </div>

                  <div className="account-metric rounded-lg px-3 py-2">
                    <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-gray-500">
                      <Clock3 className="w-3.5 h-3.5" />
                      <span>Synced</span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-gray-200">{formatSyncRelative(account.last_synced)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-800/50">
                <span className="text-xs text-gray-500">Last sync: {formatSyncDate(account.last_synced)}</span>
                
                <button
                  onClick={() => {
                    setActionError(null);
                    setAccountToDelete(account);
                  }}
                  disabled={deleteMutation.isPending}
                  className="opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Disconnect account"
                >
                  <Trash2 className="w-4 h-4 text-red-400 hover:text-red-300" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="account-empty rounded-xl p-12 text-center">
          <Cloud className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No cloud accounts connected</h3>
          <p className="text-sm text-gray-500 mb-6">Connect your first cloud provider to get started</p>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Account</span>
          </button>
        </div>
      )}

      <AddCredentialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />

      <ConfirmDialog
        open={accountToDelete !== null}
        title="Disconnect Cloud Account"
        message={
          accountToDelete
            ? `Disconnect "${accountToDelete.account_name}" credentials? This may impact provisioning and sync jobs.`
            : ''
        }
        confirmLabel="Disconnect"
        cancelLabel="Cancel"
        tone="danger"
        isLoading={deleteMutation.isPending}
        onCancel={() => {
          if (!deleteMutation.isPending) setAccountToDelete(null);
        }}
        onConfirm={() => {
          if (accountToDelete) {
            deleteMutation.mutate(accountToDelete);
          }
        }}
      />
    </div>
  );
};

export default CloudAccountsPage;
