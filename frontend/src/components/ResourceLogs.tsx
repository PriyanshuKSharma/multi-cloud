import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Copy, Check, Shield } from 'lucide-react';

interface ResourceLogsProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string;
  resourceName: string;
}

const ResourceLogs: React.FC<ResourceLogsProps> = ({ isOpen, onClose, logs, resourceName }) => {
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, logs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(logs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl" onClick={onClose}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-full max-w-4xl glass-panel rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-transparent" />
            
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-white/[0.02]">
              <div className="flex items-center space-x-5">
                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex items-center justify-center">
                  <Terminal className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tighter">Operational Telemetry</h3>
                  <div className="flex items-center space-x-2 mt-1">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{resourceName}</span>
                      <span className="w-1 h-1 rounded-full bg-white/10" />
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Live Uplink</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                 <button 
                  onClick={copyToClipboard}
                  className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl text-gray-400 hover:text-white transition-all group scale-90"
                  title="Copy Logs"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                </button>
                <button 
                  onClick={onClose}
                  className="p-3 bg-white/5 hover:bg-red-500 hover:text-white rounded-2xl text-gray-400 transition-all scale-90"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Logs Area */}
            <div className="flex-1 overflow-auto bg-[#030303]/80 p-8 font-mono text-[13px] leading-relaxed custom-scrollbar">
              {logs ? (
                <pre className="text-blue-100/80 whitespace-pre-wrap break-all">
                  {logs.split('\n').map((line, i) => (
                    <div key={i} className="hover:bg-white/[0.03] px-3 py-0.5 rounded-lg -mx-3 transition-colors border-l-2 border-transparent hover:border-blue-500/30">
                      <span className="text-gray-700 select-none mr-4 text-[10px] font-black w-8 inline-block">{(i + 1).toString().padStart(3, '0')}</span>
                      {line}
                    </div>
                  ))}
                </pre>
              ) : (
                  <div className="flex flex-col items-center justify-center h-64 space-y-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
                        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-blue-400/50" />
                      </div>
                      <p className="text-gray-500 font-bold uppercase tracking-widest text-[10px]">Synchronizing with Nebula Node...</p>
                  </div>
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Footer */}
            <div className="p-4 bg-white/[0.02] border-t border-white/5 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-gray-600">
                    <Shield size={12} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Validated System Output</span>
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ResourceLogs;
