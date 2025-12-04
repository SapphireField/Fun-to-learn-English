import { GoogleGenAI, Type, Schema, Modality } from "@google/genai";
import { WordToken, ChatResponse, QuizQuestion, PinyinChar } from '../types';

const apiKey = process.env.API_KEY;

// Initialize AI
const ai = new GoogleGenAI({ apiKey: apiKey || '' });

const checkApiKey = () => {
    if (!apiKey || apiKey.trim() === '') {
        throw new Error("API Key is missing. Please add it in Vercel Settings.");
    }
};

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
    while (retryCount < 5) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                Task: Analyze this English text for a Chinese child learner.
                
                Input Text:
                "${chunk}"

                Instructions:
                1. Break text into words/tokens.
                2. Return a PLAIN TEXT list.
                3. Format: Word|IPA|ChineseMeaning
                4. Rules:
                   - IPA: Use standard IPA pronunciation symbols (e.g. /həˈloʊ/).
                   - ChineseMeaning: Simple, short definition in Simplified Chinese (2-4 chars).
                   - Punctuation: Just output the mark and empty fields (e.g. !||).
                
                Example Output:
                Hello|/həˈloʊ/|你好
                ,| |
                World|/wɜːrld/|世界
                !| |
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
            let waitTime = 2000 * Math.pow(2, retryCount); 
            if (e.toString().includes('429')) waitTime = 5000 + (retryCount * 2000);
            retryCount++;
            if (retryCount < 5) await delay(waitTime); 
        }
    }
    return chunk.split(' ').map(w => ({ word: w, ipa: '', translation: '' }));
};

const processPinyinChunk = async (chunk: string, index: number): Promise<PinyinChar[]> => {
    let retryCount = 0;
    while (retryCount < 5) {
        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `
                Task: Convert Chinese text to Pinyin.
                Input: "${chunk}"
                Instructions:
                1. Break into characters.
                2. Return valid Pinyin for Chinese chars.
                3. Output Format: Char|Pinyin
                Example:
                你|nǐ
                好|hǎo
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
             let waitTime = 2000 * Math.pow(2, retryCount);
             if (e.toString().includes('429')) waitTime = 5000 + (retryCount * 2000);
             retryCount++;
             if (retryCount < 5) await delay(waitTime);
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
        let split = currentText.length > 2000 ? currentText.lastIndexOf('.', 2000) + 1 : currentText.length;
        if(split <= 0) split = 2000;
        chunks.push(currentText.substring(0, split));
        currentText = currentText.substring(split);
    }

    let combinedResult: WordToken[] = [];
    const BATCH_SIZE = 2;
    
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
        let split = currentText.length > 500 ? currentText.lastIndexOf('。', 500) + 1 : currentText.length;
        if (split <= 0) split = 500;
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
      // Images
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
      
      // Word Docs
      if (file.type.includes('wordprocessingml')) {
          if ((window as any).mammoth) {
              const arrayBuffer = await file.arrayBuffer();
              const result = await (window as any).mammoth.extractRawText({ arrayBuffer });
              return result.value;
          }
      }
      
      // EPUB (Simple extraction)
      if (file.type.includes('epub')) {
           // Basic fallback for now, real EPUB parsing is complex
           // Using previous logic:
           return "EPUB reading is supported in the full tool.";
      }

      // Plain Text
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
      
      Instructions:
      1. Analyze the user input (and image if provided).
      2. Respond in simple, clear English suitable for a child.
      3. If the user sends an image or text file content, explain what is in it in simple English, then ask a fun question about it.
      4. If you use a difficult word, explain it in (brackets) in Chinese.
      5. Your goal is to encourage them to speak English.
      
      Output JSON:
      {
          "english": "Your full english response.",
          "chinese": "A Chinese translation of your response.",
          "aligned": [Array of {word, ipa, translation} tokens for your English response]
      }
    `;

    // Construct request
    // Note: To simplify for this specific structure, we are sending current message + prompt instructions. 
    // Ideally, we'd use 'chats.create', but for single-turn JSON response with history context passed in prompt, this works well.
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: [{ text: `Previous Context: ${historyPrompt}` }] },
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
        contents: `Generate 5 multiple choice questions for a Chinese child learning English. Topic: ${topic}.
        Test English vocabulary.
        If the question text contains Chinese, include 'pinyin' property.
        Output JSON.`,
        config: { responseMimeType: "application/json", responseSchema: quizSchema }
    });
    return JSON.parse(response.text!) as QuizQuestion[];
};

export const generateSpeech = async (text: string, style: 'speech' | 'song' = 'speech'): Promise<string | null> => {
    checkApiKey();
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-tts',
            contents: { parts: [{ text: text.substring(0, 4500) }] },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } }
            }
        });
        return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (e) { return null; }
};

export const getLibraryContent = async (title: string) => {
    checkApiKey();
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Find or write an English children's story or nursery rhyme with the title or topic: "${title}". 
        Return JSON: {title, chineseTitle, content (English), chineseTranslation, type}.
        Type should be "rhyme" or "story".`,
        config: { responseMimeType: "application/json", responseSchema: libraryContentSchema }
    });
    return JSON.parse(response.text!);
};