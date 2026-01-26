import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Cloud, LayoutDashboard, LogOut, Settings, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const { logout, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Resources', path: '/resources', icon: Cloud },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-64 glass-panel border-r border-gray-800 h-screen sticky top-0"
      >
        <div className="p-6 flex items-center space-x-3 border-b border-gray-800/50">
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
            Nebula
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                location.pathname === item.path 
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' 
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${location.pathname === item.path ? 'text-blue-400' : 'group-hover:text-white'}`} />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800/50">
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden glass-panel p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-2">
           <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-1.5 rounded-lg">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg">Nebula</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
               <Outlet />
            </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Layout;
