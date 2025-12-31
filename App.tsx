
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameState, CellValue, Player } from './types';
import { WIN_PATTERNS, INITIAL_BOMBS } from './constants';
import { getAIMove } from './services/geminiService';
import Cell from './components/Cell';

const App: React.FC = () => {
  const [game, setGame] = useState<GameState>({
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    winningLine: null,
    bombs: { X: INITIAL_BOMBS, O: INITIAL_BOMBS },
    isAITurn: false,
    aiMessage: "Your move, human. Don't take all day."
  });

  const [bombMode, setBombMode] = useState(false);
  const [explosion, setExplosion] = useState<number | null>(null);

  const checkWinner = (board: CellValue[]): { winner: Player | 'Draw' | null, line: number[] | null } => {
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return { winner: board[a] as Player, line: pattern };
      }
    }
    if (board.every(cell => cell !== null)) {
      return { winner: 'Draw', line: null };
    }
    return { winner: null, line: null };
  };

  const playMove = useCallback((index: number, isBomb: boolean = false) => {
    if (game.winner || game.isAITurn) return;
    
    const newBoard = [...game.board];
    
    // Validations
    if (!isBomb && newBoard[index] !== null) return;
    if (isBomb) {
      if (game.bombs[game.currentPlayer] <= 0) return;
      if (newBoard[index] === null || newBoard[index] === game.currentPlayer) return;
      
      // Trigger explosion animation
      setExplosion(index);
      setTimeout(() => setExplosion(null), 600);
      
      // Clear the cell
      newBoard[index] = null;
    } else {
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
      bombs: isBomb 
        ? { ...prev.bombs, [prev.currentPlayer]: prev.bombs[prev.currentPlayer] - 1 }
        : prev.bombs,
      isAITurn: winner === null && nextPlayer === 'O',
      aiMessage: winner ? prev.aiMessage : (isBomb ? "A BOMB? That's desperate!" : prev.aiMessage)
    }));
    
    setBombMode(false);
  }, [game]);

  // AI Logic
  useEffect(() => {
    if (game.isAITurn && !game.winner) {
      const timer = setTimeout(async () => {
        const aiData = await getAIMove(game.board, 'O', game.bombs.X);
        
        // Simple AI move execution (AI doesn't use bombs for now to keep it fair, or we can add it)
        const moveIndex = aiData.move;
        
        setGame(prev => {
          const newBoard = [...prev.board];
          // If suggested move is occupied (AI logic error or edge case), find first empty
          const finalIndex = newBoard[moveIndex] === null ? moveIndex : newBoard.findIndex(c => c === null);
          
          if (finalIndex === -1) return prev;

          newBoard[finalIndex] = 'O';
          const { winner, line } = checkWinner(newBoard);
          
          return {
            ...prev,
            board: newBoard,
            currentPlayer: 'X',
            winner,
            winningLine: line,
            isAITurn: false,
            aiMessage: aiData.commentary
          };
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [game.isAITurn, game.board, game.winner, game.bombs.X]);

  const resetGame = () => {
    setGame({
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      winningLine: null,
      bombs: { X: INITIAL_BOMBS, O: INITIAL_BOMBS },
      isAITurn: false,
      aiMessage: "New game? I'll go easy on you... maybe."
    });
    setBombMode(false);
    setExplosion(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

      {/* Header */}
      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center mb-8 z-10"
      >
        <h1 className="text-4xl sm:text-6xl font-orbitron font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500 mb-2">
          NEON BOMB
        </h1>
        <p className="text-slate-400 font-medium">ULTIMATE TIC-TAC-TOE EXPERIENCE</p>
      </motion.div>

      {/* AI Message Bubble */}
      <AnimatePresence mode="wait">
        <motion.div
          key={game.aiMessage}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="mb-8 px-6 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl shadow-xl max-w-xs text-center relative z-10"
        >
          <p className="text-sm italic text-slate-300">"{game.aiMessage}"</p>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-800 border-r border-b border-slate-700 rotate-45" />
        </motion.div>
      </AnimatePresence>

      {/* Game Board Container */}
      <div className="relative z-10">
        <div className="grid grid-cols-3 gap-3 sm:gap-4 p-4 bg-slate-900/40 rounded-3xl border border-slate-800 backdrop-blur-md shadow-2xl">
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

        {/* Explosion Effect Overlay */}
        <AnimatePresence>
          {explosion !== null && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 2, 2.5], opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                position: 'absolute',
                top: `${Math.floor(explosion / 3) * 33 + 16.5}%`,
                left: `${(explosion % 3) * 33 + 16.5}%`,
                transform: 'translate(-50%, -50%)',
              }}
              className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-r from-orange-500 to-red-600 pointer-events-none z-50 flex items-center justify-center text-4xl"
            >
              💥
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-8 flex flex-col items-center gap-6 w-full max-w-md z-10">
        <div className="flex justify-between w-full items-center">
          <div className={`p-4 rounded-2xl border transition-all ${game.currentPlayer === 'X' ? 'border-blue-500 bg-blue-500/10 neon-border-blue' : 'border-slate-800 bg-slate-900/50'}`}>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Player X</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-orbitron text-blue-400">Human</span>
              <div className="h-6 w-px bg-slate-700" />
              <div className="flex gap-1">
                {[...Array(INITIAL_BOMBS)].map((_, i) => (
                  <span key={i} className={i < game.bombs.X ? "grayscale-0" : "grayscale opacity-20"}>💣</span>
                ))}
              </div>
            </div>
          </div>

          <div className="text-2xl font-orbitron text-slate-600">VS</div>

          <div className={`p-4 rounded-2xl border transition-all ${game.currentPlayer === 'O' ? 'border-pink-500 bg-pink-500/10 neon-border-pink' : 'border-slate-800 bg-slate-900/50'}`}>
            <p className="text-xs uppercase tracking-widest text-slate-400 mb-1">Player O</p>
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                {[...Array(INITIAL_BOMBS)].map((_, i) => (
                  <span key={i} className={i < game.bombs.O ? "grayscale-0" : "grayscale opacity-20"}>💣</span>
                ))}
              </div>
              <div className="h-6 w-px bg-slate-700" />
              <span className="text-2xl font-orbitron text-pink-400">Gemini</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 w-full">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (game.bombs[game.currentPlayer] > 0) {
                setBombMode(!bombMode);
              }
            }}
            disabled={game.bombs[game.currentPlayer] <= 0 || game.isAITurn || !!game.winner}
            className={`flex-1 py-4 rounded-xl font-bold font-orbitron border transition-all flex items-center justify-center gap-2
              ${bombMode ? 'bg-red-500 border-red-400 text-white shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}
              ${(game.bombs[game.currentPlayer] <= 0 || game.isAITurn || !!game.winner) ? 'opacity-30 cursor-not-allowed' : ''}
            `}
          >
            {bombMode ? "SELECT TARGET" : "USE BOMB"} 💣
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={resetGame}
            className="flex-1 py-4 rounded-xl font-bold font-orbitron bg-slate-100 text-slate-900 border border-white hover:bg-white transition-all shadow-xl"
          >
            RESET GAME
          </motion.button>
        </div>
      </div>

      {/* Game Over Modal */}
      <AnimatePresence>
        {game.winner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl text-center max-w-sm w-full"
            >
              <h2 className="text-5xl font-orbitron font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500">
                {game.winner === 'Draw' ? "DRAW!" : `${game.winner} WINS!`}
              </h2>
              <p className="text-slate-400 mb-8 font-medium">
                {game.winner === 'X' ? "Humanity lives to play another day." : 
                 game.winner === 'O' ? "Better luck next time, fleshy creature." : 
                 "A perfect match of wits."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={resetGame}
                className="w-full py-4 rounded-xl font-bold font-orbitron bg-blue-500 text-white hover:bg-blue-400 transition-all shadow-[0_0_20px_rgba(59,130,246,0.4)]"
              >
                PLAY AGAIN
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-12 text-slate-600 text-xs font-medium tracking-widest uppercase">
        Powered by Gemini • Designed for Victory
      </footer>
    </div>
  );
};

export default App;
