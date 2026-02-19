import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '../api/axios';
import { useAuth } from './AuthContext';

export type AppNotificationType = 'success' | 'warning' | 'info' | 'error';

export interface AppNotification {
  id: string;
  type: AppNotificationType;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  deploymentId?: number;
  provider?: string;
  resourceName?: string;
  status?: string;
  action?: string;
  source?: 'deployment' | 'sync' | 'system';
}

interface DeploymentSnapshot {
  id: number;
  resource_name: string;
  status: string;
  provider: string;
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (input: AddNotificationInput) => void;
  markAllRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
  formatTime: (createdAt: string) => string;
}

interface AddNotificationInput {
  type: AppNotificationType;
  title: string;
  message: string;
  deploymentId?: number;
  provider?: string;
  resourceName?: string;
  status?: string;
  action?: string;
  source?: 'deployment' | 'sync' | 'system';
}

const NotificationContext = React.createContext<NotificationContextType | null>(null);

const STORAGE_KEY = 'nebula.notifications.v1';
const MAX_NOTIFICATIONS = 50;
const PROVISIONING_STATUSES = new Set(['pending', 'provisioning', 'running', 'in_progress']);
const SUCCESS_STATUSES = new Set(['active', 'success', 'completed']);
const FAILURE_STATUSES = new Set(['failed', 'error']);

const normalizeDeployments = (payload: unknown): DeploymentSnapshot[] => {
  const arrayPayload = Array.isArray(payload)
    ? payload
    : payload && typeof payload === 'object' && Array.isArray((payload as { items?: unknown[] }).items)
      ? ((payload as { items: unknown[] }).items ?? [])
      : [];

  return arrayPayload
    .map((item) => {
      const value = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
      return {
        id: Number(value.id ?? 0),
        resource_name: String(value.resource_name ?? 'Unnamed Resource'),
        status: String(value.status ?? 'pending').toLowerCase(),
        provider: String(value.provider ?? 'unknown').toUpperCase(),
      };
    })
    .filter((item) => item.id > 0);
};

const readStoredNotifications = (): AppNotification[] => {
  if (typeof window === 'undefined') return [];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item: unknown) => {
        const value = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
        const type = String(value.type ?? 'info') as AppNotificationType;
        const sourceValue = String(value.source ?? '');
        return {
          id: String(value.id ?? ''),
          type: type === 'success' || type === 'warning' || type === 'error' ? type : 'info',
          title: String(value.title ?? ''),
          message: String(value.message ?? ''),
          createdAt: String(value.createdAt ?? new Date().toISOString()),
          read: Boolean(value.read),
          deploymentId:
            typeof value.deploymentId === 'number'
              ? value.deploymentId
              : value.deploymentId
                ? Number(value.deploymentId)
                : undefined,
          provider: value.provider ? String(value.provider) : undefined,
          resourceName: value.resourceName ? String(value.resourceName) : undefined,
          status: value.status ? String(value.status) : undefined,
          action: value.action ? String(value.action) : undefined,
          source:
            sourceValue === 'deployment' || sourceValue === 'sync' || sourceValue === 'system'
              ? sourceValue
              : undefined,
        } satisfies AppNotification;
      })
      .filter((item) => item.id && item.title && item.message)
      .slice(0, MAX_NOTIFICATIONS);
  } catch {
    return [];
  }
};

const formatTimeSince = (createdAt: string): string => {
  const timestamp = Date.parse(createdAt);
  if (Number.isNaN(timestamp)) return 'Just now';

  const deltaSeconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (deltaSeconds < 60) return `${deltaSeconds}s ago`;
  if (deltaSeconds < 3600) return `${Math.floor(deltaSeconds / 60)}m ago`;
  if (deltaSeconds < 86400) return `${Math.floor(deltaSeconds / 3600)}h ago`;
  return `${Math.floor(deltaSeconds / 86400)}d ago`;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [notifications, setNotifications] = React.useState<AppNotification[]>(readStoredNotifications);
  const previousStatusesRef = React.useRef<Map<number, string>>(new Map());
  const hasHydratedRef = React.useRef(false);

  const addNotification = React.useCallback(
    ({
      type,
      title,
      message,
      deploymentId,
      provider,
      resourceName,
      status,
      action,
      source = 'deployment',
    }: AddNotificationInput) => {
      const createdAt = new Date().toISOString();
      const notification: AppNotification = {
        id: `${deploymentId ?? 'generic'}:${createdAt}:${Math.random().toString(36).slice(2, 9)}`,
        type,
        title,
        message,
        createdAt,
        read: false,
        deploymentId,
        provider,
        resourceName,
        status,
        action,
        source,
      };

      setNotifications((previous) => [notification, ...previous].slice(0, MAX_NOTIFICATIONS));
    },
    []
  );

  const markAllRead = React.useCallback(() => {
    setNotifications((previous) =>
      previous.some((item) => !item.read) ? previous.map((item) => ({ ...item, read: true })) : previous
    );
  }, []);

  const clearNotifications = React.useCallback(() => {
    setNotifications([]);
  }, []);

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((previous) => previous.filter((item) => item.id !== id));
  }, []);

  const { data: deploymentSnapshots = [] } = useQuery<DeploymentSnapshot[]>({
    queryKey: ['notifications', 'deployments'],
    enabled: isAuthenticated && !isLoading,
    queryFn: async () => {
      const response = await axios.get('/deployments/');
      return normalizeDeployments(response.data);
    },
    refetchInterval: isAuthenticated ? 7000 : false,
    retry: 1,
    staleTime: 2000,
  });

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  React.useEffect(() => {
    if (!isAuthenticated) {
      previousStatusesRef.current = new Map();
      hasHydratedRef.current = false;
      return;
    }

    const nextStatuses = new Map<number, string>();
    deploymentSnapshots.forEach((deployment) => {
      nextStatuses.set(deployment.id, deployment.status);
    });

    if (!hasHydratedRef.current) {
      previousStatusesRef.current = nextStatuses;
      hasHydratedRef.current = true;
      return;
    }

    deploymentSnapshots.forEach((deployment) => {
      const previousStatus = previousStatusesRef.current.get(deployment.id);
      const currentStatus = deployment.status;

      if (!previousStatus) {
        if (PROVISIONING_STATUSES.has(currentStatus)) {
          addNotification({
            type: 'info',
            title: 'Provisioning Started',
            message: `${deployment.resource_name} is provisioning on ${deployment.provider}.`,
            deploymentId: deployment.id,
            provider: deployment.provider,
            resourceName: deployment.resource_name,
            status: currentStatus,
            action: 'Provisioning started',
            source: 'deployment',
          });
        } else if (SUCCESS_STATUSES.has(currentStatus)) {
          addNotification({
            type: 'success',
            title: 'Deployment Active',
            message: `${deployment.resource_name} is active on ${deployment.provider}.`,
            deploymentId: deployment.id,
            provider: deployment.provider,
            resourceName: deployment.resource_name,
            status: currentStatus,
            action: 'Deployment active',
            source: 'deployment',
          });
        } else if (FAILURE_STATUSES.has(currentStatus)) {
          addNotification({
            type: 'error',
            title: 'Deployment Failed',
            message: `${deployment.resource_name} failed on ${deployment.provider}.`,
            deploymentId: deployment.id,
            provider: deployment.provider,
            resourceName: deployment.resource_name,
            status: currentStatus,
            action: 'Deployment failed',
            source: 'deployment',
          });
        }
        return;
      }

      if (previousStatus === currentStatus) return;

      if (SUCCESS_STATUSES.has(currentStatus)) {
        addNotification({
          type: 'success',
          title: 'Provisioning Complete',
          message: `${deployment.resource_name} is now active.`,
          deploymentId: deployment.id,
          provider: deployment.provider,
          resourceName: deployment.resource_name,
          status: currentStatus,
          action: 'Provisioning complete',
          source: 'deployment',
        });
        return;
      }

      if (FAILURE_STATUSES.has(currentStatus)) {
        addNotification({
          type: 'error',
          title: 'Provisioning Failed',
          message: `${deployment.resource_name} entered ${currentStatus} state.`,
          deploymentId: deployment.id,
          provider: deployment.provider,
          resourceName: deployment.resource_name,
          status: currentStatus,
          action: 'Provisioning failed',
          source: 'deployment',
        });
        return;
      }

      if (PROVISIONING_STATUSES.has(currentStatus)) {
        addNotification({
          type: 'info',
          title: 'Provisioning Update',
          message: `${deployment.resource_name} moved to ${currentStatus}.`,
          deploymentId: deployment.id,
          provider: deployment.provider,
          resourceName: deployment.resource_name,
          status: currentStatus,
          action: 'Provisioning update',
          source: 'deployment',
        });
      }
    });

    previousStatusesRef.current = nextStatuses;
  }, [addNotification, deploymentSnapshots, isAuthenticated]);

  const unreadCount = React.useMemo(
    () => notifications.reduce((count, notification) => count + (notification.read ? 0 : 1), 0),
    [notifications]
  );

  const value = React.useMemo<NotificationContextType>(
    () => ({
      notifications,
      unreadCount,
      addNotification,
      markAllRead,
      clearNotifications,
      removeNotification,
      formatTime: formatTimeSince,
    }),
    [notifications, unreadCount, addNotification, markAllRead, clearNotifications, removeNotification]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextType => {
  const context = React.useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
