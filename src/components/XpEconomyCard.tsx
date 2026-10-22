import React, { useState, useMemo } from 'react';
import { DailyXpLog, Language } from '../types';
import { translations } from '../utils/translations';
import { parseYMD } from '../utils/date';
import { Award, Zap, Target, Gift } from 'lucide-react';

interface XpEconomyCardProps {
  history: DailyXpLog[];
  language: Language;
}

export const XpEconomyCard: React.FC<XpEconomyCardProps> = ({ history, language }) => {
  const t = translations[language];
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Memoize totals and maximum calculation
  const { maxTotal, totalTasks, totalFocus, totalGoals, totalRewards, grandTotal } = useMemo(() => {
    let tTasks = 0;
    let tFocus = 0;
    let tGoals = 0;
    let tRewards = 0;
    let maxT = 180;

    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      tTasks += h.tasks;
      tFocus += h.focus;
      tGoals += h.goals;
      tRewards += h.rewards;
      const dayT = h.tasks + h.focus + h.goals + h.rewards;
      if (dayT > maxT) maxT = dayT;
    }

    return {
      maxTotal: maxT,
      totalTasks: tTasks,
      totalFocus: tFocus,
      totalGoals: tGoals,
      totalRewards: tRewards,
      grandTotal: tTasks + tFocus + tGoals + tRewards,
    };
  }, [history]);

  return (
    <div className="xp-economy-card relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-[#0a0e27]/90 border border-indigo-500/30 p-5 shadow-xl backdrop-blur-sm">
      {/* Subtle Aurora highlight */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-300 text-sm">📊</span>
            {t.xpEconomyTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.xpEconomySubtitle}</p>
        </div>
        <div className="px-3 py-1 rounded-xl bg-indigo-900/40 border border-indigo-500/30 text-xs font-mono-numbers text-indigo-200">
          {grandTotal} {t.xpShort}
        </div>
      </div>

      {/* 4 Sources Summary Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <div className="flex items-center gap-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Award className="w-4 h-4 text-blue-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">{t.sourceTasks}</span>
            <span className="font-bold text-blue-300 font-mono-numbers">{totalTasks} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-purple-500/10 border border-purple-500/20">
          <Zap className="w-4 h-4 text-purple-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">{t.sourceFocus}</span>
            <span className="font-bold text-purple-300 font-mono-numbers">{totalFocus} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <Target className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">{t.sourceGoals}</span>
            <span className="font-bold text-emerald-300 font-mono-numbers">{totalGoals} XP</span>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Gift className="w-4 h-4 text-amber-400" />
          <div className="text-xs">
            <span className="text-slate-400 block text-[10px]">{t.sourceRewards}</span>
            <span className="font-bold text-amber-300 font-mono-numbers">{totalRewards} XP</span>
          </div>
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="relative pt-4 pb-2">
        <div className="h-40 flex items-end justify-between gap-2 sm:gap-4 px-2">
          {history.map((day, idx) => {
            const dayDate = parseYMD(day.date);
            const dayName = dayDate.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { weekday: 'short' });
            const dayTotal = day.tasks + day.focus + day.goals + day.rewards;
            const barHeightPct = Math.max(8, Math.round((dayTotal / maxTotal) * 100));

            // Heights of individual components within the bar
            const taskPct = dayTotal > 0 ? (day.tasks / dayTotal) * 100 : 0;
            const focusPct = dayTotal > 0 ? (day.focus / dayTotal) * 100 : 0;
            const goalsPct = dayTotal > 0 ? (day.goals / dayTotal) * 100 : 0;
            const rewardsPct = dayTotal > 0 ? (day.rewards / dayTotal) * 100 : 0;

            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={day.date}
                className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Hover Tooltip */}
                {isHovered && (
                  <div className="absolute -top-16 z-20 bg-slate-900 border border-indigo-500/50 rounded-xl px-2.5 py-1.5 shadow-2xl text-[11px] whitespace-nowrap pointer-events-none animate-fadeIn">
                    <div className="font-bold text-indigo-200 mb-0.5">{day.date} ({dayTotal} XP)</div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="text-blue-400">T:{day.tasks}</span>
                      <span className="text-purple-400">F:{day.focus}</span>
                      <span className="text-emerald-400">G:{day.goals}</span>
                      <span className="text-amber-400">R:{day.rewards}</span>
                    </div>
                  </div>
                )}

                {/* Daily Total Label */}
                <span className="text-[10px] font-mono-numbers text-slate-400 mb-1 group-hover:text-amber-300 transition">
                  {dayTotal}
                </span>

                {/* Stacked Vertical Bar */}
                <div
                  className="w-full max-w-[28px] rounded-lg overflow-hidden flex flex-col-reverse transition-all duration-300 group-hover:brightness-125 border border-white/5 shadow-md"
                  style={{ height: `${barHeightPct}%` }}
                >
                  {/* Tasks portion (Blue) */}
                  <div
                    className="bg-blue-500 transition-all"
                    style={{ height: `${taskPct}%` }}
                    title={`Tasks: ${day.tasks} XP`}
                  />
                  {/* Focus portion (Purple) */}
                  <div
                    className="bg-purple-500 transition-all"
                    style={{ height: `${focusPct}%` }}
                    title={`Focus: ${day.focus} XP`}
                  />
                  {/* Goals portion (Emerald) */}
                  <div
                    className="bg-emerald-500 transition-all"
                    style={{ height: `${goalsPct}%` }}
                    title={`Goals: ${day.goals} XP`}
                  />
                  {/* Rewards portion (Amber) */}
                  <div
                    className="bg-amber-500 transition-all"
                    style={{ height: `${rewardsPct}%` }}
                    title={`Rewards: ${day.rewards} XP`}
                  />
                </div>

                {/* Day Name Label */}
                <span className="text-[11px] font-medium text-slate-400 mt-2 truncate w-full text-center group-hover:text-white transition">
                  {dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
