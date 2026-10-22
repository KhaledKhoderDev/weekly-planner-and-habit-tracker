import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { GoalCategory, Language, WeeklyGoal } from '../types';
import { translations } from '../utils/translations';
import { GOAL_CATEGORIES, LIFE_ASPECT_TAGS, PRESET_TAGS } from '../utils/constants';
import { PlusCircle, Minus, CheckCircle, Sparkles, X, Edit3, Award, Tag } from 'lucide-react';
import { playSound } from '../utils/audio';

interface WeeklyGoalsProps {
  goals: WeeklyGoal[];
  onAddGoal: (goal: WeeklyGoal) => void;
  onUpdateGoal: (goal: WeeklyGoal) => void;
  onDeleteGoal: (goalId: string) => void;
  language: Language;
}

export const WeeklyGoals: React.FC<WeeklyGoalsProps> = ({
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  language,
}) => {
  const t = translations[language];
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<WeeklyGoal | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<'all' | GoalCategory>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<GoalCategory>('quran');
  const [target, setTarget] = useState<number>(20);
  const [unit, setUnit] = useState('صفحات');
  const [xpReward, setXpReward] = useState<number>(100);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');

  const handleOpenAddModal = () => {
    setGoalToEdit(null);
    setTitle('');
    setCategory('quran');
    setTarget(20);
    setUnit('صفحات');
    setXpReward(100);
    setSelectedTags([]);
    setCustomTagInput('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: WeeklyGoal) => {
    setGoalToEdit(goal);
    setTitle(goal.title);
    setCategory(goal.category);
    setTarget(goal.target);
    setUnit(goal.unit);
    setXpReward(goal.xpReward);
    setSelectedTags(goal.tags || []);
    setCustomTagInput('');
    setIsModalOpen(true);
  };

  const handleToggleTagInModal = (tagText: string) => {
    setSelectedTags(prev => 
      prev.includes(tagText) ? prev.filter(t => t !== tagText) : [...prev, tagText]
    );
  };

  const handleAddCustomTag = () => {
    if (!customTagInput.trim()) return;
    const tag = customTagInput.trim();
    if (!selectedTags.includes(tag)) {
      setSelectedTags(prev => [...prev, tag]);
    }
    setCustomTagInput('');
  };

  const handleIncrement = (goal: WeeklyGoal, delta: number) => {
    const nextCurrent = Math.max(0, goal.current + delta);
    const wasCompleted = goal.current >= goal.target;
    const nowCompleted = nextCurrent >= goal.target;

    onUpdateGoal({
      ...goal,
      current: nextCurrent,
    });

    if (!wasCompleted && nowCompleted) {
      playSound.levelUp();
    } else {
      playSound.buttonClick();
    }
  };

  const handleDirectCurrentChange = (goal: WeeklyGoal, val: number) => {
    const nextCurrent = Math.max(0, val);
    const wasCompleted = goal.current >= goal.target;
    const nowCompleted = nextCurrent >= goal.target;

    onUpdateGoal({
      ...goal,
      current: nextCurrent,
    });

    if (!wasCompleted && nowCompleted) {
      playSound.levelUp();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (goalToEdit) {
      onUpdateGoal({
        ...goalToEdit,
        title: title.trim(),
        category,
        target,
        unit: unit.trim() || 'وحدة',
        xpReward,
        tags: selectedTags,
      });
      playSound.completeTask();
    } else {
      const newGoal: WeeklyGoal = {
        id: `g-${Date.now()}`,
        title: title.trim(),
        category,
        target,
        current: 0,
        unit: unit.trim() || 'وحدة',
        xpReward,
        weekStartDate: new Date().toISOString().split('T')[0],
        tags: selectedTags,
      };
      onAddGoal(newGoal);
      playSound.completeTask();
    }

    setIsModalOpen(false);
  };

  // Filtered goals by Category and Tag
  const filteredGoals = useMemo(() => {
    return goals.filter(g => {
      const matchCat = selectedCategoryFilter === 'all' || g.category === selectedCategoryFilter;
      const matchTag = selectedTagFilter === 'all' || (g.tags && g.tags.includes(selectedTagFilter));
      return matchCat && matchTag;
    });
  }, [goals, selectedCategoryFilter, selectedTagFilter]);

  const overallProgress = useMemo(() => {
    if (goals.length === 0) return 0;
    const totalRatio = goals.reduce((acc, g) => acc + Math.min(100, (g.current / g.target) * 100), 0);
    return Math.round(totalRatio / goals.length);
  }, [goals]);

  const completedGoalsCount = goals.filter(g => g.current >= g.target).length;

  return (
    <div className="space-y-6">
      {/* 1. Header & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-indigo-500/20 backdrop-blur-sm shadow-xl">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🎯</span>
            <span>{t.goalsTitle}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            أهداف أسبوعية مخصصة في مجالاتك الإيمانية والحياتية مع مكافآت XP
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.addGoal}</span>
        </button>
      </div>

      {/* Overall Weekly Goals Progress Summary Card */}
      {goals.length > 0 && (
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl space-y-3">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-bold text-white flex items-center gap-2">
              <span>📊</span>
              <span>نسبة إنجاز الأهداف الأسبوعية الكلية</span>
            </span>
            <span className="font-mono-numbers font-bold text-indigo-300 text-sm">
              {completedGoalsCount} من {goals.length} أهداف مكتملة ({overallProgress}%)
            </span>
          </div>

          <div className="relative h-3 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Category & Tag Filter Pills */}
      <div className="space-y-2">
        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
              selectedCategoryFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            جميع المجالات ({goals.length})
          </button>
          {Object.entries(GOAL_CATEGORIES).map(([catKey, catVal]) => {
            const count = goals.filter(g => g.category === catKey).length;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategoryFilter(catKey as GoalCategory)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedCategoryFilter === catKey
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <span>{catVal.icon}</span>
                <span>{language === 'ar' ? catVal.ar : catVal.en}</span>
                {count > 0 && <span className="text-[10px] opacity-75 font-mono-numbers">({count})</span>}
              </button>
            );
          })}
        </div>

        {/* Life Aspect Tag Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs pt-1 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 shrink-0">
            <Tag className="w-3 h-3 text-indigo-400" />
            <span>فلترة بجانب الحياة:</span>
          </span>
          <button
            onClick={() => setSelectedTagFilter('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${
              selectedTagFilter === 'all'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            الكل
          </button>
          {LIFE_ASPECT_TAGS.map(aspect => {
            const aspectName = language === 'ar' ? aspect.ar : aspect.en;
            return (
              <button
                key={aspect.id}
                onClick={() => setSelectedTagFilter(aspectName)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition whitespace-nowrap flex items-center gap-1 ${
                  selectedTagFilter === aspectName
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>{aspect.icon}</span>
                <span>{aspectName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Goals Cards Grid with Circular Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredGoals.map(goal => {
          const categoryDef = GOAL_CATEGORIES[goal.category] || GOAL_CATEGORIES.personal;
          const ratio = Math.min(100, Math.round((goal.current / goal.target) * 100));
          const isDone = goal.current >= goal.target;

          // Circular progress math (circumference = 2 * PI * r = 2 * 3.14159 * 28 ≈ 175.9)
          const radius = 28;
          const circumference = 2 * Math.PI * radius;
          const dashoffset = circumference - (ratio / 100) * circumference;

          return (
            <div
              key={goal.id}
              className={`p-5 rounded-2xl border transition-all relative overflow-hidden backdrop-blur-sm ${
                isDone
                  ? 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-teal-950/30 border-emerald-500/40 shadow-xl'
                  : 'bg-slate-900/80 border-indigo-500/20 hover:border-indigo-500/40 shadow-lg'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Category & XP reward */}
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-semibold flex items-center gap-1 border border-indigo-500/30">
                      <span>{categoryDef.icon}</span>
                      <span>{language === 'ar' ? categoryDef.ar : categoryDef.en}</span>
                    </span>

                    <span className="text-[10px] px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 font-bold font-mono-numbers flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      +{goal.xpReward} XP
                    </span>

                    {/* Life Aspect Tags Badges */}
                    {goal.tags && goal.tags.map(tg => (
                      <span key={tg} className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700/80 font-medium">
                        #{tg}
                      </span>
                    ))}
                  </div>

                  <h3 className="text-base font-bold text-white mb-1.5 leading-snug">
                    {goal.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-slate-400 font-mono-numbers">
                    <span>{t.goalCurrent}:</span>
                    <input
                      type="number"
                      min={0}
                      value={goal.current}
                      onChange={e => handleDirectCurrentChange(goal, Number(e.target.value))}
                      className="w-16 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-indigo-300 font-bold text-sm text-center outline-none focus:border-indigo-500"
                    />
                    <span>/ {goal.target} {goal.unit}</span>
                  </div>
                </div>

                {/* Circular Progress Gauge */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 70 70">
                    <circle
                      cx="35"
                      cy="35"
                      r={radius}
                      strokeWidth="6"
                      stroke="currentColor"
                      className="text-slate-800"
                      fill="transparent"
                    />
                    <circle
                      cx="35"
                      cy="35"
                      r={radius}
                      strokeWidth="6"
                      strokeDasharray={circumference}
                      strokeDashoffset={dashoffset}
                      strokeLinecap="round"
                      stroke="currentColor"
                      className={`transition-all duration-500 ${
                        isDone ? 'text-emerald-400' : 'text-indigo-500'
                      }`}
                      fill="transparent"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {isDone ? (
                      <CheckCircle className="w-6 h-6 text-emerald-400 animate-bounce" />
                    ) : (
                      <span className="text-xs font-bold font-mono-numbers text-white">
                        {ratio}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Step Controls (+ / -) & Edit / Delete */}
              <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEditModal(goal)}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 rounded-lg hover:bg-slate-800 transition"
                    title="تعديل الهدف"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteGoal(goal.id)}
                    className="p-1.5 text-red-500 hover:text-red-400 rounded-lg hover:bg-red-500/10 transition"
                    title="حذف الهدف"
                    aria-label="حذف الهدف"
                  >
                    <X className="w-4 h-4 text-red-500 hover:text-red-400" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleIncrement(goal, -1)}
                    disabled={goal.current <= 0}
                    className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleIncrement(goal, 1)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>زيادة 1 {goal.unit}</span>
                  </button>

                  {/* Quick +5 button */}
                  <button
                    onClick={() => handleIncrement(goal, 5)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-numbers transition"
                  >
                    +5
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Add / Edit Goal */}
      {isModalOpen && typeof document !== 'undefined' && createPortal(
        <div onClick={() => setIsModalOpen(false)} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer">
          <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-slate-100 shadow-2xl cursor-default">
            <div className="flex items-center justify-between pb-3 border-b border-indigo-500/20 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>🎯</span>
                <span>{goalToEdit ? 'تعديل الهدف الأسبوعي' : t.addGoal}</span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.goalTitle} *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={language === 'ar' ? 'مثال: قراءة جزأين، 10 ساعات عمل عميق...' : 'e.g. Read 2 Juz, 10h deep work...'}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.goalCategory}
                </label>
                <select
                  value={category}
                  onChange={e => {
                    const cat = e.target.value as GoalCategory;
                    setCategory(cat);
                    setUnit(GOAL_CATEGORIES[cat].defaultUnit);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
                >
                  {Object.entries(GOAL_CATEGORIES).map(([catKey, catVal]) => (
                    <option key={catKey} value={catKey}>
                      {catVal.icon} {language === 'ar' ? catVal.ar : catVal.en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.goalTarget} *
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={target}
                    onChange={e => setTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm font-mono-numbers"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.unit}
                  </label>
                  <input
                    type="text"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    placeholder="صفحات، ساعات، جلسات..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  {t.goalXpReward}
                </label>
                <input
                  type="number"
                  min={10}
                  step={10}
                  value={xpReward}
                  onChange={e => setXpReward(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 outline-none text-sm font-mono-numbers"
                />
              </div>

              {/* Life Aspect Tags Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تصنيف جوانب الحياة (Tags):</span>
                </label>

                <div className="flex flex-wrap gap-1.5 mb-2 max-h-32 overflow-y-auto p-2 rounded-xl bg-slate-800 border border-slate-700">
                  {PRESET_TAGS.map(tag => {
                    const tagName = language === 'ar' ? tag.nameAr : tag.nameEn;
                    const isSelected = selectedTags.includes(tagName);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleToggleTagInModal(tagName)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition flex items-center gap-1 border ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-400'
                            : 'bg-slate-700 text-slate-300 border-slate-600 hover:border-slate-500'
                        }`}
                      >
                        <span>{tag.icon}</span>
                        <span>{tagName}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Selected Custom Tags Chips */}
                {selectedTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {selectedTags.map(tg => (
                      <span
                        key={tg}
                        className="text-[11px] px-2 py-0.5 rounded-lg bg-indigo-950 text-indigo-200 border border-indigo-700/60 flex items-center gap-1"
                      >
                        <span>#{tg}</span>
                        <button
                          type="button"
                          onClick={() => handleToggleTagInModal(tg)}
                          className="hover:text-red-400 ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* Custom tag add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customTagInput}
                    onChange={e => setCustomTagInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag();
                      }
                    }}
                    placeholder="أضف تصنيفاً خاصاً..."
                    className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 outline-none text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTag}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700"
                  >
                    + إضافة
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg"
                >
                  {t.save}
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
