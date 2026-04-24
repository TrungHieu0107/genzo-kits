import React from 'react';
import { motion } from 'framer-motion';
import { fs } from '../../../hooks/useFontSize';

export const ProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  return (
    <div className="h-[2px] w-full bg-transparent overflow-hidden relative z-50">
      {isLoading && (
        <>
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2"
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-blue-500/20 blur-[4px]"
          />
        </>
      )}
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-hidden h-full bg-[#1e1e1e]">
      <div className="w-full h-9 bg-[#252526] border-b border-gray-800 flex items-center px-4 gap-4">
        {[100, 150, 200, 250].map((w, i) => (
          <div key={i} style={{ width: w }} className="h-3 bg-gray-800/50 rounded animate-pulse" />
        ))}
      </div>
      <div className="divide-y divide-gray-800/30">
        {[...Array(15)].map((_, i) => (
          <div key={i} className="flex items-center px-4 py-3 gap-4 group">
            <div className="w-8 h-3 bg-gray-800/30 rounded animate-pulse" />
            <div className="w-32 h-3 bg-blue-500/10 rounded animate-pulse" />
            <div className="w-48 h-3 bg-gray-800/20 rounded animate-pulse" />
            <div className="flex-1 h-3 bg-gray-800/10 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const MasterLoader: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-50 bg-[#1e1e1e]/60 backdrop-blur-[6px]">
      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="w-20 h-20 rounded-full border-2 border-transparent border-t-blue-500/40 border-r-blue-500/10"
        />
        
        {/* Inner Core */}
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 m-auto w-8 h-8 bg-blue-500 rounded-full blur-[10px]"
        />
        
        {/* Scanning Line */}
        <motion.div
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-0 w-full h-[1px] bg-blue-400 shadow-[0_0_8px_#3b82f6] z-10"
        />
      </div>
      
      <div className="mt-8 flex flex-col items-center gap-1">
        <motion.span 
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          style={fs.nano} 
          className="text-blue-400 font-black tracking-[0.3em] uppercase"
        >
          Analyzing Structure
        </motion.span>
        <span style={fs.nano} className="text-gray-500 font-medium uppercase tracking-widest">
          Optimizing Virtual Grid
        </span>
      </div>
      
      {/* Decorative Matrix Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-10">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -100 }}
            animate={{ y: 1000 }}
            transition={{ duration: Math.random() * 5 + 5, repeat: Infinity, ease: "linear", delay: Math.random() * 5 }}
            className="absolute text-[8px] font-mono text-blue-500 whitespace-nowrap"
            style={{ left: `${i * 10}%` }}
          >
            {Math.random().toString(36).substring(2, 15)}
          </motion.div>
        ))}
      </div>
    </div>
  );
};
