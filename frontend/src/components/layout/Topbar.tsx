import React from 'react';
import {
  Search,
  Bell,
  User,
  ChevronDown,
  Settings,
  LogOut,
  HelpCircle,
  ArrowLeft,
  ArrowRight,
  Menu,
  Loader2,
  Server,
  Database,
  Network,
  Rocket,
  Zap,
  BellRing,
  Inbox,
  FolderKanban,
  X,
  Sun,
  Moon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
import { useNotifications } from '../../context/NotificationContext';
import { useTheme } from '../../context/ThemeContext';
import {
  CURRENT_PROJECT_CHANGED_EVENT,
  readCurrentProjectId,
  readCurrentProjectName,
  setCurrentProject,
} from '../../utils/currentProject';

import { useLocation, useNavigate, useNavigationType } from 'react-router-dom';

interface TopbarProps {
  onOpenSidebar?: () => void;
}

type SearchKind = 'project' | 'vm' | 'storage' | 'network' | 'function' | 'sqs' | 'sns' | 'deployment';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  kind: SearchKind;
}

interface ProjectOption {
  id: number;
  name: string;
  resource_count?: number;
}

const normalizeCollection = (payload: any): any[] => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
};

const includesQuery = (value: unknown, query: string): boolean =>
  String(value ?? '').toLowerCase().includes(query);

const Topbar: React.FC<TopbarProps> = ({ onOpenSidebar }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, clearNotifications, removeNotification, formatTime } = useNotifications();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const navigationType = useNavigationType();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showProjectMenu, setShowProjectMenu] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const searchContainerRef = React.useRef<HTMLDivElement | null>(null);
  const projectMenuRef = React.useRef<HTMLDivElement | null>(null);
  const [currentProjectId, setCurrentProjectId] = React.useState<number | null>(() => readCurrentProjectId());
  const [currentProjectName, setCurrentProjectName] = React.useState<string | null>(() => readCurrentProjectName());

  const getHistoryIndex = React.useCallback(() => {
    const state = window.history.state as { idx?: number } | null;
    return typeof state?.idx === 'number' ? state.idx : 0;
  }, []);

  const [historyIndex, setHistoryIndex] = React.useState<number>(getHistoryIndex);
  const [maxHistoryIndex, setMaxHistoryIndex] = React.useState<number>(getHistoryIndex);

  const { data: profileUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await axios.get('/auth/me')).data,
    retry: 1,
  });

  const { data: projects = [], isLoading: isProjectsLoading } = useQuery<ProjectOption[]>({
    queryKey: ['projects', 'topbar'],
    queryFn: async () => {
      const response = await axios.get('/projects/');
      const payload = response.data;
      const items = normalizeCollection(payload);
      return items.map((project: any) => ({
        id: Number(project.id),
        name: String(project.name ?? `Project ${project.id}`),
        resource_count:
          typeof project.resource_count === 'number' ? project.resource_count : undefined,
      }));
    },
    staleTime: 30_000,
    retry: 1,
  });

  const currentProject = React.useMemo(
    () => projects.find((project) => project.id === currentProjectId) ?? null,
    [projects, currentProjectId]
  );

  const selectProject = React.useCallback((project: ProjectOption) => {
    setCurrentProjectId(project.id);
    setCurrentProjectName(project.name);
    setCurrentProject({ id: project.id, name: project.name });
    setShowProjectMenu(false);
  }, []);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [searchTerm]);

  React.useEffect(() => {
    if (!showSearch) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!searchContainerRef.current?.contains(event.target as Node)) {
        setShowSearch(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showSearch]);

  React.useEffect(() => {
    if (!showProjectMenu) return;

    const onMouseDown = (event: MouseEvent) => {
      if (!projectMenuRef.current?.contains(event.target as Node)) {
        setShowProjectMenu(false);
      }
    };

    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [showProjectMenu]);

  React.useEffect(() => {
    if (projects.length === 0) return;

    const storedId = readCurrentProjectId();
    if (storedId && projects.some((project) => project.id === storedId)) {
      const selected = projects.find((project) => project.id === storedId) || null;
      setCurrentProjectId(storedId);
      setCurrentProjectName(selected?.name ?? readCurrentProjectName());
      return;
    }

    const fallbackProject = projects[0];
    setCurrentProjectId(fallbackProject.id);
    setCurrentProjectName(fallbackProject.name);
    setCurrentProject({ id: fallbackProject.id, name: fallbackProject.name });
  }, [projects]);

  React.useEffect(() => {
    const onProjectChanged = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: number | null; name?: string | null }>;
      const projectId = customEvent.detail?.id;
      if (typeof projectId === 'number' && projectId > 0) {
        setCurrentProjectId(projectId);
      }
      const projectName = customEvent.detail?.name;
      if (projectName && projectName.trim().length > 0) {
        setCurrentProjectName(projectName);
      }
    };

    window.addEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
    return () => window.removeEventListener(CURRENT_PROJECT_CHANGED_EVENT, onProjectChanged as EventListener);
  }, []);

  const { data: searchResults = [], isFetching: isSearching } = useQuery<SearchResultItem[]>({
    queryKey: ['topbar-search', debouncedSearchTerm],
    enabled: showSearch && debouncedSearchTerm.length >= 2,
    queryFn: async () => {
      const query = debouncedSearchTerm.toLowerCase();

      const fetchCollection = async (url: string) => {
        try {
          const response = await axios.get(url);
          return normalizeCollection(response.data);
        } catch {
          return [];
        }
      };

      const [projects, vms, storage, networks, resources, deployments] = await Promise.all([
        fetchCollection('/projects/'),
        fetchCollection('/inventory/vms?limit=100'),
        fetchCollection('/inventory/storage?limit=100'),
        fetchCollection('/inventory/networks?limit=100'),
        fetchCollection('/resources/?limit=200'),
        fetchCollection('/deployments/'),
      ]);

      const projectResults: SearchResultItem[] = projects
        .filter((project: any) => includesQuery(project.name, query) || includesQuery(project.description, query))
        .map((project: any) => ({
          id: `project-${project.id ?? project.name ?? 'unknown'}`,
          title: String(project.name ?? 'Unnamed Project'),
          subtitle: project.description ? `Project • ${String(project.description)}` : 'Project',
          path: '/projects',
          kind: 'project' as const,
        }));

      const vmResults: SearchResultItem[] = vms
        .filter(
          (vm: any) =>
            includesQuery(vm.resource_name ?? vm.name, query) ||
            includesQuery(vm.provider, query) ||
            includesQuery(vm.region, query) ||
            includesQuery(vm.status, query)
        )
        .map((vm: any) => {
          const vmId = vm.id ?? vm.resource_id;
          return {
            id: `vm-${vmId ?? vm.resource_name ?? vm.name ?? 'unknown'}`,
            title: String(vm.resource_name ?? vm.name ?? 'Unnamed VM'),
            subtitle: `VM • ${String(vm.provider ?? '').toUpperCase()} • ${String(vm.region ?? 'unknown')}`,
            path: vmId ? `/resources/vms/${vmId}` : '/resources/vms',
            kind: 'vm' as const,
          };
        });

      const storageResults: SearchResultItem[] = storage
        .filter(
          (item: any) =>
            includesQuery(item.resource_name ?? item.name, query) ||
            includesQuery(item.provider, query) ||
            includesQuery(item.region, query) ||
            includesQuery(item.status, query)
        )
        .map((item: any) => ({
          id: `storage-${item.id ?? item.resource_id ?? item.name ?? 'unknown'}`,
          title: String(item.resource_name ?? item.name ?? 'Unnamed Storage'),
          subtitle: `Storage • ${String(item.provider ?? '').toUpperCase()} • ${String(item.region ?? 'unknown')}`,
          path: '/resources/storage',
          kind: 'storage' as const,
        }));

      const networkResults: SearchResultItem[] = networks
        .filter(
          (item: any) =>
            includesQuery(item.resource_name ?? item.name, query) ||
            includesQuery(item.provider, query) ||
            includesQuery(item.status, query)
        )
        .map((item: any) => ({
          id: `network-${item.id ?? item.resource_id ?? item.name ?? 'unknown'}`,
          title: String(item.resource_name ?? item.name ?? 'Unnamed Network'),
          subtitle: `Network • ${String(item.provider ?? '').toUpperCase()}`,
          path: '/resources/networks',
          kind: 'network' as const,
        }));

      const functionResults: SearchResultItem[] = resources
        .filter((item: any) => String(item.type ?? '').toLowerCase() === 'faas')
        .filter(
          (item: any) =>
            includesQuery(item.name, query) ||
            includesQuery(item.provider, query) ||
            includesQuery(item.status, query) ||
            includesQuery(item.type, query)
        )
        .map((item: any) => ({
          id: `function-${item.id ?? item.name ?? 'unknown'}`,
          title: String(item.name ?? 'Unnamed Function'),
          subtitle: `Function • ${String(item.provider ?? '').toUpperCase()} • ${String(
            item.status ?? 'unknown'
          )}`,
          path: item.id ? `/deployments/${item.id}` : '/resources/functions',
          kind: 'function' as const,
        }));

      const messagingResults: SearchResultItem[] = resources
        .filter((item: any) => ['sqs', 'sns'].includes(String(item.type ?? '').toLowerCase()))
        .filter(
          (item: any) =>
            includesQuery(item.name, query) ||
            includesQuery(item.provider, query) ||
            includesQuery(item.status, query) ||
            includesQuery(item.type, query) ||
            includesQuery(item.configuration?.region, query)
        )
        .map((item: any) => {
          const type = String(item.type ?? '').toLowerCase() === 'sns' ? 'sns' : 'sqs';
          const provider = String(item.provider ?? '').toLowerCase();
          const providerParam = ['aws', 'azure', 'gcp'].includes(provider) ? provider : 'aws';
          return {
            id: `messaging-${type}-${item.id ?? item.name ?? 'unknown'}`,
            title: String(item.name ?? `Unnamed ${type.toUpperCase()}`),
            subtitle: `${type.toUpperCase()} • ${String(item.provider ?? '').toUpperCase()} • ${String(
              item.configuration?.region ?? 'unknown'
            )}`,
            path:
              type === 'sqs'
                ? `/resources/queues?provider=${providerParam}`
                : `/resources/messages?provider=${providerParam}`,
            kind: type as 'sqs' | 'sns',
          };
        });

      const deploymentResults: SearchResultItem[] = deployments
        .filter(
          (deployment: any) =>
            includesQuery(deployment.resource_name, query) ||
            includesQuery(deployment.provider, query) ||
            includesQuery(deployment.resource_type, query) ||
            includesQuery(deployment.status, query)
        )
        .map((deployment: any) => ({
          id: `deployment-${deployment.id ?? 'unknown'}`,
          title: String(deployment.resource_name ?? 'Unnamed Deployment'),
          subtitle: `Deployment • ${String(deployment.provider ?? '').toUpperCase()} • ${String(
            deployment.status ?? 'unknown'
          )}`,
          path: deployment.id ? `/deployments/${deployment.id}` : '/deployments',
          kind: 'deployment' as const,
        }));

      return [
        ...projectResults,
        ...vmResults,
        ...storageResults,
        ...networkResults,
        ...functionResults,
        ...messagingResults,
        ...deploymentResults,
      ].slice(0, 25);
    },
    staleTime: 5000,
    retry: 1,
  });

  const getSearchIcon = (kind: SearchKind) => {
    switch (kind) {
      case 'project':
        return <FolderKanban className="w-4 h-4 text-blue-400" />;
      case 'vm':
        return <Server className="w-4 h-4 text-blue-300" />;
      case 'storage':
        return <Database className="w-4 h-4 text-blue-300" />;
      case 'network':
        return <Network className="w-4 h-4 text-indigo-300" />;
      case 'function':
        return <Zap className="w-4 h-4 text-blue-400" />;
      case 'sqs':
        return <Inbox className="w-4 h-4 text-blue-300" />;
      case 'sns':
        return <BellRing className="w-4 h-4 text-indigo-300" />;
      case 'deployment':
        return <Rocket className="w-4 h-4 text-blue-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  const openSearchResult = (result: SearchResultItem) => {
    navigate(result.path);
    setShowSearch(false);
    setSearchTerm('');
    setDebouncedSearchTerm('');
  };

  const currentUser = profileUser || user || {
    full_name: 'Admin User',
    email: 'admin@cloudorch.com'
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
  };

  React.useEffect(() => {
    const idx = getHistoryIndex();
    setHistoryIndex(idx);
    if (navigationType === 'PUSH') {
      setMaxHistoryIndex(idx);
      return;
    }
    setMaxHistoryIndex((prev) => Math.max(prev, idx));
  }, [getHistoryIndex, location.key, navigationType]);

  const canGoBack = historyIndex > 0;
  const canGoForward = historyIndex < maxHistoryIndex;

  const goBack = () => {
    if (!canGoBack) return;
    navigate(-1);
  };

  const goForward = () => {
    if (!canGoForward) return;
    navigate(1);
  };

  React.useEffect(() => {
    if (showNotifications) {
      markAllRead();
    }
  }, [markAllRead, showNotifications]);

  return (
    <header className="app-topbar h-[68px] border-b border-gray-800/50 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40">
      {/* Left: Project Selector */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onOpenSidebar}
          className="topbar-icon-btn cursor-pointer lg:hidden p-2 rounded-lg transition-colors"
          aria-label="Open sidebar"
          title="Menu"
        >
              <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="topbar-icon-btn cursor-pointer p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="topbar-icon-btn cursor-pointer p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go forward"
            title="Forward"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
        <div className="relative hidden sm:block" ref={projectMenuRef}>
          <button
            onClick={() => setShowProjectMenu((previous) => !previous)}
            className="topbar-pill-btn cursor-pointer flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200"
          >
            <div className={`h-2 w-2 rounded-full ${currentProject ? 'bg-green-500' : 'bg-amber-500'}`} />
            <span className="topbar-heading max-w-[180px] truncate text-sm font-medium">
              {isProjectsLoading ? 'Loading projects...' : currentProject?.name || currentProjectName || 'No project selected'}
            </span>
            <ChevronDown className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {showProjectMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="app-topbar-popover absolute left-0 mt-2 w-72 border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-800/50">
                  <p className="topbar-meta text-xs uppercase tracking-wide">Current Project</p>
                  <p className="topbar-heading mt-1 truncate text-sm font-medium">
                    {currentProject?.name || currentProjectName || 'None selected'}
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {isProjectsLoading ? (
                    <div className="topbar-empty px-3 py-2 text-sm">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="topbar-empty px-3 py-2 text-sm">No projects found. Create one first.</div>
                  ) : (
                    projects.map((project) => {
                      const isSelected = project.id === currentProjectId;
                      return (
                          <button
                            key={project.id}
                            onClick={() => selectProject(project)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors cursor-pointer ${
                              isSelected
                                ? 'border-blue-500/45 bg-blue-500/12 text-blue-100'
                                : 'border-gray-800/50 bg-transparent text-gray-300 hover:bg-gray-800/50'
                            }`}
                          >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">{project.name}</span>
                            <span className="topbar-meta text-xs">
                              {project.resource_count ?? 0}
                            </span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="p-2 border-t border-gray-800/50">
                  <button
                    onClick={() => {
                      setShowProjectMenu(false);
                      navigate('/projects');
                    }}
                    className="topbar-menu-item w-full rounded-lg px-3 py-2 text-left text-sm cursor-pointer"
                  >
                    Manage Projects
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center space-x-1 sm:space-x-3">
        {/* Global Search */}
        <div className="relative" ref={searchContainerRef}>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="topbar-icon-btn cursor-pointer p-2 rounded-lg transition-all duration-200 relative"
          >
            <Search className="w-5 h-5" />
          </button>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="app-topbar-popover absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-96 border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 topbar-meta" />
                    <input
                      type="text"
                      placeholder="Search resources, deployments..."
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setShowSearch(false);
                          return;
                        }
                        if (event.key === 'Enter' && searchResults.length > 0) {
                          event.preventDefault();
                          openSearchResult(searchResults[0]);
                        }
                      }}
                      className="app-topbar-input w-full rounded-lg py-2 pl-10 pr-4 text-sm"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="topbar-meta text-xs font-semibold uppercase">Search Results</p>

                    {searchTerm.trim().length < 2 ? (
                      <div className="topbar-empty text-sm">Type at least 2 characters to search.</div>
                    ) : isSearching ? (
                      <div className="topbar-empty flex items-center space-x-2 text-sm">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="topbar-empty text-sm">No matching resources found.</div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => openSearchResult(result)}
                            className="topbar-menu-item cursor-pointer w-full flex items-start space-x-3 p-3 rounded-lg transition-colors text-left"
                          >
                            <div className="mt-0.5">{getSearchIcon(result.kind)}</div>
                            <div className="min-w-0">
                              <p className="topbar-heading truncate text-sm font-medium">{result.title}</p>
                              <p className="topbar-meta truncate text-xs">{result.subtitle}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="topbar-icon-btn cursor-pointer p-2 rounded-lg transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="app-topbar-popover absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-96 border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-gray-800/50 flex items-center justify-between gap-3">
                  <h3 className="topbar-heading text-sm font-semibold">Notifications</h3>
                  <div className="flex items-center gap-2">
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearNotifications()}
                        className="topbar-menu-item cursor-pointer rounded-md px-1.5 py-1 text-xs font-medium transition-colors"
                      >
                        Clear all
                      </button>
                    )}
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="topbar-menu-item topbar-meta cursor-pointer rounded-md p-1 transition-colors"
                      aria-label="Close notifications"
                      title="Close"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="p-4 border-b border-gray-800/50 topbar-menu-item transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start space-x-3 flex-1 min-w-0">
                            <div
                              className={`w-2 h-2 rounded-full mt-1.5 ${
                                notification.type === 'success'
                                  ? 'bg-green-500'
                                  : notification.type === 'error'
                                    ? 'bg-red-500'
                                    : notification.type === 'warning'
                                      ? 'bg-yellow-500'
                                      : 'bg-blue-500'
                              }`}
                            ></div>
                            <div className="flex-1 min-w-0">
                              <p className="topbar-heading text-sm font-medium">{notification.title}</p>
                              <p className="topbar-meta mt-1 text-xs">{notification.message}</p>
                              <p className="mt-1 text-xs text-gray-500">{formatTime(notification.createdAt)}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => removeNotification(notification.id)}
                            className="topbar-menu-item topbar-meta cursor-pointer rounded-md p-1 transition-colors"
                            aria-label="Dismiss notification"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="topbar-empty p-4 text-sm">No notifications yet.</div>
                  )}
                </div>
                <div className="p-3 bg-gray-800/30 text-center">
                  <button
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/activity');
                    }}
                    className="cursor-pointer text-xs font-medium text-blue-300 hover:text-blue-200"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="topbar-icon-btn flex items-center space-x-3 px-3 py-2 rounded-lg transition-all duration-200"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 shadow-md shadow-blue-500/30">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <p className="topbar-heading text-sm font-medium">{currentUser.full_name}</p>
              <p className="topbar-meta text-xs">{currentUser.email}</p>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="app-topbar-popover absolute right-0 mt-2 w-56 border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-gray-800/50">
                  <p className="topbar-heading text-sm font-medium">{currentUser.full_name}</p>
                  <p className="topbar-meta text-xs">{currentUser.email}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => handleNavigation('/profile')}
                    className="topbar-menu-item w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    <User className="w-4 h-4 topbar-meta" />
                    <span className="topbar-heading text-sm">Profile</span>
                  </button>
                  <button
                    onClick={() => {
                      toggleTheme();
                      setShowUserMenu(false);
                    }}
                    className="topbar-menu-item w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left"
                    title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                    aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400" />
                    )}
                    <span className="topbar-heading text-sm">
                      {theme === 'dark' ? 'Light Theme' : 'Dark Theme'}
                    </span>
                  </button>
                  <button 
                    onClick={() => handleNavigation('/settings')}
                    className="topbar-menu-item w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 topbar-meta" />
                    <span className="topbar-heading text-sm">Settings</span>
                  </button>
                  <button 
                    onClick={() => handleNavigation('/help')}
                    className="topbar-menu-item w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 topbar-meta" />
                    <span className="topbar-heading text-sm">Help & Support</span>
                  </button>
                </div>
                <div className="p-2 border-t border-gray-800/50">
                  <button
                    onClick={logout}
                    className="topbar-danger-item w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span className="text-sm text-red-400">Logout</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
