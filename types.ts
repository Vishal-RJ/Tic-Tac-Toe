
export type Player = 'X' | 'O';
export type CellValue = Player | null;

export interface GameState {
  board: CellValue[];
  currentPlayer: Player;
  winner: Player | 'Draw' | null;
  winningLine: number[] | null;
  bombs: {
    X: number;
    O: number;
  };
  isAITurn: boolean;
  aiMessage: string;
}

export interface AIResponse {
  move: number;
  isBomb: boolean;
  commentary: string;
}
