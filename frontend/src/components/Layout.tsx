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
    <div className="min-h-screen flex flex-col md:flex-row bg-transparent relative z-10">
      {/* Sidebar Navigation */}
      <motion.aside 
        initial={{ x: -280 }}
        animate={{ x: 0 }}
        className="hidden md:flex flex-col w-72 glass-panel border-r border-white/5 h-screen sticky top-0"
      >
        <div className="p-8 flex items-center space-x-4 border-b border-white/5">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shadow-lg shadow-blue-500/20">
            <Cloud className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold glow-text tracking-tight">
            Nebula
          </span>
        </div>

        <nav className="flex-1 p-6 space-y-3">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-4 px-5 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="nav-active"
                    className="absolute inset-0 bg-blue-600/10 rounded-2xl border border-blue-500/20 shadow-[0_0_15px_rgba(37,99,235,0.1)]"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <item.icon className={`w-5 h-5 transition-transform duration-300 relative z-10 ${isActive ? 'text-blue-400 scale-110' : 'group-hover:scale-110 group-hover:text-blue-400'}`} />
                <span className="font-medium relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/5 bg-white/[0.02]">
          <div className="mb-6 flex items-center space-x-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 border border-white/10 flex items-center justify-center font-bold text-blue-400 shadow-inner">
               {user?.email?.[0].toUpperCase() || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
               <p className="text-sm font-semibold text-white truncate">{user?.email?.split('@')[0] || 'User'}</p>
               <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Pro Account</p>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center space-x-3 w-full px-5 py-3.5 rounded-2xl text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Header */}
      <div className="md:hidden glass-panel p-5 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center space-x-3">
           <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg">
            <Cloud className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl glow-text">Nebula</span>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 border border-white/10"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                 <Outlet />
              </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default Layout;
