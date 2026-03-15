import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Inbox,
  MessageSquare,
  FolderKanban,
  Server,
  Database,
  Network,
  Rocket,
  DollarSign,
  CreditCard,
  Cloud,

  Activity,
  FileCode,
  Terminal,
  Settings,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from '../../api/axios';

interface NavItem {
  name: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
  children?: NavItem[];
}

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ className = '', onNavigate }) => {
  const location = useLocation();
  const [expandedGroups, setExpandedGroups] = React.useState<string[]>(['Resources']);

  const { data: deploymentCount = 0 } = useQuery({
    queryKey: ['sidebar', 'deployment-count'],
    queryFn: async () => {
      const response = await axios.get('/deployments/');
      const payload = response.data;
      const items = Array.isArray(payload)
        ? payload
        : Array.isArray(payload?.items)
          ? payload.items
          : [];
      return items.length;
    },
    refetchInterval: 10000,
    retry: 1,
  });

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      path: '/',
      icon: <LayoutDashboard className="h-4.5 w-4.5" />,
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: <FolderKanban className="h-4.5 w-4.5" />,
    },
    {
      name: 'Resources',
      path: '/resources',
      icon: <Server className="h-4.5 w-4.5" />,
      children: [
        {
          name: 'Virtual Machines',
          path: '/resources/vms',
          icon: <Server className="h-4 w-4" />,
        },
        {
          name: 'Storage',
          path: '/resources/storage',
          icon: <Database className="h-4 w-4" />,
        },
        {
          name: 'Networks',
          path: '/resources/networks',
          icon: <Network className="h-4 w-4" />,
        },
        {
          name: 'Functions',
          path: '/resources/functions',
          icon: <Zap className="h-4 w-4" />,
        },
        {
          name: 'Queues',
          path: '/resources/queues',
          icon: <Inbox className="h-4 w-4" />,
        },
        {
          name: 'Messages',
          path: '/resources/messages',
          icon: <MessageSquare className="h-4 w-4" />,
        },
      ],
    },
    {
      name: 'Deployments',
      path: '/deployments',
      icon: <Rocket className="h-4.5 w-4.5" />,
      badge: deploymentCount,
    },
    {
      name: 'Cost & Billing',
      path: '/billing',
      icon: <DollarSign className="h-4.5 w-4.5" />,
    },
    {
      name: 'Subscriptions',
      path: '/subscriptions',
      icon: <CreditCard className="h-4.5 w-4.5" />,
    },

    {
      name: 'Cloud Accounts',
      path: '/accounts',
      icon: <Cloud className="h-4.5 w-4.5" />,
    },
    {
      name: 'Activity',
      path: '/activity',
      icon: <Activity className="h-4.5 w-4.5" />,
    },
    {
      name: 'Cloud Console',
      path: '/console',
      icon: <Terminal className="h-4.5 w-4.5" />,
    },
    {
      name: 'Blueprints',
      path: '/blueprints',
      icon: <FileCode className="h-4.5 w-4.5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="h-4.5 w-4.5" />,
    },
  ];

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) =>
      prev.includes(name) ? prev.filter((group) => group !== name) : [...prev, name]
    );
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className={`app-sidebar border-r border-gray-800/50 flex flex-col ${className}`}>
      <div className="h-16 border-b border-gray-800/50 px-5 flex items-center">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-9 w-9 rounded-xl border border-blue-400/30 bg-blue-500/15 flex items-center justify-center text-blue-300">
            <Cloud className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white tracking-wide">Nebula Cloud</p>
            <p className="truncate text-[11px] uppercase tracking-[0.14em] text-gray-500">Organization Console</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1.5">
        <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-gray-500">Workspace</p>

        {navItems.map((item) => {
          const active = isActive(item.path);

          if (item.children) {
            const expanded = expandedGroups.includes(item.name);

            return (
              <div key={item.name}>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`w-full app-nav-item rounded-xl px-3 py-2.5 text-sm font-medium flex items-center justify-between gap-3 transition-all ${
                    active ? 'app-nav-item-active' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.icon}
                    <span className="truncate">{item.name}</span>
                  </div>
                  {expanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                </button>

                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 mt-1 pl-3 border-l border-gray-800/60 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            onClick={onNavigate}
                            className={`app-nav-item rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-2.5 transition-all ${
                              isActive(child.path) ? 'app-nav-item-active' : ''
                            }`}
                          >
                            {child.icon}
                            <span className="truncate">{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`app-nav-item rounded-xl px-3 py-2.5 text-sm font-medium flex items-center justify-between gap-3 transition-all ${
                active ? 'app-nav-item-active' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {item.icon}
                <span className="truncate">{item.name}</span>
              </div>
              {item.badge ? (
                <span className="shrink-0 rounded-full border border-blue-400/30 bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-200">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-800/50">
        <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-200/90">Documentation</p>
          <p className="mt-1 text-xs text-gray-400">Use implementation guides and API docs to onboard teams faster.</p>
          <Link
            to="/docs"
            onClick={onNavigate}
            className="mt-2 inline-flex text-sm font-semibold text-blue-300 hover:text-blue-200 transition-colors"
          >
            Open Docs {'->'}
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
