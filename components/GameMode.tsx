import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Star, RefreshCw, Trophy, Loader2, ArrowRight, CheckCircle2, XCircle, Volume2, Square, Home, Mic, Play } from 'lucide-react';
import { generateQuiz, generateSpeech } from '../services/geminiService';
import { playPCM, stopAudio } from '../utils/audio';
import { QuizQuestion } from '../types';

// Topics in English
const TOPICS = [
    { name: "Animals", icon: "🦁" },
    { name: "Colors", icon: "🎨" },
    { name: "Numbers", icon: "1️⃣" },
    { name: "Family", icon: "👨‍👩‍👧" },
    { name: "Food", icon: "🍎" },
    { name: "Nature", icon: "🌳" },
    { name: "Greetings", icon: "👋" },
    { name: "School", icon: "🎒" }
];

const GameMode: React.FC = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [loading, setLoading] = useState(false);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [topic, setTopic] = useState("Animals");
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    
    // Custom Topic State
    const [customTopic, setCustomTopic] = useState("");
    const [isTopicListening, setIsTopicListening] = useState(false);
    
    // Voice State (Game)
    const [isListening, setIsListening] = useState(false);
    const [voiceFeedback, setVoiceFeedback] = useState("");

    // Audio State
    const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
    const [playingId, setPlayingId] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            stopAudio();
        };
    }, []);

    const startGame = async (selectedTopic: string) => {
        stopAudio();
        setTopic(selectedTopic);
        setLoading(true);
        try {
            const data = await generateQuiz(selectedTopic);
            setQuestions(data);
            setCurrentIndex(0);
            setScore(0);
            setShowResult(false);
            setIsPlaying(true);
            setSelectedAnswer(null);
            setIsCorrect(null);
        } catch (e) {
            alert("Failed to start game. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnswer = (index: number) => {
        if (selectedAnswer !== null) return; // Prevent multiple clicks
        stopAudio();
        setPlayingId(null);
        setIsListening(false); // Stop listening if manual click

        setSelectedAnswer(index);
        const correct = index === questions[currentIndex].correctAnswer;
        setIsCorrect(correct);
        if (correct) {
            setScore(score + 1);
        }
    };

    const startTopicListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsTopicListening(true);
        recognition.onend = () => setIsTopicListening(false);
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setCustomTopic(transcript);
        };
        
        stopAudio();
        recognition.start();
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.lang = 'en-US'; // Listening for English answers
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
            setVoiceFeedback("Listening...");
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript.toLowerCase();
            setVoiceFeedback(`I heard: "${transcript}"`);
            
            // fuzzy match the transcript to options
            const currentOptions = questions[currentIndex].options;
            const matchIndex = currentOptions.findIndex(opt => 
                transcript.includes(opt.toLowerCase()) || opt.toLowerCase().includes(transcript)
            );

            if (matchIndex !== -1) {
                handleAnswer(matchIndex);
            } else {
                setVoiceFeedback(`Try again! I didn't catch that.`);
            }
        };
        
        stopAudio(); // Stop TTS so it doesn't interfere with mic
        recognition.start();
    };

    const nextQuestion = () => {
        stopAudio();
        setPlayingId(null);
        setVoiceFeedback("");
        if (currentIndex < questions.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setSelectedAnswer(null);
            setIsCorrect(null);
        } else {
            setShowResult(true);
        }
    };

    const quitGame = () => {
        stopAudio();
        setIsPlaying(false);
        setShowResult(false);
    };

    const handlePlayAudio = async (e: React.MouseEvent, text: string, id: string) => {
        e.stopPropagation(); // Prevent selecting the answer when clicking audio

        if (playingId === id) {
            stopAudio();
            setPlayingId(null);
            return;
        }

        stopAudio();
        setAudioLoadingId(id);
        
        try {
            const base64Audio = await generateSpeech(text, 'speech');
            setAudioLoadingId(null);

            if (base64Audio) {
                setPlayingId(id);
                await playPCM(base64Audio, () => {}); 
                setPlayingId(null);
            }
        } catch (err) {
            console.error(err);
            setAudioLoadingId(null);
            setPlayingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-4 bg-yellow-50">
                <Loader2 size={64} className="text-yellow-500 animate-spin mb-4" />
                <h2 className="text-3xl font-bold text-gray-700 animate-pulse english-font">
                    Getting Ready...
                </h2>
                <p className="text-gray-500 mt-2">Teacher Lion is thinking!</p>
            </div>
        );
    }

    if (showResult) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-6 bg-yellow-50 text-center animate-in zoom-in">
                <div className="mb-6 relative">
                     <Trophy size={100} className="text-yellow-500" />
                     <div className="absolute top-0 right-0 animate-bounce">
                         <Star size={40} className="text-orange-400 fill-current" />
                     </div>
                </div>
                
                <h2 className="text-4xl font-black text-gray-800 mb-2 fun-font">Awesome!</h2>
                
                <p className="text-xl text-gray-600 mb-6">You scored {score} out of {questions.length}!</p>
                
                <div className="bg-white p-6 rounded-3xl shadow-lg border-4 border-yellow-200 w-full max-w-sm mb-8">
                     <div className="text-5xl font-black text-yellow-500 mb-2">{(score / questions.length) * 100}%</div>
                     <p className="text-gray-400 font-bold uppercase tracking-wider">Accuracy</p>
                </div>

                <div className="flex gap-4 w-full max-w-sm">
                    <button 
                        onClick={() => startGame(topic)}
                        className="flex-1 py-4 bg-orange-500 text-white rounded-2xl font-bold shadow-md hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center"
                    >
                        <RefreshCw className="mr-2" size={20} /> Play Again
                    </button>
                    <button 
                        onClick={quitGame}
                        className="flex-1 py-4 bg-white text-gray-600 border-2 border-gray-200 rounded-2xl font-bold hover:bg-gray-50 transition-all active:scale-95 flex items-center justify-center"
                    >
                         <Home className="mr-2" size={20} /> Menu
                    </button>
                </div>
            </div>
        );
    }

    if (isPlaying && questions.length > 0) {
        const currentQ = questions[currentIndex];
        
        return (
            <div className="flex flex-col h-full p-4 bg-yellow-50 max-w-md mx-auto relative overflow-hidden">
                <div className="flex justify-between items-center mb-6 z-10">
                     <button onClick={quitGame} className="text-gray-400 hover:text-gray-600 font-bold text-sm flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                        <XCircle size={16} className="mr-1"/> Exit
                     </button>
                     <div className="bg-white px-4 py-1 rounded-full shadow-sm text-sm font-bold text-yellow-600 border border-yellow-200">
                         {currentIndex + 1} / {questions.length}
                     </div>
                     <div className="flex items-center text-orange-500 font-bold bg-white px-3 py-1 rounded-full shadow-sm">
                         <Star size={16} className="mr-1 fill-current" /> {score}
                     </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                    <div 
                        className="bg-yellow-500 h-2 rounded-full transition-all duration-500" 
                        style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
                    ></div>
                </div>

                <div className="flex-1 flex flex-col justify-center z-10 pb-20">
                    <div className="bg-white rounded-3xl p-6 shadow-xl border-b-8 border-r-4 border-yellow-200 mb-6 text-center relative">
                        <div className="absolute top-4 right-4">
                             <button
                                onClick={(e) => handlePlayAudio(e, currentQ.question, 'question')}
                                className={`p-2 rounded-full transition-colors ${
                                    playingId === 'question' ? 'bg-orange-100 text-orange-500' : 'bg-gray-50 text-gray-400 hover:bg-orange-50 hover:text-orange-500'
                                }`}
                             >
                                 {audioLoadingId === 'question' ? <Loader2 className="animate-spin" size={24}/> : 
                                  playingId === 'question' ? <Square size={24} className="fill-current"/> : <Volume2 size={24}/>}
                             </button>
                        </div>
                        <h3 className="text-2xl font-bold text-gray-800 mb-2 english-font mt-2">{currentQ.question}</h3>
                        {currentQ.pinyin && <p className="text-orange-500 font-medium mb-4">{currentQ.pinyin}</p>}
                    </div>

                    <div className="space-y-3">
                        {currentQ.options.map((option, idx) => {
                            let btnClass = "bg-white border-2 border-gray-100 text-gray-700 hover:border-yellow-300";
                            if (selectedAnswer !== null) {
                                if (idx === currentQ.correctAnswer) btnClass = "bg-green-100 border-green-500 text-green-700";
                                else if (idx === selectedAnswer) btnClass = "bg-red-100 border-red-500 text-red-700";
                                else btnClass = "bg-gray-50 border-gray-100 text-gray-400 opacity-60";
                            }

                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleAnswer(idx)}
                                    disabled={selectedAnswer !== null}
                                    className={`w-full p-4 pl-4 pr-3 rounded-xl font-bold text-lg shadow-sm transition-all flex justify-between items-center group ${btnClass} ${selectedAnswer === null ? 'active:scale-95' : ''}`}
                                >
                                    <span className="text-left flex-1">{option}</span>
                                    
                                    <div className="flex items-center gap-3">
                                        <div 
                                            onClick={(e) => handlePlayAudio(e, option, `opt-${idx}`)}
                                            className={`p-2 rounded-full transition-colors z-20 ${
                                                playingId === `opt-${idx}` 
                                                ? 'bg-orange-100 text-orange-500' 
                                                : 'text-gray-300 hover:text-orange-500 hover:bg-gray-100'
                                            }`}
                                        >
                                            {audioLoadingId === `opt-${idx}` ? <Loader2 className="animate-spin" size={20}/> : 
                                             playingId === `opt-${idx}` ? <Square size={20} className="fill-current"/> : <Volume2 size={20}/>}
                                        </div>

                                        {selectedAnswer !== null && idx === currentQ.correctAnswer && <CheckCircle2 size={24} className="text-green-600"/>}
                                        {selectedAnswer !== null && idx === selectedAnswer && idx !== currentQ.correctAnswer && <XCircle size={24} className="text-red-500"/>}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Voice Interaction Area */}
                <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center justify-center z-20 pointer-events-none">
                     <p className={`text-sm font-bold bg-black/50 text-white px-3 py-1 rounded-full mb-2 transition-opacity ${voiceFeedback ? 'opacity-100' : 'opacity-0'}`}>
                        {voiceFeedback}
                     </p>
                     
                     {selectedAnswer === null && (
                         <button 
                            onClick={startListening}
                            className={`p-4 rounded-full shadow-lg transition-all pointer-events-auto ${isListening ? 'bg-red-500 animate-pulse text-white scale-110' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                         >
                            <Mic size={28} />
                         </button>
                     )}
                </div>

                {selectedAnswer !== null && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 animate-in slide-in-from-bottom-10 z-30 rounded-t-3xl shadow-2xl">
                        <div className={`text-lg font-bold mb-1 flex items-center ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                            {isCorrect ? (
                                <>
                                    Correct! 🎉
                                </>
                            ) : (
                                <>
                                    Incorrect 😅
                                </>
                            )}
                        </div>
                        <p className="text-gray-600 text-sm mb-4">{currentQ.explanation}</p>
                        <button 
                            onClick={nextQuestion}
                            className={`w-full py-3 rounded-xl font-bold text-white shadow-md flex items-center justify-center ${isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-800 hover:bg-gray-900'}`}
                        >
                            {currentIndex < questions.length - 1 ? "Next Question" : "Finish Game"} <ArrowRight className="ml-2" size={20} />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    // Menu View
    return (
        <div className="flex flex-col h-full p-4 max-w-md mx-auto w-full overflow-y-auto no-scrollbar pb-24 bg-yellow-50">
            <div className="mb-6 mt-2 relative">
                <h2 className="text-3xl font-black text-gray-800 flex items-center english-font mb-1">
                    <span className="bg-yellow-200 p-2 rounded-xl mr-3 text-yellow-600">🎮</span>
                    Game Mode
                </h2>
                <p className="text-orange-500 font-bold ml-16 text-sm">Fun English Quizzes</p>
                <button 
                    onClick={(e) => handlePlayAudio(e, "Game Mode", "title")}
                    className="absolute right-0 top-2 p-2 rounded-full bg-white text-gray-400 hover:text-orange-500 shadow-sm"
                >
                    {audioLoadingId === 'title' ? <Loader2 size={20} className="animate-spin"/> : <Volume2 size={20}/>}
                </button>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                {TOPICS.map((t) => (
                    <button 
                        key={t.name} 
                        onClick={() => startGame(t.name)}
                        className="bg-white p-4 rounded-2xl shadow-sm border-b-4 border-yellow-200 active:border-b-0 active:translate-y-1 transition-all hover:bg-yellow-50 text-center group relative overflow-hidden"
                    >
                        <div className="text-3xl mb-2">{t.icon}</div>
                        <div className="font-bold text-gray-700 text-lg group-hover:text-orange-500 english-font">{t.name}</div>
                        
                        {/* Audio Button on card */}
                        <div 
                            onClick={(e) => handlePlayAudio(e, t.name, `topic-${t.name}`)}
                            className="absolute top-1 right-1 p-1.5 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-full transition-colors"
                        >
                            {audioLoadingId === `topic-${t.name}` ? <Loader2 size={14} className="animate-spin"/> : <Volume2 size={14}/>}
                        </div>
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-3xl p-6 shadow-md border-2 border-orange-100 text-center">
                 <h3 className="font-bold text-gray-800 mb-2 english-font">Want to try another topic?</h3>
                 
                 <div className="flex gap-2 relative">
                     <input 
                        className="flex-1 bg-gray-50 p-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-orange-200 text-center"
                        placeholder="e.g. Space, Dinosaurs..."
                        value={customTopic}
                        onChange={(e) => setCustomTopic(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && customTopic) {
                                startGame(customTopic);
                            }
                        }}
                     />
                     <button 
                        onClick={startTopicListening}
                        className={`p-3 rounded-xl transition-all ${isTopicListening ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-100 text-gray-400 hover:text-blue-500'}`}
                     >
                        <Mic size={24} />
                     </button>
                 </div>
                 {customTopic && (
                    <button 
                        onClick={() => startGame(customTopic)}
                        className="mt-3 w-full py-2 bg-blue-500 text-white rounded-xl font-bold shadow-sm flex items-center justify-center animate-in slide-in-from-top-2"
                    >
                        <Play size={16} className="mr-2 fill-current"/> Start Quiz: {customTopic}
                    </button>
                 )}
            </div>
        </div>
    );
};

export default GameMode;