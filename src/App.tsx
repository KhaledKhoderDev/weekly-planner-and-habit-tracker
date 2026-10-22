import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  AccentTheme,
  CustomPrayerConfig,
  DailyHabit, 
  Language, 
  PrayerSlotId,
  Task, 
  Theme, 
  UserStats, 
  WeeklyGoal
} from './types';
import { 
  getInitialTasks, 
  getInitialHabits, 
  getInitialWeeklyGoals, 
  getInitialStats, 
  loadFromStorage, 
  saveToStorage, 
  STORAGE_KEYS 
} from './utils/storage';
import { translations } from './utils/translations';
import { Header } from './components/Header';
import { XpEconomyCard } from './components/XpEconomyCard';
import { WeeklyPlanner } from './components/WeeklyPlanner';
import { DailyHabits } from './components/DailyHabits';
import { WeeklyGoals } from './components/WeeklyGoals';
import { GamificationHub } from './components/GamificationHub';
import { FocusPanel } from './components/FocusPanel';
import { CustomizationModal } from './components/CustomizationModal';
import { PrayerTracker, DailyPrayerLogs } from './components/PrayerTracker';
import { NotificationManager } from './components/NotificationManager';
import { playSound, isSoundEnabled, setSoundEnabled } from './utils/audio';
import { getTodayYMD } from './utils/date';
import confetti from 'canvas-confetti';
import { 
  Calendar, 
  CheckSquare, 
  Target, 
  ShieldAlert, 
  Clock, 
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Settings
} from 'lucide-react';

const DEFAULT_PRAYER_CONFIGS: Record<PrayerSlotId, CustomPrayerConfig> = {
  midnight: { id: 'midnight', time: '00:00' },
  fajr: { id: 'fajr', time: '05:00' },
  dhuhr: { id: 'dhuhr', time: '12:30' },
  asr: { id: 'asr', time: '15:45' },
  maghrib: { id: 'maghrib', time: '18:15' },
  isha: { id: 'isha', time: '19:45' },
};

interface DailySpark {
  textAr: string;
  textEn: string;
  sourceAr: string;
  sourceEn: string;
  category: 'hadith' | 'quran';
}

const DAILY_SPARKS: DailySpark[] = [
  {
    textAr: '«أحب الأعمال إلى الله أدومها وإن قل»',
    textEn: '“The deeds most loved by Allah are those done regularly, even if small.”',
    sourceAr: 'صحيح البخاري: 6464 | صحيح مسلم: 782',
    sourceEn: 'Sahih al-Bukhari: 6464 | Sahih Muslim: 782',
    category: 'hadith',
  },
  {
    textAr: '«نعمتان مغبون فيهما كثير من الناس: الصحة والفراغ»',
    textEn: '“Two blessings that many people lose: Health and free time.”',
    sourceAr: 'صحيح البخاري: 6412',
    sourceEn: 'Sahih al-Bukhari: 6412',
    category: 'hadith',
  },
  {
    textAr: '«اللهم بارك لأمتي في بكورها»',
    textEn: '“O Allah, bless my Ummah in its early mornings.”',
    sourceAr: 'سنن أبي داود: 2606 | جامع الترمذي: 1212 (صحيح)',
    sourceEn: 'Sunan Abi Dawud: 2606 | Jami at-Tirmidhi: 1212',
    category: 'hadith',
  },
  {
    textAr: '«احرص على ما ينفعك واستعن بالله ولا تعجز»',
    textEn: '“Cherish that which benefits you, seek help from Allah, and do not despair.”',
    sourceAr: 'صحيح مسلم: 2664',
    sourceEn: 'Sahih Muslim: 2664',
    category: 'hadith',
  },
  {
    textAr: '«من سلك طريقا يلتمس فيه علما سهل الله له به طريقا إلى الجنة»',
    textEn: '“Whoever takes a path seeking knowledge, Allah will ease their way to Paradise.”',
    sourceAr: 'صحيح مسلم: 2699',
    sourceEn: 'Sahih Muslim: 2699',
    category: 'hadith',
  },
  {
    textAr: '﴿وفي ذلك فليتنافس المتنافسون﴾',
    textEn: '“And for this let the competitors compete.”',
    sourceAr: 'القرآن الكريم — سورة المطففين: 26',
    sourceEn: 'The Holy Quran — Surah Al-Mutaffifin: 26',
    category: 'quran',
  },
  {
    textAr: '﴿وقل اعملوا فسيرى الله عملكم ورسوله والمؤمنون﴾',
    textEn: '“And say: Do deeds! Allah will see your deeds, and so will His Messenger and the believers.”',
    sourceAr: 'القرآن الكريم — سورة التوبة: 105',
    sourceEn: 'The Holy Quran — Surah At-Tawbah: 105',
    category: 'quran',
  },
];

export default function App() {
  // Theme & Language
  const [language, setLanguage] = useState<Language>(() => {
    return loadFromStorage<Language>('barakah_lang', 'ar');
  });

  const [theme, setTheme] = useState<Theme>(() => {
    return loadFromStorage<Theme>('barakah_theme', 'midnight');
  });

  const [accentTheme, setAccentTheme] = useState<AccentTheme>(() => {
    const saved = loadFromStorage<AccentTheme>('barakah_accent', 'midnight');
    return saved === 'emerald' ? 'midnight' : saved;
  });

  const [prayerConfigs, setPrayerConfigs] = useState<Record<PrayerSlotId, CustomPrayerConfig>>(() => {
    return loadFromStorage('barakah_prayer_configs', DEFAULT_PRAYER_CONFIGS);
  });

  const [audioMuted, setAudioMuted] = useState<boolean>(() => !isSoundEnabled());

  // Navigation tab: 'tasks' | 'prayers' | 'habits' | 'goals' | 'gamification'
  const [activeTab, setActiveTab] = useState<'tasks' | 'prayers' | 'habits' | 'goals' | 'gamification'>('tasks');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals Visibility
  const [isFocusModalOpen, setIsFocusModalOpen] = useState(false);
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  // App State with persistence
  const [tasks, setTasks] = useState<Task[]>(() => {
    return loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, getInitialTasks());
  });

  const [habits, setHabits] = useState<DailyHabit[]>(() => {
    return loadFromStorage<DailyHabit[]>(STORAGE_KEYS.HABITS, getInitialHabits());
  });

  const [goals, setGoals] = useState<WeeklyGoal[]>(() => {
    return loadFromStorage<WeeklyGoal[]>(STORAGE_KEYS.GOALS, getInitialWeeklyGoals());
  });

  const [stats, setStats] = useState<UserStats>(() => {
    return loadFromStorage<UserStats>(STORAGE_KEYS.STATS, getInitialStats());
  });

  const [dailyPrayerLogs, setDailyPrayerLogs] = useState<DailyPrayerLogs>(() => {
    return loadFromStorage<DailyPrayerLogs>('barakah_flow_prayer_logs_v1', {});
  });

  const todayYMD = getTodayYMD();
  const todayPrayerDoneCount = useMemo(() => {
    const log = dailyPrayerLogs[todayYMD];
    if (!log) return 0;
    let count = 0;
    (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(p => {
      const s = log[p]?.status;
      if (s === 'jamaah' || s === 'on_time' || s === 'late') count++;
    });
    return count;
  }, [dailyPrayerLogs, todayYMD]);

  useEffect(() => {
    saveToStorage('barakah_flow_prayer_logs_v1', dailyPrayerLogs);
  }, [dailyPrayerLogs]);

  // Sync HTML attributes (direction, lang, class)
  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    saveToStorage('barakah_lang', language);
  }, [language]);

  useEffect(() => {
    document.documentElement.classList.remove('theme-light', 'theme-midnight');
    if (theme === 'light') {
      document.documentElement.classList.add('theme-light');
    } else if (theme === 'midnight') {
      document.documentElement.classList.add('theme-midnight');
    }
    saveToStorage('barakah_theme', theme);
  }, [theme]);

  useEffect(() => {
    saveToStorage('barakah_accent', accentTheme);
  }, [accentTheme]);

  useEffect(() => {
    saveToStorage('barakah_prayer_configs', prayerConfigs);
  }, [prayerConfigs]);

  // Persist Data Changes asynchronously
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  }, [tasks]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.HABITS, habits);
  }, [habits]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.GOALS, goals);
  }, [goals]);

  useEffect(() => {
    saveToStorage(STORAGE_KEYS.STATS, stats);
  }, [stats]);

  // Toggle Theme: cycles midnight -> dark -> light
  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      if (prev === 'midnight') return 'dark';
      if (prev === 'dark') return 'light';
      return 'midnight';
    });
  }, []);

  // Toggle Language
  const toggleLanguage = useCallback(() => {
    setLanguage(prev => (prev === 'ar' ? 'en' : 'ar'));
  }, []);

  // Toggle Audio
  const toggleAudio = useCallback(() => {
    setAudioMuted(prev => {
      const next = !prev;
      setSoundEnabled(!next);
      return next;
    });
  }, []);

  // Helper to record XP into daily ledger
  const addXp = useCallback((amount: number, source: 'tasks' | 'focus' | 'goals' | 'rewards', bonusGold = 0) => {
    const today = getTodayYMD();
    setStats(prev => {
      const updatedHistory = [...prev.dailyXpHistory];
      const todayIdx = updatedHistory.findIndex(h => h.date === today);

      if (todayIdx >= 0) {
        updatedHistory[todayIdx] = {
          ...updatedHistory[todayIdx],
          [source]: updatedHistory[todayIdx][source] + amount,
        };
      } else {
        updatedHistory.push({
          date: today,
          tasks: source === 'tasks' ? amount : 0,
          focus: source === 'focus' ? amount : 0,
          goals: source === 'goals' ? amount : 0,
          rewards: source === 'rewards' ? amount : 0,
        });
      }

      return {
        ...prev,
        xp: prev.xp + amount,
        gold: prev.gold + bonusGold,
        dailyXpHistory: updatedHistory,
      };
    });
  }, []);

  // Task Operations
  const handleAddTask = useCallback((newTask: Task) => {
    setTasks(prev => [newTask, ...prev]);
    playSound.buttonClick();
  }, []);

  const handleUpdateTask = useCallback((updatedTask: Task) => {
    setTasks(prev => prev.map(t => (t.id === updatedTask.id ? updatedTask : t)));
  }, []);

  const handleDeleteTask = useCallback((taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    playSound.buttonClick();
  }, []);

  // Toggle Task Completion with XP Ledger & Surprise Chest Chance
  const handleToggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const task = prevTasks.find(t => t.id === taskId);
      if (!task) return prevTasks;

      const willBeCompleted = !task.completed;
      const updated = {
        ...task,
        completed: willBeCompleted,
        completedAt: willBeCompleted ? getTodayYMD() : undefined,
      };

      if (willBeCompleted) {
        const xpVal = task.priority === 'high' ? 35 : task.priority === 'medium' ? 20 : 10;
        const goldVal = task.priority === 'high' ? 10 : 5;
        addXp(xpVal, 'tasks', goldVal);

        setStats(prev => {
          let updatedStreak = prev.currentStreak;
          let updatedQuest = prev.recoveryQuest;
          let bonusXp = 0;

          if (prev.recoveryQuest?.active) {
            const nextCount = prev.recoveryQuest.currentCount + 1;
            if (nextCount >= prev.recoveryQuest.targetCount) {
              updatedStreak = prev.recoveryQuest.lostStreak + 1;
              updatedQuest = null;
              bonusXp = 100;
              confetti({ particleCount: 70, spread: 70 });
            } else {
              updatedQuest = { ...prev.recoveryQuest, currentCount: nextCount };
            }
          }

          let chestsAvail = prev.chestsAvailable;
          if (prev.chestsOpenedToday + prev.chestsAvailable < 2 && Math.random() < 0.25) {
            chestsAvail += 1;
            confetti({ particleCount: 40, spread: 60, origin: { y: 0.8 } });
          }

          return {
            ...prev,
            xp: prev.xp + bonusXp,
            currentStreak: updatedStreak,
            recoveryQuest: updatedQuest,
            chestsAvailable: chestsAvail,
            totalTasksCompleted: prev.totalTasksCompleted + 1,
          };
        });

        playSound.completeTask();
      } else {
        const xpVal = task.priority === 'high' ? 35 : task.priority === 'medium' ? 20 : 10;
        addXp(-xpVal, 'tasks', 0);
        playSound.buttonClick();
      }

      return prevTasks.map(t => (t.id === taskId ? updated : t));
    });
  }, [addXp]);

  // Habits Operations
  const handleAddHabit = useCallback((habit: DailyHabit) => {
    setHabits(prev => [...prev, habit]);
    playSound.buttonClick();
  }, []);

  const handleUpdateHabit = useCallback((updatedHabit: DailyHabit) => {
    setHabits(prev => prev.map(h => (h.id === updatedHabit.id ? updatedHabit : h)));
  }, []);

  const handleDeleteHabit = useCallback((id: string) => {
    setHabits(prev => prev.filter(h => h.id !== id));
    playSound.buttonClick();
  }, []);

  // Goals Operations
  const handleAddGoal = useCallback((goal: WeeklyGoal) => {
    setGoals(prev => [...prev, goal]);
    playSound.buttonClick();
  }, []);

  const handleUpdateGoal = useCallback((updatedGoal: WeeklyGoal) => {
    setGoals(prev => {
      const prevGoal = prev.find(g => g.id === updatedGoal.id);
      if (prevGoal && prevGoal.current < prevGoal.target && updatedGoal.current >= updatedGoal.target) {
        addXp(updatedGoal.xpReward, 'goals', 25);
        confetti({ particleCount: 60, spread: 70 });
      }
      return prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g));
    });
  }, [addXp]);

  const handleDeleteGoal = useCallback((goalId: string) => {
    setGoals(prev => prev.filter(g => g.id !== goalId));
    playSound.buttonClick();
  }, []);

  // Pomodoro Finished Session
  const handleCompletePomodoroSession = useCallback((mode: 'work' | 'short_break' | 'long_break', earnedXp: number) => {
    if (mode === 'work' && earnedXp > 0) {
      addXp(earnedXp, 'focus', 15);
      setStats(prev => ({
        ...prev,
        totalFocusMinutes: prev.totalFocusMinutes + 25,
      }));
      confetti({ particleCount: 50, spread: 60 });
    }
  }, [addXp]);

  // Restore imported data
  const handleRestoreData = useCallback((importedData: {
    tasks: Task[];
    habits: DailyHabit[];
    goals: WeeklyGoal[];
    stats: UserStats;
  }) => {
    setTasks(importedData.tasks);
    setHabits(importedData.habits);
    setGoals(importedData.goals);
    setStats(importedData.stats);
    saveToStorage(STORAGE_KEYS.TASKS, importedData.tasks, true);
    saveToStorage(STORAGE_KEYS.HABITS, importedData.habits, true);
    saveToStorage(STORAGE_KEYS.GOALS, importedData.goals, true);
    saveToStorage(STORAGE_KEYS.STATS, importedData.stats, true);
  }, []);

  // Daily Spark quote of today
  const sparkOfDay = useMemo(() => {
    const dayIndex = new Date().getDay();
    return DAILY_SPARKS[dayIndex % DAILY_SPARKS.length];
  }, []);

  const t = translations[language];

  return (
    <div data-accent={accentTheme} className="min-h-screen relative flex flex-col font-sans transition-colors duration-300">
      {/* Background aurora lights and animated dot grid */}
      <div className="aurora-glow" />
      <div className="aurora-glow-secondary" />
      <div className="fixed inset-0 dot-grid-pattern pointer-events-none z-0" />

      {/* Main Top Header */}
      <Header
        stats={stats}
        language={language}
        theme={theme}
        onToggleTheme={toggleTheme}
        onToggleLanguage={toggleLanguage}
        onOpenFocusModal={() => setIsFocusModalOpen(true)}
        onOpenCustomization={() => setIsCustomizationOpen(true)}
        onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        activeTab={activeTab}
      />

      {/* Navigation Bar (Desktop & Mobile Tabs) */}
      <nav className="sticky top-[102px] z-30 bg-[#0a0e27]/80 backdrop-blur-md border-b border-indigo-500/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 py-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'tasks'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>{t.navTasks}</span>
            </button>

            <button
              onClick={() => setActiveTab('prayers')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'prayers'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <span>🕌</span>
              <span>{language === 'ar' ? 'الصلوات والفوائت' : 'Prayer Tracker'}</span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-[10px] text-emerald-300 font-mono-numbers font-bold">
                {todayPrayerDoneCount}/5
              </span>
            </button>

            <button
              onClick={() => setActiveTab('habits')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'habits'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4" />
              <span>{t.navHabits}</span>
            </button>



            <button
              onClick={() => setActiveTab('gamification')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition whitespace-nowrap ${
                activeTab === 'gamification'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>{t.navGamification}</span>
              {stats.chestsAvailable > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </button>

            {/* Quick Settings & Audio Controls */}
            <div className="ml-auto flex items-center gap-1.5">
              <button
                onClick={() => setIsCustomizationOpen(true)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                title="تخصيص الصلوات والمظهر والنسخ الاحتياطي"
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-indigo-400" />
              </button>

              <button
                onClick={toggleAudio}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
                title={audioMuted ? 'تشغيل المؤثرات الصوتية' : 'كتم المؤثرات الصوتية'}
                aria-label="Toggle Sound"
              >
                {audioMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-teal-400" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div onClick={() => setMobileMenuOpen(false)} className="fixed inset-0 z-50 md:hidden bg-black/80 backdrop-blur-sm animate-fadeIn cursor-pointer">
          <div onClick={e => e.stopPropagation()} className="fixed inset-y-0 right-0 w-64 bg-slate-900 border-l border-indigo-500/30 p-5 flex flex-col justify-between cursor-default">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 mb-4">
                <span className="font-bold text-white text-base">قائمة التنقل</span>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setActiveTab('tasks');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-200 text-sm font-semibold"
                >
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>{t.navTasks}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('prayers');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-200 text-sm font-semibold"
                >
                  <div className="flex items-center gap-3">
                    <span>🕌</span>
                    <span>{language === 'ar' ? 'الصلوات والفوائت' : 'Prayer Tracker'}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-xs text-emerald-300 font-mono-numbers">
                    {todayPrayerDoneCount}/5
                  </span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('habits');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-200 text-sm font-semibold"
                >
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                  <span>{t.navHabits}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('goals');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-200 text-sm font-semibold"
                >
                  <Target className="w-4 h-4 text-amber-400" />
                  <span>{t.navGoals}</span>
                </button>
                <button
                  onClick={() => {
                    setActiveTab('gamification');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 text-slate-200 text-sm font-semibold"
                >
                  <ShieldAlert className="w-4 h-4 text-purple-400" />
                  <span>{t.navGamification}</span>
                </button>
                <button
                  onClick={() => {
                    setIsCustomizationOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/70 text-indigo-300 text-sm font-semibold border border-indigo-500/20"
                >
                  <Settings className="w-4 h-4 text-indigo-400" />
                  <span>الإعدادات والتخصيص</span>
                </button>
                <button
                  onClick={() => {
                    setIsFocusModalOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-teal-500/20 text-teal-300 text-sm font-semibold border border-teal-500/30"
                >
                  <Clock className="w-4 h-4 text-teal-400" />
                  <span>{t.focusTitle}</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 text-center pt-4 border-t border-slate-800">
              BarakahFlow Life OS © 2026
            </div>
          </div>
        </div>
      )}

      {/* Main Container Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
        {/* Daily Barakah Spark Inspirational Banner with Verified Citations */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-indigo-900/30 to-purple-900/20 border border-amber-500/25 flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 text-sm shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </span>
            <div className="min-w-0 space-y-1">
              <div className="text-xs sm:text-sm font-semibold text-amber-100 leading-relaxed font-sans">
                {language === 'ar' ? sparkOfDay.textAr : sparkOfDay.textEn}
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-bold font-mono-numbers flex items-center gap-1 shadow-sm">
                  <span>📖</span>
                  <span>{language === 'ar' ? sparkOfDay.sourceAr : sparkOfDay.sourceEn}</span>
                </span>
                <span className="text-[10px] text-amber-400/80 font-medium hidden sm:inline">
                  {sparkOfDay.category === 'quran'
                    ? (language === 'ar' ? '• آية قرآنية كريمة' : '• Noble Quran Verse')
                    : (language === 'ar' ? '• حديث نبوي شريف صحيح' : '• Authentic Sahih Hadith')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly XP Economy Card displayed prominently on Weekly Tasks tab */}
        {activeTab === 'tasks' && (
          <XpEconomyCard
            history={stats.dailyXpHistory}
            language={language}
          />
        )}

        {/* Tab 1: Weekly Task Planner with Master Goals Synergy */}
        {activeTab === 'tasks' && (
          <WeeklyPlanner
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onToggleTaskComplete={handleToggleTaskComplete}
            prayerConfigs={prayerConfigs}
            onOpenCustomization={() => setIsCustomizationOpen(true)}
            goals={goals}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
            language={language}
          />
        )}

        {/* Tab: Daily Prayers & Multi-Year Qada Tracker */}
        {activeTab === 'prayers' && (
          <PrayerTracker
            stats={stats}
            onUpdateStats={setStats}
            dailyPrayerLogs={dailyPrayerLogs}
            onUpdatePrayerLogs={setDailyPrayerLogs}
            language={language}
          />
        )}

        {/* Tab 2: Daily Habits with Deep Stats & Bare Minimum Threshold */}
        {activeTab === 'habits' && (
          <DailyHabits
            habits={habits}
            onAddHabit={handleAddHabit}
            onUpdateHabit={handleUpdateHabit}
            onDeleteHabit={handleDeleteHabit}
            language={language}
          />
        )}

        {/* Tab 4: Gamification & Adventurer Hub */}
        {activeTab === 'gamification' && (
          <GamificationHub
            stats={stats}
            onUpdateStats={setStats}
            language={language}
          />
        )}
      </main>

      {/* Focus Panel Modal or Floating Widget */}
      <NotificationManager stats={stats} prayerConfigs={prayerConfigs} />
      <FocusPanel
        onCompleteSession={handleCompletePomodoroSession}
        isOpen={isFocusModalOpen}
        onClose={() => setIsFocusModalOpen(false)}
        language={language}
      />

      {/* Customization & Settings Modal */}
      <CustomizationModal
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
        prayerConfigs={prayerConfigs}
        onUpdatePrayerConfigs={setPrayerConfigs}
        accentTheme={accentTheme}
        onChangeAccentTheme={setAccentTheme}
        theme={theme}
        onChangeTheme={setTheme}
        allData={{
          tasks,
          habits,
          goals,
          stats,
        }}
        onRestoreData={handleRestoreData}
        onUpdateStats={setStats}
        language={language}
      />

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-indigo-500/10 text-center text-xs text-slate-500 z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>{t.appName} — {t.tagline}</span>
          <span className="font-mono-numbers text-[11px] text-slate-500">
            بارك الله في أوقاتكم وأعمالكم
          </span>
        </div>
      </footer>
    </div>
  );
}


