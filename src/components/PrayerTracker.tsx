import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Language, UserStats, QadaState } from '../types';
import { translations } from '../utils/translations';
import { getTodayYMD, formatDateToYMD } from '../utils/date';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { 
  Flame, 
  CheckCircle2, 
  Clock, 
  X, 
  Sparkles, 
  Calculator, 
  Calendar, 
  RotateCcw, 
  PlusCircle, 
  TrendingUp, 
  ShieldCheck, 
  Info, 
  Award,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export type ObligatoryPrayerId = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type PrayerPerformanceStatus = 'jamaah' | 'on_time' | 'late' | 'missed' | 'not_yet';

export interface DailyPrayerEntry {
  status: PrayerPerformanceStatus;
  completedAt?: string;
}

export type DailyPrayerLogs = Record<string, Record<ObligatoryPrayerId, DailyPrayerEntry>>;

interface PrayerTrackerProps {
  stats: UserStats;
  onUpdateStats: React.Dispatch<React.SetStateAction<UserStats>>;
  dailyPrayerLogs: DailyPrayerLogs;
  onUpdatePrayerLogs: (newLogs: DailyPrayerLogs) => void;
  language: Language;
}

const PRAYER_DETAILS: Array<{ id: ObligatoryPrayerId; ar: string; en: string; icon: string; defaultTime: string }> = [
  { id: 'fajr', ar: 'الفجر', en: 'Fajr', icon: '🌅', defaultTime: '05:00' },
  { id: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', icon: '☀️', defaultTime: '12:30' },
  { id: 'asr', ar: 'العصر', en: 'Asr', icon: '🌤️', defaultTime: '15:45' },
  { id: 'maghrib', ar: 'المغرب', en: 'Maghrib', icon: '🌆', defaultTime: '18:15' },
  { id: 'isha', ar: 'العشاء', en: 'Isha', icon: '🌙', defaultTime: '19:45' },
];

export const PrayerTracker: React.FC<PrayerTrackerProps> = ({
  stats,
  onUpdateStats,
  dailyPrayerLogs,
  onUpdatePrayerLogs,
  language,
}) => {
  const t = translations[language];
  const todayYMD = getTodayYMD();

  const [selectedDate, setSelectedDate] = useState<string>(todayYMD);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  // Calculator wizard form state
  const [calcYears, setCalcYears] = useState<number>(1);
  const [calcMonths, setCalcMonths] = useState<number>(0);
  const [calcDailyPace, setCalcDailyPace] = useState<number>(5); // 5 qada prayers per day (1 set)

  // Current day's prayer log
  const currentDayLog = dailyPrayerLogs[selectedDate] || {
    fajr: { status: 'not_yet' },
    dhuhr: { status: 'not_yet' },
    asr: { status: 'not_yet' },
    maghrib: { status: 'not_yet' },
    isha: { status: 'not_yet' },
  };

  // Count today's completed prayers
  const todayCompletedCount = useMemo(() => {
    let count = 0;
    PRAYER_DETAILS.forEach(p => {
      const s = currentDayLog[p.id]?.status;
      if (s === 'jamaah' || s === 'on_time' || s === 'late') {
        count++;
      }
    });
    return count;
  }, [currentDayLog]);

  // Calculate prayer streak across past days
  const prayerStreak = useMemo(() => {
    let streak = 0;
    const baseDate = new Date();

    for (let i = 0; i < 60; i++) {
      const d = new Date(baseDate);
      d.setDate(baseDate.getDate() - i);
      const dateStr = formatDateToYMD(d);
      const log = dailyPrayerLogs[dateStr];

      if (!log) {
        if (i === 0) continue; // today not logged yet is okay
        break;
      }

      const allDone = PRAYER_DETAILS.every(p => {
        const s = log[p.id]?.status;
        return s === 'jamaah' || s === 'on_time' || s === 'late';
      });

      if (allDone) {
        streak++;
      } else {
        if (i === 0) continue;
        break;
      }
    }

    return streak;
  }, [dailyPrayerLogs]);

  // Handle setting a prayer status
  const handleSetPrayerStatus = (prayerId: ObligatoryPrayerId, newStatus: PrayerPerformanceStatus) => {
    const prevStatus = currentDayLog[prayerId]?.status || 'not_yet';
    const isNowDone = newStatus === 'jamaah' || newStatus === 'on_time' || newStatus === 'late';
    const wasDone = prevStatus === 'jamaah' || prevStatus === 'on_time' || prevStatus === 'late';

    const updatedLogs: DailyPrayerLogs = {
      ...dailyPrayerLogs,
      [selectedDate]: {
        ...currentDayLog,
        [prayerId]: {
          status: newStatus,
          completedAt: isNowDone ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
        },
      },
    };

    onUpdatePrayerLogs(updatedLogs);

    // Reward XP and coins for fulfilling prayer
    if (isNowDone && !wasDone) {
      const xpAmount = newStatus === 'jamaah' ? 270 : newStatus === 'on_time' ? 10 : 5;
      onUpdateStats(prev => ({
        ...prev,
        xp: prev.xp + xpAmount,
        gold: prev.gold + (newStatus === 'jamaah' ? 27 : 5),
      }));
      playSound.completeTask();

      // Check if all 5 are completed today
      const futureCompleted = PRAYER_DETAILS.filter(p => {
        if (p.id === prayerId) return true;
        const s = currentDayLog[p.id]?.status;
        return s === 'jamaah' || s === 'on_time' || s === 'late';
      }).length;

      if (futureCompleted === 5) {
        confetti({ particleCount: 70, spread: 70 });
      }
    } else if (newStatus === 'missed') {
      // Logic for handling missed prayer: move to qada section and set high priority
      onUpdateStats(prev => ({
        ...prev,
        qada: {
          ...prev.qada,
          [prayerId]: prev.qada[prayerId] + 1,
        },
      }));
      playSound.buttonClick();
    } else {
      playSound.buttonClick();
    }
  };

  // Handle fulfilling Qada prayer (+1, +5, etc)
  const handleFulfillQada = (prayerId: ObligatoryPrayerId, amount = 1) => {
    if (stats.qada[prayerId] <= 0) return;

    const actualAmount = Math.min(amount, stats.qada[prayerId]);

    onUpdateStats(prev => ({
      ...prev,
      xp: prev.xp + actualAmount * 25,
      gold: prev.gold + actualAmount * 5,
      totalQadaMadeUp: prev.totalQadaMadeUp + actualAmount,
      qada: {
        ...prev.qada,
        [prayerId]: Math.max(0, prev.qada[prayerId] - actualAmount),
      },
    }));

    playSound.completeTask();
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.8 } });
  };

  // Handle fulfilling full set (5 prayers qada)
  const handleFulfillFullQadaSet = () => {
    let totalDeducted = 0;
    const newQada = { ...stats.qada };

    PRAYER_DETAILS.forEach(p => {
      if (newQada[p.id] > 0) {
        newQada[p.id] -= 1;
        totalDeducted += 1;
      }
    });

    if (totalDeducted === 0) return;

    onUpdateStats(prev => ({
      ...prev,
      xp: prev.xp + totalDeducted * 25 + 50, // bonus 50 XP for full set
      gold: prev.gold + totalDeducted * 5 + 15,
      totalQadaMadeUp: prev.totalQadaMadeUp + totalDeducted,
      qada: newQada,
    }));

    playSound.levelUp();
    confetti({ particleCount: 80, spread: 80 });
  };

  // Save calculated Qada missed prayers
  const handleApplyCalculatedQada = (e: React.FormEvent) => {
    e.preventDefault();
    const totalDays = calcYears * 365 + calcMonths * 30;
    if (totalDays <= 0) return;

    onUpdateStats(prev => ({
      ...prev,
      qada: {
        fajr: totalDays,
        dhuhr: totalDays,
        asr: totalDays,
        maghrib: totalDays,
        isha: totalDays,
      },
    }));

    setIsCalculatorOpen(false);
    playSound.completeTask();
  };

  // Total Qada remaining across all 5 prayers
  const totalQadaRemaining = useMemo(() => {
    return stats.qada.fajr + stats.qada.dhuhr + stats.qada.asr + stats.qada.maghrib + stats.qada.isha;
  }, [stats.qada]);

  // Projected completion time based on daily pace
  const projectedDaysLeft = useMemo(() => {
    if (totalQadaRemaining <= 0 || calcDailyPace <= 0) return 0;
    return Math.ceil(totalQadaRemaining / calcDailyPace);
  }, [totalQadaRemaining, calcDailyPace]);

  const projectedYears = Math.floor(projectedDaysLeft / 365);
  const projectedMonths = Math.floor((projectedDaysLeft % 365) / 30);
  const projectedDays = projectedDaysLeft % 30;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Header Banner & Prayer Streak Status */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/80 via-slate-900 to-purple-950/70 border border-indigo-500/30 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xl shadow-inner">
              🕌
            </span>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>متتبع الصلوات اليومية وقضاء الفوائت</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono-numbers font-bold">
                  {todayCompletedCount} / 5 مكتمل اليوم
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                حافظ على صلواتك الخمس في أوقاتها، وسدد ما فاتك من صلوات السنوات الماضية بنظام دقيق
              </p>
            </div>
          </div>
        </div>

        {/* Streak Flame Badge */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-lg">
          <Flame className="w-6 h-6 text-amber-400 animate-pulse" />
          <div>
            <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">سلسلة المحافظة</div>
            <div className="text-base font-black text-white font-mono-numbers flex items-center gap-1">
              <span>{prayerStreak}</span>
              <span className="text-xs text-amber-300 font-normal">أيام متتالية</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Today's 5 Daily Obligatory Prayers Card Grid */}
      <div className="p-5 rounded-3xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-md shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-indigo-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <h3 className="text-base font-bold text-white">الصلوات الخمس اليومية</h3>
            <span className="text-xs text-indigo-300 font-mono-numbers">({selectedDate})</span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => {
                const d = new Date();
                setSelectedDate(formatDateToYMD(d));
              }}
              className={`px-3 py-1 rounded-xl font-bold transition ${
                selectedDate === todayYMD
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              اليوم
            </button>
          </div>
        </div>

        {/* 5 Prayers Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRAYER_DETAILS.map(prayer => {
            const entry = currentDayLog[prayer.id] || { status: 'not_yet' };
            const status = entry.status;
            const isDone = status === 'jamaah' || status === 'on_time' || status === 'late';

            return (
              <div
                key={prayer.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                  status === 'jamaah'
                    ? 'bg-emerald-950/30 border-emerald-500/50 shadow-lg ring-1 ring-emerald-500/30'
                    : status === 'on_time'
                    ? 'bg-indigo-950/30 border-indigo-500/50 shadow-md'
                    : status === 'late'
                    ? 'bg-amber-950/20 border-amber-500/40'
                    : status === 'missed'
                    ? 'bg-rose-950/20 border-rose-500/40 opacity-80'
                    : 'bg-slate-950/60 border-slate-800 hover:border-indigo-500/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-2xl">{prayer.icon}</span>
                    <span className="text-[10px] font-mono-numbers text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full">
                      {prayer.defaultTime}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white flex items-center gap-1.5">
                    <span>{language === 'ar' ? prayer.ar : prayer.en}</span>
                    {isDone && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </h4>
                  {entry.completedAt && (
                    <span className="text-[10px] text-emerald-300 font-mono-numbers block">
                      تم التسجيل {entry.completedAt}
                    </span>
                  )}
                </div>

                {/* Status action buttons */}
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => handleSetPrayerStatus(prayer.id, 'jamaah')}
                    className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
                      status === 'jamaah'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-emerald-600/20 hover:text-emerald-300'
                    }`}
                  >
                    <span>🕌</span>
                    <span>في جماعة (+30 XP)</span>
                  </button>

                  <button
                    onClick={() => handleSetPrayerStatus(prayer.id, 'on_time')}
                    className={`w-full py-1 px-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1 ${
                      status === 'on_time'
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-indigo-600/20 hover:text-indigo-300'
                    }`}
                  >
                    <span>✨</span>
                    <span>في الوقت (+20 XP)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1 pt-0.5">
                    <button
                      onClick={() => handleSetPrayerStatus(prayer.id, 'late')}
                      className={`py-1 px-1 rounded-lg text-[10px] font-medium transition ${
                        status === 'late'
                          ? 'bg-amber-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-amber-300'
                      }`}
                    >
                      تأخير/قضاء
                    </button>

                    <button
                      onClick={() => handleSetPrayerStatus(prayer.id, 'missed')}
                      className={`py-1 px-1 rounded-lg text-[10px] font-medium transition ${
                        status === 'missed'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-800 text-slate-400 hover:text-rose-400'
                      }`}
                    >
                      فائتة
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Missed Prayers & Long-term Qada Section (قسم قضـاء الفـوائت لسنـوات) */}
      <div className="p-6 rounded-3xl bg-slate-900/90 border border-purple-500/30 shadow-2xl backdrop-blur-md space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-purple-500/20">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xl shadow-inner">
              📿
            </span>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>سجل وقضاء الفوائت تراكمياً (الصلوات المفقودة لسنوات)</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono-numbers font-bold">
                  مجموع المتبقي: {totalQadaRemaining} صلاة
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                برنامج عملي وسهل لقضاء ما فاتك من سنوات بدون مشقة، مع متابعة الإنجاز اليومي والعد التنازلي
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCalculatorOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition flex items-center gap-1.5"
            >
              <Calculator className="w-4 h-4 text-purple-200" />
              <span>حاسبة الفوائت الذكية (سنوات/أشهر)</span>
            </button>

            {totalQadaRemaining > 0 && (
              <button
                onClick={handleFulfillFullQadaSet}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition flex items-center gap-1.5"
                title="قضاء صلاة واحدة من كل فريضة من الخمس (+175 XP)"
              >
                <Sparkles className="w-4 h-4" />
                <span>إتمام ورد اليوم (5 صلوات قضاء)</span>
              </button>
            )}
          </div>
        </div>

        {/* Total Impact & Projection Banner */}
        {totalQadaRemaining > 0 ? (
          <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/25 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-purple-200">
              <TrendingUp className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                عند قضائك <strong>{calcDailyPace} صلوات يومياً</strong>، من المتوقع أن تنهي قضاء كامل الصلوات الفوائتة خلال:{' '}
                <strong className="text-amber-300 font-mono-numbers">
                  {projectedYears > 0 ? `${projectedYears} سنة ` : ''}
                  {projectedMonths > 0 ? `${projectedMonths} شهر ` : ''}
                  {projectedDays > 0 ? `${projectedDays} يوم` : ''}
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-2 text-emerald-300 font-mono-numbers font-bold">
              <span>تم قضاء {stats.totalQadaMadeUp} صلاة حتى الآن 🎉</span>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>ما شاء الله! ليس عليك صلوات فوائت مسجلة حالياً. استمر على محافظتك على الصلوات الخمس اليومية!</span>
          </div>
        )}

        {/* 5 Individual Qada Prayer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {PRAYER_DETAILS.map(prayer => {
            const count = stats.qada[prayer.id] || 0;

            return (
              <div
                key={prayer.id}
                className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xl">{prayer.icon}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono-numbers font-bold">
                    متبقي {count}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">قضاء {prayer.ar}</h4>
                  <p className="text-[10px] text-slate-400">فريضة فائتة</p>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleFulfillQada(prayer.id, 1)}
                    disabled={count <= 0}
                    className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition flex items-center justify-center gap-1 shadow-md shadow-purple-600/20"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>قضاء صلاة (+25 XP)</span>
                  </button>

                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => handleFulfillQada(prayer.id, 5)}
                      disabled={count <= 0}
                      className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-[10px] font-semibold transition"
                    >
                      قضاء 5 صلوات
                    </button>

                    <button
                      onClick={() => handleFulfillQada(prayer.id, 10)}
                      disabled={count <= 0}
                      className="py-1 px-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-[10px] font-semibold transition"
                    >
                      قضاء 10 صلوات
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calculator Modal Wizard */}
      {isCalculatorOpen && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setIsCalculatorOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn cursor-pointer">
          <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-slate-900 border border-purple-500/40 rounded-3xl p-6 sm:p-7 text-slate-100 shadow-2xl space-y-4 cursor-default max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-purple-500/20">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Calculator className="w-5 h-5 text-purple-400" />
                <span>حاسبة الصلوات الفوائتة التقديرية (لسنوات)</span>
              </h3>
              <button
                onClick={() => setIsCalculatorOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              إذا انقطعت عن الصلاة لسنوات أو أشهر سابقة، يمكنك تقدير المدة هنا وسيقوم النظام بتوزيع الفوائت تلقائياً على الصلوات الخمس لتسهيل القضاء.
            </p>

            <form onSubmit={handleApplyCalculatedQada} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-slate-800/60 border border-slate-700">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    عدد السنوات الفائتة:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={70}
                    value={calcYears}
                    onChange={e => setCalcYears(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm font-mono-numbers text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    أشهر إضافية:
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={11}
                    value={calcMonths}
                    onChange={e => setCalcMonths(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm font-mono-numbers text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  معدل القضاء اليومي المستهدف (كم صلاة قضاء تحب أن تؤدي يومياً):
                </label>
                <select
                  value={calcDailyPace}
                  onChange={e => setCalcDailyPace(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-xs text-white"
                >
                  <option value={5}>صلاة واحدة قضاء مع كل صلاة حاضر (5 صلوات يومياً)</option>
                  <option value={10}>صلاتين قضاء مع كل صلاة حاضر (10 صلوات يومياً - إنجاز أسرع)</option>
                  <option value={15}>3 صلوات قضاء مع كل صلاة حاضر (15 صلاة يومياً)</option>
                  <option value={20}>4 صلوات قضاء يومياً (20 صلاة يومياً)</option>
                </select>
              </div>

              {/* Summary Calculation Box */}
              <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-500/30 space-y-1.5 text-xs text-purple-200">
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span>ملخص النتيجة التقديرية:</span>
                </div>
                <div>
                  إجمالي الأيام الفائتة:{' '}
                  <strong className="text-amber-300 font-mono-numbers font-bold">
                    {calcYears * 365 + calcMonths * 30} يوم
                  </strong>
                </div>
                <div>
                  عدد الصلوات الفائتة لكل صلاة (فجر، ظهر...):{' '}
                  <strong className="text-emerald-300 font-mono-numbers font-bold">
                    {calcYears * 365 + calcMonths * 30} صلاة
                  </strong>
                </div>
                <div>
                  إجمالي جميع الفوائت:{' '}
                  <strong className="text-indigo-300 font-mono-numbers font-bold">
                    {(calcYears * 365 + calcMonths * 30) * 5} صلاة
                  </strong>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg"
                >
                  تطبيق الجدول والبدء بالقضاء
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
