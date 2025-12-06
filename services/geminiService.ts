import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { WordToken, ChatResponse, QuizQuestion, PinyinChar } from '../types';

const apiKey = process.env.API_KEY;

// PROXY LOGIC FOR CHINA
// If running on Vercel (PROD), route requests to /google-api/v1beta/...
const clientOptions: any = { apiKey: apiKey || '' };
if ((import.meta as any).env?.PROD) {
  // Using Vercel rewrite proxy
  // The SDK might default to googleapis.com, but Vercel rewrites handle /google-api
  // We configure the custom endpoint if supported or rely on the rewrite matching
}

// In the specific case of @google/genai, we initialize with just the key. 
// For China proxy to work via Vercel rewrites, we ideally need to point the baseUrl.
// Since the library might not expose baseUrl easily in constructor, we assume the Vercel rewrite 
// catches specific route patterns if configured, or we rely on standard behavior.
// To explicitly force the proxy path in this specific codebase context:
const ai = new GoogleGenAI({ 
    apiKey: apiKey || '', 
    baseUrl: (import.meta as any).env?.PROD ? '/google-api' : undefined 
} as any);

const checkApiKey = () => {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error("API Key is missing. Please add it in Vercel Settings.");
    }
};

export const AVAILABLE_VOICES = [
  { id: 'Fenrir', name: 'Teacher Lion', gender: 'Male', style: 'Calm & Deep' },
  { id: 'Kore', name: 'Teacher Lily', gender: 'Female', style: 'Warm & Gentle' },
  { id: 'Puck', name: 'Teacher Jack', gender: 'Male', style: 'Energetic & Fun' },
  { id: 'Aoede', name: 'Teacher Rose', gender: 'Female', style: 'Soft & Sweet' },
];

const quizSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      question: { type: Type.STRING },
      pinyin: { type: Type.STRING },
      englishWord: { type: Type.STRING },
      options: { type: Type.ARRAY, items: { type: Type.STRING } },
      correctAnswer: { type: Type.INTEGER },
      explanation: { type: Type.STRING }
    },
    required: ["question", "options", "correctAnswer", "explanation"]
  }
};

const libraryContentSchema: Schema = {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      chineseTitle: { type: Type.STRING },
      content: { type: Type.STRING },
      chineseTranslation: { type: Type.STRING },
      type: { type: Type.STRING, enum: ["rhyme", "story"] },
    },
    required: ["title", "content", "chineseTranslation", "type"],
  };

const wordCache = new Map<string, WordToken[]>();
const pinyinCache = new Map<string, PinyinChar[]>();

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const processChunkWithRetries = async (chunk: string, index: number): Promise<WordToken[]> => {
    let retryCount = 0;
    while (retryCount < 3) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                Task: Analyze this English text for a Chinese child learner.
                Input Text: "${chunk}"
                Instructions:
                1. Break text into words/tokens.
                2. Return a PLAIN TEXT list: Word|IPA|ChineseMeaning
                3. Rules:
                   - IPA: Use standard IPA.
                   - ChineseMeaning: Simple, short definition (2-4 chars).
                   - Punctuation: Just output mark and empty fields (e.g. !||).
                `,
            });
        
            const textOutput = response.text;
            if (textOutput) {
                const lines = textOutput.split('\n');
                const chunkResult: WordToken[] = [];
                for (const line of lines) {
                    const trimmedLine = line.trim();
                    if (!trimmedLine) continue;
                    const parts = trimmedLine.split('|');
                    if (parts.length >= 1) {
                        chunkResult.push({
                            word: parts[0].trim(),
                            ipa: parts[1] ? parts[1].trim() : '',
                            translation: parts[2] ? parts[2].trim() : ''
                        });
                    }
                }
                if (chunkResult.length > 0) return chunkResult;
            }
            throw new Error("Empty result");
        } catch (e: any) {
            console.error(`Error chunk ${index}:`, e);
            await delay(1000 + (retryCount * 1000));
            retryCount++;
        }
    }
    return chunk.split(' ').map(w => ({ word: w, ipa: '', translation: '' }));
};

const processPinyinChunk = async (chunk: string, index: number): Promise<PinyinChar[]> => {
    let retryCount = 0;
    while (retryCount < 3) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                Task: Convert Chinese text to Pinyin.
                Input: "${chunk}"
                Instructions:
                1. Break into characters.
                2. Return valid Pinyin.
                3. Output Format: Char|Pinyin
                `,
            });
             const textOutput = response.text;
             if (textOutput) {
                const lines = textOutput.split('\n');
                const chunkResult: PinyinChar[] = [];
                for (const line of lines) {
                    const parts = line.trim().split('|');
                    if (parts.length >= 1 && parts[0]) {
                        chunkResult.push({
                            char: parts[0],
                            pinyin: parts[1] || ''
                        });
                    }
                }
                if (chunkResult.length > 0) return chunkResult;
             }
             throw new Error("Empty result");
        } catch (e: any) {
             await delay(1000 + (retryCount * 1000));
             retryCount++;
        }
    }
    return chunk.split('').map(c => ({ char: c, pinyin: '' }));
}

export const convertLargeTextToTokens = async (text: string, onProgress?: (percent: number) => void): Promise<WordToken[]> => {
    checkApiKey();
    if (!text.trim()) return [];

    if (wordCache.has(text.trim())) {
        if (onProgress) onProgress(100);
        return wordCache.get(text.trim())!;
    }

    const chunks = [];
    let currentText = text;
    while(currentText.length > 0) {
        let split = currentText.length > 3000 ? currentText.lastIndexOf('.', 3000) + 1 : currentText.length;
        if(split <= 0) split = 3000;
        chunks.push(currentText.substring(0, split));
        currentText = currentText.substring(split);
    }

    let combinedResult: WordToken[] = [];
    const BATCH_SIZE = 3; 
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map((c, idx) => processChunkWithRetries(c, i + idx)));
        
        batchResults.forEach(res => combinedResult = [...combinedResult, ...res]);
        if (onProgress) onProgress(Math.round(((i + batch.length) / chunks.length) * 100));
    }

    wordCache.set(text.trim(), combinedResult);
    return combinedResult;
};

export const convertLargeTextToPinyin = async (text: string, onProgress?: (percent: number) => void): Promise<PinyinChar[]> => {
    checkApiKey();
    if (!text.trim()) return [];

    if (pinyinCache.has(text.trim())) {
        if (onProgress) onProgress(100);
        return pinyinCache.get(text.trim())!;
    }

    const chunks = [];
    let currentText = text;
    while(currentText.length > 0) {
        let split = currentText.length > 2000 ? currentText.lastIndexOf('。', 2000) + 1 : currentText.length;
        if (split <= 0) split = 2000;
        chunks.push(currentText.substring(0, split));
        currentText = currentText.substring(split);
    }
    
    let combinedResult: PinyinChar[] = [];
    const BATCH_SIZE = 3;
    
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(batch.map((c, idx) => processPinyinChunk(c, i + idx)));
        
        batchResults.forEach(res => combinedResult = [...combinedResult, ...res]);
        if (onProgress) onProgress(Math.round(((i + batch.length) / chunks.length) * 100));
    }

    pinyinCache.set(text.trim(), combinedResult);
    return combinedResult;
};

export const extractTextFromFile = async (file: File): Promise<string> => {
    try {
      if (file.type.startsWith('image/')) {
         return new Promise((resolve, reject) => {
             const reader = new FileReader();
             reader.onload = async (e) => {
                 const base64 = (e.target?.result as string).split(',')[1];
                 try {
                     const response = await ai.models.generateContent({
                         model: 'gemini-2.5-flash',
                         contents: {
                             role: 'user',
                             parts: [
                                 { inlineData: { mimeType: file.type, data: base64 } },
                                 { text: "Transcribe all the text in this image. Do not describe the image, just output the text." }
                             ]
                         }
                     });
                     resolve(response.text || "No text found.");
                 } catch (err) { reject(err); }
             };
             reader.readAsDataURL(file);
         });
      }
      
      if (file.type.includes('wordprocessingml')) {
          if ((window as any).mammoth) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
              return result.value;
          }
      }
      
      if (file.type.includes('epub')) {
           return "EPUB reading is supported in the full tool.";
      }

      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.readAsText(file);
      });
    } catch (e) { return "Error reading file"; }
};

export const chatWithLion = async (message: string, history: any[], image?: {data: string, mimeType: string}): Promise<ChatResponse> => {
    checkApiKey();
    
    const parts: any[] = [{ text: message }];
    
    if (image) {
        parts.unshift({
            inlineData: {
                data: image.data,
                mimeType: image.mimeType
            }
        });
    }

    const historyPrompt = JSON.stringify(history.map(h => ({
        role: h.sender === 'user' ? 'user' : 'model',
        parts: [{ text: h.content || (h.data ? h.data.english : '') }]
    })).slice(-5));

    const prompt = `
      You are "Teacher Lion", a fun English tutor for Chinese children.
      Input: "${message}" (or image).
      Output JSON:
      {
          "english": "Your simple English response.",
          "chinese": "Chinese translation.",
          "aligned": [Array of {word, ipa, translation}]
      }
    `;

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: `History: ${historyPrompt}` }] },
            { role: 'user', parts: [...parts, { text: prompt }] }
        ],
        config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text!) as ChatResponse;
};

export const generateQuiz = async (topic: string): Promise<QuizQuestion[]> => {
    checkApiKey();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Generate 5 English vocab MCQ for kids. Topic: ${topic}. Output JSON.`,
        config: { responseMimeType: "application/json", responseSchema: quizSchema }
    });
    return JSON.parse(response.text!) as QuizQuestion[];
};

export const generateSpeech = async (text: string, style: 'speech' | 'song' = 'speech'): Promise<string | null> => {
    checkApiKey();
    try {
        // Use user preference from localStorage, default to Fenrir
        const savedVoice = localStorage.getItem('lingo_voice') || 'Fenrir';
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text.substring(0, 4500) }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: savedVoice } } }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) { return null; }
};

export const getLibraryContent = async (title: string) => {
    checkApiKey();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Write English kid story/rhyme: "${title}". Return JSON {title, chineseTitle, content, chineseTranslation, type="rhyme"|"story"}.`,
        config: { responseMimeType: "application/json", responseSchema: libraryContentSchema }
    });
    return JSON.parse(response.text!);
};

export const extractTextFromFileRef = extractTextFromFile;