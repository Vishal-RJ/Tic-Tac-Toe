
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CellValue } from '../types.ts';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  isWinningCell: boolean;
  isBombMode: boolean;
}

const Cell: React.FC<CellProps> = ({ value, onClick, isWinningCell, isBombMode }) => {
  return (
    <motion.button
      whileHover={{ scale: 0.96, backgroundColor: "rgba(30, 41, 59, 0.4)" }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`relative h-20 w-20 sm:h-28 sm:w-28 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center text-5xl font-orbitron overflow-hidden
        ${isWinningCell ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_25px_rgba(250,204,21,0.5)] z-20' : 'border-slate-800 bg-slate-900/40'}
        ${isBombMode && value && value !== 'X' ? 'border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-crosshair' : ''}
        ${isBombMode && (!value || value === 'X') ? 'opacity-40 cursor-not-allowed' : ''}
      `}
    >
      {/* Background scanline effect */}
      <div className="absolute inset-0 opacity-10 bg-gradient-to-b from-transparent via-white/10 to-transparent pointer-events-none animate-pulse" />

      <AnimatePresence mode='wait'>
        {value === 'X' && (
          <motion.div
            key="X"
            initial={{ scale: 0, rotate: -90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-cyan-400 neon-cyan"
          >
            X
          </motion.div>
        )}
        {value === 'O' && (
          <motion.div
            key="O"
            initial={{ scale: 0, rotate: 90, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-fuchsia-400 neon-fuchsia"
          >
            O
          </motion.div>
        )}
      </AnimatePresence>

      {isBombMode && value && value !== 'X' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.6, 0.2] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-red-600/20"
        />
      )}
    </motion.button>
  );
};

export default Cell;
