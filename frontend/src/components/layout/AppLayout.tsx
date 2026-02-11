import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const AppLayout: React.FC = () => {
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);

  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  React.useEffect(() => {
    if (!isMobileSidebarOpen) {
      document.body.style.overflow = '';
      return;
    }
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-[#0a0a0c] overflow-hidden">
      {/* Sidebar */}
      <Sidebar className="hidden lg:flex w-64 h-screen sticky top-0 shrink-0" />

      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 360, damping: 35 }}
            >
              <Sidebar
                className="w-full h-full"
                onNavigate={() => setIsMobileSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <Topbar onOpenSidebar={() => setIsMobileSidebarOpen(true)} />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#0a0a0c]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
