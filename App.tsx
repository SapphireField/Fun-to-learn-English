import React, { useState } from 'react';
import { BookOpen, MessageCircle, Library, Gamepad2 } from 'lucide-react';
import VocabLearn from './components/VocabLearn';
import ChatInterface from './components/ChatInterface'; 
import SongLibrary from './components/SongLibrary'; 
import GameMode from './components/GameMode';
import { AppTab } from './types';
import { stopAudio } from './utils/audio';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LEARN);

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sky-50 font-sans text-gray-800">
      
      {/* Header */}
      <div className="bg-white p-4 shadow-sm z-10 flex justify-center items-center">
         <span className="text-3xl mr-2">🦁</span>
         <h1 className="text-xl font-black text-blue-600 tracking-wide english-font">Lion Lingo</h1>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === AppTab.LEARN && <VocabLearn />}
        {activeTab === AppTab.CHAT && <ChatInterface />}
        {activeTab === AppTab.LIBRARY && <SongLibrary />}
        {activeTab === AppTab.GAME && <GameMode />}
      </div>

      <nav className="bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pt-2 pb-6 px-4 z-20">
        <div className="max-w-md mx-auto flex justify-between items-center gap-1">
            {[
                { id: AppTab.LEARN, icon: BookOpen, label: "Learn", color: "text-blue-500 bg-blue-50" },
                { id: AppTab.CHAT, icon: MessageCircle, label: "Talk", color: "text-indigo-500 bg-indigo-50" },
                { id: AppTab.LIBRARY, icon: Library, label: "Stories", color: "text-yellow-500 bg-yellow-50" },
                { id: AppTab.GAME, icon: Gamepad2, label: "Game", color: "text-green-500 bg-green-50" },
            ].map(tab => (
                <button
                    key={tab.id}
                    onClick={() => { stopAudio(); setActiveTab(tab.id); }}
                    className={`flex flex-col items-center gap-1 p-2 rounded-2xl transition-all duration-300 w-16 ${
                        activeTab === tab.id ? `${tab.color} -translate-y-2 shadow-sm` : 'text-gray-400'
                    }`}
                >
                    <tab.icon size={20} strokeWidth={activeTab === tab.id ? 3 : 2} />
                    <span className="text-[10px] font-bold">{tab.label}</span>
                </button>
            ))}
        </div>
      </nav>
    </div>
  );
};

export default App;