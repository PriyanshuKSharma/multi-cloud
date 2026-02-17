import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Terminal, Copy, Check } from 'lucide-react';
import { normalizeLogText } from '../utils/terraformOutput';

interface ResourceLogsProps {
  isOpen: boolean;
  onClose: () => void;
  logs: string;
  resourceName: string;
}

const ResourceLogs: React.FC<ResourceLogsProps> = ({ isOpen, onClose, logs, resourceName }) => {
  const [copied, setCopied] = React.useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  const formattedLogs = React.useMemo(() => normalizeLogText(logs), [logs]);

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, formattedLogs]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(formattedLogs);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-3xl glass-card rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-700/50 bg-gray-900/50">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gray-800 rounded-lg border border-gray-700">
                <Terminal className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-mono font-bold text-white">Console Output</h3>
                <p className="text-xs text-gray-400">Resource: {resourceName}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <button 
                onClick={copyToClipboard}
                className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Copy Logs"
              >
                {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
              </button>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Logs Area */}
          <div className="flex-1 overflow-auto bg-[#0d1117] p-4 font-mono text-sm leading-relaxed">
            {formattedLogs ? (
              <pre className="text-gray-300 whitespace-pre-wrap break-all">
                {formattedLogs.split('\n').map((line, i) => (
                  <div key={i} className="hover:bg-gray-800/30 px-2 rounded -mx-2">
                    <span className="text-gray-600 select-none mr-3 text-xs">{(i + 1).toString().padStart(3, ' ')}</span>
                    {line}
                  </div>
                ))}
              </pre>
            ) : (
                <div className="flex flex-col items-center justify-center h-40 text-gray-500 space-y-2">
                    <div className="w-2 h-2 rounded-full bg-gray-600 animate-ping" />
                    <p>Waiting for logs...</p>
                </div>
            )}
            <div ref={logsEndRef} />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ResourceLogs;
