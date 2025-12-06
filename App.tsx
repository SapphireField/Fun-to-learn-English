import React, { useState } from 'react';
import { BookOpen, MessageCircle, Library, Gamepad2, Settings, X, Check, Volume2 } from 'lucide-react';
import VocabLearn from './components/VocabLearn';
import ChatInterface from './components/ChatInterface'; 
import SongLibrary from './components/SongLibrary'; 
import GameMode from './components/GameMode';
import { AppTab } from './types';
import { stopAudio, playPCM } from './utils/audio';
import { AVAILABLE_VOICES, generateSpeech } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.LEARN);
  const [showSettings, setShowSettings] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(localStorage.getItem('lingo_voice') || 'Fenrir');

  const handleVoiceChange = async (voiceId: string) => {
    setCurrentVoice(voiceId);
    localStorage.setItem('lingo_voice', voiceId);
    
    // Play sample
    stopAudio();
    try {
        const audio = await generateSpeech("Hello! I am ready to teach.", 'speech');
        if (audio) await playPCM(audio);
    } catch(e) {}
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-sky-50 font-sans text-gray-800">
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md p-4 shadow-sm z-10 flex justify-between items-center border-b border-white">
         <div className="flex items-center">
             <div className="bg-yellow-200 p-2 rounded-full mr-3 shadow-inner">
                 <span className="text-2xl">🦁</span>
             </div>
             <h1 className="text-2xl font-black text-blue-500 tracking-wide english-font drop-shadow-sm">LingoBuddy</h1>
         </div>
         <button 
            onClick={() => setShowSettings(true)}
            className="p-2 bg-gray-100 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
         >
             <Settings size={24} />
         </button>
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

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border-4 border-blue-100">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-black text-gray-800 flex items-center">
                          <Settings className="mr-2" size={20} /> Settings
                      </h2>
                      <button onClick={() => setShowSettings(false)} className="p-2 bg-gray-100 rounded-full hover:bg-red-50 hover:text-red-500">
                          <X size={20} />
                      </button>
                  </div>

                  <div className="mb-4">
                      <h3 className="font-bold text-gray-400 uppercase text-xs mb-3">Choose Teacher Voice</h3>
                      <div className="space-y-2">
                          {AVAILABLE_VOICES.map((voice) => (
                              <button
                                key={voice.id}
                                onClick={() => handleVoiceChange(voice.id)}
                                className={`w-full p-3 rounded-xl flex items-center justify-between border-2 transition-all ${
                                    currentVoice === voice.id 
                                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                                    : 'border-gray-100 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                  <div className="flex items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                                          currentVoice === voice.id ? 'bg-blue-200' : 'bg-gray-200'
                                      }`}>
                                          <Volume2 size={16} />
                                      </div>
                                      <div className="text-left">
                                          <div className="font-bold text-sm">{voice.name}</div>
                                          <div className="text-xs opacity-70">{voice.style}</div>
                                      </div>
                                  </div>
                                  {currentVoice === voice.id && <Check size={18} className="text-blue-500" />}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default App;