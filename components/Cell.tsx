
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CellValue } from '../types';

interface CellProps {
  value: CellValue;
  onClick: () => void;
  isWinningCell: boolean;
  isBombMode: boolean;
}

const Cell: React.FC<CellProps> = ({ value, onClick, isWinningCell, isBombMode }) => {
  return (
    <motion.button
      whileHover={{ scale: 0.98, backgroundColor: "rgba(30, 41, 59, 0.8)" }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative h-24 w-24 sm:h-32 sm:w-32 rounded-xl border-2 transition-all duration-300 flex items-center justify-center text-5xl font-orbitron
        ${isWinningCell ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_20px_rgba(250,204,21,0.4)]' : 'border-slate-700 bg-slate-800/50'}
        ${isBombMode && !value ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        ${isBombMode && value ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}
      `}
    >
      <AnimatePresence mode='wait'>
        {value === 'X' && (
          <motion.div
            key="X"
            initial={{ scale: 0, rotate: -45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-blue-400 neon-text-blue"
          >
            X
          </motion.div>
        )}
        {value === 'O' && (
          <motion.div
            key="O"
            initial={{ scale: 0, rotate: 45, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="text-pink-400 neon-text-pink"
          >
            O
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bomb indicator if hovering in bomb mode over an opponent's cell */}
      {isBombMode && value && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-red-500/20 rounded-xl"
        >
          <span className="text-xl">💣</span>
        </motion.div>
      )}
    </motion.button>
  );
};

export default Cell;
