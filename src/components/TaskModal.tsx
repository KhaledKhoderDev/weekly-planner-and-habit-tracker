import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Language, PrayerSlotId, Priority, SubTask, Task, TaskCategory } from '../types';
import { translations } from '../utils/translations';
import { PRAYER_SLOTS, PRIORITY_CONFIG, TASK_CATEGORIES, READY_SUBTASK_CHIPS, READY_SUBTASK_PACKS, PRESET_TAGS } from '../utils/constants';
import { X, PlusCircle, CheckCircle2, Sparkles, Zap, ListPlus, Tag } from 'lucide-react';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  taskToEdit?: Task | null;
  defaultDate?: string;
  defaultSlot?: PrayerSlotId;
  language: Language;
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  taskToEdit,
  defaultDate,
  defaultSlot = 'fajr',
  language,
}) => {
  const t = translations[language];

  const [title, setTitle] = useState('');
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [prayerSlot, setPrayerSlot] = useState<PrayerSlotId>(defaultSlot);
  const [priority, setPriority] = useState<Priority>('medium');
  const [category, setCategory] = useState<TaskCategory>('work');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState<number>(30);
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [color, setColor] = useState('indigo');
  const [repeat, setRepeat] = useState<'none' | 'daily' | 'weekly'>('none');
  const [subtasks, setSubtasks] = useState<SubTask[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDate(taskToEdit.date);
      setPrayerSlot(taskToEdit.prayerSlot);
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category);
      setTime(taskToEdit.time || '');
      setDuration(taskToEdit.duration || 30);
      setTagsInput(taskToEdit.tags.join(', '));
      setNotes(taskToEdit.notes || '');
      setColor(taskToEdit.color || 'indigo');
      setRepeat(taskToEdit.repeat || 'none');
      setSubtasks(taskToEdit.subtasks || []);
    } else {
      setTitle('');
      setDate(defaultDate || new Date().toISOString().split('T')[0]);
      setPrayerSlot(defaultSlot);
      setPriority('medium');
      setCategory('work');
      setTime('');
      setDuration(30);
      setTagsInput('');
      setNotes('');
      setColor('indigo');
      setRepeat('none');
      setSubtasks([]);
    }
    setNewSubtaskText('');
  }, [taskToEdit, defaultDate, defaultSlot, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    if (subtasks.length >= 50) return;
    setSubtasks([
      ...subtasks,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text: newSubtaskText.trim(),
        completed: false,
      },
    ]);
    setNewSubtaskText('');
  };

  const handleAddPresetSubtask = (text: string) => {
    if (subtasks.length >= 50) return;
    if (subtasks.some(s => s.text === text)) return;
    setSubtasks(prev => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text,
        completed: false,
      },
    ]);
  };

  const handleApplyPack = (items: string[]) => {
    const newItems = items
      .filter(item => !subtasks.some(s => s.text === item))
      .slice(0, 50 - subtasks.length)
      .map(text => ({
        id: `st-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        text,
        completed: false,
      }));
    setSubtasks(prev => [...prev, ...newItems]);
  };

  const handleToggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);

    const taskData: Task = {
      id: taskToEdit ? taskToEdit.id : `task-${Date.now()}`,
      title: title.trim(),
      date,
      prayerSlot,
      priority,
      category,
      time: time || undefined,
      duration: duration || undefined,
      tags,
      notes: notes.trim(),
      color,
      repeat,
      subtasks,
      completed: taskToEdit ? taskToEdit.completed : false,
      completedAt: taskToEdit?.completedAt,
    };

    onSave(taskData);
    onClose();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer">
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-indigo-500/30 rounded-2xl shadow-2xl p-6 text-slate-100 cursor-default">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="p-1 rounded-lg bg-indigo-500/20 text-indigo-300">📝</span>
            {taskToEdit ? t.editTask : t.addTask}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.taskTitle} *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: إتمام كتابة التقرير، تلاوة القرآن...' : 'e.g. Finish quarterly report, read Quran...'}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-sm transition"
            />
          </div>

          {/* Date & Prayer Slot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskDay} *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm font-mono-numbers"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskSlot} *
              </label>
              <select
                value={prayerSlot}
                onChange={e => setPrayerSlot(e.target.value as PrayerSlotId)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
              >
                {PRAYER_SLOTS.map(slot => (
                  <option key={slot.id} value={slot.id}>
                    {slot.icon} {language === 'ar' ? slot.ar : slot.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Priority & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskPriority}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['high', 'medium', 'low'] as Priority[]).map(p => {
                  const cfg = PRIORITY_CONFIG[p];
                  const active = priority === p;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`px-2 py-1.5 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-0.5 ${
                        active
                          ? `${cfg.bg} border-current ${cfg.color} ring-1 ring-current`
                          : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span>{language === 'ar' ? cfg.ar : cfg.en}</span>
                      <span className="text-[10px] opacity-80 font-mono-numbers">+{cfg.xp} XP</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskCategory}
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as TaskCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm"
              >
                {Object.entries(TASK_CATEGORIES).map(([catKey, catVal]) => (
                  <option key={catKey} value={catKey}>
                    {catVal.icon} {language === 'ar' ? catVal.ar : catVal.en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Duration & Tags */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskTime}
              </label>
              <input
                type="time"
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskDuration}
              </label>
              <input
                type="number"
                min={5}
                max={480}
                step={5}
                value={duration}
                onChange={e => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm font-mono-numbers"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.taskTags}
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                placeholder={language === 'ar' ? 'عمل, عاجل, تقرير' : 'work, report, urgent'}
                className="w-full px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-sm mb-2"
              />
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl bg-slate-800/50 border border-slate-700">
                {PRESET_TAGS.map(tag => {
                  const isSelected = tagsInput.includes(language === 'ar' ? tag.nameAr : tag.nameEn);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => {
                        const tagName = language === 'ar' ? tag.nameAr : tag.nameEn;
                        setTagsInput(prev => prev ? `${prev}, ${tagName}` : tagName);
                      }}
                      className={`px-2 py-1 rounded-lg text-[10px] font-medium border flex items-center gap-1 transition ${
                        isSelected ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-700 text-slate-300 border-slate-600'
                      }`}
                    >
                      <span>{tag.icon}</span>
                      <span>{language === 'ar' ? tag.nameAr : tag.nameEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Color & Repeat Customization */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                لون تمييز المهمة:
              </label>
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'indigo', bg: 'bg-indigo-500' },
                  { id: 'emerald', bg: 'bg-emerald-500' },
                  { id: 'amber', bg: 'bg-amber-500' },
                  { id: 'rose', bg: 'bg-rose-500' },
                  { id: 'cyan', bg: 'bg-cyan-500' },
                  { id: 'purple', bg: 'bg-purple-500' },
                ].map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setColor(c.id)}
                    className={`w-6 h-6 rounded-full ${c.bg} transition ${
                      color === c.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                تكرار المهمة:
              </label>
              <select
                value={repeat}
                onChange={e => setRepeat(e.target.value as 'none' | 'daily' | 'weekly')}
                className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 outline-none"
              >
                <option value="none">لا تتكرر (مهمة مفردة)</option>
                <option value="daily">تتكرر يومياً</option>
                <option value="weekly">تتكرر أسبوعياً</option>
              </select>
            </div>
          </div>

          {/* Subtasks (up to 50) */}
          <div className="pt-2 border-t border-indigo-500/20">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5 text-indigo-400" />
                <span>{t.subtasks}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono-numbers">
                  {subtasks.filter(s => s.completed).length}/{subtasks.length}
                </span>
              </label>
              <span className="text-[10px] text-slate-400">حتى 50 مهمة فرعية</span>
            </div>

            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={newSubtaskText}
                onChange={e => setNewSubtaskText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder={language === 'ar' ? 'أضف خطوة مخصصة واضغط إدخال...' : 'Add custom subtask and press Enter...'}
                className="flex-1 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-xs"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-indigo-600/20 active:scale-95"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{t.addSubtask}</span>
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {subtasks.map(st => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-800/50 border border-slate-700/60 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleSubtask(st.id)}
                      className="flex items-center gap-2 text-left flex-1"
                    >
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 transition ${
                          st.completed ? 'text-emerald-400 fill-emerald-400/20' : 'text-slate-500'
                        }`}
                      />
                      <span className={st.completed ? 'line-through text-slate-500' : 'text-slate-200'}>
                        {st.text}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="p-1 text-red-500 hover:text-red-400 rounded transition hover:bg-red-500/10"
                      title="حذف الخطوة الفرعية"
                      aria-label="حذف الخطوة الفرعية"
                    >
                      <X className="w-3.5 h-3.5 text-red-500 hover:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.taskNotes}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={language === 'ar' ? 'ملاحظات وتفاصيل إضافية...' : 'Additional notes and details...'}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700 focus:border-indigo-500 outline-none text-xs"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-indigo-500/20">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg transition"
            >
              {t.save}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
