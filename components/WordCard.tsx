import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

interface WordCardProps {
  word: string;
  ipa: string;
  translation: string;
  isActive?: boolean;
  onPlay?: (word: string) => Promise<void>;
}

const WordCard: React.FC<WordCardProps> = ({ word, ipa, translation, isActive = false, onPlay }) => {
  const [showMeta, setShowMeta] = useState(true);
  const [loadingAudio, setLoadingAudio] = useState(false);
  
  // Detect punctuation
  const isPunctuation = !ipa && !translation && word.length === 1 && !word.match(/[a-zA-Z]/);

  const handlePlayClick = async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent toggling meta
      if (onPlay && !loadingAudio) {
          setLoadingAudio(true);
          try {
            await onPlay(word);
          } finally {
            setLoadingAudio(false);
          }
      }
  };

  if (isPunctuation) {
      return <span className="text-3xl font-bold text-gray-400 mx-1 self-end mb-2">{word}</span>;
  }

  return (
    <div 
        className={`relative flex flex-col items-center mx-1 my-2 cursor-pointer transition-all duration-300 rounded-lg px-2 pb-1 pt-4 group ${isActive ? 'bg-yellow-100 scale-105' : 'hover:bg-blue-50'}`} 
        onClick={() => setShowMeta(!showMeta)}
    >
      {/* Audio Button (Top Right) */}
      {onPlay && (
          <div 
            onClick={handlePlayClick}
            className={`absolute top-0 right-0 p-1 rounded-full text-blue-400 hover:text-blue-600 hover:bg-blue-100 transition-all ${loadingAudio ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
              {loadingAudio ? <Loader2 size={10} className="animate-spin"/> : <Volume2 size={12} />}
          </div>
      )}

      {/* Chinese Translation (Top) */}
      <span 
        className={`text-xs text-blue-500 font-bold chinese-font mb-0.5 transition-opacity ${showMeta ? 'opacity-100' : 'opacity-0'}`}
      >
        {translation || ' '}
      </span>

      {/* English Word (Middle) */}
      <span 
        className={`text-2xl font-bold english-font leading-none ${isActive ? 'text-blue-600' : 'text-gray-800'}`}
      >
        {word}
      </span>

      {/* IPA (Bottom) */}
      <span 
        className={`text-[10px] text-gray-400 font-mono mt-0.5 transition-opacity ${showMeta ? 'opacity-100' : 'opacity-0'}`}
      >
        {ipa ? `/${ipa}/` : ' '}
      </span>
    </div>
  );
};

export default WordCard;