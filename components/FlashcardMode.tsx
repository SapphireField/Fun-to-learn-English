import React, { useState, useEffect } from 'react';
import { X, Check, Volume2, RotateCcw, XCircle, Loader2 } from 'lucide-react';
import { WordToken } from '../types';
import { generateSpeech } from '../services/geminiService';
import { playPCM, stopAudio } from '../utils/audio';

interface FlashcardModeProps {
  words: WordToken[];
  onClose: () => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ words, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);

  // Swipe logic state
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const currentWord = words[currentIndex];

  const handlePlayAudio = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (audioLoading) return;
    
    setAudioLoading(true);
    try {
        const audio = await generateSpeech(currentWord.word);
        if (audio) {
            await playPCM(audio);
        }
    } catch (e) {
        console.error(e);
    } finally {
        setAudioLoading(false);
    }
  };

  // Auto-play audio when showing a new card (front side)
  useEffect(() => {
    if (!isComplete) {
        // Small delay to allow transition
        const timer = setTimeout(() => {
            handlePlayAudio();
        }, 500);
        return () => clearTimeout(timer);
    }
  }, [currentIndex, isComplete]);

  const handleNext = (known: boolean) => {
    if (known) setKnownCount(p => p + 1);
    else setReviewCount(p => p + 1);

    setIsFlipped(false);
    
    if (currentIndex < words.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const restart = () => {
      setCurrentIndex(0);
      setKnownCount(0);
      setReviewCount(0);
      setIsComplete(false);
      setIsFlipped(false);
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.targetTouches[0].clientX);
  const handleTouchMove = (e: React.TouchEvent) => setTouchEnd(e.targetTouches[0].clientX);
  const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;

      if (isLeftSwipe) handleNext(false); // Swipe Left = Review
      if (isRightSwipe) handleNext(true); // Swipe Right = Known
      
      setTouchStart(0);
      setTouchEnd(0);
  };

  if (isComplete) {
      return (
        <div className="fixed inset-0 z-50 bg-sky-50 flex flex-col items-center justify-center p-6 animate-in fade-in">
            <div className="bg-white rounded-3xl p-8 shadow-xl text-center w-full max-w-sm border-4 border-blue-100">
                <h2 className="text-3xl font-black text-blue-600 mb-2 english-font">Great Job!</h2>
                <p className="text-gray-500 mb-6">Session Complete</p>
                
                <div className="flex gap-4 mb-8">
                    <div className="flex-1 bg-green-50 p-4 rounded-2xl border border-green-100">
                        <div className="text-3xl font-bold text-green-600">{knownCount}</div>
                        <div className="text-xs text-green-400 uppercase font-bold">Known</div>
                    </div>
                    <div className="flex-1 bg-orange-50 p-4 rounded-2xl border border-orange-100">
                        <div className="text-3xl font-bold text-orange-600">{reviewCount}</div>
                        <div className="text-xs text-orange-400 uppercase font-bold">To Review</div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={restart} className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold flex items-center justify-center">
                        <RotateCcw className="mr-2" size={18} /> Restart
                    </button>
                    <button onClick={onClose} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold">
                        Close
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
        
        {/* Header */}
        <div className="w-full max-w-md flex justify-between items-center text-white mb-6">
            <div className="text-lg font-bold">
                {currentIndex + 1} / {words.length}
            </div>
            <button onClick={onClose} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                <X size={20} />
            </button>
        </div>

        {/* Card Container */}
        <div 
            className="w-full max-w-xs h-80 perspective-1000 cursor-pointer group"
            onClick={() => setIsFlipped(!isFlipped)}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            <div className={`relative w-full h-full duration-500 transform-style-3d transition-transform ${isFlipped ? 'rotate-y-180' : ''}`}>
                
                {/* Front Side (English) */}
                <div className="absolute w-full h-full bg-white rounded-3xl shadow-2xl backface-hidden flex flex-col items-center justify-center p-6 border-b-8 border-blue-500">
                    <button 
                        onClick={handlePlayAudio}
                        className="absolute top-4 right-4 p-2 text-blue-400 hover:text-blue-600 bg-blue-50 rounded-full"
                    >
                        {audioLoading ? <Loader2 className="animate-spin" size={24} /> : <Volume2 size={24} />}
                    </button>
                    <h2 className="text-4xl font-black text-gray-800 english-font text-center mb-2">{currentWord.word}</h2>
                    <p className="text-gray-400 text-sm animate-pulse">Tap to flip</p>
                </div>

                {/* Back Side (Translation) */}
                <div className="absolute w-full h-full bg-blue-50 rounded-3xl shadow-2xl backface-hidden rotate-y-180 flex flex-col items-center justify-center p-6 border-b-8 border-yellow-400">
                    <h3 className="text-4xl font-bold text-blue-600 chinese-font mb-2">{currentWord.translation}</h3>
                    <p className="text-xl text-gray-500 font-mono bg-white px-3 py-1 rounded-lg border border-blue-100">
                        /{currentWord.ipa}/
                    </p>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="flex gap-8 mt-10 items-center">
            <button 
                onClick={() => handleNext(false)}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center text-red-500 border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                    <XCircle size={32} />
                </div>
                <span className="text-white font-bold text-sm">Review</span>
            </button>

            <button 
                onClick={() => handleNext(true)}
                className="flex flex-col items-center gap-2 group"
            >
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 border-4 border-white shadow-lg group-hover:scale-110 transition-transform">
                    <Check size={32} strokeWidth={3} />
                </div>
                <span className="text-white font-bold text-sm">Known</span>
            </button>
        </div>
        
        <p className="text-white/50 text-xs mt-8">Swipe Left (Review) • Swipe Right (Known)</p>

        <style>{`
            .perspective-1000 { perspective: 1000px; }
            .transform-style-3d { transform-style: preserve-3d; }
            .backface-hidden { backface-visibility: hidden; }
            .rotate-y-180 { transform: rotateY(180deg); }
        `}</style>
    </div>
  );
};

export default FlashcardMode;
