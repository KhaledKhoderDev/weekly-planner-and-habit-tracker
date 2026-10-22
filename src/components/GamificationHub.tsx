import React, { useState } from 'react';
import { AvatarGear, Language, UserStats } from '../types';
import { translations } from '../utils/translations';
import { GEAR_STORE_ITEMS } from '../utils/constants';
import { 
  Sparkles, 
  Shield, 
  Coins, 
  Check, 
  Lock, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  Plus, 
  Gift, 
  Flame, 
  RotateCcw
} from 'lucide-react';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface GamificationHubProps {
  stats: UserStats;
  onUpdateStats: (newStats: UserStats) => void;
  language: Language;
}

export const GamificationHub: React.FC<GamificationHubProps> = ({
  stats,
  onUpdateStats,
  language,
}) => {
  const t = translations[language];

  // Chest animation state
  const [isOpeningChest, setIsOpeningChest] = useState(false);
  const [chestRewardMsg, setChestRewardMsg] = useState<string | null>(null);

  // Store purchase
  const handleBuyOrEquip = (gearId: AvatarGear) => {
    const item = GEAR_STORE_ITEMS.find(i => i.id === gearId);
    if (!item) return;

    const isUnlocked = stats.unlockedGears.includes(gearId);

    if (isUnlocked) {
      // Equip
      onUpdateStats({
        ...stats,
        selectedGear: gearId,
      });
      playSound.buttonClick();
      return;
    }

    // Check coins
    if (stats.gold < item.price) {
      alert(t.notEnoughCoins);
      return;
    }

    // Purchase & equip
    onUpdateStats({
      ...stats,
      gold: stats.gold - item.price,
      unlockedGears: [...stats.unlockedGears, gearId],
      selectedGear: gearId,
    });
    playSound.chestOpen();
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
  };

  // Qada tracker operations
  const handleFulfillQada = (prayer: keyof typeof stats.qada) => {
    if (stats.qada[prayer] <= 0) return;

    const newQada = {
      ...stats.qada,
      [prayer]: stats.qada[prayer] - 1,
    };

    onUpdateStats({
      ...stats,
      xp: stats.xp + 25,
      totalQadaMadeUp: stats.totalQadaMadeUp + 1,
      qada: newQada,
    });

    playSound.completeTask();
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
  };

  const handleAddMissedQada = (prayer: keyof typeof stats.qada) => {
    onUpdateStats({
      ...stats,
      qada: {
        ...stats.qada,
        [prayer]: stats.qada[prayer] + 1,
      },
    });
    playSound.buttonClick();
  };

  // Open Surprise Mystery Chest
  const handleOpenChest = () => {
    if (stats.chestsAvailable <= 0 || isOpeningChest) return;

    setIsOpeningChest(true);
    playSound.chestOpen();

    setTimeout(() => {
      // Reward roll: XP (50%), Coins (30%), Shield (15%), Gear unlock (5%)
      const roll = Math.random();
      let newStats = { ...stats, chestsAvailable: stats.chestsAvailable - 1, chestsOpenedToday: stats.chestsOpenedToday + 1 };
      let msg = '';

      if (roll < 0.45) {
        const xpWon = 75;
        newStats.xp += xpWon;
        msg = t.chestWonXp.replace('{val}', xpWon.toString());
      } else if (roll < 0.8) {
        const goldWon = 50;
        newStats.gold += goldWon;
        msg = t.chestWonGold.replace('{val}', goldWon.toString());
      } else if (roll < 0.95) {
        newStats.shieldsCount += 1;
        msg = t.chestWonShield;
      } else {
        // Unlock gear if available
        const lockedGears = GEAR_STORE_ITEMS.map(i => i.id).filter(id => !stats.unlockedGears.includes(id));
        if (lockedGears.length > 0) {
          const unlocked = lockedGears[0];
          newStats.unlockedGears = [...newStats.unlockedGears, unlocked];
          newStats.selectedGear = unlocked;
          msg = t.chestWonGear;
        } else {
          newStats.gold += 100;
          msg = t.chestWonGold.replace('{val}', '100');
        }
      }

      onUpdateStats(newStats);
      setChestRewardMsg(msg);
      setIsOpeningChest(false);
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
    }, 1200);
  };

  // Recovery Quest Toggle
  const handleActivateRecovery = () => {
    if (stats.recoveryQuest?.active) return;
    onUpdateStats({
      ...stats,
      recoveryQuest: {
        active: true,
        currentCount: 0,
        targetCount: 2,
        lostStreak: Math.max(3, stats.currentStreak),
      },
    });
    playSound.buttonClick();
  };

  // Convert pages read to books
  const booksEquivalent = (stats.totalPagesRead / 250).toFixed(1);
  const totalFocusHours = (stats.totalFocusMinutes / 60).toFixed(1);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 border border-indigo-500/30 shadow-xl backdrop-blur-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🛡️</span>
            <span>{t.gamificationTitle}</span>
          </h2>
          <p className="text-xs text-indigo-200 mt-1">
            خصص مظهر المغامر، تابع قضاء الصلوات، وافتح صناديق المكافآت
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold text-xs">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono-numbers">{stats.gold} {t.goldCoins}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 font-bold text-xs">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-mono-numbers">{stats.shieldsCount} {t.streakShields}</span>
          </div>
        </div>
      </div>

      {/* 2. Faceless Adventurer Avatar & Visual Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Interactive Visual Avatar */}
        <div className="rounded-2xl bg-slate-900/80 border border-indigo-500/30 p-6 flex flex-col items-center justify-center text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-2 right-2 text-xs text-indigo-400 font-semibold px-2 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
            {t.equipped}: {GEAR_STORE_ITEMS.find(i => i.id === stats.selectedGear)?.[language === 'ar' ? 'nameAr' : 'nameEn']}
          </div>

          {/* Aura background glow based on gear */}
          <div
            className={`w-44 h-44 rounded-full flex items-center justify-center relative transition-all duration-700 my-4 ${
              stats.selectedGear === 'golden-star'
                ? 'bg-amber-500/20 shadow-[0_0_50px_rgba(245,158,11,0.5)] ring-4 ring-amber-400/40'
                : stats.selectedGear === 'silver-aura'
                ? 'bg-cyan-500/20 shadow-[0_0_50px_rgba(6,182,212,0.5)] ring-4 ring-cyan-400/40'
                : stats.selectedGear === 'bronze-shield'
                ? 'bg-orange-500/15 shadow-[0_0_35px_rgba(249,115,22,0.3)] ring-2 ring-orange-400/30'
                : stats.selectedGear === 'sage-cloak'
                ? 'bg-emerald-500/15 shadow-[0_0_30px_rgba(16,185,129,0.3)] ring-2 ring-emerald-400/30'
                : 'bg-indigo-900/40 ring-1 ring-indigo-500/30'
            }`}
          >
            {/* Authentic Islamic Geometric Octagram Shield & Arabesque Emblem */}
            <svg className="w-36 h-36 drop-shadow-xl animate-islamic-pulse" viewBox="0 0 100 100">
              <defs>
                {/* Radial glow for shield center */}
                <radialGradient id="islamicShieldCenterGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#fde047' :
                    stats.selectedGear === 'silver-aura' ? '#7dd3fc' :
                    stats.selectedGear === 'bronze-shield' ? '#fdba74' :
                    stats.selectedGear === 'sage-cloak' ? '#6ee7b7' : '#a5b4fc'
                  } stopOpacity="0.9" />
                  <stop offset="100%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#b45309' :
                    stats.selectedGear === 'silver-aura' ? '#0369a1' :
                    stats.selectedGear === 'bronze-shield' ? '#9a3412' :
                    stats.selectedGear === 'sage-cloak' ? '#047857' : '#3730a3'
                  } stopOpacity="0.4" />
                </radialGradient>

                {/* Linear gradient for metallic primary square */}
                <linearGradient id="islamicSquare1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#f59e0b' :
                    stats.selectedGear === 'silver-aura' ? '#38bdf8' :
                    stats.selectedGear === 'bronze-shield' ? '#ea580c' :
                    stats.selectedGear === 'sage-cloak' ? '#10b981' : '#6366f1'
                  } />
                  <stop offset="100%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#78350f' :
                    stats.selectedGear === 'silver-aura' ? '#0c4a6e' :
                    stats.selectedGear === 'bronze-shield' ? '#431407' :
                    stats.selectedGear === 'sage-cloak' ? '#064e3b' : '#1e1b4b'
                  } />
                </linearGradient>

                {/* Linear gradient for rotated secondary square */}
                <linearGradient id="islamicSquare2" x1="100%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#fbbf24' :
                    stats.selectedGear === 'silver-aura' ? '#0284c7' :
                    stats.selectedGear === 'bronze-shield' ? '#c2410c' :
                    stats.selectedGear === 'sage-cloak' ? '#059669' : '#4f46e5'
                  } />
                  <stop offset="100%" stopColor={
                    stats.selectedGear === 'golden-star' ? '#92400e' :
                    stats.selectedGear === 'silver-aura' ? '#075985' :
                    stats.selectedGear === 'bronze-shield' ? '#7c2d12' :
                    stats.selectedGear === 'sage-cloak' ? '#065f46' : '#312e81'
                  } />
                </linearGradient>
              </defs>

              {/* Dynamic Aura background rings */}
              {stats.selectedGear === 'silver-aura' && (
                <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(56, 189, 248, 0.6)" strokeWidth="1.5" strokeDasharray="3 3" className="animate-spin" />
              )}
              {stats.selectedGear === 'golden-star' && (
                <circle cx="50" cy="50" r="47" fill="none" stroke="rgba(251, 191, 36, 0.6)" strokeWidth="1.5" strokeDasharray="4 2" className="animate-pulse" />
              )}

              {/* Outer decorative perimeter boundary */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={
                  stats.selectedGear === 'golden-star' ? '#f59e0b' :
                  stats.selectedGear === 'silver-aura' ? '#38bdf8' :
                  stats.selectedGear === 'bronze-shield' ? '#ea580c' :
                  stats.selectedGear === 'sage-cloak' ? '#10b981' : '#6366f1'
                }
                strokeWidth="1"
                strokeOpacity="0.4"
              />

              {/* 1. Islamic 8-pointed Star (Rub el Hizb Khatam): Square 1 */}
              <rect
                x="20"
                y="20"
                width="60"
                height="60"
                rx="4"
                fill="url(#islamicSquare1)"
                stroke={
                  stats.selectedGear === 'golden-star' ? '#fde047' :
                  stats.selectedGear === 'silver-aura' ? '#bae6fd' :
                  stats.selectedGear === 'bronze-shield' ? '#fed7aa' :
                  stats.selectedGear === 'sage-cloak' ? '#a7f3d0' : '#c7d2fe'
                }
                strokeWidth="1.5"
                className="transition-all duration-500"
              />

              {/* 2. Islamic 8-pointed Star: Square 2 (Rotated 45 degrees) */}
              <rect
                x="20"
                y="20"
                width="60"
                height="60"
                rx="4"
                transform="rotate(45 50 50)"
                fill="url(#islamicSquare2)"
                stroke={
                  stats.selectedGear === 'golden-star' ? '#fde047' :
                  stats.selectedGear === 'silver-aura' ? '#bae6fd' :
                  stats.selectedGear === 'bronze-shield' ? '#fed7aa' :
                  stats.selectedGear === 'sage-cloak' ? '#a7f3d0' : '#c7d2fe'
                }
                strokeWidth="1.5"
                fillOpacity="0.85"
                className="transition-all duration-500 origin-[50px_50px] animate-slow-spin"
              />

              {/* Inner Circular Shield Medallion */}
              <circle
                cx="50"
                cy="50"
                r="28"
                fill="url(#islamicShieldCenterGlow)"
                stroke={
                  stats.selectedGear === 'golden-star' ? '#fef08a' :
                  stats.selectedGear === 'silver-aura' ? '#e0f2fe' :
                  stats.selectedGear === 'bronze-shield' ? '#ffedd5' :
                  stats.selectedGear === 'sage-cloak' ? '#d1fae5' : '#e0e7ff'
                }
                strokeWidth="1.5"
              />

              {/* Intricate Girih Arabesque Interlacing Floral Petals */}
              <g
                stroke={
                  stats.selectedGear === 'golden-star' ? '#fef08a' :
                  stats.selectedGear === 'silver-aura' ? '#e0f2fe' :
                  stats.selectedGear === 'bronze-shield' ? '#ffedd5' :
                  stats.selectedGear === 'sage-cloak' ? '#d1fae5' : '#e0e7ff'
                }
                strokeWidth="1"
                fill="none"
                opacity="0.85"
              >
                {/* 4 Cardinal Circles */}
                <circle cx="50" cy="36" r="14" />
                <circle cx="50" cy="64" r="14" />
                <circle cx="36" cy="50" r="14" />
                <circle cx="64" cy="50" r="14" />
                {/* 4 Diagonal Circles */}
                <circle cx="40" cy="40" r="14" />
                <circle cx="60" cy="40" r="14" />
                <circle cx="40" cy="60" r="14" />
                <circle cx="60" cy="60" r="14" />
              </g>

              {/* Central Barakah Core Medallion & 8-Pointed Micro Star */}
              <circle
                cx="50"
                cy="50"
                r="8"
                fill={
                  stats.selectedGear === 'golden-star' ? '#fef08a' :
                  stats.selectedGear === 'silver-aura' ? '#ffffff' :
                  stats.selectedGear === 'bronze-shield' ? '#ffedd5' :
                  stats.selectedGear === 'sage-cloak' ? '#ecfdf5' : '#ffffff'
                }
                stroke={
                  stats.selectedGear === 'golden-star' ? '#b45309' :
                  stats.selectedGear === 'silver-aura' ? '#0369a1' :
                  stats.selectedGear === 'bronze-shield' ? '#7c2d12' :
                  stats.selectedGear === 'sage-cloak' ? '#047857' : '#3730a3'
                }
                strokeWidth="1.2"
              />
              <polygon
                points="50,44 51.8,48.2 56,50 51.8,51.8 50,56 48.2,51.8 44,50 48.2,48.2"
                fill={
                  stats.selectedGear === 'golden-star' ? '#b45309' :
                  stats.selectedGear === 'silver-aura' ? '#0284c7' :
                  stats.selectedGear === 'bronze-shield' ? '#9a3412' :
                  stats.selectedGear === 'sage-cloak' ? '#059669' : '#4338ca'
                }
              />

              {/* 8 Perimeter Rivets of Resolve */}
              {[
                [50, 8], [50, 92], [8, 50], [92, 50],
                [20, 20], [80, 20], [20, 80], [80, 80]
              ].map(([rx, ry], idx) => (
                <circle
                  key={idx}
                  cx={rx}
                  cy={ry}
                  r="2"
                  fill={
                    stats.selectedGear === 'golden-star' ? '#fef08a' :
                    stats.selectedGear === 'silver-aura' ? '#7dd3fc' :
                    stats.selectedGear === 'bronze-shield' ? '#fed7aa' :
                    stats.selectedGear === 'sage-cloak' ? '#a7f3d0' : '#c7d2fe'
                  }
                  stroke={
                    stats.selectedGear === 'golden-star' ? '#92400e' :
                    stats.selectedGear === 'silver-aura' ? '#075985' :
                    stats.selectedGear === 'bronze-shield' ? '#7c2d12' :
                    stats.selectedGear === 'sage-cloak' ? '#065f46' : '#312e81'
                  }
                  strokeWidth="0.8"
                />
              ))}
            </svg>
          </div>

          <h3 className="text-base font-bold text-white mb-0.5">{t.avatarTitle}</h3>
          <p className="text-xs text-slate-400 max-w-xs">{t.avatarSubtitle}</p>
        </div>

        {/* Center & Right: Outfit & Armory Store */}
        <div className="lg:col-span-2 rounded-2xl bg-slate-900/80 border border-indigo-500/30 p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{t.outfitStore}</span>
            </h3>
            <span className="text-xs text-slate-400">
              رصيدك: <strong className="text-amber-300 font-mono-numbers">{stats.gold}</strong> عملة
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GEAR_STORE_ITEMS.map(item => {
              const isUnlocked = stats.unlockedGears.includes(item.id);
              const isEquipped = stats.selectedGear === item.id;
              const canAfford = stats.gold >= item.price;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 relative ${
                    isEquipped
                      ? 'bg-indigo-900/40 border-indigo-400 ring-1 ring-indigo-400'
                      : isUnlocked
                      ? 'bg-slate-800/60 border-slate-700'
                      : 'bg-slate-950/60 border-slate-800 opacity-90'
                  }`}
                >
                  <span className="text-2xl p-2 rounded-xl bg-slate-800 shrink-0">
                    {item.icon}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4 className="text-sm font-bold text-white truncate">
                        {language === 'ar' ? item.nameAr : item.nameEn}
                      </h4>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold">
                        {language === 'ar' ? item.rarityAr : item.rarityEn}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-xs font-bold text-amber-300 font-mono-numbers flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5" />
                        {item.price === 0 ? 'مجاني' : `${item.price}`}
                      </span>

                      <button
                        onClick={() => handleBuyOrEquip(item.id)}
                        disabled={!isUnlocked && !canAfford}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                          isEquipped
                            ? 'bg-emerald-600/80 text-white cursor-default'
                            : isUnlocked
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                            : canAfford
                            ? 'bg-amber-600 hover:bg-amber-500 text-white'
                            : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {isEquipped ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{t.equipped}</span>
                          </>
                        ) : isUnlocked ? (
                          <span>{t.equip}</span>
                        ) : (
                          <>
                            <Lock className="w-3.5 h-3.5" />
                            <span>{t.buyWithCoins}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Surprise Chests & Streak Shields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Surprise Chest Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-purple-950/30 border border-amber-500/30 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Gift className="w-5 h-5 text-amber-400" />
              <span>{t.surpriseChestTitle}</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 font-mono-numbers font-bold">
              {stats.chestsAvailable} {t.chestsAvailable}
            </span>
          </div>

          <p className="text-xs text-slate-400 mb-4">{t.maxChestsPerDay}</p>

          <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-slate-950/60 border border-amber-500/20 text-center">
            <div
              className={`text-5xl my-2 cursor-pointer transition-transform ${
                isOpeningChest ? 'animate-bounce scale-125' : 'hover:scale-110'
              }`}
              onClick={handleOpenChest}
            >
              🎁
            </div>

            {chestRewardMsg && (
              <div className="my-2 p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs font-bold animate-fadeIn">
                {chestRewardMsg}
              </div>
            )}

            <button
              onClick={handleOpenChest}
              disabled={stats.chestsAvailable <= 0 || isOpeningChest}
              className={`mt-2 px-5 py-2 rounded-xl text-xs font-bold shadow-lg transition flex items-center gap-2 ${
                stats.chestsAvailable > 0
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>
                {isOpeningChest
                  ? 'جاري فتح الصندوق...'
                  : stats.chestsAvailable > 0
                  ? t.openChest
                  : t.noChestsAvailable}
              </span>
            </button>
          </div>
        </div>

        {/* Streak Shield & Recovery Quest */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-blue-950/30 border border-indigo-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-indigo-400" />
              <span>{t.streakShields}</span>
            </h3>
            <span className="text-xs px-2.5 py-1 rounded-xl bg-indigo-500/20 text-indigo-300 font-mono-numbers font-bold">
              {stats.shieldsCount} {t.shieldsAvailable}
            </span>
          </div>

          {/* Recovery Quest Banner */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-indigo-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-rose-500" />
                <span>{t.recoveryQuestTitle}</span>
              </span>
              {stats.recoveryQuest?.active ? (
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  {t.recoveryActive}
                </span>
              ) : null}
            </div>

            <p className="text-[11px] text-slate-400">{t.recoveryDesc}</p>

            {stats.recoveryQuest?.active ? (
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>التقدم:</span>
                  <span className="font-mono-numbers font-bold text-indigo-300">
                    {stats.recoveryQuest.currentCount} / {stats.recoveryQuest.targetCount}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{
                      width: `${(stats.recoveryQuest.currentCount / stats.recoveryQuest.targetCount) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <button
                onClick={handleActivateRecovery}
                className="mt-2 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-slate-700"
              >
                <RotateCcw className="w-3.5 h-3.5 text-indigo-400" />
                <span>تفعيل مهمة استعادة السلسلة</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Qada Tracker (سجل قضاء الصلوات) */}
      <div className="p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/30 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-300">🕌</span>
              <span>{t.qadaTitle}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{t.qadaSubtitle}</p>
          </div>
          <div className="text-xs px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono-numbers">
            تم قضاء {stats.totalQadaMadeUp} صلاة
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {(
            [
              { key: 'fajr', ar: 'الفجر', en: 'Fajr', icon: '🌅' },
              { key: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', icon: '☀️' },
              { key: 'asr', ar: 'العصر', en: 'Asr', icon: '🌤️' },
              { key: 'maghrib', ar: 'المغرب', en: 'Maghrib', icon: '🌇' },
              { key: 'isha', ar: 'العشاء', en: 'Isha', icon: '🌌' },
            ] as const
          ).map(p => {
            const count = stats.qada[p.key];
            return (
              <div
                key={p.key}
                className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80 text-center flex flex-col items-center justify-between gap-2"
              >
                <div className="text-lg">{p.icon}</div>
                <div className="text-xs font-bold text-slate-200">
                  {language === 'ar' ? p.ar : p.en}
                </div>
                <div className="text-xl font-bold font-mono-numbers text-amber-300">
                  {count}
                </div>

                <div className="flex items-center gap-1 w-full pt-1">
                  <button
                    onClick={() => handleFulfillQada(p.key)}
                    disabled={count <= 0}
                    className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[11px] font-bold transition flex items-center justify-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" />
                    <span>قضاء</span>
                  </button>

                  <button
                    onClick={() => handleAddMissedQada(p.key)}
                    className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs transition"
                    title={t.addMissed}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Cumulative Impact Metrics (حساب الأثر التراكمي) */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border border-indigo-500/20 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <span>📈</span>
            <span>{t.impactTitle}</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">{t.bookCalculationNote}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1 text-purple-400">
              <BookOpen className="w-4 h-4" />
              <span className="text-[11px] text-slate-400">{t.booksReadEquivalent}</span>
            </div>
            <div className="text-lg font-bold font-mono-numbers text-purple-300">
              {booksEquivalent} <span className="text-xs font-normal text-slate-400">كتاب ({stats.totalPagesRead} ص)</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1 text-teal-400">
              <Clock className="w-4 h-4" />
              <span className="text-[11px] text-slate-400">{t.totalFocusHours}</span>
            </div>
            <div className="text-lg font-bold font-mono-numbers text-teal-300">
              {totalFocusHours} <span className="text-xs font-normal text-slate-400">ساعة</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1 text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-[11px] text-slate-400">{t.totalTasksDone}</span>
            </div>
            <div className="text-lg font-bold font-mono-numbers text-emerald-300">
              {stats.totalTasksCompleted} <span className="text-xs font-normal text-slate-400">مهمة</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="flex items-center gap-2 mb-1 text-amber-400">
              <Shield className="w-4 h-4" />
              <span className="text-[11px] text-slate-400">{t.totalQadaDone}</span>
            </div>
            <div className="text-lg font-bold font-mono-numbers text-amber-300">
              {stats.totalQadaMadeUp} <span className="text-xs font-normal text-slate-400">صلاة</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
