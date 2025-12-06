import React, { useState, useEffect } from 'react';
import { ArrowLeft, Play, Square, Music, BookOpen, Plus, Loader2, Star } from 'lucide-react';
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
        borderColor: 'border-yellow-500',
        type: 'rhyme'
    },
    {
        id: 'macdonald',
        title: 'Old MacDonald Had a Farm',
        chineseTitle: '老麦克唐纳有个农场',
        content: "Old MacDonald had a farm, E-I-E-I-O!\nAnd on his farm he had a cow, E-I-E-I-O!\nWith a moo-moo here and a moo-moo there,\nHere a moo, there a moo, everywhere a moo-moo!",
        translation: "老麦克唐纳有个农场，咿呀咿呀哟！在农场里他有一头牛，咿呀咿呀哟！这里哞哞叫，那里哞哞叫，到处都是哞哞叫！",
        color: 'bg-green-400',
        borderColor: 'border-green-500',
        type: 'rhyme'
    },
    {
        id: 'bus',
        title: 'The Wheels on the Bus',
        chineseTitle: '公车上的轮子',
        content: "The wheels on the bus go round and round,\nRound and round, round and round.\nThe wheels on the bus go round and round,\nAll through the town.",
        translation: "公车上的轮子转呀转，转呀转，转呀转。公车上的轮子转呀转，跑遍整个城市。",
        color: 'bg-blue-400',
        borderColor: 'border-blue-500',
        type: 'rhyme'
    },
    {
        id: 'london',
        title: 'London Bridge is Falling Down',
        chineseTitle: '伦敦大桥倒塌了',
        content: "London Bridge is falling down,\nFalling down, falling down.\nLondon Bridge is falling down,\nMy fair lady.",
        translation: "伦敦大桥倒塌了，倒塌了，倒塌了。伦敦大桥倒塌了，我美丽的淑女。",
        color: 'bg-red-400',
        borderColor: 'border-red-500',
        type: 'rhyme'
    },
    {
        id: 'spider',
        title: 'Itsy Bitsy Spider',
        chineseTitle: '这只小蜘蛛',
        content: "The itsy bitsy spider climbed up the water spout.\nDown came the rain and washed the spider out.\nOut came the sun and dried up all the rain,\nAnd the itsy bitsy spider climbed up the spout again.",
        translation: "这只小蜘蛛爬上排水管。雨水落下来，把蜘蛛冲走了。太阳出来，晒干了雨水，这只小蜘蛛又爬上了排水管。",
        color: 'bg-purple-400',
        borderColor: 'border-purple-500',
        type: 'rhyme'
    },
    {
        id: 'pigs',
        title: 'Three Little Pigs',
        chineseTitle: '三只小猪',
        content: "Once upon a time, there were three little pigs.\nThe first pig built a house of straw.\nThe second pig built a house of sticks.\nThe third pig built a house of bricks.\nThe big bad wolf blew down the straw house and the stick house,\nbut he could not blow down the brick house.",
        translation: "从前有三只小猪。第一只猪盖了草房子。第二只猪盖了木棍房子。第三只猪盖了砖房子。大坏狼吹倒了草房子和木棍房子，但他吹不倒砖房子。",
        color: 'bg-orange-400',
        borderColor: 'border-orange-500',
        type: 'story'
    },
    {
        id: 'shark',
        title: 'Baby Shark',
        chineseTitle: '鲨鱼宝宝',
        content: "Baby shark, doo doo doo doo doo doo.\nBaby shark, doo doo doo doo doo doo.\nBaby shark, doo doo doo doo doo doo.\nBaby shark!",
        translation: "鲨鱼宝宝，嘟嘟嘟... 鲨鱼宝宝！",
        color: 'bg-teal-400',
        borderColor: 'border-teal-500',
        type: 'rhyme'
    },
    {
        id: 'headshoulders',
        title: 'Head, Shoulders, Knees and Toes',
        chineseTitle: '头，肩膀，膝盖和脚趾',
        content: "Head, shoulders, knees and toes, knees and toes.\nHead, shoulders, knees and toes, knees and toes.\nAnd eyes, and ears, and mouth, and nose.\nHead, shoulders, knees and toes, knees and toes.",
        translation: "头，肩膀，膝盖和脚趾，膝盖和脚趾。还有眼睛，耳朵，嘴巴和鼻子。",
        color: 'bg-pink-400',
        borderColor: 'border-pink-500',
        type: 'rhyme'
    },
    {
        id: 'rowboat',
        title: 'Row Row Row Your Boat',
        chineseTitle: '划小船',
        content: "Row, row, row your boat,\nGently down the stream.\nMerrily, merrily, merrily, merrily,\nLife is but a dream.",
        translation: "划，划，划小船，顺流而下。快乐地，快乐地，快乐地，快乐地，生活就像一场梦。",
        color: 'bg-cyan-400',
        borderColor: 'border-cyan-500',
        type: 'rhyme'
    },
    {
        id: 'humpty',
        title: 'Humpty Dumpty',
        chineseTitle: '矮胖子',
        content: "Humpty Dumpty sat on a wall,\nHumpty Dumpty had a great fall.\nAll the king's horses and all the king's men\nCouldn't put Humpty together again.",
        translation: "矮胖子坐在墙上，摔了个大跟头。国王所有的马和士兵，都无法把他拼回去了。",
        color: 'bg-lime-400',
        borderColor: 'border-lime-500',
        type: 'rhyme'
    },
    {
        id: 'tortoise',
        title: 'The Tortoise and the Hare',
        chineseTitle: '龟兔赛跑',
        content: "The hare was fast. The tortoise was slow.\nThe hare stopped to sleep. The tortoise kept going.\nSlow and steady wins the race.\nThe tortoise won the race!",
        translation: "兔子跑得快，乌龟爬得慢。兔子停下来睡觉，乌龟坚持不懈。稳扎稳打赢得比赛。乌龟赢了！",
        color: 'bg-indigo-400',
        borderColor: 'border-indigo-500',
        type: 'story'
    },
    {
        id: 'redriding',
        title: 'Little Red Riding Hood',
        chineseTitle: '小红帽',
        content: "Little Red Riding Hood went to visit her grandma.\nShe met a big bad wolf.\nThe wolf pretended to be grandma.\n'What big teeth you have!' said Little Red Riding Hood.\n'All the better to eat you with!' said the wolf.\nA woodcutter heard them and saved them.",
        translation: "小红帽去看外婆。她遇到了大灰狼。狼假装成外婆。“你的牙齿真大啊！”小红帽说。“是为了更好地吃掉你！”狼说。樵夫听到了，救了她们。",
        color: 'bg-rose-400',
        borderColor: 'border-rose-500',
        type: 'story'
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

    // Cleanup audio on unmount
    useEffect(() => {
        return () => {
            stopAudio();
            if (requestRef.current) cancelAnimationFrame(requestRef.current);
        };
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
                color: newItem.type === 'rhyme' ? 'bg-pink-400' : 'bg-green-400',
                borderColor: newItem.type === 'rhyme' ? 'border-pink-500' : 'border-green-500'
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
            alert("Could not create story. Try another title.");
        } finally {
            setAdding(false);
        }
    };

    const renderContent = () => {
        if (!selected) return null;
        
        const tokens = selected.content.match(/([\w']+|[^\w\s]+|\s+)/g) || [];
        const wordsOnly = selected.content.match(/[\w']+|[.,!?;:]/g) || []; 
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
                    className={`transition-all duration-200 inline-block rounded px-1 ${
                        isActive ? 'text-orange-600 bg-orange-100 scale-110 font-bold transform -translate-y-1 shadow-sm' : 'text-gray-700'
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
                <button onClick={() => {stopAudio(); setSelected(null); setIsPlaying(false);}} className="mb-4 flex items-center font-bold text-gray-500 hover:text-blue-500 bouncy">
                    <ArrowLeft className="mr-2"/> Back to Library
                </button>
                <div className={`p-6 rounded-3xl text-white mb-6 ${selected.color} shadow-lg border-b-8 ${selected.borderColor}`}>
                    <h2 className="text-4xl font-black english-font mb-2 drop-shadow-md">{selected.title}</h2>
                    <p className="opacity-90 chinese-font text-xl">{selected.chineseTitle}</p>
                    <span className="inline-block mt-3 bg-black/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-white/20">
                        {selected.type === 'rhyme' ? 'Song 🎵' : 'Story 📖'}
                    </span>
                </div>
                <div className="bg-white rounded-3xl p-6 shadow-xl border-4 border-white flex-1 relative">
                    <div className="absolute top-4 right-4">
                        <button 
                            onClick={handlePlay} 
                            className={`flex items-center gap-2 p-4 rounded-full font-bold shadow-lg transition-all bouncy ${isPlaying ? 'bg-red-400 text-white' : 'bg-green-400 text-white'}`}
                        >
                            {isPlaying ? <Square size={24} className="fill-current"/> : <Play size={24} className="fill-current"/>}
                        </button>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-2xl leading-relaxed mb-8 english-font pt-12">
                        {renderContent()}
                    </div>
                    <div className="border-t-2 border-dashed border-gray-200 pt-6 mt-6">
                        <h4 className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center"><Star size={16} className="mr-1"/> Chinese Meaning</h4>
                        <p className="text-gray-600 chinese-font leading-loose text-lg font-medium">{selected.translation || selected.chineseTranslation}</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="p-4 h-full overflow-y-auto pb-24">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-blue-600 english-font drop-shadow-sm">Song Library</h2>
                    <p className="text-gray-400 font-bold text-sm">Sing & Read Along!</p>
                </div>
                <button onClick={() => setShowAdd(!showAdd)} className="p-3 bg-white text-blue-500 rounded-full hover:bg-blue-50 shadow-md bouncy border-2 border-blue-100">
                    <Plus size={28} />
                </button>
            </div>
            
            {showAdd && (
                <div className="bg-white p-4 rounded-3xl shadow-lg mb-6 animate-in slide-in-from-top-5 border-4 border-blue-100">
                    <h3 className="font-bold text-gray-700 mb-2">Add a New Story</h3>
                    <div className="flex gap-2">
                        <input 
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Frozen"
                            className="flex-1 bg-gray-50 border-2 border-gray-200 rounded-2xl px-4 py-3 outline-none focus:border-blue-400 font-bold text-lg"
                        />
                        <button 
                            onClick={handleAdd} 
                            disabled={adding}
                            className="bg-blue-500 text-white px-6 rounded-2xl font-bold flex items-center bouncy shadow-md"
                        >
                            {adding ? <Loader2 className="animate-spin"/> : 'Add'}
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {items.map(item => (
                    <div 
                        key={item.id} 
                        onClick={() => setSelected(item)} 
                        className={`bg-white p-4 rounded-3xl shadow-sm border-b-8 flex items-center cursor-pointer hover:shadow-lg transition-all active:scale-95 group relative overflow-hidden ${item.borderColor || 'border-gray-200'}`}
                    >
                        <div className={`w-16 h-16 rounded-2xl ${item.color} flex items-center justify-center text-white mr-4 shadow-inner transform group-hover:rotate-6 transition-transform`}>
                            {item.type === 'story' ? <BookOpen size={32} /> : <Music size={32} />}
                        </div>
                        <div className="flex-1 z-10">
                            <h3 className="font-black text-gray-800 text-xl english-font mb-0.5">{item.title}</h3>
                            <p className="text-gray-500 font-bold chinese-font">{item.chineseTitle}</p>
                        </div>
                        <div className="opacity-0 group-hover:opacity-10 absolute right-4 transition-opacity">
                            {item.type === 'story' ? <BookOpen size={80} /> : <Music size={80} />}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SongLibrary;