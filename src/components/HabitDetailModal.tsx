import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { DailyHabit, HabitDayStatus, Language } from '../types';
import { translations } from '../utils/translations';
import { formatDateToYMD, getTodayYMD, parseYMD } from '../utils/date';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  AlertTriangle, 
  Smile, 
  Shield, 
  Flame, 
  TrendingUp, 
  Save, 
  Calendar,
  Settings,
  Palette,
  Heart,
  Award,
  Zap,
  Info,
  Tag
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { BARE_MINIMUM_PRESETS, HABIT_COLORS, HABIT_ICONS, PRESET_TAGS } from '../utils/constants';

interface HabitDetailModalProps {
  habit: DailyHabit | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHabit: (updated: DailyHabit) => void;
  language: Language;
}

export const HabitDetailModal: React.FC<HabitDetailModalProps> = ({
  habit,
  isOpen,
  onClose,
  onUpdateHabit,
  language,
}) => {
  const t = translations[language];
  const todayYMD = getTodayYMD();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'stats' | 'calendar' | 'settings'>('stats');

  // Local Editable Settings State
  const [name, setName] = useState(habit?.name || '');
  const [color, setColor] = useState(habit?.color || 'emerald');
  const [icon, setIcon] = useState(habit?.icon || 'sparkles');
  const [intention, setIntention] = useState(habit?.intention || '');
  const [hasMin, setHasMin] = useState(habit?.hasMinimumThreshold ?? false);
  const [minVal, setMinVal] = useState(habit?.minTargetValue ?? 1);
  const [minDesc, setMinDesc] = useState(habit?.minTargetDesc ?? '');
  const [targetVal, setTargetVal] = useState(habit?.targetValue ?? 8);
  const [unit, setUnit] = useState(habit?.unit || 'مرات');
  const [customXp, setCustomXp] = useState(habit?.customXp ?? 15);
  const [minXp, setMinXp] = useState(habit?.minXp ?? 10);
  const [tags, setTags] = useState<string[]>(habit?.tags || []);

  // Selected Day in Calendar view for note/editing
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(todayYMD);
  const [calendarNoteInput, setCalendarNoteInput] = useState('');

  // Synchronize when habit prop updates
  React.useEffect(() => {
    if (habit) {
      setName(habit.name);
      setColor(habit.color || 'emerald');
      setIcon(habit.icon || 'sparkles');
      setIntention(habit.intention || '');
      setHasMin(habit.hasMinimumThreshold ?? false);
      setMinVal(habit.minTargetValue ?? 1);
      setMinDesc(habit.minTargetDesc ?? '');
      setTargetVal(habit.targetValue ?? 8);
      setUnit(habit.unit || 'مرات');
      setCustomXp(habit.customXp ?? 15);
      setMinXp(habit.minXp ?? 10);
      setTags(habit.tags || []);
    }
  }, [habit]);

  // Deep habit statistics computation
  const stats = useMemo(() => {
    if (!habit) {
      return {
        fullCompleted: 0,
        bareMinimum: 0,
        missedNoExcuse: 0,
        excused: 0,
        shielded: 0,
        totalActiveDays: 0,
        commitmentRate: 0,
        fullPercent: 0,
        minPercent: 0,
        missedPercent: 0,
        excusedPercent: 0,
      };
    }

    let fullCompleted = 0;
    let bareMinimum = 0;
    let missedNoExcuse = 0;
    let excused = 0;
    let shielded = 0;

    const logEntries = Object.entries(habit.logs || {});
    for (const [, entry] of logEntries) {
      if (entry.status === 'completed') {
        fullCompleted++;
      } else if (entry.status === 'minimum') {
        bareMinimum++;
      } else if (entry.status === 'excused') {
        excused++;
      } else if (entry.status === 'shielded') {
        shielded++;
      } else if (entry.status === 'missed') {
        missedNoExcuse++;
      }
    }

    const totalActiveDays = fullCompleted + bareMinimum + excused + shielded + missedNoExcuse;
    const committedTotal = fullCompleted + bareMinimum + shielded;
    const commitmentRate = totalActiveDays > 0 ? Math.round((committedTotal / totalActiveDays) * 100) : 0;

    // Percentages of total
    const fullPercent = totalActiveDays > 0 ? Math.round((fullCompleted / totalActiveDays) * 100) : 0;
    const minPercent = totalActiveDays > 0 ? Math.round((bareMinimum / totalActiveDays) * 100) : 0;
    const missedPercent = totalActiveDays > 0 ? Math.round((missedNoExcuse / totalActiveDays) * 100) : 0;
    const excusedPercent = totalActiveDays > 0 ? Math.round((excused / totalActiveDays) * 100) : 0;

    return {
      fullCompleted,
      bareMinimum,
      missedNoExcuse,
      excused,
      shielded,
      totalActiveDays,
      commitmentRate,
      fullPercent,
      minPercent,
      missedPercent,
      excusedPercent,
    };
  }, [habit?.logs]);

  // Streak calculations
  const streaks = useMemo(() => {
    if (!habit) return { current: 0, best: 0 };

    let current = 0;
    let best = 0;
    let temp = 0;
    const now = new Date();

    for (let i = 0; i < 90; i++) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const str = formatDateToYMD(d);
      const log = habit.logs?.[str];

      if (log?.status === 'completed' || log?.status === 'minimum' || log?.status === 'shielded') {
        temp++;
        if (i === current) current = temp;
        if (temp > best) best = temp;
      } else if (log?.status === 'excused') {
        // Excused keeps streak intact
        continue;
      } else {
        if (i <= current) current = temp;
        temp = 0;
      }
    }

    return { current, best: Math.max(best, current) };
  }, [habit?.logs]);

  // Last 35 days for Interactive Calendar Heatmap
  const calendarDays = useMemo(() => {
    const list: string[] = [];
    const base = new Date();
    for (let i = 34; i >= 0; i--) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      list.push(formatDateToYMD(d));
    }
    return list;
  }, []);

  // Update specific day status
  const handleSetDayStatus = (dateStr: string, status: HabitDayStatus) => {
    if (!habit) return;
    const currentEntry = habit.logs[dateStr];
    let nextVal = currentEntry?.value;

    if (status === 'completed' && habit.targetValue) {
      nextVal = habit.targetValue;
    } else if (status === 'minimum' && habit.minTargetValue) {
      nextVal = habit.minTargetValue;
    }

    const updated: DailyHabit = {
      ...habit,
      logs: {
        ...habit.logs,
        [dateStr]: {
          status,
          value: nextVal,
          notes: currentEntry?.notes,
        },
      },
    };

    onUpdateHabit(updated);
    playSound.buttonClick();
  };

  // Add note to a specific day
  const handleSaveDayNote = (dateStr: string) => {
    if (!habit) return;
    if (!calendarNoteInput.trim()) return;
    const currentEntry = habit.logs[dateStr] || { status: 'completed' as HabitDayStatus };
    const updated: DailyHabit = {
      ...habit,
      logs: {
        ...habit.logs,
        [dateStr]: {
          ...currentEntry,
          notes: calendarNoteInput.trim(),
        },
      },
    };
    onUpdateHabit(updated);
    setCalendarNoteInput('');
    playSound.completeTask();
  };

  // Save full habit customization settings
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!habit) return;
    if (!name.trim()) return;

    const updated: DailyHabit = {
      ...habit,
      name: name.trim(),
      color,
      icon,
      intention: intention.trim(),
      hasMinimumThreshold: hasMin,
      minTargetValue: hasMin ? minVal : undefined,
      minTargetDesc: hasMin ? minDesc.trim() : undefined,
      targetValue: habit.metricMode === 'target' ? targetVal : habit.targetValue,
      unit: habit.metricMode !== 'check' ? unit.trim() : habit.unit,
      customXp,
      minXp,
      tags,
    };

    onUpdateHabit(updated);
    playSound.completeTask();
    setActiveTab('stats');
  };

  // Quick preset minimum threshold applier
  const handleApplyMinPreset = (preset: typeof BARE_MINIMUM_PRESETS[0]) => {
    setHasMin(true);
    setMinVal(preset.val);
    setMinDesc(language === 'ar' ? preset.titleAr : preset.titleEn);
    setUnit(preset.unit);
  };

  if (!isOpen || !habit) return null;
  if (typeof document === 'undefined') return null;

  const todayStatus = habit.logs[todayYMD]?.status;
  const currentHabitColor = HABIT_COLORS.find(c => c.id === habit.color) || HABIT_COLORS[0];
  const currentHabitIcon = HABIT_ICONS.find(i => i.id === habit.icon)?.emoji || '✨';

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer">
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[94vh] overflow-y-auto bg-slate-900 border border-indigo-500/30 rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl cursor-default">
        
        {/* Glow ambient accent matching habit color */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${currentHabitColor.bg} rounded-full blur-3xl pointer-events-none opacity-40`} />

        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-indigo-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${currentHabitColor.bg} border ${currentHabitColor.border} shadow-lg shrink-0`}>
              {currentHabitIcon}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                  {habit.category}
                </span>
                {habit.hasMinimumThreshold ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" />
                    <span>أقل القليل مفعل ({habit.minTargetDesc || `${habit.minTargetValue} ${habit.unit || ''}`})</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700">
                    بدون حد أدنى
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-white truncate flex items-center gap-2">
                <span>{habit.name}</span>
              </h2>
              {habit.intention && (
                <p className="text-xs text-indigo-300/80 italic mt-0.5 flex items-center gap-1">
                  <span>💭</span>
                  <span>«{habit.intention}»</span>
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 my-4 p-1 rounded-2xl bg-slate-950/70 border border-slate-800">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{t.habitStatsTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('calendar')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'calendar'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>التقويم التفاعلي (35 يوماً)</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>تخصيص العادة وأقل القليل</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: Detailed Habit Statistics & Breakdown */}
        {/* ========================================================================= */}
        {activeTab === 'stats' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Top Streaks & Commitment Rate Header */}
            <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3 sm:p-3.5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-center">
                <div className="text-[11px] text-slate-400 mb-0.5">{t.commitmentRate}</div>
                <div className="text-2xl font-bold font-mono-numbers text-indigo-300">
                  {stats.commitmentRate}%
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">من إجمالي الأيام النشطة</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
                <div className="text-[11px] text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>السلسلة الحالية</span>
                </div>
                <div className="text-2xl font-bold font-mono-numbers text-amber-300">
                  {streaks.current} <span className="text-xs font-normal">أيام</span>
                </div>
                <div className="text-[10px] text-amber-400/70 mt-0.5">مستمرة بتوفيق الله</div>
              </div>

              <div className="p-3 sm:p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                <div className="text-[11px] text-slate-400 mb-0.5 flex items-center justify-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  <span>أفضل سلسلة</span>
                </div>
                <div className="text-2xl font-bold font-mono-numbers text-emerald-300">
                  {streaks.best} <span className="text-xs font-normal">أيام</span>
                </div>
                <div className="text-[10px] text-emerald-400/70 mt-0.5">أعلى رقم قياسي</div>
              </div>
            </div>

            {/* Proportional Stacked Progress Bar */}
            {stats.totalActiveDays > 0 && (
              <div className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                  <span className="font-semibold text-slate-300">التوزيع النسبي لسجل العادة:</span>
                  <span className="font-mono-numbers">{stats.totalActiveDays} يوماً مسجلاً</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
                  {stats.fullPercent > 0 && (
                    <div 
                      style={{ width: `${stats.fullPercent}%` }} 
                      className="bg-emerald-500 hover:bg-emerald-400 transition" 
                      title={`التزام كامل: ${stats.fullCompleted} (${stats.fullPercent}%)`}
                    />
                  )}
                  {stats.minPercent > 0 && (
                    <div 
                      style={{ width: `${stats.minPercent}%` }} 
                      className="bg-cyan-500 hover:bg-cyan-400 transition" 
                      title={`أقل القليل: ${stats.bareMinimum} (${stats.minPercent}%)`}
                    />
                  )}
                  {stats.excusedPercent > 0 && (
                    <div 
                      style={{ width: `${stats.excusedPercent}%` }} 
                      className="bg-blue-500 hover:bg-blue-400 transition" 
                      title={`معذور: ${stats.excused} (${stats.excusedPercent}%)`}
                    />
                  )}
                  {stats.missedPercent > 0 && (
                    <div 
                      style={{ width: `${stats.missedPercent}%` }} 
                      className="bg-rose-500 hover:bg-rose-400 transition" 
                      title={`فائت بدون عذر: ${stats.missedNoExcuse} (${stats.missedPercent}%)`}
                    />
                  )}
                </div>

                {/* Legend indicator */}
                <div className="flex flex-wrap items-center justify-center gap-3.5 mt-2.5 text-[11px] text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>كامل ({stats.fullPercent}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                    <span>أقل القليل ({stats.minPercent}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    <span>معذور ({stats.excusedPercent}%)</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span>بدون عذر ({stats.missedPercent}%)</span>
                  </span>
                </div>
              </div>
            )}

            {/* The 4 Core Detailed Metrics Requested by User */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                إحصائيات الالتزام والتفويت بالتفصيل الدقيق:
              </h3>

              {/* 1. Fully Committed */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-emerald-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{t.timesCommittedFull}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 font-mono-numbers">
                          {stats.fullPercent}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">إنجاز كامل الهدف المحدد بدقة وعزيمة</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono-numbers text-emerald-400">
                      {stats.fullCompleted} <span className="text-xs text-slate-400 font-normal">مرة</span>
                    </div>
                  </div>
                </div>
                {/* Visual bar */}
                <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden">
                  <div style={{ width: `${stats.fullPercent}%` }} className="h-full bg-emerald-500 rounded-full" />
                </div>
              </div>

              {/* 2. Bare Minimum (أقل القليل) */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-cyan-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{t.timesCommittedMin}</span>
                        {habit.hasMinimumThreshold && (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 font-mono-numbers">
                            {stats.minPercent}%
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-400">
                        {habit.hasMinimumThreshold ? (
                          habit.minTargetDesc ? (
                            <span>وصف الحد الأدنى: <strong className="text-cyan-300">{habit.minTargetDesc}</strong></span>
                          ) : (
                            <span>إنجاز الحد الأدنى لمنع انقطاع السلسلة في الأيام الصعبة</span>
                          )
                        ) : (
                          <span className="text-amber-300/80">لم يتم تحديد حد أدنى لهذه العادة بعد</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono-numbers text-cyan-300">
                      {stats.bareMinimum} <span className="text-xs text-slate-400 font-normal">مرة</span>
                    </div>
                  </div>
                </div>

                {habit.hasMinimumThreshold ? (
                  <>
                    <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden mb-2">
                      <div style={{ width: `${stats.minPercent}%` }} className="h-full bg-cyan-500 rounded-full" />
                    </div>
                    <div className="text-[11px] text-cyan-400/80 flex items-center gap-1">
                      <span>✨</span>
                      <span>أنقذت قاعدة «قليل دائم» السلسلة {stats.bareMinimum} مرة من التصفير الكامل!</span>
                    </div>
                  </>
                ) : (
                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">
                      فائدة الحد الأدنى: يضمن لك استمرار العادة حتى في السفر أو التعب.
                    </span>
                    <button
                      onClick={() => {
                        setHasMin(true);
                        setActiveTab('settings');
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>تفعيل حد أدنى الآن</span>
                    </button>
                  </div>
                )}
              </div>

              {/* 3. Missed without Excuse (تفويتها بدون عذر) */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-rose-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{t.timesMissedNoExcuse}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 font-mono-numbers">
                          {stats.missedPercent}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">فوات العادة تكاسلاً أو تسويفاً دون ظرف قاهر</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono-numbers text-rose-400">
                      {stats.missedNoExcuse} <span className="text-xs text-slate-400 font-normal">مرة</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden mb-2">
                  <div style={{ width: `${stats.missedPercent}%` }} className="h-full bg-rose-500 rounded-full" />
                </div>
                <div className="text-[11px] text-rose-300/80 flex items-center gap-1">
                  <span>💡</span>
                  <span>قاعدة اليوم الواحد: لا تسمح بتفويت العادة يومين متتاليين أبداً، عُد فوراً غداً!</span>
                </div>
              </div>

              {/* 4. Missed with Excuse (تفويتها بعذر) */}
              <div className="p-3.5 rounded-2xl bg-slate-800/60 border border-blue-500/30 relative overflow-hidden">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <span className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                      <Smile className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                        <span>{t.timesMissedExcused}</span>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 font-mono-numbers">
                          {stats.excusedPercent}%
                        </span>
                      </div>
                      <div className="text-xs text-slate-400">سفر أو مرض أو عذر مشروع — يحافظ على السلسلة ولا يكسرها</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-2xl font-bold font-mono-numbers text-blue-300">
                      {stats.excused} <span className="text-xs text-slate-400 font-normal">مرة</span>
                    </div>
                  </div>
                </div>
                <div className="h-1.5 w-full bg-slate-700/60 rounded-full overflow-hidden mb-2">
                  <div style={{ width: `${stats.excusedPercent}%` }} className="h-full bg-blue-500 rounded-full" />
                </div>
                <div className="text-[11px] text-blue-300/80 flex items-center gap-1">
                  <span>🌿</span>
                  <span>الأعذار المشروعة مباحة شرعاً ونفسياً، وتبقى نيتك المباركة محفوظة!</span>
                </div>
              </div>

              {/* 5. Shielded (دروع الحماية) */}
              {stats.shielded > 0 && (
                <div className="p-3 rounded-xl bg-slate-800/50 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>تم إنقاذ السلسلة بواسطة دروع التحفيز ({t.timesShielded})</span>
                  </div>
                  <div className="text-base font-bold font-mono-numbers text-amber-300">
                    {stats.shielded} مرة
                  </div>
                </div>
              )}
            </div>

            {/* Quick Record for Today */}
            <div className="pt-3 border-t border-slate-800">
              <div className="text-xs font-semibold text-slate-300 mb-2">تسجيل حالة اليوم السريعة بنقرة واحدة:</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  onClick={() => handleSetDayStatus(todayYMD, 'completed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    todayStatus === 'completed'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-1 ring-emerald-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>إتمام كامل</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus(todayYMD, 'minimum')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    todayStatus === 'minimum'
                      ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/30 ring-1 ring-cyan-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>أقل القليل</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus(todayYMD, 'excused')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    todayStatus === 'excused'
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <Smile className="w-3.5 h-3.5 text-blue-300" />
                  <span>معذور 🌿</span>
                </button>

                <button
                  onClick={() => handleSetDayStatus(todayYMD, 'missed')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    todayStatus === 'missed'
                      ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30 ring-1 ring-rose-400'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                  <span>فائت ⚠️</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: Interactive 35-Day Calendar Heatmap */}
        {/* ========================================================================= */}
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>خريطة الالتزام لآخر 35 يوماً (انقر على أي يوم لتغيير حالته):</span>
              <span className="text-indigo-400 font-semibold">اليوم: {todayYMD}</span>
            </div>

            {/* Grid Heatmap */}
            <div className="grid grid-cols-7 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-800">
              {calendarDays.map(dateStr => {
                const isSelected = selectedCalendarDate === dateStr;
                const isToday = dateStr === todayYMD;
                const status = habit.logs[dateStr]?.status;
                const note = habit.logs[dateStr]?.notes;

                let colorClasses = 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600';
                let indicator = '⚪';

                if (status === 'completed') {
                  colorClasses = 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:border-emerald-400';
                  indicator = '🟢';
                } else if (status === 'minimum') {
                  colorClasses = 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 hover:border-cyan-400';
                  indicator = '🔷';
                } else if (status === 'excused') {
                  colorClasses = 'bg-blue-950/50 border-blue-500/50 text-blue-300 hover:border-blue-400';
                  indicator = '🔵';
                } else if (status === 'missed') {
                  colorClasses = 'bg-rose-950/50 border-rose-500/50 text-rose-400 hover:border-rose-400';
                  indicator = '🔴';
                }

                const dayNum = dateStr.split('-')[2];

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedCalendarDate(dateStr);
                      setCalendarNoteInput(note || '');
                    }}
                    className={`p-2 rounded-xl border text-center transition flex flex-col items-center justify-center relative ${colorClasses} ${
                      isSelected ? 'ring-2 ring-indigo-400 scale-105 z-10' : ''
                    } ${isToday ? 'font-bold' : ''}`}
                  >
                    <span className="text-[10px] opacity-75">{dateStr.split('-')[1]}/{dayNum}</span>
                    <span className="text-xs my-0.5">{indicator}</span>
                    {isToday && (
                      <span className="text-[8px] px-1 rounded bg-amber-500/20 text-amber-300">اليوم</span>
                    )}
                    {note && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 absolute top-1 right-1" title="توجد ملاحظة" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Day Controller */}
            {selectedCalendarDate && (
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-indigo-400" />
                    <span>تعديل يوم: {selectedCalendarDate}</span>
                  </span>
                  <span className="text-slate-400">
                    الحالة الحالية: <strong className="text-indigo-300">{habit.logs[selectedCalendarDate]?.status || 'غير مسجل'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleSetDayStatus(selectedCalendarDate, 'completed')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>كامل</span>
                  </button>
                  <button
                    onClick={() => handleSetDayStatus(selectedCalendarDate, 'minimum')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>أقل القليل</span>
                  </button>
                  <button
                    onClick={() => handleSetDayStatus(selectedCalendarDate, 'excused')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-blue-950/40 border border-blue-500/30 text-blue-300 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <Smile className="w-3.5 h-3.5" />
                    <span>معذور</span>
                  </button>
                  <button
                    onClick={() => handleSetDayStatus(selectedCalendarDate, 'missed')}
                    className="py-1.5 px-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center justify-center gap-1"
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>فائت</span>
                  </button>
                </div>

                {/* Day Note Input */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                  <input
                    type="text"
                    value={calendarNoteInput}
                    onChange={e => setCalendarNoteInput(e.target.value)}
                    placeholder="أضف ملاحظة أو تدوينة لهذا اليوم (مثلاً: كنت مريضاً، أو قرأت في المسجد)..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleSaveDayNote(selectedCalendarDate)}
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 transition"
                  >
                    حفظ الملاحظة
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: Customization & Minimum Floor Settings */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="space-y-4 animate-fadeIn">
            {/* 1. Habit Name & Intention */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  اسم العادة:
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm font-bold text-white focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <span>💭</span>
                  <span>النية والدافع (لماذا هذه العادة مهمة في حياتك وإيمانك):</span>
                </label>
                <input
                  type="text"
                  value={intention}
                  onChange={e => setIntention(e.target.value)}
                  placeholder="مثال: ابتغاء مرضاة الله، تنشيط البدن لطاعة الله، صفاء الذهن..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-xs text-indigo-300 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 2. Color & Icon Selector */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-indigo-400" />
                <span>لون وهوية العادة:</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_COLORS.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 ${
                      color === c.id
                        ? `${c.bg} ${c.text} ${c.border} ring-2 ring-white/20`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${c.bg}`} />
                    <span>{language === 'ar' ? c.labelAr : c.labelEn}</span>
                  </button>
                ))}
              </div>

              <label className="block text-xs font-semibold text-slate-300 mt-2 flex items-center gap-1.5">
                <span>أيقونة العادة:</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {HABIT_ICONS.map(ic => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    className={`p-2 rounded-xl text-lg border transition ${
                      icon === ic.id
                        ? 'bg-indigo-600/30 border-indigo-500 ring-2 ring-indigo-400'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                    title={language === 'ar' ? ic.labelAr : ic.labelEn}
                  >
                    {ic.emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Tags Selection */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>تصنيفات العادة (Tags):</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-900 border border-slate-700">
                {PRESET_TAGS.map(tag => {
                  const tagName = language === 'ar' ? tag.nameAr : tag.nameEn;
                  const isSelected = tags.includes(tagName);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => setTags(prev => isSelected ? prev.filter(t => t !== tagName) : [...prev, tagName])}
                      className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 border ${
                        isSelected
                          ? 'bg-indigo-600 text-white border-indigo-400'
                          : 'bg-slate-800 text-slate-300 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{tagName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Minimum Viable Habit (أقل القليل) Configuration */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    <span>{t.hasMinimumThreshold}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    مبدأ «أحب الأعمال إلى الله أدومها وإن قل»: يمنع انقطاع السلسلة في الأيام المزدحمة أو المرض.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={hasMin}
                  onChange={e => setHasMin(e.target.checked)}
                  className="w-5 h-5 rounded text-cyan-600 bg-slate-900 border-slate-700 focus:ring-cyan-500 cursor-pointer"
                />
              </div>

              {hasMin && (
                <div className="pt-3 border-t border-slate-800/80 space-y-3">
                  {/* Quick Presets */}
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 mb-1.5 block">
                      اقتراحات سريعة لأقل القليل (اختر لتطبيق فوري):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {BARE_MINIMUM_PRESETS.map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleApplyMinPreset(p)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-cyan-950/50 border border-cyan-500/20 text-cyan-300 text-[11px] font-medium transition"
                        >
                          {language === 'ar' ? p.titleAr : p.titleEn}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        {t.minThresholdValue}:
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={minVal}
                        onChange={e => setMinVal(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        وحدة القياس:
                      </label>
                      <input
                        type="text"
                        value={unit}
                        onChange={e => setUnit(e.target.value)}
                        placeholder="أكواب، صفحات، ركعات..."
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      {t.minThresholdDesc}:
                    </label>
                    <input
                      type="text"
                      value={minDesc}
                      onChange={e => setMinDesc(e.target.value)}
                      placeholder={language === 'ar' ? 'مثال: ركعتان خفيفتان، صفحة واحدة من المصحف، 5 دقائق مشي...' : 'e.g. 1 page read, 2 rak\'ahs, 5 min walk...'}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-xs focus:border-cyan-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        نقاط XP للإنجاز الكامل:
                      </label>
                      <input
                        type="number"
                        min={5}
                        max={100}
                        value={customXp}
                        onChange={e => setCustomXp(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono-numbers"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        نقاط XP لأقل القليل:
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={minXp}
                        onChange={e => setMinXp(Number(e.target.value))}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-sm font-mono-numbers"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Target Value if applicable */}
            {habit.metricMode === 'target' && (
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  المستهدف اليومي الكامل ({unit}):
                </label>
                <input
                  type="number"
                  min={1}
                  value={targetVal}
                  onChange={e => setTargetVal(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm font-mono-numbers"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('stats')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
              >
                {t.cancel}
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التخصيص</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};
