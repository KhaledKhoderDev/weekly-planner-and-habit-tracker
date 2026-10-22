import { DailyHabit, Task, UserStats, WeeklyGoal } from '../types';
import { formatDateToYMD, getTodayYMD, getWeekStartSaturday } from './date';

const STORAGE_KEYS = {
  TASKS: 'barakah_flow_tasks_v1',
  HABITS: 'barakah_flow_habits_v1',
  GOALS: 'barakah_flow_goals_v1',
  STATS: 'barakah_flow_stats_v1',
  PRAYER_ORDER: 'barakah_flow_prayer_order_v1',
};

export function getInitialTasks(): Task[] {
  const today = new Date();
  const weekStart = getWeekStartSaturday(today);
  
  // Calculate relative dates in this week
  const getDateOffset = (offset: number) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + offset);
    return formatDateToYMD(d);
  };

  const day0 = getDateOffset(0); // Saturday
  const day1 = getDateOffset(1); // Sunday
  const day2 = getDateOffset(2); // Monday
  const day3 = getDateOffset(3); // Tuesday
  const day4 = getDateOffset(4); // Wednesday
  const day5 = getDateOffset(5); // Thursday
  const day6 = getDateOffset(6); // Friday

  return [
    {
      id: 't-1',
      title: 'ورد الصباح وتلاوة سورة يس وتدبر آياتها',
      date: day1,
      prayerSlot: 'fajr',
      priority: 'high',
      category: 'worship',
      time: '05:30',
      duration: 30,
      tags: ['قرآن', 'سكينة', 'ورد'],
      notes: 'تلاوة مباركة بهدوء وحضور قلب قبل شروق الشمس.',
      subtasks: [
        { id: 'st-1', text: 'أذكار الصباح المأثورة', completed: true },
        { id: 'st-2', text: 'تلاوة سورة يس مع التفسير الميسر', completed: true },
        { id: 'st-3', text: 'تدوين فائدة إيمانية في المذكرة', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-2',
      title: 'مراجعة خطة المشروع البرمجي وتسليم المرحلة الأولى',
      date: day1,
      prayerSlot: 'dhuhr',
      priority: 'high',
      category: 'work',
      time: '13:00',
      duration: 60,
      tags: ['برمجة', 'تسليم', 'عمل'],
      notes: 'التحقق من جاهزية واجهات المستخدم واختبار الربط.',
      subtasks: [
        { id: 'st-4', text: 'مراجعة توثيق واجهة التطبيق', completed: true },
        { id: 'st-5', text: 'فحص التجاوب على شاشات الجوال', completed: false },
        { id: 'st-6', text: 'إرسال رابط المعاينة إلى الفريق', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-3',
      title: 'جلسة تركيز بومودورو: مراجعة خوارزميات الذكاء الاصطناعي',
      date: day1,
      prayerSlot: 'asr',
      priority: 'medium',
      category: 'study',
      time: '16:00',
      duration: 50,
      tags: ['تعلم', 'ذكاء_اصطناعي'],
      notes: 'حل 3 مسائل برمجية مع تلخيص المفاهيم.',
      subtasks: [
        { id: 'st-7', text: 'تطبيق خوارزمية البحث الثنائي', completed: true },
        { id: 'st-8', text: 'قراءة الفصل الرابع من المرجع', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-4',
      title: 'أذكار المساء والمشي السريع في الهواء الطلق',
      date: day1,
      prayerSlot: 'maghrib',
      priority: 'medium',
      category: 'health',
      time: '18:30',
      duration: 35,
      tags: ['صحة', 'رياضة', 'أذكار'],
      notes: 'المحافظة على 4000 خطوة مع ترديد أذكار المساء.',
      subtasks: [
        { id: 'st-9', text: 'أذكار المساء', completed: true },
        { id: 'st-10', text: 'مشي 30 دقيقة', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-5',
      title: 'قراءة 20 صفحة من كتاب الرحيق المختوم',
      date: day1,
      prayerSlot: 'isha',
      priority: 'low',
      category: 'personal',
      time: '20:15',
      duration: 25,
      tags: ['قراءة', 'سيرة'],
      notes: 'قراءة هادئة قبل النوم مع تلخيص سريع.',
      subtasks: [
        { id: 'st-11', text: 'قراءة الصفحات من 120 إلى 140', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-6',
      title: 'صلاة قيام الليل والاستغفار بالأسحار',
      date: day2,
      prayerSlot: 'midnight',
      priority: 'high',
      category: 'worship',
      time: '02:00',
      duration: 40,
      tags: ['قيام', 'دعاء'],
      notes: 'ركعتان خفيفتان مع دعاء خالص وطلب التوفيق.',
      subtasks: [
        { id: 'st-12', text: 'صلاة ركعتين خاشعتين', completed: false },
        { id: 'st-13', text: 'الاستغفار 100 مرة', completed: false },
      ],
      completed: false,
    },
    {
      id: 't-7',
      title: 'اجتماع مناقشة الأهداف الأسبوعية مع الأسرة',
      date: day0,
      prayerSlot: 'maghrib',
      priority: 'medium',
      category: 'social',
      time: '19:00',
      duration: 45,
      tags: ['عائلة', 'تخطيط'],
      notes: 'جلسة محبة وتنسيق للأنشطة الأسرية الأسبوعية.',
      subtasks: [
        { id: 'st-14', text: 'تحديد موعد الزيارة العائلية', completed: true },
        { id: 'st-15', text: 'تجهيز الشاي والضيافة', completed: true },
      ],
      completed: true,
      completedAt: day0,
    },
    {
      id: 't-8',
      title: 'صلاة الجمعة وقراءة سورة الكهف والتبكير إلى المسجد',
      date: day6,
      prayerSlot: 'dhuhr',
      priority: 'high',
      category: 'worship',
      time: '11:45',
      duration: 90,
      tags: ['جمعة', 'الكهف', 'بركة'],
      notes: 'الاغتسال والتطيب والتبكير مع الإكثار من الصلاة على النبي ﷺ.',
      subtasks: [
        { id: 'st-16', text: 'قراءة سورة الكهف كاملة', completed: false },
        { id: 'st-17', text: 'التبكير في الصف الأول', completed: false },
        { id: 'st-18', text: 'دعاء ساعة الإجابة قبل المغرب', completed: false },
      ],
      completed: false,
    },
  ];
}

export function getInitialHabits(): DailyHabit[] {
  const today = getTodayYMD();
  const d = new Date();
  
  // Previous 4 days logs for streak
  const logs1: Record<string, { status: 'completed' | 'missed' | 'excused' | 'shielded'; value?: number }> = {};
  const logs2: Record<string, { status: 'completed' | 'missed' | 'excused' | 'shielded'; value?: number }> = {};
  const logs3: Record<string, { status: 'completed' | 'missed' | 'excused' | 'shielded'; value?: number }> = {};
  const logs4: Record<string, { status: 'completed' | 'missed' | 'excused' | 'shielded'; value?: number }> = {};

  for (let i = 1; i <= 5; i++) {
    const prev = new Date(d);
    prev.setDate(d.getDate() - i);
    const prevStr = formatDateToYMD(prev);
    logs1[prevStr] = { status: 'completed' };
    logs2[prevStr] = { status: 'completed', value: 8 };
    logs3[prevStr] = { status: 'completed', value: 12 };
    logs4[prevStr] = { status: i === 3 ? 'shielded' : 'completed' };
  }

  // Today initial status
  logs1[today] = { status: 'completed' };
  logs2[today] = { status: 'completed', value: 6 };
  logs3[today] = { status: 'completed', value: 10 };

  return [
    {
      id: 'h-1',
      name: 'أذكار الصباح والمساء والتحصين',
      category: 'روحي',
      metricMode: 'check',
      scheduleType: 'daily',
      logs: logs1,
      createdAt: '2026-09-01',
    },
    {
      id: 'h-2',
      name: 'شرب 8 أكواب ماء منعش',
      category: 'صحة',
      metricMode: 'target',
      targetValue: 8,
      unit: 'أكواب',
      scheduleType: 'daily',
      logs: logs2,
      createdAt: '2026-09-01',
    },
    {
      id: 'h-3',
      name: 'تلاوة 10 صفحات من القرآن الكريم',
      category: 'قرآن',
      metricMode: 'target',
      targetValue: 10,
      unit: 'صفحات',
      scheduleType: 'daily',
      logs: logs3,
      createdAt: '2026-09-01',
    },
    {
      id: 'h-4',
      name: 'صلاة ركعتي الضحى وصلاة الوتر',
      category: 'عبادة',
      metricMode: 'check',
      scheduleType: 'daily',
      logs: logs4,
      createdAt: '2026-09-05',
    },
    {
      id: 'h-5',
      name: 'تسجيل قراءة الوزن الصباحي',
      category: 'صحة',
      metricMode: 'record',
      unit: 'كغم',
      scheduleType: 'weekdays',
      scheduledWeekdays: [0, 2, 4], // Sun, Tue, Thu
      logs: {
        [today]: { status: 'completed', value: 74.2 },
      },
      createdAt: '2026-09-10',
    },
  ];
}

export function getInitialWeeklyGoals(): WeeklyGoal[] {
  const weekStart = formatDateToYMD(getWeekStartSaturday(new Date()));
  return [
    {
      id: 'g-1',
      title: 'ختم قراءة جزأين من القرآن الكريم بتدبر',
      category: 'quran',
      target: 40,
      current: 28,
      unit: 'صفحة',
      xpReward: 150,
      weekStartDate: weekStart,
    },
    {
      id: 'g-2',
      title: 'إتمام 10 ساعات عمل عميق وبناء ميزات جديدة',
      category: 'work',
      target: 10,
      current: 7,
      unit: 'ساعات',
      xpReward: 200,
      weekStartDate: weekStart,
    },
    {
      id: 'g-3',
      title: 'حضور ومتابعة 4 محاضرات في دورة الذكاء الاصطناعي',
      category: 'study',
      target: 4,
      current: 3,
      unit: 'محاضرات',
      xpReward: 120,
      weekStartDate: weekStart,
    },
    {
      id: 'g-4',
      title: 'ممارسة تمارين اللياقة والمشي 4 مرات هذا الأسبوع',
      category: 'sports',
      target: 4,
      current: 2,
      unit: 'جلسات',
      xpReward: 100,
      weekStartDate: weekStart,
    },
  ];
}

export function getInitialStats(): UserStats {
  const today = getTodayYMD();
  const d = new Date();

  // Populate 7 days of realistic XP ledger history
  const dailyXpHistory = [];
  for (let i = 6; i >= 0; i--) {
    const cur = new Date(d);
    cur.setDate(d.getDate() - i);
    const dateStr = formatDateToYMD(cur);
    if (i === 0) {
      dailyXpHistory.push({
        date: dateStr,
        tasks: 65,
        focus: 100,
        goals: 50,
        rewards: 35,
      });
    } else {
      const taskXp = 40 + Math.floor(Math.sin(i * 1.5) * 20 + 20);
      const focusXp = i % 2 === 0 ? 100 : 50;
      const goalsXp = i === 2 ? 60 : 0;
      const rewardsXp = 20;
      dailyXpHistory.push({
        date: dateStr,
        tasks: taskXp,
        focus: focusXp,
        goals: goalsXp,
        rewards: rewardsXp,
      });
    }
  }

  return {
    xp: 450, // Matching the spec: Level 3 Champion / 450 XP / 5 days streak
    gold: 240,
    currentStreak: 5,
    bestStreak: 12,
    lastActiveDate: today,
    shieldsCount: 2,
    recoveryQuest: null,
    selectedGear: 'plain',
    unlockedGears: ['plain'],
    chestsAvailable: 1, // 1 ready to open for immediate fun!
    chestsOpenedToday: 0,
    lastChestDate: today,
    qada: {
      fajr: 3,
      dhuhr: 1,
      asr: 2,
      maghrib: 0,
      isha: 2,
    },
    totalPagesRead: 350,
    totalFocusMinutes: 450,
    totalTasksCompleted: 26,
    totalQadaMadeUp: 8,
    dailyXpHistory,
  };
}

// Storage helpers with Debounced Queue and Quota Protection
const debounceTimers: Record<string, number> = {};

export function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.warn(`Failed to parse cached data for key ${key}`, e);
    return fallback;
  }
}

export function saveToStorage<T>(key: string, value: T, immediate = false): void {
  if (typeof window === 'undefined') return;

  const performSave = () => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Storage quota exceeded or write failed for key ${key}`, e);
    }
  };

  if (immediate) {
    if (debounceTimers[key]) {
      window.clearTimeout(debounceTimers[key]);
      delete debounceTimers[key];
    }
    performSave();
    return;
  }

  // Clear existing pending save
  if (debounceTimers[key]) {
    window.clearTimeout(debounceTimers[key]);
  }

  // Schedule delayed save (300ms) to unblock the main render thread
  debounceTimers[key] = window.setTimeout(() => {
    delete debounceTimers[key];
    if ('requestIdleCallback' in window) {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => {
        performSave();
      });
    } else {
      performSave();
    }
  }, 300);
}

export { STORAGE_KEYS };
