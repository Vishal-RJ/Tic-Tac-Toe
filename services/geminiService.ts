
import { GoogleGenAI, Type } from "@google/genai";
import { CellValue, AIResponse } from "../types";
import { MODELS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getAIMove = async (
  board: CellValue[],
  player: 'O' | 'X',
  opponentBombs: number
): Promise<AIResponse> => {
  const boardStr = board.map((cell, i) => cell || i).join(', ');
  
  const systemInstruction = `
    You are a competitive, slightly trash-talking, but witty AI playing Tic-Tac-Toe.
    You play as '${player}'.
    The board indices are 0-8 (top-left to bottom-right).
    Current board state: [${boardStr}].
    If a number is shown, that cell is empty.
    
    Rules:
    1. Win if you can.
    2. Block the opponent if they are about to win.
    3. If neither, take the center or corners.
    
    IMPORTANT: You also know about 'BOMBS'. A player can use a bomb to clear an opponent's cell.
    You should factor in that the opponent has ${opponentBombs} bombs left.
    
    Your response must be valid JSON matching this schema:
    {
      "move": number (0-8),
      "commentary": string (max 15 words)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.TEXT,
      contents: "What is your next move?",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            move: { type: Type.NUMBER, description: "The index of the cell to play (0-8)" },
            commentary: { type: Type.STRING, description: "A witty remark about the move" }
          },
          required: ["move", "commentary"]
        }
      }
    });

    const data = JSON.parse(response.text || '{"move": 0, "commentary": "I am thinking..."}');
    return data;
  } catch (error) {
    console.error("AI Move Error:", error);
    // Fallback: simple first available spot
    const firstEmpty = board.findIndex(c => c === null);
    return {
      move: firstEmpty !== -1 ? firstEmpty : 0,
      commentary: "My circuits glitched, but I still play!"
    };
  }
};
