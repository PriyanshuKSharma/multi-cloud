import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import ProviderIcon from '../components/ui/ProviderIcon';
import StatusBadge from '../components/ui/StatusBadge';
import PageGuide from '../components/ui/PageGuide';
import PageHero from '../components/ui/PageHero';
import { useNotifications } from '../context/NotificationContext';
import {
  Activity as ActivityIcon,
  RefreshCw,
  Filter,
} from 'lucide-react';
import { motion } from 'framer-motion';

type ProviderKey = 'aws' | 'azure' | 'gcp';
type ActivitySource = 'notification' | 'deployment' | 'sync';
type ActivityStatus =
  | 'running'
  | 'stopped'
  | 'pending'
  | 'failed'
  | 'active'
  | 'inactive'
  | 'healthy'
  | 'degraded'
  | 'provisioning'
  | 'destroying';

interface DeploymentSummary {
  id: number;
  resource_name: string;
  provider: string;
  status: string;
  started_at: string;
}

interface DashboardRecentItem {
  resource_name: string;
  provider: string;
  type: string;
  status: string;
  region: string;
  last_synced: string | null;
}

interface ActivityEvent {
  id: string;
  resource_name: string;
  provider: ProviderKey;
  action: string;
  status: ActivityStatus;
  timestamp: string;
  actor: string;
  source: ActivitySource;
  details?: string;
  deploymentId?: number;
}

const normalizeCollection = (payload: unknown): Record<string, unknown>[] => {
  if (Array.isArray(payload)) return payload as Record<string, unknown>[];
  if (payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)) {
    return ((payload as { items: unknown[] }).items ?? []) as Record<string, unknown>[];
  }
  return [];
};

const normalizeProvider = (provider: unknown): ProviderKey => {
  const normalized = String(provider ?? '').toLowerCase();
  if (normalized === 'azure') return 'azure';
  if (normalized === 'gcp') return 'gcp';
  return 'aws';
};

const normalizeStatus = (status: unknown): ActivityStatus => {
  const normalized = String(status ?? '').toLowerCase();
  if (normalized === 'running') return 'running';
  if (normalized === 'stopped') return 'stopped';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'failed' || normalized === 'error') return 'failed';
  if (normalized === 'active' || normalized === 'success' || normalized === 'completed') return 'active';
  if (normalized === 'inactive' || normalized === 'destroyed') return 'inactive';
  if (normalized === 'healthy') return 'healthy';
  if (normalized === 'degraded') return 'degraded';
  if (normalized === 'destroying') return 'destroying';
  return 'provisioning';
};

const ActivityPage: React.FC = () => {
  const { notifications, formatTime } = useNotifications();
  const [providerFilter, setProviderFilter] = React.useState<'all' | ProviderKey>('all');
  const [sourceFilter, setSourceFilter] = React.useState<'all' | ActivitySource>('all');
  const [search, setSearch] = React.useState('');

  const {
    data: deployments = [],
    isLoading: isDeploymentsLoading,
    refetch: refetchDeployments,
  } = useQuery<DeploymentSummary[]>({
    queryKey: ['activity', 'deployments'],
    queryFn: async () => {
      try {
        const response = await axios.get('/deployments/');
        return normalizeCollection(response.data).map((item) => ({
          id: Number(item.id ?? 0),
          resource_name: String(item.resource_name ?? 'Unnamed Resource'),
          provider: String(item.provider ?? 'aws'),
          status: String(item.status ?? 'pending'),
          started_at: String(item.started_at ?? new Date().toISOString()),
        })).filter((item) => item.id > 0);
      } catch {
        return [];
      }
    },
    refetchInterval: 7000,
  });

  const {
    data: dashboardRecent = [],
    isLoading: isDashboardLoading,
    refetch: refetchDashboard,
  } = useQuery<DashboardRecentItem[]>({
    queryKey: ['activity', 'dashboard-recent'],
    queryFn: async () => {
      try {
        const response = await axios.get('/dashboard/stats');
        const items = Array.isArray(response.data?.recent_activity) ? response.data.recent_activity : [];
        return items.map((item: Record<string, unknown>) => ({
          resource_name: String(item.resource_name ?? 'Unnamed Resource'),
          provider: String(item.provider ?? 'aws'),
          type: String(item.type ?? 'resource'),
          status: String(item.status ?? 'pending'),
          region: String(item.region ?? 'unknown'),
          last_synced: item.last_synced ? String(item.last_synced) : null,
        }));
      } catch {
        return [];
      }
    },
    refetchInterval: 15000,
  });

  const events = React.useMemo<ActivityEvent[]>(() => {
    const notificationEvents: ActivityEvent[] = notifications.map((item) => ({
      id: `notification:${item.id}`,
      resource_name: item.resourceName || item.message.split(' ')[0] || 'Resource',
      provider: normalizeProvider(item.provider),
      action: item.action || item.title,
      status: normalizeStatus(item.status ?? item.type),
      timestamp: item.createdAt,
      actor: 'System',
      source: 'notification',
      details: item.message,
      deploymentId: item.deploymentId,
    }));

    const deploymentEvents: ActivityEvent[] = deployments.map((item) => ({
      id: `deployment:${item.id}:${item.started_at}`,
      resource_name: item.resource_name,
      provider: normalizeProvider(item.provider),
      action: 'Deployment created',
      status: normalizeStatus(item.status),
      timestamp: item.started_at,
      actor: 'You',
      source: 'deployment',
      details: `Deployment #${item.id} on ${String(item.provider).toUpperCase()}`,
      deploymentId: item.id,
    }));

    const syncEvents: ActivityEvent[] = dashboardRecent.map((item, index) => ({
      id: `sync:${item.resource_name}:${item.last_synced ?? index}`,
      resource_name: item.resource_name,
      provider: normalizeProvider(item.provider),
      action: 'Inventory sync',
      status: normalizeStatus(item.status),
      timestamp: item.last_synced || new Date().toISOString(),
      actor: 'Sync Worker',
      source: 'sync',
      details: `${item.type} • ${item.region}`,
    }));

    const merged = [...notificationEvents, ...deploymentEvents, ...syncEvents];
    const unique = new Map<string, ActivityEvent>();
    merged.forEach((event) => {
      const dedupeKey = `${event.source}:${event.resource_name}:${event.action}:${event.status}:${event.timestamp}`;
      if (!unique.has(dedupeKey)) unique.set(dedupeKey, event);
    });

    return [...unique.values()].sort((a, b) => {
      const aTime = Date.parse(a.timestamp) || 0;
      const bTime = Date.parse(b.timestamp) || 0;
      return bTime - aTime;
    });
  }, [dashboardRecent, deployments, notifications]);

  const filteredEvents = React.useMemo(() => {
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      if (providerFilter !== 'all' && event.provider !== providerFilter) return false;
      if (sourceFilter !== 'all' && event.source !== sourceFilter) return false;
      if (!query) return true;
      return (
        event.resource_name.toLowerCase().includes(query) ||
        event.action.toLowerCase().includes(query) ||
        String(event.details ?? '').toLowerCase().includes(query)
      );
    });
  }, [events, providerFilter, search, sourceFilter]);

  const refreshAll = () => {
    refetchDeployments();
    refetchDashboard();
  };

  const isLoading = isDeploymentsLoading || isDashboardLoading;

  return (
    <div className="p-8 space-y-6">
      <PageHero
        id="activity"
        tone="emerald"
        eyebrow="Audit and event stream"
        eyebrowIcon={<ActivityIcon className="h-3.5 w-3.5" />}
        title="Activity Timeline"
        titleIcon={<ActivityIcon className="w-8 h-8 text-emerald-400" />}
        description="Track user actions, deployment events, and status transitions across cloud resources."
        chips={[
          { label: `${filteredEvents.length} visible events`, tone: 'emerald' },
          { label: `${events.length} total live events`, tone: 'cyan' },
        ]}
        actions={
          <>
            <button className="cursor-default flex items-center space-x-2 px-4 py-2 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-700/50">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Live Filters</span>
            </button>
            <button
              onClick={refreshAll}
              className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg border border-gray-700/50 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </>
        }
      />

      <PageGuide
        title="About Activity"
        purpose="Activity timeline merges deployment starts, live status transitions, and inventory sync events."
        actions={[
          'monitor resource status changes in near real-time',
          'filter by provider and event source',
          'open deployment details directly from timeline rows',
        ]}
      />

      <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search resource or action..."
          className="md:col-span-2 px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
        <select
          value={providerFilter}
          onChange={(event) => setProviderFilter(event.target.value as 'all' | ProviderKey)}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">All Providers</option>
          <option value="aws">AWS</option>
          <option value="azure">Azure</option>
          <option value="gcp">GCP</option>
        </select>
        <select
          value={sourceFilter}
          onChange={(event) => setSourceFilter(event.target.value as 'all' | ActivitySource)}
          className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        >
          <option value="all">All Sources</option>
          <option value="notification">Status Updates</option>
          <option value="deployment">Deployments</option>
          <option value="sync">Inventory Sync</option>
        </select>
      </div>

      {isLoading && events.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-[#0f0f11] border border-gray-800/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start space-x-4 flex-1 min-w-0">
                  <ProviderIcon provider={event.provider} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-gray-400 text-sm">{event.actor}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-white font-medium">{event.action}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-300 truncate">{event.resource_name}</span>
                      <StatusBadge status={event.status} size="sm" />
                    </div>
                    {event.details && (
                      <p className="text-xs text-gray-500">{event.details}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      {new Date(event.timestamp).toLocaleString()} ({formatTime(event.timestamp)})
                    </p>
                  </div>
                </div>
                {event.deploymentId ? (
                  <Link
                    to={`/deployments/${event.deploymentId}`}
                    className="shrink-0 text-xs text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                  >
                    Open
                  </Link>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-[#0f0f11] border border-gray-800/50 rounded-xl p-12 text-center">
          <ActivityIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-400 mb-2">No activity yet</h3>
          <p className="text-sm text-gray-500">Create or sync resources to populate live events.</p>
        </div>
      )}
    </div>
  );
};

export default ActivityPage;
