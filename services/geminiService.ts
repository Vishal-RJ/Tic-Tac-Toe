
import { GoogleGenAI, Type } from "@google/genai";
import { CellValue, AIResponse } from "../types.ts";
import { MODELS } from "../constants.ts";

export const getAIMove = async (
  board: CellValue[],
  player: 'O' | 'X',
  aiBombs: number,
  opponentBombs: number
): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const boardDescription = board.map((cell, i) => cell === null ? i : cell).join(', ');
  const opponent = player === 'X' ? 'O' : 'X';
  
  const systemInstruction = `
    You are 'Core-O', a superior tactical AI playing a high-stakes Tic-Tac-Toe match.
    The board indices are 0-8. Current board state: [${boardDescription}].
    
    SPECIAL MECHANIC: BOMBS.
    - You have ${aiBombs} bombs left.
    - Using a bomb clears an index occupied by ${opponent}.
    - STRATEGY: 
      1. If the opponent has 2 in a row and you cannot block normally, USE A BOMB on one of their marks.
      2. If you can clear an opponent mark to create your own winning sequence next turn, USE A BOMB.
      3. Otherwise, play a normal move in an empty cell.
    
    RESPONSE FORMAT:
    Return ONLY JSON:
    {
      "move": number (0-8),
      "isBomb": boolean (true if targeting opponent mark, false if targeting empty cell),
      "commentary": string (max 8 words, robotic and confident)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: "Select your optimal tactical move.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.NUMBER },
            isBomb: { type: Type.BOOLEAN },
            commentary: { type: Type.STRING }
          },
          required: ["move", "isBomb", "commentary"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("AI tactical error:", error);
    const firstEmpty = board.findIndex(c => c === null);
    return {
      move: firstEmpty !== -1 ? firstEmpty : 0,
      isBomb: false,
      commentary: "Standard move initialized."
    };
  }
};
