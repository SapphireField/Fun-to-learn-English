import React, { useState, useEffect, useRef } from 'react';
import { Wand2, Volume2, X, Loader2, Save, Download, Play, Square, Upload, Camera, Layers } from 'lucide-react';
import { convertLargeTextToTokens, generateSpeech, extractTextFromFile } from '../services/geminiService';
import { playPCM, stopAudio, calculateWeightedActiveIndexForTokens } from '../utils/audio';
import { WordToken } from '../types';
import WordCard from './WordCard';
import FlashcardMode from './FlashcardMode';

const VocabLearn: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState<WordToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [fileProcessing, setFileProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [showFlashcards, setShowFlashcards] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Animation Refs
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const requestRef = useRef<number | undefined>(undefined);

  const handleConvert = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    stopAudio();
    setIsPlaying(false);
    try {
        const data = await convertLargeTextToTokens(inputText);
        setResult(data);
    } catch (e) { alert("Error: " + e); } 
    finally { setLoading(false); }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setFileProcessing(true);
      setInputText("Reading image/file...");
      
      try {
          const text = await extractTextFromFile(file);
          if (text && !text.startsWith("Error")) {
              setInputText(text);
          } else {
              alert(text || "Failed to read file.");
              setInputText("");
          }
      } catch (e: any) {
          alert("Error: " + e.message);
          setInputText("");
      } finally {
          setFileProcessing(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
          if (cameraInputRef.current) cameraInputRef.current.value = '';
      }
  };

  const animate = () => {
    if (!startTimeRef.current || !durationRef.current) return;
    const now = Date.now();
    const progress = Math.min((now - startTimeRef.current) / 1000 / durationRef.current, 1);
    setPlaybackProgress(progress);
    if (progress < 1) requestRef.current = requestAnimationFrame(animate);
    else { setIsPlaying(false); setPlaybackProgress(0); }
  };

  const handlePlay = async () => {
    if (isPlaying) { stopAudio(); setIsPlaying(false); return; }
    try {
        const audio = await generateSpeech(inputText);
        if (audio) {
            setIsPlaying(true);
            await playPCM(audio, (d) => {
                durationRef.current = d;
                startTimeRef.current = Date.now();
                requestRef.current = requestAnimationFrame(animate);
            });
        }
    } catch (e) { setIsPlaying(false); }
  };

  const handlePlayWord = async (word: string) => {
      // Stop any existing playback
      stopAudio();
      setIsPlaying(false);
      setPlaybackProgress(0);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);

      try {
          const audio = await generateSpeech(word);
          if (audio) {
              await playPCM(audio);
          }
      } catch (e) {
          console.error("Failed to play word", e);
      }
  };

  // Sync logic for variable-length English words
  const activeIndex = isPlaying ? calculateWeightedActiveIndexForTokens(playbackProgress, result) : -1;

  return (
    <div className="flex flex-col h-full p-4 max-w-md mx-auto overflow-y-auto no-scrollbar pb-24">
      <div className="bg-white rounded-3xl shadow-xl p-6 mb-6 border-4 border-blue-100 relative">
         <h2 className="text-2xl font-black text-blue-500 flex items-center mb-4 english-font justify-between">
            <span className="flex items-center"><Wand2 className="mr-2" /> Word Magic</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={fileProcessing || loading}
                    className="text-blue-500 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors"
                    title="Take Photo"
                >
                    {fileProcessing ? <Loader2 className="animate-spin" size={20}/> : <Camera size={20}/>}
                </button>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={fileProcessing || loading}
                    className="text-blue-500 bg-blue-50 p-2 rounded-full hover:bg-blue-100 transition-colors"
                    title="Upload File"
                >
                    {fileProcessing ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                </button>
            </div>
         </h2>
         <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,.pdf,.docx,.txt"
            onChange={handleFileUpload}
         />
         <input 
            type="file" 
            ref={cameraInputRef} 
            className="hidden" 
            accept="image/*"
            capture="environment"
            onChange={handleFileUpload}
         />
         
         <textarea
            className="w-full p-4 rounded-xl border-2 border-blue-100 focus:border-blue-400 outline-none text-lg english-font resize-none"
            rows={3}
            placeholder="Type English, or take a photo of a book..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            readOnly={fileProcessing}
         />
         <button
            onClick={handleConvert}
            disabled={loading || !inputText || fileProcessing}
            className="w-full mt-4 py-3 rounded-xl font-bold text-white bg-blue-500 hover:bg-blue-600 shadow-md transition-all active:scale-95 flex justify-center items-center"
         >
            {loading ? <Loader2 className="animate-spin mr-2"/> : 'Translate & Explain! 🦁'}
         </button>
      </div>

      {result.length > 0 && (
        <div className="bg-white rounded-3xl shadow-xl p-6 border-4 border-yellow-100 mb-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-yellow-600 english-font">Result</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setShowFlashcards(true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-yellow-100 text-yellow-600 rounded-lg font-bold text-xs hover:bg-yellow-200 transition-colors"
                    >
                        <Layers size={16} /> Flashcards
                    </button>
                    <button onClick={handlePlay} className={`p-2 rounded-full ${isPlaying ? 'bg-red-100 text-red-500' : 'bg-blue-100 text-blue-500'}`}>
                        {isPlaying ? <Square size={20} className="fill-current"/> : <Play size={20} className="fill-current"/>}
                    </button>
                </div>
            </div>
            <div className="flex flex-wrap content-start">
                {result.map((item, index) => (
                    <WordCard 
                        key={index} 
                        word={item.word} 
                        ipa={item.ipa} 
                        translation={item.translation} 
                        isActive={index === activeIndex} 
                        onPlay={handlePlayWord}
                    />
                ))}
            </div>
        </div>
      )}
      
      {showFlashcards && (
          <FlashcardMode words={result.filter(w => w.word.match(/[a-zA-Z]/))} onClose={() => setShowFlashcards(false)} />
      )}
    </div>
  );
};

export default VocabLearn;