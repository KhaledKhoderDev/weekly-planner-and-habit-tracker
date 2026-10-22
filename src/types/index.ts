export type Language = 'ar' | 'en';
export type Theme = 'dark' | 'light' | 'midnight';
export type AccentTheme = 'midnight' | 'twilight' | 'amber' | 'ruby' | 'cyan' | 'emerald';

export type Priority = 'high' | 'medium' | 'low';

export type PrayerSlotId = 'midnight' | 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

export interface CustomPrayerConfig {
  id: PrayerSlotId;
  time: string;
  customNameAr?: string;
  customNameEn?: string;
  enabled?: boolean;
}

export type TaskCategory = 'work' | 'study' | 'worship' | 'health' | 'personal' | 'social';

export type GoalCategory = 
  | 'quran' 
  | 'study' 
  | 'work' 
  | 'health' 
  | 'personal' 
  | 'spiritual' 
  | 'sports' 
  | 'social';

export type HabitMetricMode = 'check' | 'target' | 'record';
export type HabitScheduleType = 'daily' | 'weekdays' | 'monthdays' | 'interval';
export type HabitDayStatus = 'completed' | 'minimum' | 'missed' | 'excused' | 'shielded';

export interface SubTask {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  prayerSlot: PrayerSlotId;
  priority: Priority;
  category: TaskCategory;
  time?: string;
  duration?: number; // in minutes
  tags: string[];
  notes: string;
  subtasks: SubTask[];
  completed: boolean;
  completedAt?: string;
  color?: string;
  repeat?: 'none' | 'daily' | 'weekly';
}

export interface HabitLogEntry {
  status: HabitDayStatus;
  value?: number;
  notes?: string;
}

export interface DailyHabit {
  id: string;
  name: string;
  category: string;
  metricMode: HabitMetricMode;
  targetValue?: number;
  unit?: string;
  hasMinimumThreshold?: boolean;
  minTargetValue?: number;
  minTargetDesc?: string;
  scheduleType: HabitScheduleType;
  scheduledWeekdays?: number[]; // 0 for Sunday ... 6 for Saturday
  scheduledMonthDays?: number[]; // 1..31
  intervalDays?: number;
  logs: Record<string, HabitLogEntry>; // key is YYYY-MM-DD
  createdAt: string;
  color?: string; // emerald, indigo, amber, rose, cyan, purple, teal
  icon?: string; // quran, moon, dumbbell, book, heart, droplet, sparkles, brain, sun, clock
  intention?: string; // Why this habit matters
  customXp?: number;
  minXp?: number;
  tags?: string[];
}

export interface GoalMilestone {
  id: string;
  title: string;
  targetValue: number;
  reached: boolean;
}

export interface WeeklyGoal {
  id: string;
  title: string;
  category: GoalCategory;
  target: number;
  current: number;
  unit: string;
  xpReward: number;
  weekStartDate: string; // YYYY-MM-DD of the week start
  milestones?: GoalMilestone[];
  tags?: string[];
}

export type AvatarGear = 'plain' | 'sage-cloak' | 'bronze-shield' | 'silver-aura' | 'golden-star';

export interface RecoveryQuest {
  active: boolean;
  currentCount: number;
  targetCount: number; // default 2
  lostStreak: number;
}

export interface QadaState {
  fajr: number;
  dhuhr: number;
  asr: number;
  maghrib: number;
  isha: number;
}

export interface DailyXpLog {
  date: string; // YYYY-MM-DD
  tasks: number;
  focus: number;
  goals: number;
  rewards: number;
}

export interface NotificationConfig {
  enabled: boolean;
  reminderMinutes: number; // minutes before prayer time
}

export interface UserStats {
  xp: number;
  gold: number;
  currentStreak: number;
  bestStreak: number;
  lastActiveDate: string;
  shieldsCount: number;
  recoveryQuest: RecoveryQuest | null;
  selectedGear: AvatarGear;
  unlockedGears: AvatarGear[];
  chestsAvailable: number;
  chestsOpenedToday: number;
  lastChestDate: string;
  qada: QadaState;
  totalPagesRead: number;
  totalFocusMinutes: number;
  totalTasksCompleted: number;
  totalQadaMadeUp: number;
  dailyXpHistory: DailyXpLog[];
  notifications?: NotificationConfig;
}

export interface PomodoroConfig {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number;
  longBreakInterval: number;
}

export interface TimerState {
  type: 'pomodoro' | 'countdown' | 'stopwatch';
  mode: 'work' | 'short_break' | 'long_break';
  timeLeft: number; // in seconds
  isRunning: boolean;
  consecutiveSessions: number;
  flowStateActive: boolean;
  minimized: boolean;
  stopwatchElapsed: number; // in seconds
  countdownDuration: number; // in seconds
}
