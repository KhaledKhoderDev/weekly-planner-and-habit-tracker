import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AccentTheme, CustomPrayerConfig, DailyHabit, Language, PrayerSlotId, Task, Theme, UserStats, WeeklyGoal } from '../types';
import { translations } from '../utils/translations';
import { PRAYER_SLOTS } from '../utils/constants';
import { 
  X, 
  Settings, 
  Clock, 
  Palette, 
  Download, 
  Upload, 
  Save, 
  Check, 
  ShieldCheck, 
  Sparkles,
  AlertCircle,
  Moon,
  Sun
} from 'lucide-react';
import { playSound } from '../utils/audio';

interface CustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prayerConfigs: Record<PrayerSlotId, CustomPrayerConfig>;
  onUpdatePrayerConfigs: (configs: Record<PrayerSlotId, CustomPrayerConfig>) => void;
  accentTheme: AccentTheme;
  onChangeAccentTheme: (theme: AccentTheme) => void;
  theme?: Theme;
  onChangeTheme?: (theme: Theme) => void;
  // Backup / Restore data
  allData: {
    tasks: Task[];
    habits: DailyHabit[];
    goals: WeeklyGoal[];
    stats: UserStats;
  };
  onRestoreData: (importedData: {
    tasks: Task[];
    habits: DailyHabit[];
    goals: WeeklyGoal[];
    stats: UserStats;
  }) => void;
  onUpdateStats: (stats: UserStats) => void;
  language: Language;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  isOpen,
  onClose,
  prayerConfigs,
  onUpdatePrayerConfigs,
  accentTheme,
  onChangeAccentTheme,
  theme = 'midnight',
  onChangeTheme,
  allData,
  onRestoreData,
  onUpdateStats,
  language,
}) => {
  const t = translations[language];

  const [activeTab, setActiveTab] = useState<'prayers' | 'appearance' | 'backup' | 'notifications'>('prayers');
  const [localPrayers, setLocalPrayers] = useState<Record<PrayerSlotId, CustomPrayerConfig>>(prayerConfigs);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setLocalPrayers(prayerConfigs);
    }
  }, [isOpen, prayerConfigs]);

  if (!isOpen) return null;

  // Handle changing time or custom name for a prayer slot
  const handlePrayerTimeChange = (id: PrayerSlotId, time: string) => {
    setLocalPrayers(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        time,
      },
    }));
  };

  const handlePrayerNameChange = (id: PrayerSlotId, name: string) => {
    setLocalPrayers(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [language === 'ar' ? 'customNameAr' : 'customNameEn']: name,
      },
    }));
  };

  const handleSavePrayers = () => {
    onUpdatePrayerConfigs(localPrayers);
    playSound.completeTask();
  };

  // Export full backup as JSON file
  const handleExportBackup = () => {
    try {
      const exportObject = {
        app: 'BarakahFlow',
        version: '1.2.0',
        exportedAt: new Date().toISOString(),
        data: allData,
        prayerConfigs: localPrayers,
      };

      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportObject, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `barakahflow_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      playSound.completeTask();
      alert(t.backupSuccess);
    } catch {
      alert('Failed to export backup');
    }
  };

  // Import backup from JSON file
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Basic schema verification
        if (!parsed.data || !Array.isArray(parsed.data.tasks) || !Array.isArray(parsed.data.habits)) {
          throw new Error('Invalid schema');
        }

        onRestoreData(parsed.data);
        if (parsed.prayerConfigs) {
          onUpdatePrayerConfigs(parsed.prayerConfigs);
        }

        playSound.levelUp();
        setImportStatus(t.importSuccess);
        setTimeout(() => setImportStatus(null), 3000);
      } catch {
        alert(t.importError);
      }
    };
    reader.readAsText(file);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn cursor-pointer">
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 text-slate-100 shadow-2xl cursor-default">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" />
            <span>مركز التخصيص والإعدادات المتقدمة</span>
          </h2>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-2 my-4 p-1 rounded-2xl bg-slate-950/60 border border-slate-800">
          <button
            onClick={() => setActiveTab('prayers')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'prayers'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{t.customPrayersTitle}</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>{t.themeAccent}</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>النسخ الاحتياطي والأمان</span>
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>التنبيهات</span>
          </button>
        </div>

        {/* TAB 1: Customize Prayer Times */}
        {activeTab === 'prayers' && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-xs text-slate-400">
              {t.customPrayerHint}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PRAYER_SLOTS.map(slot => {
                const conf = localPrayers[slot.id] || { id: slot.id, time: slot.defaultTime, enabled: true };
                const isEnabled = conf.enabled !== false;
                const currentName = language === 'ar'
                  ? (conf.customNameAr || slot.ar)
                  : (conf.customNameEn || slot.en);

                return (
                  <div
                    key={slot.id}
                    className={`p-3 rounded-2xl border space-y-2 transition ${
                      isEnabled
                        ? 'bg-slate-800/60 border-slate-700/60'
                        : 'bg-slate-900/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{slot.icon}</span>
                        <span>{language === 'ar' ? slot.ar : slot.en}</span>
                      </span>

                      <div className="flex items-center gap-2">
                        <input
                          type="time"
                          value={conf.time}
                          onChange={e => handlePrayerTimeChange(slot.id, e.target.value)}
                          className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-mono-numbers text-indigo-300 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLocalPrayers(prev => ({
                              ...prev,
                              [slot.id]: {
                                ...prev[slot.id],
                                enabled: !isEnabled,
                              },
                            }));
                          }}
                          className={`text-[10px] px-2 py-0.5 rounded-lg border font-semibold transition ${
                            isEnabled
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : 'bg-slate-800 text-slate-500 border-slate-700'
                          }`}
                        >
                          {isEnabled ? 'مفعل' : 'مخفي'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-slate-400 block mb-0.5">الاسم المخصص:</label>
                      <input
                        type="text"
                        value={currentName}
                        onChange={e => handlePrayerNameChange(slot.id, e.target.value)}
                        className="w-full px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-700 outline-none text-xs"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSavePrayers}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-3.5 h-3.5" />
                <span>حفظ التوقيتات والأقسام</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Accent Themes & Dark Mode */}
        {activeTab === 'appearance' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Theme Mode Selector: Night Dark vs Classic Dark vs Light */}
            {onChangeTheme && (
              <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-indigo-400" />
                    <span>نمط العرض الليلي والنهاري (Theme Mode):</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-medium">مريح للعين وتوفير للبطارية</span>
                </div>
                <div className="grid grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      onChangeTheme('midnight');
                      playSound.buttonClick();
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      theme === 'midnight'
                        ? 'bg-black border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-lg shadow-black/50'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-xl">🌌</span>
                    <span className="font-bold text-white">ليلي داكن</span>
                    <span className="text-[10px] text-slate-400">سكون وسواد مريح</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeTheme('dark');
                      playSound.buttonClick();
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      theme === 'dark'
                        ? 'bg-slate-800 border-indigo-400 text-white ring-2 ring-indigo-500/50 shadow-lg'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-xl">🌙</span>
                    <span className="font-bold text-white">داكن كلاسيكي</span>
                    <span className="text-[10px] text-slate-400">كحلي عميق</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onChangeTheme('light');
                      playSound.buttonClick();
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition ${
                      theme === 'light'
                        ? 'bg-slate-200 border-indigo-500 text-slate-900 ring-2 ring-indigo-500/50 shadow-lg'
                        : 'bg-slate-900/70 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/80'
                    }`}
                  >
                    <span className="text-xl">☀️</span>
                    <span className="font-bold text-slate-200">نهاري فاتح</span>
                    <span className="text-[10px] text-slate-400">إشراق الصباح</span>
                  </button>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-slate-400 mb-2.5">
                اختر سمة الهوية البصرية والتدرجات الشفقية المحببة لعينك:
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { id: 'midnight' as AccentTheme, name: 'ليلي داكن (سكون الليل)', desc: 'سواد هادئ مريح للعين ولمسات قمرية خافتة', color: 'from-slate-900 via-indigo-950 to-black', border: 'border-slate-500' },
                  { id: 'twilight' as AccentTheme, name: t.accentTwilight, desc: 'كحيلي ملكي وبنفسجي شفق', color: 'from-indigo-600 to-purple-600', border: 'border-indigo-500' },
                  { id: 'amber' as AccentTheme, name: t.accentAmber, desc: 'عنبر دافئ مع إشراق الصباح', color: 'from-amber-500 to-yellow-600', border: 'border-amber-500' },
                  { id: 'ruby' as AccentTheme, name: t.accentRuby, desc: 'ياقوت الهمة وعزيمة الأبطال', color: 'from-rose-600 to-violet-600', border: 'border-rose-500' },
                  { id: 'cyan' as AccentTheme, name: 'واحة فيروزية', desc: 'فيروزي منعش ونسائم هادئة', color: 'from-cyan-500 to-teal-500', border: 'border-cyan-500' },
                ].map(themeItem => {
                  const isSelected = accentTheme === themeItem.id;
                  return (
                    <button
                      key={themeItem.id}
                      onClick={() => {
                        onChangeAccentTheme(themeItem.id);
                        playSound.buttonClick();
                      }}
                      className={`p-3.5 rounded-2xl border text-left rtl:text-right transition-all flex flex-col justify-between ${
                        isSelected
                          ? `bg-slate-800/90 ${themeItem.border} ring-2 ring-current text-white`
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-r ${themeItem.color} shadow-sm border border-white/10`} />
                        {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white">{themeItem.name}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{themeItem.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Backup & Restore */}
        {activeTab === 'backup' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Download className="w-5 h-5 text-indigo-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.exportBackup}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    احفظ كافة مهامك وعاداتك وإحصائيات شخصيتك في ملف نصي مشفر بأمان.
                  </p>
                </div>
              </div>

              <button
                onClick={handleExportBackup}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل نسخة احتياطية فورية</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-sm font-bold text-white">{t.importBackup}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    استعد بياناتك السابقة عند تغيير المتصفح أو الجهاز بكل سهولة.
                  </p>
                </div>
              </div>

              {importStatus && (
                <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{importStatus}</span>
                </div>
              )}

              <label className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-2 cursor-pointer border border-slate-700">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>اختر ملف النسخة الاحتياطية (.json)</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportFile}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        )}

        {/* TAB 4: Notifications */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">تنبيهات الصلاة</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    تلقي تنبيهات المتصفح قبل موعد الصلاة لضمان أداء الصلاة في وقتها.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={allData.stats.notifications?.enabled ?? false}
                  onChange={e => {
                    onUpdateStats({
                      ...allData.stats,
                      notifications: {
                        enabled: e.target.checked,
                        reminderMinutes: allData.stats.notifications?.reminderMinutes ?? 5,
                      },
                    });
                  }}
                  className="w-5 h-5 rounded text-indigo-600 bg-slate-900 border-slate-700 cursor-pointer"
                />
              </div>

              {allData.stats.notifications?.enabled && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    التذكير قبل (بالدقائق):
                  </label>
                  <select
                    value={allData.stats.notifications?.reminderMinutes ?? 5}
                    onChange={e => {
                      onUpdateStats({
                        ...allData.stats,
                        notifications: {
                          enabled: true,
                          reminderMinutes: Number(e.target.value),
                        },
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 outline-none text-sm"
                  >
                    <option value={0}>في وقت الصلاة</option>
                    <option value={5}>5 دقائق قبل</option>
                    <option value={10}>10 دقائق قبل</option>
                    <option value={15}>15 دقيقة قبل</option>
                  </select>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
