import React, { useState, useMemo } from 'react';
import { DayInfo, formatFriendlyDate, getTodayYMD, getWeekDays } from '../utils/date';
import { CustomPrayerConfig, Language, PrayerSlotId, Priority, SubTask, Task } from '../types';
import { translations } from '../utils/translations';
import { PRAYER_SLOTS, PRIORITY_CONFIG, TASK_CATEGORIES, READY_SUBTASK_CHIPS, READY_SUBTASK_PACKS } from '../utils/constants';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  PlusCircle, 
  CheckCircle2, 
  Clock, 
  MoveUp, 
  MoveDown, 
  Edit3, 
  X, 
  ChevronDown, 
  ChevronUp, 
  ArrowRightLeft,
  Sparkles,
  ListPlus,
  Zap,
  CheckSquare,
  ListTodo,
  Target,
  GripVertical
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import { WeeklyGoals } from './WeeklyGoals';
import { WeeklyGoal } from '../types';
import { playSound } from '../utils/audio';

interface WeeklyPlannerProps {
  tasks: Task[];
  onAddTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onReorderTasks?: (tasks: Task[]) => void;
  prayerConfigs?: Record<PrayerSlotId, CustomPrayerConfig>;
  onOpenCustomization?: () => void;
  goals?: WeeklyGoal[];
  onAddGoal?: (goal: WeeklyGoal) => void;
  onUpdateGoal?: (goal: WeeklyGoal) => void;
  onDeleteGoal?: (goalId: string) => void;
  language: Language;
}

export const WeeklyPlanner: React.FC<WeeklyPlannerProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskComplete,
  onReorderTasks,
  prayerConfigs,
  onOpenCustomization,
  goals,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  language,
}) => {
  const t = translations[language];

  // Drag and Drop state for tasks
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [dragOverSlotId, setDragOverSlotId] = useState<PrayerSlotId | null>(null);

  // Goals panel visibility toggle
  const [showGoalsPanel, setShowGoalsPanel] = useState<boolean>(true);

  // Week navigation state
  const [weekOffset, setWeekOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayYMD());

  // Prayer slots ordering state
  const [prayerSlotOrder, setPrayerSlotOrder] = useState<PrayerSlotId[]>([
    'midnight',
    'fajr',
    'dhuhr',
    'asr',
    'maghrib',
    'isha',
  ]);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [modalDefaultDate, setModalDefaultDate] = useState<string>(getTodayYMD());
  const [modalDefaultSlot, setModalDefaultSlot] = useState<PrayerSlotId>('fajr');

  // Filter & collapse state
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Record<string, boolean>>({});

  // Move task quick dialog state
  const [movingTaskId, setMovingTaskId] = useState<string | null>(null);

  // Quick Subtask Drawer state for instant subtask management
  const [subtaskDrawerTaskId, setSubtaskDrawerTaskId] = useState<string | null>(null);
  const [quickSubtaskInputs, setQuickSubtaskInputs] = useState<Record<string, string>>({});
  const [subtasksExpandedMap, setSubtasksExpandedMap] = useState<Record<string, boolean>>({});

  const toggleSubtasksVisible = (taskId: string) => {
    setSubtasksExpandedMap(prev => ({
      ...prev,
      [taskId]: !(prev[taskId] ?? true),
    }));
  };

  // Memoized current week days calculation
  const weekDays = useMemo(() => {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    const day = baseDate.getDay();
    const diff = (day + 1) % 7;
    baseDate.setDate(baseDate.getDate() - diff);
    baseDate.setHours(12, 0, 0, 0);
    return getWeekDays(baseDate);
  }, [weekOffset]);

  // Filter visible slots according to user customization
  const visibleSlotOrder = useMemo(() => {
    return prayerSlotOrder.filter(slotId => {
      return prayerConfigs?.[slotId]?.enabled !== false;
    });
  }, [prayerSlotOrder, prayerConfigs]);

  // Fast O(N) indexing of tasks by slot for selected date
  const tasksBySlot = useMemo(() => {
    const map: Record<PrayerSlotId, Task[]> = {
      midnight: [],
      fajr: [],
      dhuhr: [],
      asr: [],
      maghrib: [],
      isha: [],
    };
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (task.date === selectedDate) {
        if (priorityFilter === 'all' || task.priority === priorityFilter) {
          if (map[task.prayerSlot]) {
            map[task.prayerSlot].push(task);
          }
        }
      }
    }
    return map;
  }, [tasks, selectedDate, priorityFilter]);

  // Fast O(N) indexing of day task counts for the 7 week tabs
  const dayTaskCounts = useMemo(() => {
    const counts: Record<string, { total: number; completed: number }> = {};
    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      if (!counts[task.date]) {
        counts[task.date] = { total: 0, completed: 0 };
      }
      counts[task.date].total += 1;
      if (task.completed) {
        counts[task.date].completed += 1;
      }
    }
    return counts;
  }, [tasks]);

  // Slot reordering handlers
  const moveSlotUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...prayerSlotOrder];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index];
    newOrder[index] = temp;
    setPrayerSlotOrder(newOrder);
  };

  const moveSlotDown = (index: number) => {
    if (index >= prayerSlotOrder.length - 1) return;
    const newOrder = [...prayerSlotOrder];
    const temp = newOrder[index + 1];
    newOrder[index + 1] = newOrder[index];
    newOrder[index] = temp;
    setPrayerSlotOrder(newOrder);
  };

  const handleOpenAddModal = (dateStr: string, slotId: PrayerSlotId) => {
    setTaskToEdit(null);
    setModalDefaultDate(dateStr);
    setModalDefaultSlot(slotId);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const toggleTaskExpansion = (taskId: string) => {
    setExpandedTaskIds(prev => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  const handleSubtaskToggleInCard = (task: Task, subtaskId: string) => {
    const updatedSubtasks = task.subtasks.map(st =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );
    onUpdateTask({
      ...task,
      subtasks: updatedSubtasks,
    });
    playSound.buttonClick();
  };

  const handleAddQuickSubtask = (task: Task, text: string) => {
    if (!text.trim()) return;
    if (task.subtasks.length >= 50) return;
    const newSubtask: SubTask = {
      id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: text.trim(),
      completed: false,
    };
    onUpdateTask({
      ...task,
      subtasks: [...task.subtasks, newSubtask],
    });
    setQuickSubtaskInputs(prev => ({ ...prev, [task.id]: '' }));
    playSound.buttonClick();
  };

  const handleApplySubtaskPackToTask = (task: Task, items: string[]) => {
    const existingTexts = new Set(task.subtasks.map(s => s.text));
    const newSubtasks: SubTask[] = items
      .filter(t => !existingTexts.has(t))
      .slice(0, 50 - task.subtasks.length)
      .map(t => ({
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: t,
        completed: false,
      }));
    if (newSubtasks.length === 0) return;
    onUpdateTask({
      ...task,
      subtasks: [...task.subtasks, ...newSubtasks],
    });
    playSound.completeTask();
  };

  const handleDeleteSubtaskInCard = (task: Task, subtaskId: string) => {
    onUpdateTask({
      ...task,
      subtasks: task.subtasks.filter(s => s.id !== subtaskId),
    });
  };

  const handleQuickMove = (taskId: string, newDate: string, newSlot: PrayerSlotId) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    onUpdateTask({
      ...task,
      date: newDate,
      prayerSlot: newSlot,
    });
    setMovingTaskId(null);
  };

  // Drag and Drop event handlers for tasks
  const handleTaskDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleTaskDragOverSlot = (e: React.DragEvent, slotId: PrayerSlotId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSlotId !== slotId) setDragOverSlotId(slotId);
  };

  const handleTaskDragOverCard = (e: React.DragEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverTaskId !== taskId) setDragOverTaskId(taskId);
  };

  const handleTaskDropOnSlot = (e: React.DragEvent, targetSlotId: PrayerSlotId, targetTaskId?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTaskId(null);
    setDragOverSlotId(null);
    const sourceTaskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    setDraggedTaskId(null);

    if (!sourceTaskId) return;
    const sourceTask = tasks.find(t => t.id === sourceTaskId)!;

    if (sourceTask.prayerSlot !== targetSlotId || sourceTask.date !== selectedDate || (targetTaskId && targetTaskId !== sourceTaskId)) {
      const newTasks = [...tasks];
      const sourceTaskIndex = newTasks.findIndex(t => t.id === sourceTaskId);
      const movedTask = { ...newTasks[sourceTaskIndex], prayerSlot: targetSlotId, date: selectedDate };
      newTasks.splice(sourceTaskIndex, 1);

      if (targetTaskId) {
        const targetTaskIndex = newTasks.findIndex(t => t.id === targetTaskId);
        newTasks.splice(targetTaskIndex, 0, movedTask);
      } else {
        newTasks.push(movedTask);
      }

      if (onReorderTasks) {
        onReorderTasks(newTasks);
      } else {
        onUpdateTask(movedTask);
      }
      playSound.buttonClick();
    }
  };

  const handleTaskDragEnd = () => {
    setDraggedTaskId(null);
    setDragOverTaskId(null);
    setDragOverSlotId(null);
  };

  return (
    <div className="space-y-6">
      {/* Master Weekly Goals Synergy Section */}
      {goals && onAddGoal && onUpdateGoal && onDeleteGoal && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-950/50 via-slate-900 to-purple-950/40 border border-indigo-500/30 p-5 shadow-2xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                <Target className="w-5 h-5 text-indigo-400" />
              </span>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>أهداف الأسبوع الكبرى والمرتبطة بالمهام</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-numbers font-bold">
                    {goals.filter(g => g.current >= g.target).length} / {goals.length} مكتمل
                  </span>
                </h3>
                <p className="text-xs text-slate-400">إدارة أهدافك الأسبوعية جنباً إلى جنب مع جدولك الأسبوعي والصلوات لضمان إنجاز متكامل</p>
              </div>
            </div>

            <button
              onClick={() => setShowGoalsPanel(prev => !prev)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30 transition flex items-center gap-1.5"
            >
              <span>{showGoalsPanel ? 'إخفاء الأهداف' : 'عرض الأهداف'}</span>
              {showGoalsPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showGoalsPanel && (
            <div className="pt-3 border-t border-indigo-500/20">
              <WeeklyGoals
                goals={goals}
                onAddGoal={onAddGoal}
                onUpdateGoal={onUpdateGoal}
                onDeleteGoal={onDeleteGoal}
                language={language}
              />
            </div>
          )}
        </div>
      )}

      {/* 1. Week Bar Navigation & Controls */}
      <div className="rounded-2xl bg-slate-900/80 border border-indigo-500/20 p-4 shadow-xl backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">
              {weekOffset === 0
                ? t.currentWeek
                : weekOffset > 0
                ? `${t.nextWeek} (+${weekOffset})`
                : `${t.prevWeek} (${weekOffset})`}
            </h2>
            {weekOffset !== 0 && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition"
              >
                {t.currentWeek}
              </button>
            )}
          </div>

          {/* Week Nav Buttons + Priority Filter */}
          <div className="flex items-center gap-2">
            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value as 'all' | Priority)}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-300 outline-none"
            >
              <option value="all">{t.allPriorities}</option>
              <option value="high">{t.highPriority}</option>
              <option value="medium">{t.medPriority}</option>
              <option value="low">{t.lowPriority}</option>
            </select>

            {/* Quick customization button */}
            {onOpenCustomization && (
              <button
                onClick={onOpenCustomization}
                className="p-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition"
                title="تخصيص أوقات الصلوات والألوان"
              >
                <Clock className="w-4 h-4 text-indigo-400" />
              </button>
            )}

            <div className="flex items-center rounded-xl bg-slate-800 border border-slate-700 p-0.5">
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title={t.prevWeek}
              >
                {language === 'ar' ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setWeekOffset(prev => prev + 1)}
                className="p-1.5 text-slate-300 hover:text-white rounded-lg hover:bg-slate-700 transition"
                title={t.nextWeek}
              >
                {language === 'ar' ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* 7-Days Horizontal Tabs as per specification */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {weekDays.map(dayInfo => {
            const isSelected = dayInfo.dateString === selectedDate;
            const counts = dayTaskCounts[dayInfo.dateString] || { total: 0, completed: 0 };

            return (
              <button
                key={dayInfo.dateString}
                onClick={() => setSelectedDate(dayInfo.dateString)}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl transition border text-center relative ${
                  isSelected
                    ? 'bg-gradient-to-b from-indigo-600/90 to-purple-700/90 border-indigo-400 text-white shadow-lg ring-1 ring-indigo-400'
                    : dayInfo.isToday
                    ? 'bg-slate-800/90 border-indigo-500/40 text-slate-200 hover:bg-slate-800'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {dayInfo.isToday && (
                  <span className="absolute -top-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-black text-[9px]">
                    اليوم
                  </span>
                )}
                <span className="text-xs font-semibold">
                  {language === 'ar' ? dayInfo.shortNameAr : dayInfo.shortNameEn}
                </span>
                <span className="font-mono-numbers text-sm sm:text-base font-bold my-0.5">
                  {dayInfo.dayNumber}
                </span>
                <span className="text-[10px] text-slate-300 font-mono-numbers">
                  {counts.total > 0 ? `${counts.completed}/${counts.total}` : '-'}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <span>📅</span>
            <span>{formatFriendlyDate(selectedDate, language)}</span>
          </h3>
          <p className="text-xs text-slate-400">{t.dragHint}</p>
        </div>

        <button
          onClick={() => handleOpenAddModal(selectedDate, 'fajr')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.addTask}</span>
        </button>
      </div>

      {/* 2. Prayer-Based Time Slots (6 Slots) */}
      <div className="space-y-4">
        {visibleSlotOrder.map((slotId, index) => {
          const slotDef = PRAYER_SLOTS.find(s => s.id === slotId)!;
          const slotTasks = tasksBySlot[slotId] || [];
          const customConf = prayerConfigs?.[slotId];
          const displayName = language === 'ar'
            ? (customConf?.customNameAr || slotDef.ar)
            : (customConf?.customNameEn || slotDef.en);
          const displayTime = customConf?.time || slotDef.defaultTime;

          const isSlotDragOver = dragOverSlotId === slotId;

          return (
            <div
              key={slotId}
              onDragOver={e => handleTaskDragOverSlot(e, slotId)}
              onDrop={e => handleTaskDropOnSlot(e, slotId)}
              className={`rounded-2xl border transition-all p-4 shadow-sm ${
                isSlotDragOver
                  ? 'bg-indigo-950/40 border-2 border-indigo-400/80 shadow-lg'
                  : 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/30'
              }`}
            >
              {/* Slot Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{slotDef.icon}</span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <span>{displayName}</span>
                      <span className="text-[11px] font-mono-numbers text-indigo-300 font-normal">
                        ({displayTime})
                      </span>
                      <span className="text-[10px] font-mono-numbers text-slate-400 px-2 py-0.5 rounded-full bg-slate-800">
                        {slotTasks.length} {language === 'ar' ? 'مهام' : 'tasks'}
                      </span>
                    </h4>
                  </div>
                </div>

                {/* Slot controls: Add Task to this slot + Reorder Slot */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenAddModal(selectedDate, slotId)}
                    className="p-1.5 text-indigo-400 hover:text-indigo-200 hover:bg-indigo-500/20 rounded-lg transition"
                    title={t.addTask}
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>

                  {/* Reorder Buttons */}
                  <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60">
                    <button
                      onClick={() => moveSlotUp(index)}
                      disabled={index === 0}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="تحريك لأعلى"
                    >
                      <MoveUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => moveSlotDown(index)}
                      disabled={index === prayerSlotOrder.length - 1}
                      className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="تحريك لأسفل"
                    >
                      <MoveDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Tasks List inside slot */}
              {slotTasks.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  {t.noTasksInSlot}
                </div>
              ) : (
                <div className="mt-3 space-y-2.5">
                  {slotTasks.map(task => {
                    const priorityCfg = PRIORITY_CONFIG[task.priority];
                    const categoryCfg = TASK_CATEGORIES[task.category];
                    const isExpanded = !!expandedTaskIds[task.id];
                    const completedSubtasks = task.subtasks.filter(s => s.completed).length;
                    const subtasksRatio = task.subtasks.length > 0 
                      ? Math.round((completedSubtasks / task.subtasks.length) * 100) 
                      : 0;

                    const isTaskDragging = draggedTaskId === task.id;
                    const isTaskDragOver = dragOverTaskId === task.id;
                    const isSubtasksOpen = subtasksExpandedMap[task.id] !== false;

                    return (
                      <div
                        key={task.id}
                        draggable={true}
                        onDragStart={e => handleTaskDragStart(e, task.id)}
                        onDragOver={e => handleTaskDragOverCard(e, task.id)}
                        onDrop={e => handleTaskDropOnSlot(e, slotId, task.id)}
                        onDragEnd={handleTaskDragEnd}
                        className={`rounded-xl border transition-all relative overflow-hidden bg-slate-850/80 ${
                          isTaskDragging
                            ? 'opacity-40 border-dashed border-indigo-400 bg-slate-900'
                            : isTaskDragOver
                            ? 'border-2 border-indigo-400 bg-indigo-950/40 shadow-xl scale-[1.01]'
                            : task.completed
                            ? 'bg-slate-900/40 border-slate-800/80 opacity-75'
                            : 'bg-slate-900/90 border-slate-750 hover:border-indigo-500/40 shadow-md'
                        }`}
                      >
                        {/* Priority Color Stripe on side */}
                        <div
                          className={`absolute top-0 bottom-0 w-1.5 ${
                            task.priority === 'high'
                              ? 'bg-rose-500'
                              : task.priority === 'medium'
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          } ${language === 'ar' ? 'right-0' : 'left-0'}`}
                        />

                        <div className={`p-3.5 ${language === 'ar' ? 'pr-4' : 'pl-4'}`}>
                          {/* Task Main Row */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2 flex-1 min-w-0">
                              {/* Drag Handle */}
                              <div
                                className="mt-0.5 p-0.5 text-slate-500 hover:text-indigo-300 cursor-grab active:cursor-grabbing shrink-0 transition"
                                title="سحب لنقل المهمة أو إعادة ترتيبها"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              {/* Checkbox */}
                              <button
                                onClick={() => onToggleTaskComplete(task.id)}
                                className={`mt-0.5 shrink-0 transition-transform active:scale-90 ${
                                  task.completed
                                    ? 'text-emerald-400'
                                    : 'text-slate-500 hover:text-emerald-400'
                                }`}
                                aria-label="Toggle Complete"
                              >
                                <CheckCircle2 className={`w-5 h-5 ${task.completed ? 'fill-emerald-500/20' : ''}`} />
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  {/* Task Title */}
                                  <h5
                                    className={`text-sm font-semibold truncate transition ${
                                      task.completed
                                        ? 'line-through text-slate-500'
                                        : 'text-slate-100 hover:text-indigo-200'
                                    }`}
                                  >
                                    {task.title}
                                  </h5>

                                  {/* Priority Badge */}
                                  <span
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono-numbers ${priorityCfg.bg} ${priorityCfg.color}`}
                                  >
                                    +{priorityCfg.xp} XP
                                  </span>

                                  {/* Category Badge */}
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700/60">
                                    <span>{categoryCfg.icon}</span>
                                    <span>{language === 'ar' ? categoryCfg.ar : categoryCfg.en}</span>
                                  </span>
                                </div>

                                {/* Meta: time, duration, tags */}
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                                  {task.time && (
                                    <span className="flex items-center gap-1 font-mono-numbers text-[11px] text-indigo-300">
                                      <Clock className="w-3 h-3" />
                                      {task.time}
                                    </span>
                                  )}
                                  {task.duration && (
                                    <span className="font-mono-numbers text-[11px] text-slate-400">
                                      ⏱️ {task.duration} {language === 'ar' ? 'دقيقة' : 'm'}
                                    </span>
                                  )}
                                  {task.tags.map(tag => (
                                    <span
                                      key={tag}
                                      className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950/40 text-indigo-300 border border-indigo-800/40"
                                    >
                                      #{tag}
                                    </span>
                                  ))}
                                  {task.repeat && task.repeat !== 'none' && (
                                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 font-semibold">
                                      🔄 {task.repeat === 'daily' ? 'تكرار يومي' : 'تكرار أسبوعي'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Task Action Buttons */}
                            <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                              {/* Toggle Subtasks Visibility Button */}
                              <button
                                type="button"
                                onClick={() => toggleSubtasksVisible(task.id)}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border shadow-sm active:scale-95 ${
                                  isSubtasksOpen
                                    ? 'bg-indigo-600 text-white border-indigo-400 ring-1 ring-indigo-400/40 shadow-indigo-600/30'
                                    : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700/80 text-slate-300 hover:text-white'
                                }`}
                                title="تحكم في إظهار أو إخفاء المهام الفرعية"
                              >
                                <ListPlus className="w-3.5 h-3.5 text-indigo-300" />
                                <span>
                                  {language === 'ar' 
                                    ? (isSubtasksOpen ? 'إخفاء الفرعية' : 'عرض الفرعية') 
                                    : (isSubtasksOpen ? 'Hide Subtasks' : 'Show Subtasks')}
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-indigo-500/25 text-[10px] font-mono-numbers text-indigo-200">
                                  {task.subtasks.length > 0 ? `${completedSubtasks}/${task.subtasks.length}` : '+'}
                                </span>
                                {isSubtasksOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>

                              {/* Quick Move Button */}
                              <button
                                onClick={() => setMovingTaskId(movingTaskId === task.id ? null : task.id)}
                                className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition"
                                title="نقل إلى يوم أو صلاة أخرى"
                              >
                                <ArrowRightLeft className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Button */}
                              <button
                                onClick={() => handleOpenEditModal(task)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                                title={t.editTask}
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => onDeleteTask(task.id)}
                                className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
                                title={t.deleteTask}
                                aria-label={t.deleteTask}
                              >
                                <X className="w-3.5 h-3.5 text-red-500 hover:text-red-400" />
                              </button>

                              {/* Expand/Collapse details */}
                              <button
                                onClick={() => toggleTaskExpansion(task.id)}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          {/* Subtasks Progress Bar if subtasks exist */}
                          {task.subtasks.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                                <span>{t.subtasks} ({completedSubtasks}/{task.subtasks.length})</span>
                                <span className="font-mono-numbers font-bold text-indigo-300">{subtasksRatio}%</span>
                              </div>
                              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                                  style={{ width: `${subtasksRatio}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Embedded Professional Nested Subtasks Tree (التعشيش الهرمي الاحترافي للمهام الفرعية) */}
                          {isSubtasksOpen && (
                            <div className={`mt-3 pt-3 border-t border-indigo-500/20 ${language === 'ar' ? 'mr-3 pr-3 border-r-2 border-indigo-500/40' : 'ml-3 pl-3 border-l-2 border-indigo-500/40'} space-y-2.5 animate-fadeIn`}>
                              
                              {/* Subtasks Progress Header */}
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                                  <span>↳</span>
                                  <span>الخطوات والمهام الفرعية المتداخلة ({completedSubtasks}/{task.subtasks.length})</span>
                                </span>
                                <span className="font-mono-numbers font-bold text-indigo-300">{subtasksRatio}%</span>
                              </div>

                              {/* Progress bar */}
                              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                                  style={{ width: `${subtasksRatio}%` }}
                                />
                              </div>



                              {/* Quick Add Custom Subtask Input */}
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={quickSubtaskInputs[task.id] || ''}
                                  onChange={e => setQuickSubtaskInputs(prev => ({ ...prev, [task.id]: e.target.value }))}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      handleAddQuickSubtask(task, quickSubtaskInputs[task.id] || '');
                                    }
                                  }}
                                  placeholder={language === 'ar' ? 'أضف مهمة فرعية متداخلة واضغط Enter...' : 'Add nested subtask and press Enter...'}
                                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-indigo-500 outline-none text-xs text-slate-200"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleAddQuickSubtask(task, quickSubtaskInputs[task.id] || '')}
                                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-sm shrink-0 active:scale-95"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span>إضافة</span>
                                </button>
                              </div>

                              {/* Nested Subtasks List */}
                              {task.subtasks.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {task.subtasks.map(st => (
                                    <div
                                      key={st.id}
                                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-xs transition hover:border-indigo-500/30 shadow-inner"
                                    >
                                      <button
                                        type="button"
                                        onClick={() => handleSubtaskToggleInCard(task, st.id)}
                                        className="flex items-center gap-2.5 text-left flex-1 min-w-0"
                                      >
                                        <CheckCircle2
                                          className={`w-4 h-4 shrink-0 transition ${
                                            st.completed ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-600 hover:text-slate-400'
                                          }`}
                                        />
                                        <span className={`text-xs truncate ${st.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                                          {st.text}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteSubtaskInCard(task, st.id)}
                                        className="p-1 text-red-500 hover:text-red-400 transition rounded-md hover:bg-red-500/10 shrink-0"
                                        title="حذف الخطوة"
                                        aria-label="حذف الخطوة"
                                      >
                                        <X className="w-3 h-3 text-red-500 hover:text-red-400" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Quick Move Inline Drawer */}
                          {movingTaskId === task.id && (
                            <div className="mt-3 p-3 rounded-xl bg-slate-800/90 border border-indigo-500/30 text-xs space-y-2 animate-fadeIn">
                              <div className="font-bold text-indigo-300">نقل المهمة إلى:</div>
                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">اليوم</label>
                                  <select
                                    defaultValue={task.date}
                                    id={`move-date-${task.id}`}
                                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                                  >
                                    {weekDays.map(d => (
                                      <option key={d.dateString} value={d.dateString}>
                                        {language === 'ar' ? d.dayNameAr : d.dayNameEn} ({d.dayNumber})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] text-slate-400 block mb-0.5">الصلاة</label>
                                  <select
                                    defaultValue={task.prayerSlot}
                                    id={`move-slot-${task.id}`}
                                    className="w-full px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs"
                                  >
                                    {PRAYER_SLOTS.map(s => (
                                      <option key={s.id} value={s.id}>
                                        {s.icon} {language === 'ar' ? s.ar : s.en}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div className="flex justify-end gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setMovingTaskId(null)}
                                  className="px-2.5 py-1 rounded bg-slate-700 text-slate-300 text-xs"
                                >
                                  {t.cancel}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const dateSel = (document.getElementById(`move-date-${task.id}`) as HTMLSelectElement)?.value;
                                    const slotSel = (document.getElementById(`move-slot-${task.id}`) as HTMLSelectElement)?.value as PrayerSlotId;
                                    handleQuickMove(task.id, dateSel, slotSel);
                                  }}
                                  className="px-3 py-1 rounded bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
                                >
                                  تطبيق النقل
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Expanded Details: Notes and Subtasks Checkboxes */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-slate-800 space-y-2 text-xs">
                              {task.notes && (
                                <p className="text-slate-300 italic bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                                  {task.notes}
                                </p>
                              )}

                              {task.subtasks.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                  {task.subtasks.map(st => (
                                    <div
                                      key={st.id}
                                      onClick={() => handleSubtaskToggleInCard(task, st.id)}
                                      className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/70 hover:bg-slate-800/80 cursor-pointer transition"
                                    >
                                      <CheckCircle2
                                        className={`w-3.5 h-3.5 shrink-0 ${
                                          st.completed ? 'text-emerald-400' : 'text-slate-600'
                                        }`}
                                      />
                                      <span
                                        className={`text-xs ${
                                          st.completed ? 'line-through text-slate-500' : 'text-slate-300'
                                        }`}
                                      >
                                        {st.text}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Task Creation / Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={task => {
          if (taskToEdit) {
            onUpdateTask(task);
          } else {
            onAddTask(task);
          }
        }}
        taskToEdit={taskToEdit}
        defaultDate={modalDefaultDate}
        defaultSlot={modalDefaultSlot}
        language={language}
      />
    </div>
  );
};
