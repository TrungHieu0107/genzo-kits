import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const GIT_STATUSES = [
  "INITIALIZING REPOSITORY...",
  "SCANNING BINARY TREE...",
  "RESOLVING OID HASHES...",
  "MAPPING DELTA CHAIN...",
  "INDEXING BLOBS...",
  "VERIFYING PACKFILE...",
  "COMPUTING GRAPH EDGES...",
  "READYING VIRTUAL DOM..."
];

export const ProgressBar: React.FC<{ isLoading: boolean }> = ({ isLoading }) => {
  return (
    <div className="h-[2px] w-full bg-transparent overflow-hidden relative z-50">
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500 to-transparent w-1/2"
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export const TableSkeleton: React.FC = () => {
  return (
    <div className="flex-1 overflow-hidden h-full bg-[#0F0F10] p-6">
      <div className="flex flex-col gap-4">
        <div className="h-10 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
        <div className="flex gap-4">
          <div className="w-1/4 h-8 bg-white/5 rounded-md animate-pulse" />
          <div className="w-1/2 h-8 bg-white/5 rounded-md animate-pulse" />
          <div className="w-1/4 h-8 bg-white/5 rounded-md animate-pulse" />
        </div>
        <div className="space-y-3 mt-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="flex gap-4 items-center opacity-50">
              <div className="w-4 h-4 bg-white/10 rounded" />
              <div className="flex-1 h-4 bg-white/5 rounded" />
              <div className="w-24 h-4 bg-white/5 rounded" />
              <div className="w-16 h-4 bg-white/5 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MasterLoader: React.FC = () => {
  const [matrixCols, setMatrixCols] = useState<{ left: string, delay: number, duration: number, chars: string[] }[]>([]);

  useEffect(() => {
    const cols = Array.from({ length: 15 }).map(() => ({
      left: `${Math.random() * 100}%`,
      delay: Math.random() * 2,
      duration: 3 + Math.random() * 4,
      chars: Array.from({ length: 20 }).map(() => Math.floor(Math.random() * 2).toString())
    }));
    setMatrixCols(cols);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center z-[100] bg-[#0A0A0B]/90 backdrop-blur-md overflow-hidden">
      
      {/* ── BACKGROUND MATRIX ── */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        {matrixCols.map((col, i) => (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center"
            style={{ left: col.left, fontFamily: 'monospace', fontSize: '0.7rem', lineHeight: '14px' }}
            initial={{ y: -300 }}
            animate={{ y: '110vh' }}
            transition={{ duration: col.duration, repeat: Infinity, ease: 'linear', delay: col.delay }}
          >
            {col.chars.map((c, j) => (
              <span key={j} style={{ color: j === 0 ? '#ffffff' : '#00d4ff', opacity: 1 - j / 20 }}>
                {c}
              </span>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Corner targeting brackets */}
      {[
        { top: 24, left: 24,     transform: 'rotate(0deg)'   },
        { top: 24, right: 24,    transform: 'rotate(90deg)'  },
        { bottom: 24, right: 24, transform: 'rotate(180deg)' },
        { bottom: 24, left: 24,  transform: 'rotate(270deg)' },
      ].map((style, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ ...style, width: 32, height: 32 } as React.CSSProperties}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, delay: i * 0.2 }}
        >
          <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 16 L0 0 L16 0" stroke="#00d4ff" strokeWidth="1.5" strokeLinecap="square" />
          </svg>
        </motion.div>
      ))}

      {/* ── ORBITAL SYSTEM ── */}
      <div className="relative" style={{ width: 220, height: 220 }}>

        {/* Outer pulse ring */}
        <motion.div
          className="absolute rounded-full border border-blue-500/10"
          style={{ inset: -20 }}
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity }}
        />

        {/* Rotating outer ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: 0,
            border: '1px solid rgba(0,212,255,0.1)',
            borderTopColor: 'rgba(0,212,255,0.6)',
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <div className="absolute top-[-3px] left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_12px_#00d4ff]" />
        </motion.div>

        {/* Middle ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            inset: 30,
            border: '1px solid rgba(59,130,246,0.1)',
            borderBottomColor: 'rgba(59,130,246,0.4)',
          }}
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
        />

        {/* Hexagon Core */}
        <motion.svg
          className="absolute inset-0 m-auto w-32 h-32"
          viewBox="0 0 100 100"
          animate={{ rotate: [0, 60, 60, 120, 120, 180, 180, 240, 240, 300, 300, 360] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        >
          <polygon
            points="50,5 90,25 90,75 50,95 10,75 10,25"
            fill="none"
            stroke="url(#grad1)"
            strokeWidth="0.5"
            strokeDasharray="4 4"
          />
          <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2" />
            </linearGradient>
          </defs>
        </motion.svg>

        {/* Inner core pulse */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="w-12 h-12 rounded-full bg-blue-500/20 blur-xl"
            animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.span
            className="font-mono text-[1.1rem] font-black text-blue-400 tracking-tighter"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            GZ-KIT
          </motion.span>
        </div>
      </div>

      {/* ── STATUS PANEL ── */}
      <div className="mt-12 flex flex-col items-center gap-2 relative z-10">
        <motion.span
          className="text-[0.85rem] font-black tracking-[0.4em] text-blue-400 uppercase"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          System Analysis
        </motion.span>

        <div className="h-[14px] overflow-hidden flex flex-col items-center">
          <motion.div
            animate={{ y: GIT_STATUSES.map((_, i) => `-${i * 14}px`) }}
            transition={{
              duration: GIT_STATUSES.length * 2,
              repeat: Infinity,
              ease: "easeInOut",
              times: GIT_STATUSES.map((_, i) => i / GIT_STATUSES.length)
            }}
          >
            {GIT_STATUSES.map((status, i) => (
              <div key={i} className="h-[14px] flex items-center justify-center">
                <span className="text-[0.7rem] font-mono text-gray-500 uppercase tracking-widest">
                  {status}
                </span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Terminal Line */}
        <div className="flex items-center gap-2 mt-4 px-3 py-1 bg-white/5 rounded border border-white/5">
          <span className="text-[0.62rem] font-mono text-gray-600">admin@genzo:~$</span>
          <span className="text-[0.62rem] font-mono text-blue-500/70">task --execute xml-filter</span>
          <motion.div 
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity }}
            className="w-1.5 h-3 bg-blue-500/50"
          />
        </div>
      </div>
    </div>
  );
};
