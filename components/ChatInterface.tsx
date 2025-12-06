import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Volume2, Paperclip, Loader2, Image as ImageIcon, Camera } from 'lucide-react';
import { chatWithLion, generateSpeech, extractTextFromFileRef } from '../services/geminiService';
import { playPCM, stopAudio, calculateWeightedActiveIndexForTokens } from '../utils/audio';
import WordCard from './WordCard';

const ChatInterface: React.FC = () => {
    const [messages, setMessages] = useState<any[]>([{
        id: '1', sender: 'bot', 
        data: { 
            english: "Hello! I am Teacher Lion.", 
            chinese: "你好！我是狮子老师。", 
            aligned: [{word: "Hello", ipa: "/həˈloʊ/", translation: "你好"}, {word: "!", ipa:"", translation:""}] 
        }
    }]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [listening, setListening] = useState(false);
    
    // Audio Sync State
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const startTimeRef = useRef<number>(0);
    const durationRef = useRef<number>(0);
    const requestRef = useRef<number | undefined>(undefined);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    // Stop audio when leaving
    useEffect(() => {
        return () => {
            stopAudio();
            if(requestRef.current) cancelAnimationFrame(requestRef.current);
        };
    }, []);

    const animate = () => {
        if (!startTimeRef.current || !durationRef.current) return;
        const now = Date.now();
        const progress = Math.min((now - startTimeRef.current) / 1000 / durationRef.current, 1);
        setPlaybackProgress(progress);
        if (progress < 1) requestRef.current = requestAnimationFrame(animate);
        else { setPlayingMessageId(null); setPlaybackProgress(0); }
    };

    const playMessageAudio = async (text: string, id: string) => {
        if(playingMessageId === id) {
            stopAudio();
            setPlayingMessageId(null);
            cancelAnimationFrame(requestRef.current!);
            return;
        }
        
        stopAudio();
        setPlayingMessageId(id);
        
        const audio = await generateSpeech(text);
        if(audio) {
            await playPCM(audio, (d) => {
                durationRef.current = d;
                startTimeRef.current = Date.now();
                requestRef.current = requestAnimationFrame(animate);
            });
        } else {
            setPlayingMessageId(null);
        }
    };

    const handlePlayWord = async (word: string) => {
        // Stop any sentence playback
        if (playingMessageId) {
            stopAudio();
            setPlayingMessageId(null);
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        }

        try {
            const audio = await generateSpeech(word);
            if (audio) {
                await playPCM(audio);
            }
        } catch (e) {
            console.error("Failed to play word", e);
        }
    };

    const handleSend = async (file?: File) => {
        if(!input.trim() && !file) return;
        
        let contentToSend = input;
        let attachment = undefined;
        let imageData = undefined;

        if (file) {
            if (file.type.startsWith('image/')) {
                 // Convert to base64 for display and sending
                 const base64 = await new Promise<string>((resolve) => {
                     const reader = new FileReader();
                     reader.onload = (e) => resolve((e.target?.result as string));
                     reader.readAsDataURL(file);
                 });
                 attachment = { type: 'image', content: base64, name: file.name };
                 imageData = { data: base64.split(',')[1], mimeType: file.type };
                 contentToSend = input || "I uploaded a picture. What is this?";
            } else {
                 // Extract text
                 const text = await extractTextFromFileRef(file);
                 contentToSend = `[File Content from ${file.name}]:\n${text}\n\n${input}`;
                 attachment = { type: 'file', content: 'Document uploaded', name: file.name };
            }
        }

        const userMsg = { 
            id: Date.now().toString(), 
            sender: 'user', 
            content: input || (file ? `Sent a file: ${file.name}` : ''),
            attachment: attachment 
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);
        
        try {
            const response = await chatWithLion(contentToSend, messages, imageData);
            const botMsg = { id: (Date.now() + 1).toString(), sender: 'bot', data: response };
            setMessages(prev => [...prev, botMsg]);
            
            // Auto play response
            playMessageAudio(response.english, botMsg.id);
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }
        
        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setListening(true);
        recognition.onend = () => setListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
        };
        
        recognition.start();
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleSend(file);
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 relative">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
                {messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[90%] p-3 rounded-2xl ${m.sender === 'user' ? 'bg-blue-500 text-white' : 'bg-white border-2 border-blue-100'}`}>
                            {m.attachment && m.attachment.type === 'image' && (
                                <img src={m.attachment.content} alt="upload" className="max-w-full h-auto rounded-lg mb-2 border-2 border-white/20"/>
                            )}
                            {m.attachment && m.attachment.type === 'file' && (
                                <div className="bg-black/10 p-2 rounded-lg mb-2 text-sm flex items-center">
                                    <Paperclip size={14} className="mr-1"/> {m.attachment.name}
                                </div>
                            )}
                            
                            {m.sender === 'user' ? <p className="text-lg">{m.content}</p> : (
                                <div>
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex flex-wrap items-end gap-0.5">
                                            {m.data.aligned.map((t: any, i: number) => {
                                                // Calculate active based on current message playback
                                                const isActive = playingMessageId === m.id && calculateWeightedActiveIndexForTokens(playbackProgress, m.data.aligned) === i;
                                                return <WordCard key={i} word={t.word} ipa={t.ipa} translation={t.translation} isActive={isActive} onPlay={handlePlayWord} />;
                                            })}
                                        </div>
                                        <button onClick={() => playMessageAudio(m.data.english, m.id)} className="text-blue-400 p-1">
                                            {playingMessageId === m.id ? <Volume2 className="animate-pulse text-blue-600"/> : <Volume2 size={18}/>}
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 border-t pt-2 mt-2">{m.data.chinese}</p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {loading && <div className="text-center text-gray-400 flex justify-center gap-2"><Loader2 className="animate-spin"/> Teacher Lion is thinking...</div>}
            </div>
            
            {/* Input Area - Moved up to bottom-28 to clear the navigation dock */}
            <div className="absolute bottom-28 left-4 right-4 bg-white/90 backdrop-blur-sm p-2 rounded-[2rem] shadow-xl border border-blue-100 flex items-center gap-2 z-20">
                <button onClick={() => cameraInputRef.current?.click()} className="p-3 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-full transition-colors">
                    <Camera size={20}/>
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-gray-400 hover:text-blue-500 bg-gray-50 rounded-full transition-colors">
                    <Paperclip size={20}/>
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*,.pdf,.docx,.txt"
                    onChange={handleFileSelect}
                />
                <input 
                    type="file" 
                    ref={cameraInputRef} 
                    className="hidden" 
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                />
                
                <input 
                    value={input} 
                    onChange={e => setInput(e.target.value)} 
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    className="flex-1 bg-gray-100 rounded-full px-4 py-3 outline-none focus:ring-2 focus:ring-blue-300 font-medium" 
                    placeholder="Say something..." 
                />
                
                {input ? (
                    <button onClick={() => handleSend()} className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-lg shadow-blue-200"><Send size={20}/></button>
                ) : (
                    <button onClick={startListening} className={`p-3 rounded-full transition-all ${listening ? 'bg-red-500 animate-pulse text-white shadow-lg shadow-red-200' : 'bg-gray-200 text-gray-500 hover:bg-gray-300'}`}>
                        <Mic size={20}/>
                    </button>
                )}
            </div>
        </div>
    );
};
export default ChatInterface;