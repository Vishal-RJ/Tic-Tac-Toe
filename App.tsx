
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, CellValue, Player } from './types.ts';
import { WIN_PATTERNS, INITIAL_BOMBS } from './constants.ts';
import { getAIMove } from './services/geminiService.ts';
import Cell from './components/Cell.tsx';

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    winningLine: null,
    bombs: { X: INITIAL_BOMBS, O: INITIAL_BOMBS },
    isAITurn: false,
    aiMessage: "Arena online. Make your move, user."
  });

  const [bombMode, setBombMode] = useState(false);
  const [explosion, setExplosion] = useState<number | null>(null);
  const [screenShake, setScreenShake] = useState(false);

  const checkWinner = (board: CellValue[]): { winner: Player | 'Draw' | null, line: number[] | null } => {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as Player, line: pattern };
      }
    }
    if (board.every(cell => cell !== null)) return { winner: 'Draw', line: null };
    return { winner: null, line: null };
  };

  const handleExplosion = (index: number) => {
    setExplosion(index);
    setScreenShake(true);
    setTimeout(() => {
      setExplosion(null);
      setScreenShake(false);
    }, 1000);
  };

  const playMove = useCallback((index: number, isBomb: boolean = false) => {
    if (game.winner || (game.isAITurn && game.currentPlayer === 'O')) return;
    
    const newBoard = [...game.board];
    
    if (isBomb) {
      if (game.bombs[game.currentPlayer] <= 0 || newBoard[index] === null || newBoard[index] === game.currentPlayer) return;
      handleExplosion(index);
      newBoard[index] = null;
    } else {
      if (newBoard[index] !== null) return;
      newBoard[index] = game.currentPlayer;
    }

    const { winner, line } = checkWinner(newBoard);
    const nextPlayer = game.currentPlayer === 'X' ? 'O' : 'X';
    
    setGame(prev => ({
      ...prev,
      board: newBoard,
      currentPlayer: nextPlayer,
      winner,
      winningLine: line,
      bombs: isBomb ? { ...prev.bombs, [prev.currentPlayer]: prev.bombs[prev.currentPlayer] - 1 } : prev.bombs,
      isAITurn: winner === null && nextPlayer === 'O',
    }));
    
    setBombMode(false);
  }, [game]);

  useEffect(() => {
    if (game.isAITurn && !game.winner) {
      const runAI = async () => {
        await new Promise(r => setTimeout(r, 800)); // Dramatic pause
        const aiData = await getAIMove(game.board, 'O', game.bombs.O, game.bombs.X);
        
        setGame(prev => {
          const newBoard = [...prev.board];
          let finalIndex = aiData.move;
          let finalIsBomb = aiData.isBomb && prev.bombs.O > 0;

          // AI Verification
          if (finalIsBomb) {
            if (newBoard[finalIndex] !== 'X') {
              finalIsBomb = false;
              finalIndex = newBoard.findIndex(c => c === null);
            }
          } else if (newBoard[finalIndex] !== null) {
            finalIndex = newBoard.findIndex(c => c === null);
          }

          if (finalIndex === -1) return { ...prev, isAITurn: false, currentPlayer: 'X' };

          if (finalIsBomb) {
            handleExplosion(finalIndex);
            newBoard[finalIndex] = null;
          } else {
            newBoard[finalIndex] = 'O';
          }

          const { winner, line } = checkWinner(newBoard);
          return {
            ...prev,
            board: newBoard,
            currentPlayer: 'X',
            winner,
            winningLine: line,
            bombs: finalIsBomb ? { ...prev.bombs, O: prev.bombs.O - 1 } : prev.bombs,
            isAITurn: false,
            aiMessage: aiData.commentary
          };
        });
      };
      runAI();
    }
  }, [game.isAITurn, game.winner]);

  const reset = () => {
    setGame({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      winningLine: null,
      bombs: { X: INITIAL_BOMBS, O: INITIAL_BOMBS },
      isAITurn: false,
      aiMessage: "Arena reset. Initiative: USER_X."
    });
    setBombMode(false);
  };

  return (
    <div className="min-h-screen bg-grid flex flex-col items-center justify-center p-6 select-none relative">
      {/* Visual background layers */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-900/10 via-transparent to-fuchsia-900/10 pointer-events-none" />
      
      <AnimatePresence>
        {screenShake && (
          <motion.div 
            initial={{ scale: 1 }}
            animate={{ x: [-5, 5, -5, 5, 0], y: [-5, 5, -5, 5, 0] }}
            className="fixed inset-0 bg-red-600/5 z-0 pointer-events-none"
          />
        )}
      </AnimatePresence>

      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 z-10"
      >
        <h1 className="text-6xl font-orbitron font-bold tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-600 mb-2 drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
          NEON BOMB
        </h1>
        <div className="flex items-center justify-center gap-4 text-slate-500 text-xs tracking-widest uppercase font-orbitron">
          <span className="w-8 h-[1px] bg-slate-800" />
          Tactical Grid System
          <span className="w-8 h-[1px] bg-slate-800" />
        </div>
      </motion.div>

      <div className="z-10 w-full max-w-sm">
        <div className="flex justify-between items-end mb-4 px-2">
          <div className={`transition-all duration-500 ${game.currentPlayer === 'X' ? 'scale-110' : 'opacity-40 grayscale'}`}>
            <p className="text-cyan-400 font-bold text-lg neon-cyan">USER_X</p>
            <div className="flex gap-1">
              {[...Array(INITIAL_BOMBS)].map((_, i) => (
                <span key={i} className={i < game.bombs.X ? 'text-lg opacity-100' : 'text-lg opacity-20 grayscale'}>💣</span>
              ))}
            </div>
          </div>
          <motion.div 
            key={game.aiMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel px-4 py-2 rounded-xl text-[10px] text-cyan-100 border-cyan-500/20 max-w-[140px] text-center"
          >
            {game.aiMessage}
          </motion.div>
          <div className={`transition-all duration-500 text-right ${game.currentPlayer === 'O' ? 'scale-110' : 'opacity-40 grayscale'}`}>
            <p className="text-fuchsia-400 font-bold text-lg neon-fuchsia">CORE_O</p>
            <div className="flex gap-1 justify-end">
              {[...Array(INITIAL_BOMBS)].map((_, i) => (
                <span key={i} className={i < game.bombs.O ? 'text-lg opacity-100' : 'text-lg opacity-20 grayscale'}>💣</span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative glass-panel p-4 rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border-slate-700/30 overflow-hidden">
          <div className="grid grid-cols-3 gap-3 relative z-10">
            {game.board.map((cell, i) => (
              <Cell
                key={i}
                value={cell}
                onClick={() => playMove(i, bombMode)}
                isWinningCell={game.winningLine?.includes(i) || false}
                isBombMode={bombMode}
              />
            ))}
          </div>

          <AnimatePresence>
            {explosion !== null && (
              <div 
                style={{
                  position: 'absolute',
                  top: `${Math.floor(explosion / 3) * 33.3 + 16.6}%`,
                  left: `${(explosion % 3) * 33.3 + 16.6}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                className="pointer-events-none z-50"
              >
                <motion.div initial={{ scale: 0 }} animate={{ scale: 4, opacity: 0 }} className="w-20 h-20 rounded-full bg-orange-500/40 mix-blend-screen" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 6, opacity: 0 }} className="absolute inset-0 w-20 h-20 rounded-full border-2 border-red-500" />
                <motion.div 
                  initial={{ y: 20, opacity: 1 }} 
                  animate={{ y: -60, opacity: 0 }} 
                  className="absolute inset-0 flex items-center justify-center font-orbitron font-bold text-red-500 italic text-2xl"
                >
                  DESTRUCT
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="mt-8 flex gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => game.bombs.X > 0 && setBombMode(!bombMode)}
            disabled={game.bombs.X === 0 || game.isAITurn || !!game.winner}
            className={`flex-1 py-4 rounded-2xl font-orbitron font-bold transition-all border-2 flex items-center justify-center gap-3
              ${bombMode ? 'bg-red-600 border-red-400 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)]' : 'glass-panel border-slate-700 text-slate-300'}
              ${(game.bombs.X === 0 || game.isAITurn || !!game.winner) ? 'opacity-20 cursor-not-allowed' : ''}
            `}
          >
            {bombMode ? "SELECT TARGET" : "TACTICAL BOMB"}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="px-6 py-4 rounded-2xl glass-panel border-slate-700 text-slate-300 font-orbitron hover:bg-slate-800 transition-colors"
          >
            REBOOT
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {game.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-6"
          >
            <motion.div
              initial={{ scale: 0.8, rotateX: 30 }}
              animate={{ scale: 1, rotateX: 0 }}
              className="glass-panel p-10 rounded-[3rem] border-slate-700 shadow-2xl text-center max-w-sm w-full"
            >
              <h2 className="text-5xl font-orbitron font-bold mb-6 tracking-widest text-white">
                {game.winner === 'Draw' ? "EQUILIBRIUM" : "DOMINANCE"}
              </h2>
              <div className={`text-8xl mb-8 ${game.winner === 'X' ? 'text-cyan-400' : 'text-fuchsia-400'}`}>
                {game.winner === 'X' ? "X" : game.winner === 'O' ? "O" : "="}
              </div>
              <p className="text-slate-400 mb-10 italic font-medium">
                {game.winner === 'X' ? "Biological persistence verified." : 
                 game.winner === 'O' ? "Synthetic logic is absolute." : 
                 "System in total deadlock."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={reset}
                className="w-full py-5 rounded-3xl font-orbitron font-bold bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-xl"
              >
                INITIALIZE RE-MATCH
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-slate-800 text-[10px] font-orbitron tracking-[0.5em] uppercase pointer-events-none">
        Arena Version 2.4.0 // Connection: Secure
      </footer>
    </div>
  );
};

export default App;
