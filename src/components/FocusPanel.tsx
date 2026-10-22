import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Language, TimerState } from '../types';
import { translations } from '../utils/translations';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Minimize2, 
  Maximize2, 
  X, 
  Zap
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface FocusPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteSession: (mode: 'work' | 'short_break' | 'long_break', earnedXp: number) => void;
  language: Language;
}

export const FocusPanel: React.FC<FocusPanelProps> = ({
  isOpen,
  onClose,
  onCompleteSession,
  language,
}) => {
  const t = translations[language];

  // Self-contained high-frequency timer state to prevent parent re-renders
  const [timerState, setTimerState] = useState<TimerState>({
    type: 'pomodoro',
    mode: 'work',
    timeLeft: 25 * 60,
    isRunning: false,
    consecutiveSessions: 0,
    flowStateActive: false,
    minimized: false,
    stopwatchElapsed: 0,
    countdownDuration: 25 * 60,
  });

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // High-precision ticking effect isolated inside this component
  useEffect(() => {
    if (timerState.isRunning) {
      timerRef.current = setInterval(() => {
        setTimerState(prev => {
          if (prev.type === 'pomodoro' || prev.type === 'countdown') {
            if (prev.timeLeft > 1) {
              return { ...prev, timeLeft: prev.timeLeft - 1 };
            } else {
              // Timer Finished!
              playSound.timerComplete();

              if (prev.type === 'pomodoro' && prev.mode === 'work') {
                const consecutive = prev.consecutiveSessions + 1;
                const flowActive = consecutive >= 3;
                const baseReward = 100;
                const earnedXp = flowActive ? Math.round(baseReward * 1.5) : baseReward;

                onCompleteSession('work', earnedXp);

                const nextMode = consecutive % 4 === 0 ? 'long_break' : 'short_break';
                const nextDuration = nextMode === 'long_break' ? 15 * 60 : 5 * 60;

                return {
                  ...prev,
                  mode: nextMode,
                  timeLeft: nextDuration,
                  isRunning: false,
                  consecutiveSessions: consecutive,
                  flowStateActive: flowActive,
                };
              } else if (prev.type === 'pomodoro') {
                onCompleteSession(prev.mode, 0);
                return {
                  ...prev,
                  mode: 'work',
                  timeLeft: 25 * 60,
                  isRunning: false,
                };
              } else {
                return {
                  ...prev,
                  timeLeft: 0,
                  isRunning: false,
                };
              }
            }
          } else if (prev.type === 'stopwatch') {
            return {
              ...prev,
              stopwatchElapsed: prev.stopwatchElapsed + 1,
            };
          }
          return prev;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timerState.isRunning, onCompleteSession]);

  const toggleRun = () => {
    playSound.buttonClick();
    setTimerState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  };

  const resetTimer = () => {
    playSound.buttonClick();
    setTimerState(prev => {
      let newTime = 25 * 60;
      if (prev.type === 'pomodoro') {
        if (prev.mode === 'short_break') newTime = 5 * 60;
        if (prev.mode === 'long_break') newTime = 15 * 60;
      } else if (prev.type === 'countdown') {
        newTime = prev.countdownDuration || 15 * 60;
      }
      return {
        ...prev,
        timeLeft: newTime,
        isRunning: false,
        stopwatchElapsed: 0,
      };
    });
  };

  const skipSession = () => {
    playSound.buttonClick();
    setTimerState(prev => {
      if (prev.type !== 'pomodoro') return prev;
      if (prev.mode === 'work') {
        return {
          ...prev,
          mode: 'short_break',
          timeLeft: 5 * 60,
          isRunning: false,
        };
      } else {
        return {
          ...prev,
          mode: 'work',
          timeLeft: 25 * 60,
          isRunning: false,
        };
      }
    });
  };

  const switchPomodoroMode = (mode: 'work' | 'short_break' | 'long_break') => {
    playSound.buttonClick();
    const duration = mode === 'work' ? 25 * 60 : mode === 'short_break' ? 5 * 60 : 15 * 60;
    setTimerState(prev => ({
      ...prev,
      type: 'pomodoro',
      mode,
      timeLeft: duration,
      isRunning: false,
    }));
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Minimized Floating Widget in corner
  if (timerState.minimized) {
    return (
      <div className="fixed bottom-5 right-5 z-50 animate-bounce-subtle">
        <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-slate-900/95 border border-indigo-500/50 shadow-2xl backdrop-blur-md text-white">
          <div className="flex items-center gap-1.5 px-2">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                timerState.isRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="font-mono-numbers font-bold text-sm text-indigo-200">
              {timerState.type === 'stopwatch'
                ? formatSeconds(timerState.stopwatchElapsed)
                : formatSeconds(timerState.timeLeft)}
            </span>
          </div>

          <button
            onClick={toggleRun}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition"
          >
            {timerState.isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setTimerState(prev => ({ ...prev, minimized: false }))}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t.expandTimer}
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (!isOpen) return null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer">
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 sm:p-8 text-slate-100 shadow-2xl overflow-hidden cursor-default">
        {/* Glow ambient circle */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20 mb-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span>⏱️</span>
            <span>{t.focusTitle}</span>
          </h2>

          <div className="flex items-center gap-1.5">
            {/* Minimize to Floating Corner */}
            <button
              onClick={() => setTimerState(prev => ({ ...prev, minimized: true }))}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title={t.minimizeToCorner}
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Timer Mode Selection */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <button
            onClick={() => setTimerState(prev => ({ ...prev, type: 'pomodoro' }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timerState.type === 'pomodoro'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.pomodoroMode}
          </button>
          <button
            onClick={() => setTimerState(prev => ({ ...prev, type: 'countdown' }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timerState.type === 'countdown'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.countdown}
          </button>
          <button
            onClick={() => setTimerState(prev => ({ ...prev, type: 'stopwatch' }))}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              timerState.type === 'stopwatch'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.stopwatch}
          </button>
        </div>

        {/* If Pomodoro: Submode selector */}
        {timerState.type === 'pomodoro' && (
          <div className="flex items-center justify-center gap-1.5 mb-6 p-1 rounded-2xl bg-slate-950/60 border border-slate-800 max-w-sm mx-auto">
            <button
              onClick={() => switchPomodoroMode('work')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                timerState.mode === 'work'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.workSession}
            </button>
            <button
              onClick={() => switchPomodoroMode('short_break')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                timerState.mode === 'short_break'
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.shortBreak}
            </button>
            <button
              onClick={() => switchPomodoroMode('long_break')}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition ${
                timerState.mode === 'long_break'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.longBreak}
            </button>
          </div>
        )}

        {/* Flow State Multiplier Banner */}
        {timerState.flowStateActive && (
          <div className="mb-6 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-500/40 text-amber-200 text-xs font-bold text-center flex items-center justify-center gap-1.5 animate-pulse">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>{t.flowStateBadge}</span>
          </div>
        )}

        {/* Main Countdown Display */}
        <div className="flex flex-col items-center justify-center my-6">
          <div className="relative w-56 h-56 rounded-full border-4 border-indigo-500/30 flex flex-col items-center justify-center bg-slate-950/70 shadow-2xl">
            <div className="font-mono-numbers text-5xl font-extrabold text-white tracking-wider">
              {timerState.type === 'stopwatch'
                ? formatSeconds(timerState.stopwatchElapsed)
                : formatSeconds(timerState.timeLeft)}
            </div>

            <div className="text-xs text-indigo-300 mt-2 font-medium flex items-center gap-1">
              {timerState.type === 'pomodoro' ? (
                <>
                  <span>
                    {timerState.mode === 'work'
                      ? t.workSession
                      : timerState.mode === 'short_break'
                      ? t.shortBreak
                      : t.longBreak}
                  </span>
                  <span className="font-mono-numbers text-amber-400">
                    ({timerState.consecutiveSessions} جلسات)
                  </span>
                </>
              ) : timerState.type === 'stopwatch' ? (
                <span>ساعة إيقاف</span>
              ) : (
                <span>عد تنازلي</span>
              )}
            </div>
          </div>
        </div>

        {/* Timer Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={resetTimer}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title={t.reset}
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleRun}
            className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            {timerState.isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>{t.pause}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{t.start}</span>
              </>
            )}
          </button>

          {timerState.type === 'pomodoro' && (
            <button
              onClick={skipSession}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title={t.skip}
            >
              <SkipForward className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Flow state tip */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-[11px] text-slate-400">
          {t.flowStateNotice}
        </div>
      </div>
    </div>,
    document.body
  );
};
