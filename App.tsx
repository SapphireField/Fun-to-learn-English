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
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm z-10 flex justify-center items-center border-b border-white">
         <div className="bg-yellow-200 p-2 rounded-full mr-3 shadow-inner">
             <span className="text-2xl">🦁</span>
         </div>
         <h1 className="text-2xl font-black text-blue-500 tracking-wide english-font drop-shadow-sm">LingoBuddy</h1>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === AppTab.LEARN && <VocabLearn />}
        {activeTab === AppTab.CHAT && <ChatInterface />}
        {activeTab === AppTab.LIBRARY && <SongLibrary />}
        {activeTab === AppTab.GAME && <GameMode />}
      </div>

      {/* Floating Dock Navigation */}
      <div className="absolute bottom-6 left-0 right-0 px-6 z-30 pointer-events-none">
          <nav className="bg-white/90 backdrop-blur-xl shadow-2xl rounded-[2rem] p-2 pointer-events-auto border-4 border-white mx-auto max-w-sm">
            <div className="flex justify-around items-center">
                {[
                    { id: AppTab.LEARN, icon: BookOpen, label: "Learn", color: "text-blue-500", bg: "bg-blue-100" },
                    { id: AppTab.CHAT, icon: MessageCircle, label: "Talk", color: "text-indigo-500", bg: "bg-indigo-100" },
                    { id: AppTab.LIBRARY, icon: Library, label: "Stories", color: "text-yellow-500", bg: "bg-yellow-100" },
                    { id: AppTab.GAME, icon: Gamepad2, label: "Game", color: "text-green-500", bg: "bg-green-100" },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => { stopAudio(); setActiveTab(tab.id); }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all duration-300 bouncy ${
                            activeTab === tab.id ? `${tab.bg} ${tab.color} scale-110 -translate-y-4 shadow-lg ring-4 ring-white` : 'text-gray-400 hover:bg-gray-50'
                        }`}
                    >
                        <tab.icon size={24} strokeWidth={activeTab === tab.id ? 3 : 2.5} />
                    </button>
                ))}
            </div>
          </nav>
      </div>
    </div>
  );
};

export default App;