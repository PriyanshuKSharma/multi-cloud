import React from 'react';
import { Search, Bell, User, ChevronDown, Settings, LogOut, HelpCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import axios from '../../api/axios';

import { useNavigate } from 'react-router-dom';

const Topbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  const { data: profileUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => (await axios.get('/auth/me')).data,
    retry: 1,
  });

  const currentUser = profileUser || user || {
    full_name: 'Admin User',
    email: 'admin@cloudorch.com'
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setShowUserMenu(false);
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
    <header className="h-16 bg-[#0f0f11] border-b border-gray-800/50 flex items-center justify-between px-6 sticky top-0 z-40">
      {/* Left: Project Selector */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <button className="flex items-center space-x-2 px-4 py-2 bg-gray-800/50 hover:bg-gray-800 rounded-lg border border-gray-700/50 transition-all duration-200">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-gray-300">Production</span>
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Right: Search, Notifications, User */}
      <div className="flex items-center space-x-3">
        {/* Global Search */}
        <div className="relative">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-gray-800/50 rounded-lg transition-all duration-200 relative"
          >
            <Search className="w-5 h-5 text-gray-400" />
          </button>

          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute right-0 mt-2 w-96 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
              >
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search resources, deployments..."
                      className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      autoFocus
                    />
                  </div>
                  <div className="mt-4 space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Recent Searches</p>
                    <div className="text-sm text-gray-400">No recent searches</div>
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
                className="absolute right-0 mt-2 w-96 bg-[#1a1a1d] border border-gray-800/50 rounded-xl shadow-2xl overflow-hidden"
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
