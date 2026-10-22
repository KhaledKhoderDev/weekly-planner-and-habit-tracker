import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DailyHabit, HabitDayStatus, HabitMetricMode, HabitScheduleType, Language } from '../types';
import { translations } from '../utils/translations';
import { formatDateToYMD, getTodayYMD } from '../utils/date';
import { 
  PlusCircle, 
  Check, 
  X, 
  Shield, 
  Minus, 
  Flame, 
  TrendingUp, 
  Calendar, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2,
  Sparkles,
  BarChart2,
  Smile,
  AlertTriangle,
  Palette,
  Info,
  GripVertical
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { HabitDetailModal } from './HabitDetailModal';
import { BARE_MINIMUM_PRESETS, HABIT_COLORS, HABIT_ICONS } from '../utils/constants';

interface DailyHabitsProps {
  habits: DailyHabit[];
  onAddHabit: (habit: DailyHabit) => void;
  onUpdateHabit: (habit: DailyHabit) => void;
  onDeleteHabit: (id: string) => void;
  onReorderHabits?: (habits: DailyHabit[]) => void;
  language: Language;
}

export const DailyHabits: React.FC<DailyHabitsProps> = ({
  habits,
  onAddHabit,
  onUpdateHabit,
  onDeleteHabit,
  onReorderHabits,
  language,
}) => {
  const t = translations[language];
  const todayYMD = getTodayYMD();

  // Drag and drop state
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);

  // Calendar View Filter: 'weekly' | 'monthly' | 'yearly' | 'all'
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly' | 'yearly' | 'all'>('weekly');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDetailHabit, setSelectedDetailHabit] = useState<DailyHabit | null>(null);

  // Form State for new Habit
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCategory, setNewHabitCategory] = useState('روحي');
  const [newColor, setNewColor] = useState('emerald');
  const [newIcon, setNewIcon] = useState('sparkles');
  const [newIntention, setNewIntention] = useState('');
  const [newMetricMode, setNewMetricMode] = useState<HabitMetricMode>('check');
  const [newTargetValue, setNewTargetValue] = useState<number>(8);
  const [newUnit, setNewUnit] = useState('أكواب');
  const [newScheduleType, setNewScheduleType] = useState<HabitScheduleType>('daily');
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  
  // Bare minimum form state
  const [newHasMin, setNewHasMin] = useState(false);
  const [newMinVal, setNewMinVal] = useState(1);
  const [newMinDesc, setNewMinDesc] = useState('');
  const [newCustomXp, setNewCustomXp] = useState(15);
  const [newMinXp, setNewMinXp] = useState(10);

  // Drag and Drop Event Handlers
  const handleHabitDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedHabitId(id);
  };

  const handleHabitDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverHabitId !== id) {
      setDragOverHabitId(id);
    }
  };

  const handleHabitDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    setDragOverHabitId(null);
    const sourceId = e.dataTransfer.getData('text/plain') || draggedHabitId;
    setDraggedHabitId(null);

    if (!sourceId || sourceId === targetId || !onReorderHabits) return;

    const sourceIndex = habits.findIndex(h => h.id === sourceId);
    const targetIndex = habits.findIndex(h => h.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) return;

    const newHabits = [...habits];
    const [movedHabit] = newHabits.splice(sourceIndex, 1);
    newHabits.splice(targetIndex, 0, movedHabit);
    onReorderHabits(newHabits);
    playSound.buttonClick();
  };

  const handleHabitDragEnd = () => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };

  // Memoized streak calculation per habit
  const habitStreaks = useMemo(() => {
    const result: Record<string, { current: number; best: number }> = {};
    const now = new Date();

    for (const habit of habits) {
      let current = 0;
      let best = 0;
      let temp = 0;

      for (let i = 0; i < 60; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const str = formatDateToYMD(d);
        const log = habit.logs[str];

        if (log?.status === 'completed' || log?.status === 'minimum' || log?.status === 'shielded') {
          temp++;
          if (i === current) current = temp;
          if (temp > best) best = temp;
        } else if (log?.status === 'excused') {
          continue;
        } else {
          if (i <= current) current = temp;
          temp = 0;
        }
      }
      result[habit.id] = { current, best: Math.max(best, current) };
    }

    return result;
  }, [habits]);

  // Toggle or update today's log for a habit
  const handleToggleTodayStatus = (habit: DailyHabit, nextStatus: HabitDayStatus) => {
    const currentLog = habit.logs[todayYMD];
    const newStatus = currentLog?.status === nextStatus ? 'missed' : nextStatus;
    
    let nextValue = currentLog?.value;
    if (newStatus === 'completed' && habit.targetValue) {
      nextValue = habit.targetValue;
    } else if (newStatus === 'minimum' && habit.minTargetValue) {
      nextValue = habit.minTargetValue;
    }

    const updated: DailyHabit = {
      ...habit,
      logs: {
        ...habit.logs,
        [todayYMD]: {
          status: newStatus,
          value: nextValue,
        },
      },
    };

    onUpdateHabit(updated);
    if (newStatus === 'completed' || newStatus === 'minimum') {
      playSound.completeTask();
    } else {
      playSound.buttonClick();
    }
  };

  const handleUpdateTargetValue = (habit: DailyHabit, delta: number) => {
    const curLog = habit.logs[todayYMD];
    const curVal = curLog?.value ?? 0;
    const targetVal = habit.targetValue ?? 1;
    const minVal = habit.minTargetValue ?? 1;
    const newVal = Math.max(0, curVal + delta);
    
    let isStatus: HabitDayStatus = 'missed';
    if (newVal >= targetVal) isStatus = 'completed';
    else if (habit.hasMinimumThreshold && newVal >= minVal) isStatus = 'minimum';

    const updated: DailyHabit = {
      ...habit,
      logs: {
        ...habit.logs,
        [todayYMD]: {
          status: isStatus,
          value: newVal,
        },
      },
    };
    onUpdateHabit(updated);
    if (isStatus === 'completed' && curVal < targetVal) {
      playSound.completeTask();
    } else {
      playSound.buttonClick();
    }
  };

  const handleSaveRecord = (habit: DailyHabit, val: number) => {
    const updated: DailyHabit = {
      ...habit,
      logs: {
        ...habit.logs,
        [todayYMD]: {
          status: 'completed',
          value: val,
        },
      },
    };
    onUpdateHabit(updated);
    playSound.completeTask();
  };

  // Submit new habit
  const handleCreateHabit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    const newHabit: DailyHabit = {
      id: `h-${Date.now()}`,
      name: newHabitName.trim(),
      category: newHabitCategory,
      color: newColor,
      icon: newIcon,
      intention: newIntention.trim() || undefined,
      metricMode: newMetricMode,
      targetValue: newMetricMode === 'target' ? newTargetValue : undefined,
      unit: newMetricMode !== 'check' ? newUnit : undefined,
      hasMinimumThreshold: newHasMin,
      minTargetValue: newHasMin ? newMinVal : undefined,
      minTargetDesc: newHasMin ? newMinDesc.trim() : undefined,
      customXp: newCustomXp,
      minXp: newMinXp,
      scheduleType: newScheduleType,
      scheduledWeekdays: newScheduleType === 'weekdays' ? selectedWeekdays : undefined,
      logs: {
        [todayYMD]: { status: 'missed' },
      },
      createdAt: todayYMD,
    };

    onAddHabit(newHabit);
    setNewHabitName('');
    setNewMinDesc('');
    setNewIntention('');
    setNewHasMin(false);
    setIsAddModalOpen(false);
  };

  // Memoized overall commitment rate %
  const overallRate = useMemo(() => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(
      h => {
        const s = h.logs[todayYMD]?.status;
        return s === 'completed' || s === 'minimum' || s === 'shielded';
      }
    ).length;
    return Math.round((completed / habits.length) * 100);
  }, [habits, todayYMD]);

  // Memoized date list for performance history viewMode
  const historyDates = useMemo(() => {
    const daysCount = viewMode === 'weekly' ? 7 : viewMode === 'monthly' ? 30 : viewMode === 'yearly' ? 90 : 120;
    const dates: string[] = [];
    const baseD = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(baseD);
      d.setDate(baseD.getDate() - i);
      dates.push(formatDateToYMD(d));
    }
    return dates;
  }, [viewMode]);

  return (
    <div className="space-y-6">
      {/* 1. Header & Summary Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>✨</span>
            <span>{t.habitsTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t.clickHabitHint}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Commitment rate badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">
              {t.commitmentRate}: <span className="font-mono-numbers font-bold">{overallRate}%</span>
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t.addHabit}</span>
          </button>
        </div>
      </div>

      {/* 2. Habits Cards with interactive controllers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map(habit => {
          const streak = habitStreaks[habit.id] || { current: 0, best: 0 };
          const todayLog = habit.logs[todayYMD];
          const isDone = todayLog?.status === 'completed';
          const isMin = todayLog?.status === 'minimum';
          const isExcused = todayLog?.status === 'excused';
          const isShielded = todayLog?.status === 'shielded';

          const colorDef = HABIT_COLORS.find(c => c.id === habit.color) || HABIT_COLORS[0];
          const iconEmoji = HABIT_ICONS.find(i => i.id === habit.icon)?.emoji || '✨';

          const isDragging = draggedHabitId === habit.id;
          const isDragOver = dragOverHabitId === habit.id;

          return (
            <div
              key={habit.id}
              draggable={true}
              onDragStart={e => handleHabitDragStart(e, habit.id)}
              onDragOver={e => handleHabitDragOver(e, habit.id)}
              onDrop={e => handleHabitDrop(e, habit.id)}
              onDragEnd={handleHabitDragEnd}
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-sm ${
                isDragging
                  ? 'opacity-40 border-dashed border-indigo-400 bg-slate-900'
                  : isDragOver
                  ? 'border-2 border-indigo-400 bg-indigo-950/40 shadow-xl scale-[1.01]'
                  : isDone
                  ? 'bg-emerald-950/20 border-emerald-500/40 shadow-lg'
                  : isMin
                  ? 'bg-cyan-950/25 border-cyan-500/40 shadow-lg'
                  : 'bg-slate-900/80 border-indigo-500/20 hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                {/* Drag Grip Handle */}
                <div
                  className="p-1 text-slate-500 hover:text-indigo-300 cursor-grab active:cursor-grabbing shrink-0 transition"
                  title="سحب لإعادة الترتيب"
                >
                  <GripVertical className="w-4 h-4" />
                </div>

                <div 
                  className="flex-1 min-w-0 cursor-pointer group"
                  onClick={() => setSelectedDetailHabit(habit)}
                  title="انقر لفتح الإحصائيات المفصلة وتخصيص العادة"
                >
                  <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                    <span className={`w-6 h-6 rounded-lg ${colorDef.bg} border ${colorDef.border} flex items-center justify-center text-xs shadow-sm`}>
                      {iconEmoji}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 font-medium border border-indigo-500/30">
                      {habit.category}
                    </span>
                    {habit.hasMinimumThreshold && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                        <span>أقل القليل: {habit.minTargetDesc || `${habit.minTargetValue} ${habit.unit || ''}`}</span>
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      {habit.scheduleType === 'daily' ? t.schedDaily : t.schedWeekdays}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white group-hover:text-indigo-300 transition truncate flex items-center gap-1.5">
                    <span>{habit.name}</span>
                    <span className="text-[11px] text-indigo-400/80 font-normal flex items-center gap-0.5 group-hover:text-indigo-300">
                      <BarChart2 className="w-3.5 h-3.5" />
                      <span>إحصائيات</span>
                    </span>
                  </h4>
                  {habit.intention && (
                    <p className="text-[11px] text-indigo-300/70 italic mt-0.5 truncate">
                      «{habit.intention}»
                    </p>
                  )}
                </div>

                {/* Habit Streak Badge */}
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs shrink-0">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-mono-numbers font-bold">{streak.current}</span>
                  <span className="text-[10px] text-amber-400/70">{t.streakFlame}</span>
                </div>
              </div>

              {/* Mode-specific interactive controls for TODAY */}
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 mb-3 space-y-2">
                {habit.metricMode === 'check' && (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-300">تسجيل اليوم:</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleToggleTodayStatus(habit, 'completed')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                          isDone
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{isDone ? 'مكتملة' : 'إتمام كامل'}</span>
                      </button>

                      {habit.hasMinimumThreshold && (
                        <button
                          onClick={() => handleToggleTodayStatus(habit, 'minimum')}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                            isMin
                              ? 'bg-cyan-600 text-white shadow-md ring-1 ring-cyan-400'
                              : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
                          }`}
                          title="تنفيذ بأقل القليل لمنع انقطاع السلسلة"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>أقل القليل</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleToggleTodayStatus(habit, 'excused')}
                        className={`p-1.5 rounded-xl text-xs border transition ${
                          isExcused
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-300'
                        }`}
                        title="تسجيل بعذر"
                      >
                        <Smile className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleToggleTodayStatus(habit, 'shielded')}
                        className={`p-1.5 rounded-xl text-xs border transition ${
                          isShielded
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-amber-300'
                        }`}
                        title={t.statusShielded}
                      >
                        <Shield className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {habit.metricMode === 'target' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300">التقدم اليومي:</span>
                      <span className="font-mono-numbers text-indigo-300 font-bold">
                        {todayLog?.value ?? 0} / {habit.targetValue} {habit.unit}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          isDone ? 'bg-emerald-500' : isMin ? 'bg-cyan-400' : 'bg-indigo-500'
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(((todayLog?.value ?? 0) / (habit.targetValue ?? 1)) * 100)
                          )}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {habit.hasMinimumThreshold && (
                        <span className="text-[10px] text-cyan-300">
                          الحد الأدنى: {habit.minTargetValue} {habit.unit}
                        </span>
                      )}
                      <div className="flex items-center gap-1.5 ml-auto">
                        <button
                          onClick={() => handleUpdateTargetValue(habit, -1)}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleUpdateTargetValue(habit, 1)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 transition"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>زيادة 1 {habit.unit}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {habit.metricMode === 'record' && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-300">تسجيل القياس:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="0.1"
                        defaultValue={todayLog?.value ?? ''}
                        placeholder={`0.0 ${habit.unit || ''}`}
                        id={`input-record-${habit.id}`}
                        className="w-24 px-2 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-mono-numbers text-center outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => {
                          const input = document.getElementById(
                            `input-record-${habit.id}`
                          ) as HTMLInputElement;
                          if (input?.value) {
                            handleSaveRecord(habit, parseFloat(input.value));
                          }
                        }}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition"
                      >
                        {t.save}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card Controls: Open Details + Delete */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                <button
                  onClick={() => setSelectedDetailHabit(habit)}
                  className="text-xs font-semibold text-indigo-300 hover:text-white flex items-center gap-1 transition"
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  <span>عرض التحليلات المفصلة</span>
                </button>

                <div className="flex items-center gap-3">
                  <span>{t.bestStreak}: <strong className="text-slate-200 font-mono-numbers">{streak.best}</strong> يوم</span>
                  <button
                    onClick={() => onDeleteHabit(habit.id)}
                    className="p-1 text-red-500 hover:text-red-400 rounded-md hover:bg-red-500/10 transition"
                    title="حذف العادة"
                    aria-label="حذف العادة"
                  >
                    <X className="w-3.5 h-3.5 text-red-500 hover:text-red-400" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Performance History Calendar Matrix */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-sm shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">{t.habitPerformanceHistory}</h3>
          </div>

          {/* Time View Switcher */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-800 border border-slate-700 text-xs">
            {(['weekly', 'monthly', 'yearly', 'all'] as const).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-lg transition font-medium ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {mode === 'weekly'
                  ? t.viewWeekly
                  : mode === 'monthly'
                  ? t.viewMonthly
                  : mode === 'yearly'
                  ? t.viewYearly
                  : t.viewAllTime}
              </button>
            ))}
          </div>
        </div>

        {/* Legend with Bare Minimum */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
            <span>{t.statusCompleted}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-400" />
            <span>{t.statusMinimum}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-amber-500" />
            <span>{t.statusShielded}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-blue-500/60" />
            <span>{t.statusExcused}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-slate-800 border border-slate-700" />
            <span>{t.statusMissed}</span>
          </div>
        </div>

        {/* Matrix grid */}
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[600px] space-y-2.5">
            {habits.map(habit => (
              <div key={habit.id} className="flex items-center gap-3">
                <span 
                  onClick={() => setSelectedDetailHabit(habit)}
                  className="w-36 text-xs text-slate-300 font-medium truncate shrink-0 cursor-pointer hover:text-indigo-300 transition"
                >
                  {habit.name}
                </span>

                <div className="flex items-center gap-1 flex-1">
                  {historyDates.map(dateStr => {
                    const log = habit.logs[dateStr];
                    const status = log?.status || 'missed';

                    let bgClass = 'bg-slate-800 border-slate-700';
                    if (status === 'completed') bgClass = 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]';
                    else if (status === 'minimum') bgClass = 'bg-cyan-400 shadow-[0_0_6px_rgba(6,182,212,0.4)]';
                    else if (status === 'shielded') bgClass = 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.4)]';
                    else if (status === 'excused') bgClass = 'bg-blue-500/60';

                    return (
                      <div
                        key={dateStr}
                        onClick={() => setSelectedDetailHabit(habit)}
                        className={`h-4 flex-1 min-w-[10px] max-w-[20px] rounded-[3px] border border-transparent transition hover:scale-125 cursor-pointer ${bgClass}`}
                        title={`${dateStr} - ${status} ${log?.value ? `(${log.value})` : ''}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal: Add New Habit */}
      {isAddModalOpen && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setIsAddModalOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer">
          <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>➕</span>
                <span>{t.addHabit}</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.habitName} *
                </label>
                <input
                  type="text"
                  required
                  value={newHabitName}
                  onChange={e => setNewHabitName(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: أذكار الصباح، شرب الماء...' : 'e.g. Morning dhikr, water...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm focus:border-indigo-500"
                />
              </div>

              {/* Intention / Purpose */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <span>💭</span>
                  <span>النية والدافع (ما الغاية التي ترجوها من هذه العادة):</span>
                </label>
                <input
                  type="text"
                  value={newIntention}
                  onChange={e => setNewIntention(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: تقوية البدن، صفاء الذهن، طلب البركة من الله...' : 'e.g. Seeking blessings from Allah, health...'}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-xs text-indigo-300 focus:border-indigo-500"
                />
              </div>

              {/* Color and Icon */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700/80">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                    <Palette className="w-3 h-3 text-indigo-400" />
                    <span>لون العادة:</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {HABIT_COLORS.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setNewColor(c.id)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition ${
                          newColor === c.id
                            ? `${c.bg} ${c.text} ${c.border} ring-1 ring-white/30`
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        {language === 'ar' ? c.labelAr.split(' ')[0] : c.labelEn.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1.5">
                    أيقونة العادة:
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {HABIT_ICONS.slice(0, 8).map(ic => (
                      <button
                        key={ic.id}
                        type="button"
                        onClick={() => setNewIcon(ic.id)}
                        className={`p-1.5 rounded-lg text-sm border transition ${
                          newIcon === ic.id
                            ? 'bg-indigo-600/30 border-indigo-500 ring-1 ring-indigo-400'
                            : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                        }`}
                        title={language === 'ar' ? ic.labelAr : ic.labelEn}
                      >
                        {ic.emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.habitCategory}
                  </label>
                  <select
                    value={newHabitCategory}
                    onChange={e => setNewHabitCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
                  >
                    <option value="روحي">روحي وعبادة</option>
                    <option value="صحة">صحة وبدن</option>
                    <option value="قرآن">قرآن وتدبر</option>
                    <option value="دراسة">دراسة وتطوير</option>
                    <option value="عمل">عمل وإنتاجية</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.metricMode}
                  </label>
                  <select
                    value={newMetricMode}
                    onChange={e => setNewMetricMode(e.target.value as HabitMetricMode)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
                  >
                    <option value="check">{t.modeCheck}</option>
                    <option value="target">{t.modeTarget}</option>
                    <option value="record">{t.modeRecord}</option>
                  </select>
                </div>
              </div>

              {newMetricMode === 'target' && (
                <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.targetValue}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newTargetValue}
                      onChange={e => setNewTargetValue(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm font-mono-numbers"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.unit}
                    </label>
                    <input
                      type="text"
                      value={newUnit}
                      onChange={e => setNewUnit(e.target.value)}
                      placeholder="أكواب، صفحات..."
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 outline-none text-sm"
                    />
                  </div>
                </div>
              )}

              {/* Bare minimum configuration */}
              <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{t.hasMinimumThreshold}</span>
                  </label>
                  <input
                    type="checkbox"
                    checked={newHasMin}
                    onChange={e => setNewHasMin(e.target.checked)}
                    className="w-4 h-4 rounded text-cyan-600 bg-slate-900 border-slate-700"
                  />
                </div>

                {newHasMin && (
                  <div className="space-y-2 pt-1 border-t border-slate-700/60">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 mb-1 block">
                        اقتراحات سريعة لأقل القليل:
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {BARE_MINIMUM_PRESETS.map((p, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setNewMinVal(p.val);
                              setNewMinDesc(language === 'ar' ? p.titleAr : p.titleEn);
                              setNewUnit(p.unit);
                            }}
                            className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 text-[10px] transition"
                          >
                            {language === 'ar' ? p.titleAr : p.titleEn}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-0.5">
                          القيمة العددية للحد الأدنى:
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={newMinVal}
                          onChange={e => setNewMinVal(Number(e.target.value))}
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 outline-none text-xs font-mono-numbers"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-slate-300 mb-0.5">
                          {t.minThresholdDesc}:
                        </label>
                        <input
                          type="text"
                          value={newMinDesc}
                          onChange={e => setNewMinDesc(e.target.value)}
                          placeholder="مثلاً: صفحة واحدة، ركعتان، 5 دقائق..."
                          className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 outline-none text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.schedule}
                </label>
                <select
                  value={newScheduleType}
                  onChange={e => setNewScheduleType(e.target.value as HabitScheduleType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
                >
                  <option value="daily">{t.schedDaily}</option>
                  <option value="weekdays">{t.schedWeekdays}</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Deep Habit Analytics & Detail Modal */}
      {selectedDetailHabit && (
        <HabitDetailModal
          habit={selectedDetailHabit}
          isOpen={!!selectedDetailHabit}
          onClose={() => setSelectedDetailHabit(null)}
          onUpdateHabit={updated => {
            onUpdateHabit(updated);
            setSelectedDetailHabit(updated);
          }}
          language={language}
        />
      )}
    </div>
  );
};
