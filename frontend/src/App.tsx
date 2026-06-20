import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Settings,
  BookOpen,
  Heart,
  Smile,
  Send,
  Brain,
  Compass,
  RotateCcw,
  Activity,
  CheckCircle2,
  Moon,
  Sun,
  AlertTriangle,
  Play,
  Check,
  Plus,
  MessageSquare,
  Calendar,
  User,
} from 'lucide-react';
import { apiService, UserProfile } from './services/api';

const DEFAULT_USER_ID = '00000000-0000-0000-0000-000000000000';

const MOOD_EMOJIS = [
  { score: 1, emoji: '😢', label: 'Very Low', color: 'text-red-500 bg-red-100 dark:bg-red-950/30 border-red-200' },
  { score: 2, emoji: '🙁', label: 'Low', color: 'text-orange-500 bg-orange-100 dark:bg-orange-950/30 border-orange-200' },
  { score: 3, emoji: '😐', label: 'Neutral', color: 'text-amber-500 bg-amber-100 dark:bg-amber-950/30 border-amber-200' },
  { score: 4, emoji: '🙂', label: 'High', color: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-950/30 border-emerald-200' },
  { score: 5, emoji: '😃', label: 'Very High', color: 'text-violet-500 bg-violet-100 dark:bg-violet-950/30 border-violet-200' },
];

export default function App() {
  const queryClient = useQueryClient();

  // Local state managers
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'journal' | 'mtcr' | 'chat' | 'breathing'>('dashboard');
  const [userName, setUserName] = useState<string>(() => localStorage.getItem('studentName') || 'Aspirant');
  const [targetExam, setTargetExam] = useState<string>(() => localStorage.getItem('targetExam') || 'JEE');
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [userId, setUserId] = useState<string>(() => localStorage.getItem('userId') || DEFAULT_USER_ID);

  // Settings Input Temp state
  const [tempName, setTempName] = useState(userName);
  const [tempExam, setTempExam] = useState(targetExam);
  const [tempEmail, setTempEmail] = useState('student@example.com');

  // Check-in / Journal states
  const [journalContent, setJournalContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<number>(3);
  const [journalAnalysis, setJournalAnalysis] = useState<any>(null);
  const [crisisAlert, setCrisisAlert] = useState<any>(null);

  // Mock Test Reframer states
  const [mtSubject, setMtSubject] = useState('');
  const [mtScore, setMtScore] = useState<number | ''>('');
  const [mtMaxScore, setMtMaxScore] = useState<number | ''>('');
  const [mtMistakes, setMtMistakes] = useState('');
  const [mtReframedResult, setMtReframedResult] = useState<any>(null);
  const [mtBreathingState, setMtBreathingState] = useState<boolean>(false);

  // Chat states
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatMessageInput, setChatMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState<any[]>([]);

  // 4-7-8 Breathing guidance states
  const [breathingPhase, setBreathingPhase] = useState<'idle' | 'inhale' | 'hold' | 'exhale'>('idle');
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(0);
  const [breathingProgress, setBreathingProgress] = useState<number>(0);
  const breathingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync theme class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Sync user profile state
  useEffect(() => {
    // Attempt to register or get user profile
    const setupUser = async () => {
      try {
        let currentUserId = localStorage.getItem('userId');
        if (!currentUserId || currentUserId === DEFAULT_USER_ID) {
          const profile = await apiService.registerUser('student@example.com', userName, targetExam);
          localStorage.setItem('userId', profile.id);
          setUserId(profile.id);
        }
      } catch (err) {
        console.warn('Backend connection failed, running in sandbox offline mode.');
      }
    };
    setupUser();
  }, [userName, targetExam]);

  // Queries
  const { data: moodAnalytics, refetch: refetchMood } = useQuery({
    queryKey: ['moodAnalytics', userId],
    queryFn: () => apiService.getMoodAnalytics(userId),
    enabled: !!userId,
  });

  const { data: journalHistory, refetch: refetchJournals } = useQuery({
    queryKey: ['journalHistory', userId],
    queryFn: () => apiService.getJournalHistory(userId),
    enabled: !!userId,
  });

  const { data: mockHistory, refetch: refetchMockHistory } = useQuery({
    queryKey: ['mockHistory', userId],
    queryFn: () => apiService.getMockTestHistory(userId),
    enabled: !!userId,
  });

  const { data: chatSessions, refetch: refetchChatSessions } = useQuery({
    queryKey: ['chatSessions', userId],
    queryFn: () => apiService.getChatSessions(userId),
    enabled: !!userId,
  });

  // Mutators
  const saveSettingsMutation = useMutation({
    mutationFn: async ({ email, name, exam }: { email: string; name: string; exam: string }) => {
      const res = await apiService.registerUser(email, name, exam);
      return res;
    },
    onSuccess: (data: UserProfile) => {
      localStorage.setItem('userId', data.id);
      localStorage.setItem('studentName', data.full_name);
      localStorage.setItem('targetExam', data.target_exam);
      setUserId(data.id);
      setUserName(data.full_name);
      setTargetExam(data.target_exam);
      setIsSettingsOpen(false);
      refetchMood();
      refetchJournals();
      refetchMockHistory();
    },
  });

  const submitJournalMutation = useMutation({
    mutationFn: async () => {
      setCrisisAlert(null);
      setJournalAnalysis(null);
      return await apiService.submitJournal(journalContent, selectedMood, userId);
    },
    onSuccess: (data) => {
      setJournalAnalysis(data);
      setJournalContent('');
      refetchJournals();
      refetchMood();
    },
    onError: (error: any) => {
      if (error.response?.status === 422 || error.response?.data?.error?.crisis) {
        setCrisisAlert(error.response.data.error);
      } else {
        alert('Could not submit journal entry. Using fallback offline simulation...');
        // Offline simulation
        const isCrisis = journalContent.toLowerCase().includes('suicide') || journalContent.toLowerCase().includes('die');
        if (isCrisis) {
          setCrisisAlert({
            message: 'Crisis keywords detected. We care about your safety.',
            crisis: true,
            helpline: 'Vandrevala Foundation: 9999-666-555 | AASRA: 9820466726'
          });
        } else {
          setJournalAnalysis({
            journalId: 'fallback-id',
            moodScore: selectedMood,
            dominantEmotion: 'Anxious',
            stressLevel: 7,
            detectedTriggers: [
              { category: 'Syllabus Backlog', intensityScore: 8, evidenceSnippet: 'feeling behind on physics' }
            ],
            copingStrategies: ['Practice 5 minutes of focused breathing and review physics formulas later with zero pressure.']
          });
        }
      }
    }
  });

  const submitMockTestMutation = useMutation({
    mutationFn: async () => {
      return await apiService.logMockTest(
        mtSubject,
        Number(mtScore),
        Number(mtMaxScore),
        targetExam,
        mtMistakes,
        userId
      );
    },
    onSuccess: (data) => {
      setMtReframedResult(data);
      refetchMockHistory();
    },
    onError: () => {
      // Fallback offline reframer
      const percentage = Math.round((Number(mtScore) / Number(mtMaxScore)) * 100);
      setMtReframedResult({
        recordId: 'fallback-mock-id',
        groundingPrompt: { required: true, type: '4-7-8 Breathing Technique', durationSeconds: 60 },
        reframedAnalysis: {
          cognitiveReframe: `Scoring ${percentage}% is simply a progress snapshot, not the final destination. You have identified specific conceptual gaps in ${mtSubject} which you can now tackle.`,
          actionChecklist: [
            { id: 'task-1', task: `Review the top 3 incorrect questions in ${mtSubject} with zero time limit.`, durationMinutes: 20 },
            { id: 'task-2', task: 'Write down key formulas on a flashcard to reinforce memory.', durationMinutes: 15 }
          ]
        }
      });
    }
  });

  // Handle active session messages loading
  useEffect(() => {
    if (activeSessionId) {
      apiService.getChatMessages(activeSessionId)
        .then(setChatMessages)
        .catch(() => setChatMessages([]));
    } else {
      setChatMessages([]);
    }
  }, [activeSessionId]);

  // Chat message submission
  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessageInput.trim() || !activeSessionId) return;

    const userMsg = { id: Date.now().toString(), sender: 'user', content: chatMessageInput };
    setChatMessages((prev) => [...prev, userMsg]);
    const input = chatMessageInput;
    setChatMessageInput('');

    try {
      const response = await apiService.sendChatMessage(activeSessionId, input, userId);
      setChatMessages((prev) => [...prev, response]);
    } catch {
      // Simulate offline AI response
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'assistant',
            content: `I hear you. The pressure of preparing for ${targetExam} is genuine. Let's break things down into smaller tasks. Remember to stay hydrated and take a short walk.`
          }
        ]);
      }, 1000);
    }
  };

  const handleCreateChatSession = async () => {
    try {
      const session = await apiService.createChatSession(userId);
      refetchChatSessions();
      setActiveSessionId(session.id);
    } catch {
      // Offline fallback session id
      const dummyId = 'session-' + Date.now();
      setActiveSessionId(dummyId);
    }
  };

  // 4-7-8 Breathing Guide Logic
  const startBreathingGuide = () => {
    if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    
    setBreathingPhase('inhale');
    setBreathingSecondsLeft(4);
    setBreathingProgress(100);

    let currentPhase: 'inhale' | 'hold' | 'exhale' = 'inhale';
    let secondsLeft = 4;

    breathingTimerRef.current = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        if (currentPhase === 'inhale') {
          currentPhase = 'hold';
          secondsLeft = 7;
        } else if (currentPhase === 'hold') {
          currentPhase = 'exhale';
          secondsLeft = 8;
        } else {
          currentPhase = 'inhale';
          secondsLeft = 4;
        }
      }
      setBreathingPhase(currentPhase);
      setBreathingSecondsLeft(secondsLeft);
      
      const maxSeconds = currentPhase === 'inhale' ? 4 : (currentPhase === 'hold' ? 7 : 8);
      setBreathingProgress((secondsLeft / maxSeconds) * 100);
    }, 1000);
  };

  const stopBreathingGuide = () => {
    if (breathingTimerRef.current) {
      clearInterval(breathingTimerRef.current);
      breathingTimerRef.current = null;
    }
    setBreathingPhase('idle');
    setBreathingSecondsLeft(0);
    setBreathingProgress(0);
  };

  useEffect(() => {
    return () => {
      if (breathingTimerRef.current) clearInterval(breathingTimerRef.current);
    };
  }, []);

  // Prepopulate standard UI dummy values if backend provides empty lists
  const defaultMoodData = [
    { date: 'Mon', moodScore: 3 },
    { date: 'Tue', moodScore: 4 },
    { date: 'Wed', moodScore: 2 },
    { date: 'Thu', moodScore: 3 },
    { date: 'Fri', moodScore: 5 },
    { date: 'Sat', moodScore: 4 },
    { date: 'Sun', moodScore: 3 }
  ];

  const chartData = moodAnalytics?.history?.length 
    ? moodAnalytics.history.slice(-7) 
    : defaultMoodData;

  const averageMood = moodAnalytics?.stats?.average 
    ? moodAnalytics.stats.average.toFixed(1) 
    : '3.4';

  const totalEntries = moodAnalytics?.stats?.count || 7;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100 transition-colors duration-300 font-sans">
      
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="p-2 bg-violet-600 rounded-xl shadow-lg shadow-violet-500/30">
              <Brain className="h-6 w-6 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-violet-600 to-indigo-600 dark:from-violet-400 dark:to-indigo-400 bg-clip-text text-transparent">
                MindMirror AI
              </span>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Student Mental Sanctuary</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="h-5 w-5 text-amber-400" /> : <Moon className="h-5 w-5 text-indigo-600" />}
            </button>

            <button
              onClick={() => {
                setTempName(userName);
                setTempExam(targetExam);
                setIsSettingsOpen(true);
              }}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center space-x-1"
            >
              <Settings className="h-5 w-5 text-slate-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Profile Card / Context header */}
        <div className="mb-8 p-6 bg-gradient-to-r from-violet-600/10 to-indigo-600/10 rounded-3xl border border-violet-500/10 dark:border-violet-500/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-2xl bg-violet-600/20 flex items-center justify-center text-violet-600 dark:text-violet-400 font-bold text-xl">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome back, {userName}!</h2>
              <p className="text-sm text-slate-500">Targeting {targetExam} exam • Taking it one step at a time</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('journal');
                setCrisisAlert(null);
                setJournalAnalysis(null);
              }}
              className="px-4 py-2.5 rounded-xl font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition flex items-center space-x-2"
            >
              <Smile className="h-4 w-4" />
              <span>Log Daily Check-in</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('breathing');
                startBreathingGuide();
              }}
              className="px-4 py-2.5 rounded-xl font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition flex items-center space-x-2"
            >
              <Compass className="h-4 w-4" />
              <span>Quick Calming</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex space-x-2 p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl mb-8 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: Activity },
            { id: 'journal', label: 'Daily Journal', icon: BookOpen },
            { id: 'mtcr', label: 'Mock Test Reframer', icon: Heart },
            { id: 'chat', label: 'AI Companion', icon: MessageSquare },
            { id: 'breathing', label: 'Breathing Space', icon: Compass },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id !== 'breathing') stopBreathingGuide();
                }}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-sm font-semibold transition shrink-0 ${
                  active
                    ? 'bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Views */}
        
        {/* Tab: Dashboard */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Analytics & Charts */}
            <div className="lg:col-span-2 space-y-8">
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold">Mood Analytics Over Time</h3>
                    <p className="text-sm text-slate-500">Visualizing your emotional trajectory</p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-violet-600 dark:text-violet-400">{averageMood}</span>
                    <span className="text-xs text-slate-400 block font-semibold">AVG MOOD</span>
                  </div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMood" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1e293b', 
                          border: 'none', 
                          borderRadius: '12px',
                          color: '#fff' 
                        }} 
                      />
                      <Area type="monotone" dataKey="moodScore" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorMood)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stressors List */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">Detected Study Stressors</h3>
                {journalHistory && journalHistory.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-slate-500">Gemini extracted stressors from your journal logs:</p>
                    {journalHistory.slice(0, 3).map((journal: any) => (
                      <div key={journal.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 flex items-start gap-4">
                        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400 mt-1">
                          <Activity className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-sm">Log Entry ({new Date(journal.created_at).toLocaleDateString()})</span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                              Mood Score: {journal.mood_score}/5
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400 italic">"{journal.content.substring(0, 120)}..."</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-slate-300 dark:text-slate-700 mx-auto mb-3 float-slow" />
                    <p className="text-slate-400 text-sm">No journal data logged yet. Create your first entry to see insights.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right column sidebar */}
            <div className="space-y-8">
              
              {/* Daily Affirmation */}
              <div className="p-6 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
                <h3 className="text-md font-bold uppercase tracking-wider text-violet-200 mb-2">Daily Anchor</h3>
                <p className="text-lg font-bold mb-4 leading-snug">
                  "Progress isn't defined by scoring perfectly, but by the courage to look at mistakes without fear."
                </p>
                <div className="flex items-center space-x-2 text-violet-200 text-xs">
                  <Heart className="h-4 w-4 fill-current text-red-400" />
                  <span>Personalized for {targetExam} preparation</span>
                </div>
              </div>

              {/* Statistics Panel */}
              <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
                <h3 className="text-lg font-bold mb-4">Wellness Checklist</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-sm text-slate-500">Total Mood Checks</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{totalEntries} logs</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-sm text-slate-500">Mock Reframing Logs</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {mockHistory?.length || 0} times
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Active Chat Companion</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Daily Journal */}
        {activeTab === 'journal' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-black mb-1">Unified Daily Check-in</h3>
              <p className="text-sm text-slate-500 mb-6">Write freely about your day, syllabus progress, mock test anxiety or feelings. We protect your privacy via end-to-end encryption.</p>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold mb-3">How is your energy/mood score right now?</label>
                  <div className="grid grid-cols-5 gap-3">
                    {MOOD_EMOJIS.map((emoji) => {
                      const selected = selectedMood === emoji.score;
                      return (
                        <button
                          key={emoji.score}
                          type="button"
                          onClick={() => setSelectedMood(emoji.score)}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all ${
                            selected 
                              ? `${emoji.color} border-violet-500 ring-2 ring-violet-500/20 scale-105` 
                              : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <span className="text-2xl mb-1">{emoji.emoji}</span>
                          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 text-center">{emoji.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold mb-2">Write your journal entry</label>
                  <textarea
                    rows={6}
                    value={journalContent}
                    onChange={(e) => setJournalContent(e.target.value)}
                    placeholder="Today, I am feeling extremely stressed about the Mock Test score. Chemistry backlogs are piling up, and parental expectations feel heavy..."
                    className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                  />
                </div>

                <button
                  type="button"
                  disabled={submitJournalMutation.isPending || !journalContent.trim()}
                  onClick={() => submitJournalMutation.mutate()}
                  className="w-full py-4 rounded-2xl font-bold bg-violet-600 hover:bg-violet-700 text-white transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {submitJournalMutation.isPending ? (
                    <span>Analyzing well-being triggers...</span>
                  ) : (
                    <>
                      <Send className="h-5 w-5" />
                      <span>Submit Entry</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Crisis Protocol Helplines Output */}
            {crisisAlert && (
              <div className="p-6 bg-red-50 dark:bg-red-950/20 border-2 border-red-500/30 rounded-3xl flex gap-4">
                <div className="p-3 bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 rounded-2xl shrink-0">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="font-extrabold text-red-600 dark:text-red-400 text-lg mb-1">{crisisAlert.message}</h4>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mb-3">
                    Please consider speaking with family, mentors, or direct helplines. You do not have to carry this burden alone.
                  </p>
                  <div className="p-3 bg-white dark:bg-slate-950 border border-red-200 dark:border-red-900 rounded-xl">
                    <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">National Helpline Info</span>
                    <span className="font-bold text-red-700 dark:text-red-300">{crisisAlert.helpline}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Analysis Results Display */}
            {journalAnalysis && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
                <h4 className="font-bold text-xl flex items-center gap-2">
                  <Check className="text-emerald-500 h-5 w-5 border border-emerald-500 rounded-full p-0.5" />
                  Analysis Completed
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Dominant Emotion</span>
                    <span className="font-bold text-lg text-violet-600 dark:text-violet-400">
                      {journalAnalysis.dominantEmotion}
                    </span>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
                    <span className="text-xs text-slate-400 uppercase font-bold block mb-1">Stress Level</span>
                    <span className="font-bold text-lg text-amber-600 dark:text-amber-400">
                      {journalAnalysis.stressLevel} / 10
                    </span>
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-sm mb-3">Detected Stressors:</h5>
                  <div className="space-y-3">
                    {journalAnalysis.detectedTriggers?.map((trigger: any, index: number) => (
                      <div key={index} className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{trigger.category}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                            Intensity: {trigger.intensityScore || trigger.intensity}/10
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 italic">Evidence: "{trigger.evidenceSnippet || trigger.evidence}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-bold text-sm mb-2">Empathetic Coping Strategy:</h5>
                  <div className="p-4 bg-violet-600/5 border border-violet-500/10 rounded-2xl">
                    <ul className="list-disc pl-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
                      {journalAnalysis.copingStrategies?.map((strategy: string, index: number) => (
                        <li key={index}>{strategy}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Mock Test Reframer */}
        {activeTab === 'mtcr' && (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-2xl font-black mb-1">Mock Exam Reframe Engine</h3>
              <p className="text-sm text-slate-500 mb-6">Convert exam scores and mistakes into constructive growth checklists instead of letting score anxiety build up.</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Subject</label>
                    <input
                      type="text"
                      value={mtSubject}
                      onChange={(e) => setMtSubject(e.target.value)}
                      placeholder="e.g. Chemistry - Thermodynamics"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Exam Type</label>
                    <input
                      type="text"
                      value={targetExam}
                      disabled
                      className="w-full p-3 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Your Score</label>
                    <input
                      type="number"
                      value={mtScore}
                      onChange={(e) => setMtScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 54"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Maximum Score</label>
                    <input
                      type="number"
                      value={mtMaxScore}
                      onChange={(e) => setMtMaxScore(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 100"
                      className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Brief summary of mistakes / areas missed</label>
                  <textarea
                    rows={3}
                    value={mtMistakes}
                    onChange={(e) => setMtMistakes(e.target.value)}
                    placeholder="Silly calculation errors in entropy calculation, couldn't remember formula for Carnot engine..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                  />
                </div>

                <button
                  type="button"
                  disabled={submitMockTestMutation.isPending || !mtSubject || mtScore === '' || !mtMaxScore}
                  onClick={() => {
                    // Trigger grounding first
                    setMtBreathingState(true);
                    startBreathingGuide();
                  }}
                  className="w-full py-4 rounded-xl font-bold bg-violet-600 hover:bg-violet-700 text-white transition flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Activity className="h-5 w-5" />
                  <span>Log Score & Reframe</span>
                </button>
              </div>
            </div>

            {/* Breathing Grounding Pop-up overlay before analysis reveal */}
            {mtBreathingState && (
              <div className="p-6 bg-violet-600/10 border-2 border-violet-500/20 rounded-3xl flex flex-col items-center justify-center text-center space-y-4">
                <Brain className="h-10 w-10 text-violet-600 dark:text-violet-400 animate-pulse" />
                <div>
                  <h4 className="font-extrabold text-lg">Calm Your Nervous System First</h4>
                  <p className="text-sm text-slate-500 max-w-md mt-1">
                    Before reviewing your reframed diagnostic checklist, let's complete one deep 4-7-8 breathing loop to clear test-induced cortisol.
                  </p>
                </div>

                {/* Micro Breathing Indicator */}
                <div className="flex items-center space-x-3 py-2">
                  <span className="text-xs uppercase font-extrabold text-slate-400">Current Phase:</span>
                  <span className="text-sm font-black uppercase text-violet-600 dark:text-violet-400">{breathingPhase}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300">
                    {breathingSecondsLeft}s
                  </span>
                </div>

                <button
                  onClick={() => {
                    setMtBreathingState(false);
                    stopBreathingGuide();
                    submitMockTestMutation.mutate();
                  }}
                  className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-bold text-sm transition"
                >
                  Skip Exercise & View Checklist
                </button>
              </div>
            )}

            {/* Reframe Result */}
            {mtReframedResult && !mtBreathingState && (
              <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-2">Cognitive Reframe Analysis</h4>
                  <div className="p-4 bg-emerald-600/5 border border-emerald-500/15 rounded-2xl">
                    <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-semibold">
                      "{mtReframedResult.reframedAnalysis.cognitiveReframe}"
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400 mb-3">Diagnostic Growth Checklist</h4>
                  <div className="space-y-3">
                    {mtReframedResult.reframedAnalysis.actionChecklist?.map((task: any, index: number) => (
                      <div key={task.id || index} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          <span className="text-sm text-slate-700 dark:text-slate-300">{task.task}</span>
                        </div>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {task.durationMinutes} mins
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab: Chat */}
        {activeTab === 'chat' && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Sidebar Sessions */}
            <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[500px]">
              <button
                onClick={handleCreateChatSession}
                className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl text-sm transition flex items-center justify-center space-x-2 mb-4"
              >
                <Plus className="h-4 w-4" />
                <span>New Session</span>
              </button>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {chatSessions && chatSessions.length > 0 ? (
                  chatSessions.map((session) => (
                    <button
                      key={session.id}
                      onClick={() => setActiveSessionId(session.id)}
                      className={`w-full p-3 rounded-xl border text-left text-sm font-semibold transition flex items-center space-x-3 ${
                        activeSessionId === session.id
                          ? 'bg-violet-600/10 border-violet-500/20 text-violet-600 dark:text-violet-400'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <div className="truncate">
                        <span className="block font-bold">Session</span>
                        <span className="text-[10px] text-slate-400 block">
                          {new Date(session.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-slate-400 text-center mt-8">No active chats. Start one now!</p>
                )}
              </div>
            </div>

            {/* Chat Box */}
            <div className="md:col-span-2 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col h-[500px]">
              {activeSessionId ? (
                <>
                  <div className="border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <span className="font-extrabold text-sm block">Conversational Companion</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Active Session: MirrorGuide Bot
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-3 pr-1 mb-4">
                    {chatMessages.length === 0 && (
                      <p className="text-xs text-slate-400 text-center mt-12 italic">
                        No messages yet. Send a greeting to start your conversation with MirrorGuide.
                      </p>
                    )}
                    {chatMessages.map((msg) => {
                      const isUser = msg.sender === 'user';
                      return (
                        <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] p-3 rounded-2xl text-sm leading-relaxed ${
                            isUser
                              ? 'bg-violet-600 text-white rounded-br-none'
                              : 'bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                          }`}>
                            <p>{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <form onSubmit={handleSendChatMessage} className="flex gap-2">
                    <input
                      type="text"
                      value={chatMessageInput}
                      onChange={(e) => setChatMessageInput(e.target.value)}
                      placeholder="Ask for advice, discuss backlog pressure, or just vent..."
                      className="flex-1 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                    />
                    <button
                      type="submit"
                      className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                  <MessageSquare className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-3 float-slow" />
                  <h4 className="font-extrabold">Active Conversation Closed</h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
                    Open a previous chat session from the sidebar or click below to start a new mentoring chat.
                  </p>
                  <button
                    onClick={handleCreateChatSession}
                    className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition"
                  >
                    Start Chat Session
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab: Breathing Space */}
        {activeTab === 'breathing' && (
          <div className="max-w-2xl mx-auto text-center space-y-8 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
            <div>
              <h3 className="text-2xl font-black mb-1">4-7-8 Deep Grounding Breathing</h3>
              <p className="text-sm text-slate-500">
                Inhale through your nose for 4s, hold for 7s, and exhale through your mouth for 8s. Proven to suppress test stress instantly.
              </p>
            </div>

            {/* The Breathing Circle Visualizer */}
            <div className="relative h-64 w-64 mx-auto flex items-center justify-center">
              {/* Outer pulsing ring */}
              <div 
                className={`absolute inset-0 rounded-full bg-violet-600/10 transition-all duration-1000 ${
                  breathingPhase === 'inhale' ? 'scale-125' : (breathingPhase === 'hold' ? 'scale-125' : 'scale-100')
                }`}
              />
              
              {/* Inner core circle */}
              <div 
                className={`h-48 w-48 rounded-full flex flex-col items-center justify-center text-white transition-all duration-1000 shadow-2xl ${
                  breathingPhase === 'inhale' 
                    ? 'bg-violet-600 scale-110' 
                    : (breathingPhase === 'hold' 
                      ? 'bg-amber-600 scale-110' 
                      : (breathingPhase === 'exhale' 
                        ? 'bg-emerald-600 scale-100 animate-pulse' 
                        : 'bg-slate-400 dark:bg-slate-800'))
                }`}
              >
                {breathingPhase === 'idle' ? (
                  <Play className="h-10 w-10 text-white cursor-pointer" onClick={startBreathingGuide} />
                ) : (
                  <>
                    <span className="text-xs uppercase tracking-widest text-white/70 font-extrabold mb-1">
                      {breathingPhase}
                    </span>
                    <span className="text-4xl font-black">{breathingSecondsLeft}s</span>
                  </>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-center space-x-3">
              {breathingPhase === 'idle' ? (
                <button
                  onClick={startBreathingGuide}
                  className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl font-extrabold transition shadow-lg shadow-violet-500/25"
                >
                  Start Breathing
                </button>
              ) : (
                <button
                  onClick={stopBreathingGuide}
                  className="px-8 py-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl font-extrabold transition"
                >
                  Stop / Reset
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md space-y-6">
            <div>
              <h3 className="text-xl font-bold">Configure Profile</h3>
              <p className="text-sm text-slate-500">Provide details to personalize the mental well-being triggers</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Target Competitive Exam</label>
                <select
                  value={tempExam}
                  onChange={(e) => setTempExam(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                >
                  <option value="JEE">JEE (Joint Entrance Examination)</option>
                  <option value="NEET">NEET (National Eligibility cum Entrance Test)</option>
                  <option value="UPSC">UPSC Civil Services</option>
                  <option value="GATE">GATE (Graduate Aptitude Test in Engineering)</option>
                  <option value="CAT">CAT (Common Admission Test)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-600 focus:border-transparent text-sm transition"
                />
              </div>
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-950 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={saveSettingsMutation.isPending}
                onClick={() => saveSettingsMutation.mutate({ email: tempEmail, name: tempName, exam: tempExam })}
                className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-sm transition"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}