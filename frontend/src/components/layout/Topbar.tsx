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
  FolderKanban,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';
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

type SearchKind = 'project' | 'vm' | 'storage' | 'network' | 'deployment';

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

      const [projects, vms, storage, networks, deployments] = await Promise.all([
        fetchCollection('/projects/'),
        fetchCollection('/inventory/vms?limit=100'),
        fetchCollection('/inventory/storage?limit=100'),
        fetchCollection('/inventory/networks?limit=100'),
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
        return <Server className="w-4 h-4 text-cyan-400" />;
      case 'storage':
        return <Database className="w-4 h-4 text-purple-400" />;
      case 'network':
        return <Network className="w-4 h-4 text-teal-400" />;
      case 'deployment':
        return <Rocket className="w-4 h-4 text-orange-400" />;
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

  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Deployment Complete',
      message: 'web-server-01 deployed successfully',
      time: '2 minutes ago',
    },
    {
      id: 2,
      type: 'warning',
      title: 'High Latency Detected',
      message: 'GCP provider response time: 1200ms',
      time: '15 minutes ago',
    },
  ];

  return (
    <header className="h-16 bg-[#0f0f11] border-b border-gray-800/50 flex items-center justify-between px-3 sm:px-6 sticky top-0 z-40">
      {/* Left: Project Selector */}
      <div className="flex items-center space-x-2 sm:space-x-4">
        <button
          onClick={onOpenSidebar}
          className="cursor-pointer lg:hidden p-2 hover:bg-gray-800/50 rounded-lg transition-colors"
          aria-label="Open sidebar"
          title="Menu"
        >
          <Menu className="w-5 h-5 text-gray-300" />
        </button>
        <div className="flex items-center space-x-2">
          <button
            onClick={goBack}
            disabled={!canGoBack}
            className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go back"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <button
            onClick={goForward}
            disabled={!canGoForward}
            className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Go forward"
            title="Forward"
          >
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
        <div className="relative hidden sm:block" ref={projectMenuRef}>
          <button
            onClick={() => setShowProjectMenu((previous) => !previous)}
            className="cursor-pointer flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition-all duration-200"
          >
            <div className={`w-2 h-2 rounded-full ${currentProject ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm font-medium text-gray-300 max-w-[180px] truncate">
              {isProjectsLoading ? 'Loading projects...' : currentProject?.name || currentProjectName || 'No project selected'}
            </span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          <AnimatePresence>
            {showProjectMenu && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="absolute left-0 mt-2 w-72 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-gray-800/50">
                  <p className="text-xs uppercase tracking-wide text-gray-500">Current Project</p>
                  <p className="text-sm font-medium text-gray-200 mt-1 truncate">
                    {currentProject?.name || currentProjectName || 'None selected'}
                  </p>
                </div>

                <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                  {isProjectsLoading ? (
                    <div className="px-3 py-2 text-sm text-gray-400">Loading projects...</div>
                  ) : projects.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-400">No projects found. Create one first.</div>
                  ) : (
                    projects.map((project) => {
                      const isSelected = project.id === currentProjectId;
                      return (
                        <button
                          key={project.id}
                          onClick={() => selectProject(project)}
                          className={`cursor-pointer w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500/40 bg-blue-500/10 text-blue-200'
                              : 'border-gray-800/50 bg-transparent text-gray-300 hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-medium truncate">{project.name}</span>
                            <span className="text-xs text-gray-500">
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
                    className="cursor-pointer w-full rounded-lg px-3 py-2 text-left text-sm text-blue-300 hover:bg-gray-800/50"
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
            className="cursor-pointer p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200 relative"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-96 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
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
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Search Results</p>

                    {searchTerm.trim().length < 2 ? (
                      <div className="text-sm text-gray-400">Type at least 2 characters to search.</div>
                    ) : isSearching ? (
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Searching...</span>
                      </div>
                    ) : searchResults.length === 0 ? (
                      <div className="text-sm text-gray-400">No matching resources found.</div>
                    ) : (
                      <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                        {searchResults.map((result) => (
                          <button
                            key={result.id}
                            type="button"
                            onClick={() => openSearchResult(result)}
                            className="cursor-pointer w-full flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors text-left"
                          >
                            <div className="mt-0.5">{getSearchIcon(result.kind)}</div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-200 truncate">{result.title}</p>
                              <p className="text-xs text-gray-500 truncate">{result.subtitle}</p>
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
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200 relative"
          >
            <Bell className="w-5 h-5 text-gray-400" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-[calc(100vw-1.5rem)] max-w-96 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4 border-b border-gray-800/50">
                  <h3 className="text-sm font-semibold text-gray-300">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="p-4 border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start space-x-3">
                        <div
                          className={`w-2 h-2 rounded-full mt-1.5 ${
                            notification.type === 'success' ? 'bg-green-500' : 'bg-yellow-500'
                          }`}
                        ></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-300">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-600 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-gray-800/30 text-center">
                  <button className="text-xs font-medium text-blue-400 hover:text-blue-300">
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
            className="flex items-center space-x-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="text-left hidden md:block">
              <p className="text-sm font-medium text-gray-300">{currentUser.full_name}</p>
              <p className="text-xs text-gray-500">{currentUser.email}</p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-56 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-3 border-b border-gray-800/50">
                  <p className="text-sm font-medium text-gray-300">{currentUser.full_name}</p>
                  <p className="text-xs text-gray-500">{currentUser.email}</p>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => handleNavigation('/profile')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Profile</span>
                  </button>
                  <button 
                    onClick={() => handleNavigation('/settings')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Settings</span>
                  </button>
                  <button 
                    onClick={() => handleNavigation('/help')}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-gray-800/50 rounded-lg transition-colors text-left"
                  >
                    <HelpCircle className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">Help & Support</span>
                  </button>
                </div>
                <div className="p-2 border-t border-gray-800/50">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-3 py-2 hover:bg-red-500/10 rounded-lg transition-colors text-left"
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
