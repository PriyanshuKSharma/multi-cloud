import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  FolderKanban,
  Server,
  Database,
  Network,
  Rocket,
  DollarSign,
  Cloud,
  Activity,
  FileCode,
  Terminal,
  Settings,
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

const Sidebar: React.FC = () => {
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
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      name: 'Projects',
      path: '/projects',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      name: 'Resources',
      path: '/resources',
      icon: <Server className="w-5 h-5" />,
      children: [
        {
          name: 'Virtual Machines',
          path: '/resources/vms',
          icon: <Server className="w-4 h-4" />,
        },
        {
          name: 'Storage',
          path: '/resources/storage',
          icon: <Database className="w-4 h-4" />,
        },
        {
          name: 'Networks',
          path: '/resources/networks',
          icon: <Network className="w-4 h-4" />,
        },
      ],
    },
    {
      name: 'Deployments',
      path: '/deployments',
      icon: <Rocket className="w-5 h-5" />,
      badge: deploymentCount,
    },
    {
      name: 'Cost & Billing',
      path: '/billing',
      icon: <DollarSign className="w-5 h-5" />,
    },
    {
      name: 'Cloud Accounts',
      path: '/accounts',
      icon: <Cloud className="w-5 h-5" />,
    },
    {
      name: 'Activity',
      path: '/activity',
      icon: <Activity className="w-5 h-5" />,
    },
    {
      name: 'Cloud Console',
      path: '/console',
      icon: <Terminal className="w-5 h-5" />,
    },
    {
      name: 'Blueprints',
      path: '/blueprints',
      icon: <FileCode className="w-5 h-5" />,
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: <Settings className="w-5 h-5" />,
    },
  ];

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) =>
      prev.includes(name) ? prev.filter((g) => g !== name) : [...prev, name]
    );
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 bg-[#0f0f11] border-r border-gray-800/50 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-800/50">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">Nebula</h1>
            <p className="text-xs text-gray-500">Multi-Cloud Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.name}>
            {item.children ? (
              // Group with children
              <div>
                <button
                  onClick={() => toggleGroup(item.name)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.icon}
                    <span>{item.name}</span>
                  </div>
                  {expandedGroups.includes(item.name) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>

                <AnimatePresence>
                  {expandedGroups.includes(item.name) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-6 mt-1 space-y-1 border-l border-gray-800/50 pl-3">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                              isActive(child.path)
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                            }`}
                          >
                            {child.icon}
                            <span>{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              // Single item
              <Link
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-500/10 text-blue-400'
                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-xs font-semibold bg-blue-500/20 text-blue-400 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800/50">
        <div className="px-3 py-2 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg border border-blue-500/20">
          <p className="text-xs font-medium text-gray-400">Need help?</p>
          <Link
            to="/docs"
            className="text-sm font-semibold text-blue-400 hover:text-blue-300 transition-colors"
          >
            View Documentation →
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
