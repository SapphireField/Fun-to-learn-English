export interface WordToken {
  word: string;
  ipa: string; // Pronunciation
  translation: string; // Chinese meaning
}

export interface PinyinChar {
  char: string;
  pinyin: string;
}

export interface ChatResponse {
  english: string;
  chinese: string; // Translation/Explanation
  aligned: WordToken[];
}

export interface Message {
  id: string;
  sender: 'user' | 'bot';
  content?: string;
  data?: ChatResponse;
  timestamp: number;
  attachment?: {
    type: 'image' | 'file';
    content: string; // Base64 or Text
    name: string;
  };
}

export interface QuizQuestion {
  question: string; // Chinese or English
  pinyin?: string;
  englishWord: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export enum AppTab {
  LEARN = 'LEARN',
  CHAT = 'CHAT',
  LIBRARY = 'LIBRARY',
  GAME = 'GAME',
}