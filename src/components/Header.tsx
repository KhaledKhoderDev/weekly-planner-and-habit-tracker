import React from 'react';
import { Flame, Coins, Sparkles, Moon, Sun, Globe, Clock, Menu, Settings } from 'lucide-react';
import { calculateLevel, LEVEL_TITLES } from '../utils/constants';
import { Language, Theme, UserStats } from '../types';
import { translations } from '../utils/translations';

interface HeaderProps {
  stats: UserStats;
  language: Language;
  theme: Theme;
  onToggleTheme: () => void;
  onToggleLanguage: () => void;
  onOpenFocusModal: () => void;
  onOpenCustomization?: () => void;
  onToggleMobileMenu: () => void;
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  language,
  theme,
  onToggleTheme,
  onToggleLanguage,
  onOpenFocusModal,
  onOpenCustomization,
  onToggleMobileMenu,
}) => {
  const t = translations[language];
  const levelInfo = calculateLevel(stats.xp);
  const currentTitle = LEVEL_TITLES[language][levelInfo.titleKeyIndex] || LEVEL_TITLES[language][0];

  // Calculate today's XP from daily history
  const todayEntry = stats.dailyXpHistory[stats.dailyXpHistory.length - 1];
  const todayXp = todayEntry 
    ? (todayEntry.tasks + todayEntry.focus + todayEntry.goals + todayEntry.rewards)
    : 0;

  return (
    <header className="sticky top-0 z-40 bg-[#0a0e27]/90 dark:bg-[#0a0e27]/90 backdrop-blur-md border-b border-indigo-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Top Control & Stats Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Left: Mobile Menu + Level & Title Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={onToggleMobileMenu}
              className="md:hidden p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-200 hover:text-white hover:bg-indigo-900/60 transition"
              aria-label="Toggle menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Level & Rank Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-900/80 to-purple-900/80 border border-indigo-500/40 shadow-inner">
              <span className="text-amber-400 font-bold text-sm sm:text-base">⚡</span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-indigo-200">
                  {t.level} {levelInfo.level}
                </span>
                <span className="text-xs font-bold text-amber-300 drop-shadow-sm">
                  {currentTitle}
                </span>
              </div>
            </div>

            {/* XP Hero Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <div className="flex flex-col leading-tight">
                <span className="font-mono-numbers font-bold text-sm text-amber-200">
                  {stats.xp} <span className="text-[10px] text-amber-400/80 font-normal">{t.xpShort}</span>
                </span>
                <span className="text-[10px] text-amber-400/70 hidden sm:inline">
                  +{todayXp} {t.todayXp}
                </span>
              </div>
            </div>

            {/* Streak Flame Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <Flame className="w-4 h-4 text-rose-500 animate-bounce" />
              <div className="flex flex-col leading-tight">
                <span className="font-mono-numbers font-bold text-sm text-rose-200">
                  {stats.currentStreak}
                </span>
                <span className="text-[10px] text-rose-400/80 hidden sm:inline">
                  {t.streakFlame}
                </span>
              </div>
            </div>

            {/* Gold Coins Badge */}
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-300">
              <Coins className="w-4 h-4 text-yellow-400" />
              <span className="font-mono-numbers font-bold text-sm text-yellow-200">
                {stats.gold}
              </span>
            </div>
          </div>

          {/* Right: Actions & Tools */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Focus Quick Button */}
            <button
              onClick={onOpenFocusModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500/20 to-emerald-500/20 border border-teal-500/40 text-teal-300 hover:text-teal-100 hover:border-teal-400 transition shadow-sm"
              title={t.focusTitle}
            >
              <Clock className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-semibold hidden sm:inline">{t.focus}</span>
            </button>

            {/* Settings & Customization Button */}
            {onOpenCustomization && (
              <button
                onClick={onOpenCustomization}
                className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition"
                title="تخصيص الصلوات والمظهر والنسخ الاحتياطي"
                aria-label="Settings and Customization"
              >
                <Settings className="w-4 h-4 text-indigo-300" />
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition flex items-center justify-center w-8 h-8"
              title={theme === 'midnight' ? 'التبديل إلى الداكن الكحلي' : theme === 'dark' ? 'التبديل إلى النهاري الفاتح' : 'التبديل إلى الليلي الداكن'}
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? (
                <Sun className="w-4 h-4 text-amber-300" />
              ) : theme === 'midnight' ? (
                <span className="text-xs select-none">🌌</span>
              ) : (
                <Moon className="w-4 h-4 text-indigo-300" />
              )}
            </button>

            {/* Language Toggle */}
            <button
              onClick={onToggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-700/60 transition text-xs font-bold"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
            </button>
          </div>
        </div>

        {/* Level Progress Bar as required by spec */}
        <div className="mt-2.5 pt-2 border-t border-indigo-500/10">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1 font-medium">
            <span className="flex items-center gap-1">
              <span>{t.nextLevelProgress}:</span>
              <span className="font-mono-numbers text-indigo-300 font-bold">
                {levelInfo.progressPercent}%
              </span>
            </span>
            <span className="font-mono-numbers text-slate-400">
              {stats.xp} / {levelInfo.nextLevelXp} {t.xpShort}
            </span>
          </div>
          <div className="h-2 w-full bg-slate-900/80 rounded-full overflow-hidden p-0.5 border border-indigo-500/20 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-indigo-500 to-purple-500 transition-all duration-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]"
              style={{ width: `${levelInfo.progressPercent}%` }}
            />
          </div>
        </div>

      </div>
    </header>
  );
};
