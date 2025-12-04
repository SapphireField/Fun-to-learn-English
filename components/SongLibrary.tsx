import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Square, Music, BookOpen, Plus, Loader2 } from 'lucide-react';
import { generateSpeech, getLibraryContent } from '../services/geminiService';
import { playPCM, stopAudio, calculateWeightedActiveIndexForTokens } from '../utils/audio';

// Initial data
const INITIAL_ITEMS = [
    {
        id: 'twinkle',
        title: 'Twinkle Twinkle Little Star',
        chineseTitle: '一闪一闪小星星',
        content: "Twinkle, twinkle, little star,\nHow I wonder what you are!\nUp above the world so high,\nLike a diamond in the sky.",
        translation: "一闪一闪小星星，我多想知道你是什么！挂在天上那么高，就像天空中的钻石。",
        color: 'bg-yellow-400',
        type: 'rhyme'
    },
    {
        id: 'humpty',
        title: 'Humpty Dumpty',
        chineseTitle: '矮胖子',
        content: "Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall.\nAll the king's horses and all the king's men\nCouldn't put Humpty together again.",
        translation: "矮胖子坐在墙头上，矮胖子摔了个大跟斗。国王的马和国王的人，都无法把矮胖子拼回原样。",
        color: 'bg-blue-400',
        type: 'rhyme'
    },
    {
        id: 'mary',
        title: 'Mary Had a Little Lamb',
        chineseTitle: '玛丽有只小羔羊',
        content: "Mary had a little lamb,\nIts fleece was white as snow.\nAnd everywhere that Mary went,\nThe lamb was sure to go.",
        translation: "玛丽有只小羔羊，它的羊毛像雪一样白。不管玛丽走到哪里，小羊一定跟着去。",
        color: 'bg-pink-400',
        type: 'rhyme'
    },
    {
        id: 'pigs',
        title: 'Three Little Pigs',
        chineseTitle: '三只小猪',
        content: "Once upon a time, there were three little pigs.\nThe first pig built a house of straw.\nThe second pig built a house of sticks.\nThe third pig built a house of bricks.\nThe big bad wolf blew down the straw house and the stick house,\nbut he could not blow down the brick house.",
        translation: "从前有三只小猪。第一只猪盖了草房子。第二只猪盖了木棍房子。第三只猪盖了砖房子。大坏狼吹倒了草房子和木棍房子，但他吹不倒砖房子。",
        color: 'bg-green-400',
        type: 'story'
    },
    {
        id: 'headshoulders',
        title: 'Head, Shoulders, Knees and Toes',
        chineseTitle: '头，肩膀，膝盖和脚趾',
        content: "Head, shoulders, knees and toes,\nKnees and toes.\nHead, shoulders, knees and toes,\nKnees and toes.\nAnd eyes and ears and mouth and nose,\nHead, shoulders, knees and toes.",
        translation: "头，肩膀，膝盖和脚趾，膝盖和脚趾。头，肩膀，膝盖和脚趾，膝盖和脚趾。还有眼睛，耳朵，嘴巴和鼻子，头，肩膀，膝盖和脚趾。",
        color: 'bg-purple-400',
        type: 'rhyme'
    },
    {
        id: 'tortoise',
        title: 'The Tortoise and the Hare',
        chineseTitle: '龟兔赛跑',
        content: "The hare was fast, but he took a nap.\nThe tortoise was slow, but he never stopped.\nWhile the hare slept, the tortoise kept walking.\nIn the end, the slow and steady tortoise won the race.",
        translation: "兔子跑得很快，但他睡了一觉。乌龟很慢，但他从未停下。当兔子睡觉时，乌龟继续走。最后，缓慢而稳重的乌龟赢得了比赛。",
        color: 'bg-orange-400',
        type: 'story'
    },
    {
        id: 'rowboat',
        title: 'Row Row Row Your Boat',
        chineseTitle: '划船歌',
        content: "Row, row, row your boat,\nGently down the stream.\nMerrily, merrily, merrily, merrily,\nLife is but a dream.",
        translation: "划，划，划小船，顺着溪流慢慢游。快乐地，快乐地，快乐地，快乐地，生活就像一场梦。",
        color: 'bg-teal-400',
        type: 'rhyme'
    }
];

const SongLibrary: React.FC = () => {
    const [items, setItems] = useState<any[]>(INITIAL_ITEMS);
    const [selected, setSelected] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Add New Story State
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [adding, setAdding] = useState(false);

    // Playback Sync State
    const [playbackProgress, setPlaybackProgress] = useState(0);
    const requestRef = React.useRef<number | undefined>(undefined);
    const startTimeRef = React.useRef<number>(0);
    const durationRef = React.useRef<number>(0);

    // Load custom items
    useEffect(() => {
        const saved = localStorage.getItem('lionLibrary');
        if (saved) {
            setItems([...INITIAL_ITEMS, ...JSON.parse(saved)]);
        }
    }, []);

    const animate = () => {
        if (!startTimeRef.current || !durationRef.current) return;
        const now = Date.now();
        const progress = Math.min((now - startTimeRef.current) / 1000 / durationRef.current, 1);
        setPlaybackProgress(progress);
        if (progress < 1) requestRef.current = requestAnimationFrame(animate);
        else { setIsPlaying(false); setPlaybackProgress(0); }
    };

    const handlePlay = async () => {
        if(isPlaying) { 
            stopAudio(); 
            setIsPlaying(false); 
            setPlaybackProgress(0);
            if(requestRef.current) cancelAnimationFrame(requestRef.current);
            return; 
        }
        
        // Use 'song' style for rhymes, 'speech' for stories
        const style = selected.type === 'rhyme' ? 'song' : 'speech';
        const audio = await generateSpeech(selected.content, style);
        
        if(audio) { 
            setIsPlaying(true); 
            playPCM(audio, (d) => {
                durationRef.current = d;
                startTimeRef.current = Date.now();
                requestRef.current = requestAnimationFrame(animate);
            });
        }
    };
    
    const handleAdd = async () => {
        if (!newTitle.trim()) return;
        setAdding(true);
        try {
            const newItem = await getLibraryContent(newTitle);
            const itemWithId = {
                ...newItem,
                id: Date.now().toString(),
                color: newItem.type === 'rhyme' ? 'bg-pink-400' : 'bg-green-400'
            };
            
            const updatedItems = [...items, itemWithId];
            setItems(updatedItems);
            
            // Save only custom items to local storage
            const customItems = updatedItems.slice(INITIAL_ITEMS.length);
            localStorage.setItem('lionLibrary', JSON.stringify(customItems));
            
            setNewTitle('');
            setShowAdd(false);
            setSelected(itemWithId);
        } catch (e) {
            alert("Failed to create story. Try a different title.");
        } finally {
            setAdding(false);
        }
    };

    // Render logic for tokenized highlighting
    const renderContent = () => {
        if (!selected) return null;
        
        // Simple tokenizer for display
        const tokens = selected.content.match(/([\w']+|[^\w\s]+|\s+)/g) || [];
        const wordsOnly = selected.content.match(/[\w']+|[.,!?;:]/g) || []; // For sync calculation
        const wordObjects = wordsOnly.map((w: string) => ({ word: w }));

        let wordCounter = 0;
        const activeWordIndex = isPlaying ? calculateWeightedActiveIndexForTokens(playbackProgress, wordObjects) : -1;

        return tokens.map((token: string, i: number) => {
            const isWordOrPunct = /[\w']+|[.,!?;:]/.test(token);
            let isActive = false;
            
            if (isWordOrPunct) {
                if (wordCounter === activeWordIndex) isActive = true;
                wordCounter++;
            }

            return (
                <span 
                    key={i} 
                    className={`transition-all duration-200 inline-block ${
                        isActive ? 'text-orange-600 scale-110 font-bold' : 'text-gray-700'
                    }`}
                >
                    {token}
                </span>
            );
        });
    };

    if (selected) {
        return (
            <div className="h-full bg-blue-50 flex flex-col p-4 pb-24 overflow-y-auto">
                <button onClick={() => {stopAudio(); setSelected(null); setIsPlaying(false);}} className="mb-4 flex items-center font-bold text-gray-500">
                    <ArrowLeft className="mr-2"/> Back
                </button>
                <div className={`p-6 rounded-3xl text-white mb-6 ${selected.color} shadow-lg`}>
                    <h2 className="text-3xl font-black english-font mb-2">{selected.title}</h2>
                    <p className="opacity-90 chinese-font">{selected.chineseTitle}</p>
                    <span className="inline-block mt-2 bg-white/20 px-2 py-1 rounded text-xs font-bold uppercase">{selected.type}</span>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-md flex-1">
                    <div className="flex justify-end mb-4">
                        <button onClick={handlePlay} className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-full font-bold shadow-md hover:bg-blue-600 transition-all active:scale-95">
                            {isPlaying ? <Square size={16} className="fill-current"/> : <Play size={16} className="fill-current"/>} {isPlaying ? 'Stop' : 'Listen'}
                        </button>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-xl leading-relaxed mb-8 english-font">
                        {renderContent()}
                    </div>
                    <div className="border-t pt-4 bg-gray-50 -mx-6 px-6 pb-4 rounded-b-3xl">
                        <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Translation</h4>
                        <p className="text-gray-600 chinese-font leading-loose text-lg">{selected.translation || selected.chineseTranslation}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 h-full overflow-y-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-blue-600 english-font">English Library</h2>
                <button onClick={() => setShowAdd(!showAdd)} className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200">
                    <Plus size={24} />
                </button>
            </div>
            
            {showAdd && (
                <div className="bg-white p-4 rounded-2xl shadow-md mb-6 animate-in slide-in-from-top-5">
                    <h3 className="font-bold text-gray-700 mb-2">Add New Story</h3>
                    <div className="flex gap-2">
                        <input 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Three Little Pigs"
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-300"
                        />
                        <button 
                            onClick={handleAdd} 
                            disabled={adding}
                            className="bg-blue-500 text-white px-4 rounded-xl font-bold flex items-center"
                        >
                            {adding ? <Loader2 className="animate-spin"/> : 'Add'}
                        </button>
                    </div>
                </div>
            )}

            <div className="space-y-4">
                {items.map(item => (
                    <div key={item.id} onClick={() => setSelected(item)} className="bg-white p-4 rounded-2xl shadow-sm border-l-8 flex items-center cursor-pointer hover:shadow-md transition-all active:scale-95" style={{ borderLeftColor: item.color === 'bg-yellow-400' ? '#facc15' : item.color === 'bg-blue-400' ? '#60a5fa' : item.color === 'bg-pink-400' ? '#f472b6' : item.color === 'bg-green-400' ? '#4ade80' : item.color === 'bg-purple-400' ? '#c084fc' : item.color === 'bg-orange-400' ? '#fb923c' : '#2dd4bf' }}>
                        <div className={`w-12 h-12 rounded-full ${item.color} flex items-center justify-center text-white mr-4 shadow-sm`}>
                            {item.type === 'story' ? <BookOpen size={20} /> : <Music size={20} />}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg english-font">{item.title}</h3>
                            <p className="text-gray-400 text-sm chinese-font">{item.chineseTitle}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SongLibrary;