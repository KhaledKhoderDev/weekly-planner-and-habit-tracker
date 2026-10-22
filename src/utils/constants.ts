import { AvatarGear, GoalCategory, PrayerSlotId, Priority, TaskCategory } from '../types';

export const XP_LEVELS = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3500, 5000];

export const XP_REWARDS = {
  TASK_HIGH: 35,
  TASK_MEDIUM: 20,
  TASK_LOW: 10,
  POMODORO: 100,
  QADA_PRAYER: 25,
  HABIT_CHECK: 15,
};

export const LEVEL_TITLES = {
  ar: [
    'مبتدئ',       // 0
    'متعلم',       // 1
    'متحمس',       // 2
    'مثابر',       // 3
    'متمرس',       // 4
    'محترف',       // 5
    'خبير',        // 6
    'بطل',         // 7
    'قدير',        // 8
    'أسطورة',      // 9
    'حكيم البركة', // 10+
  ],
  en: [
    'Novice',
    'Learner',
    'Enthusiast',
    'Diligent',
    'Seasoned',
    'Pro',
    'Expert',
    'Champion',
    'Master',
    'Legend',
    'Barakah Sage',
  ],
};

export function calculateLevel(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPercent: number;
  titleKeyIndex: number;
} {
  let level = 0;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) {
      level = i;
    } else {
      break;
    }
  }

  const currentLevelFloor = XP_LEVELS[level] ?? 0;
  const isMaxLevel = level >= XP_LEVELS.length - 1;
  const nextLevelCeil = isMaxLevel ? XP_LEVELS[level] + 1500 : XP_LEVELS[level + 1];

  const gainedInLevel = Math.max(0, xp - currentLevelFloor);
  const neededInLevel = nextLevelCeil - currentLevelFloor;
  const progressPercent = Math.min(100, Math.max(0, Math.round((gainedInLevel / neededInLevel) * 100)));

  return {
    level,
    currentLevelXp: currentLevelFloor,
    nextLevelXp: nextLevelCeil,
    progressPercent,
    titleKeyIndex: Math.min(level, LEVEL_TITLES.ar.length - 1),
  };
}

export const PRAYER_SLOTS: { id: PrayerSlotId; ar: string; en: string; icon: string; defaultTime: string }[] = [
  { id: 'midnight', ar: 'منتصف الليل', en: 'Midnight', icon: '🌙', defaultTime: '00:00' },
  { id: 'fajr', ar: 'الفجر', en: 'Fajr', icon: '🌅', defaultTime: '05:00' },
  { id: 'dhuhr', ar: 'الظهر', en: 'Dhuhr', icon: '☀️', defaultTime: '12:30' },
  { id: 'asr', ar: 'العصر', en: 'Asr', icon: '🌤️', defaultTime: '15:45' },
  { id: 'maghrib', ar: 'المغرب', en: 'Maghrib', icon: '🌇', defaultTime: '18:15' },
  { id: 'isha', ar: 'العشاء', en: 'Isha', icon: '🌌', defaultTime: '19:45' },
];

export const PRIORITY_CONFIG: Record<Priority, { ar: string; en: string; color: string; bg: string; xp: number }> = {
  high: { ar: 'عالية', en: 'High', color: 'text-rose-400', bg: 'bg-rose-500/20 border-rose-500/40', xp: XP_REWARDS.TASK_HIGH },
  medium: { ar: 'متوسطة', en: 'Medium', color: 'text-amber-400', bg: 'bg-amber-500/20 border-amber-500/40', xp: XP_REWARDS.TASK_MEDIUM },
  low: { ar: 'منخفضة', en: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-500/20 border-emerald-500/40', xp: XP_REWARDS.TASK_LOW },
};

export const TASK_CATEGORIES: Record<TaskCategory, { ar: string; en: string; icon: string; color: string }> = {
  worship: { ar: 'عبادة', en: 'Worship', icon: '🕌', color: 'from-emerald-600 to-teal-500' },
  work: { ar: 'عمل', en: 'Work', icon: '💼', color: 'from-blue-600 to-indigo-500' },
  study: { ar: 'دراسة', en: 'Study', icon: '📚', color: 'from-purple-600 to-violet-500' },
  health: { ar: 'صحة', en: 'Health', icon: '🍏', color: 'from-green-600 to-emerald-500' },
  personal: { ar: 'شخصي', en: 'Personal', icon: '✨', color: 'from-pink-600 to-rose-500' },
  social: { ar: 'اجتماعي', en: 'Social', icon: '🤝', color: 'from-amber-600 to-orange-500' },
};

export const GOAL_CATEGORIES: Record<GoalCategory, { ar: string; en: string; icon: string; defaultUnit: string }> = {
  quran: { ar: 'قرآن كريم', en: 'Holy Quran', icon: '📖', defaultUnit: 'صفحات' },
  study: { ar: 'دراسة', en: 'Study', icon: '🎓', defaultUnit: 'ساعات' },
  work: { ar: 'عمل ومشاريع', en: 'Work & Projects', icon: '💼', defaultUnit: 'ساعات' },
  health: { ar: 'صحة وعناية', en: 'Health & Care', icon: '🥗', defaultUnit: 'أيام' },
  personal: { ar: 'تطوير شخصي', en: 'Personal Dev', icon: '🌱', defaultUnit: 'جلسات' },
  spiritual: { ar: 'روحي وأذكار', en: 'Spiritual', icon: '📿', defaultUnit: 'أذكار' },
  sports: { ar: 'رياضة ولياقة', en: 'Fitness & Sports', icon: '🏃', defaultUnit: 'تمارين' },
  social: { ar: 'اجتماعي وبر', en: 'Social & Family', icon: '❤️', defaultUnit: 'زيارات' },
};

export const LIFE_ASPECT_TAGS = [
  { id: 'worship', ar: 'عبادة وطاعات', en: 'Worship', icon: '🕌' },
  { id: 'work', ar: 'عمل ومشاريع', en: 'Work', icon: '💼' },
  { id: 'family', ar: 'عائلة واجتماعي', en: 'Family', icon: '👨‍👩‍👧‍👦' },
  { id: 'health', ar: 'صحة ولياقة', en: 'Health', icon: '🥗' },
  { id: 'growth', ar: 'تطوير وتزوّد', en: 'Growth', icon: '🌱' },
];

export const HABIT_COLORS = [
  { id: 'emerald', labelAr: 'أخضر هادئ', labelEn: 'Fresh Green', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/40', glow: 'shadow-emerald-500/20' },
  { id: 'indigo', labelAr: 'نيلي ملكي', labelEn: 'Royal Indigo', bg: 'bg-indigo-500/20', text: 'text-indigo-300', border: 'border-indigo-500/40', glow: 'shadow-indigo-500/20' },
  { id: 'cyan', labelAr: 'سماوي فيروزي', labelEn: 'Cyan Oasis', bg: 'bg-cyan-500/20', text: 'text-cyan-300', border: 'border-cyan-500/40', glow: 'shadow-cyan-500/20' },
  { id: 'amber', labelAr: 'ذهبي عنبر', labelEn: 'Golden Amber', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/40', glow: 'shadow-amber-500/20' },
  { id: 'rose', labelAr: 'وردي قرمزي', labelEn: 'Ruby Rose', bg: 'bg-rose-500/20', text: 'text-rose-300', border: 'border-rose-500/40', glow: 'shadow-rose-500/20' },
  { id: 'purple', labelAr: 'بنفسجي شفق', labelEn: 'Twilight Purple', bg: 'bg-purple-500/20', text: 'text-purple-300', border: 'border-purple-500/40', glow: 'shadow-purple-500/20' },
  { id: 'teal', labelAr: 'تركوازي عميق', labelEn: 'Deep Teal', bg: 'bg-teal-500/20', text: 'text-teal-300', border: 'border-teal-500/40', glow: 'shadow-teal-500/20' },
];

export const HABIT_ICONS = [
  { id: 'quran', emoji: '📖', labelAr: 'مصحف / قراءة', labelEn: 'Quran / Reading' },
  { id: 'moon', emoji: '🌙', labelAr: 'قيام / تهجد', labelEn: 'Night Prayer' },
  { id: 'prayer', emoji: '🕌', labelAr: 'صلاة / مسجد', labelEn: 'Prayer' },
  { id: 'heart', emoji: '❤️', labelAr: 'أذكار / قلب', labelEn: 'Dhikr / Heart' },
  { id: 'dumbbell', emoji: '💪', labelAr: 'رياضة / قوة', labelEn: 'Workout' },
  { id: 'droplets', emoji: '💧', labelAr: 'شرب ماء', labelEn: 'Water' },
  { id: 'book', emoji: '📚', labelAr: 'طلب علم', labelEn: 'Study' },
  { id: 'sparkles', emoji: '✨', labelAr: 'سنة / فضل', labelEn: 'Sunnah' },
  { id: 'sun', emoji: '☀️', labelAr: 'صباح / بكور', labelEn: 'Morning' },
  { id: 'brain', emoji: '🧠', labelAr: 'تأمل وتطوير', labelEn: 'Mindset' },
  { id: 'walking', emoji: '🚶', labelAr: 'مشي وخطوات', labelEn: 'Walking' },
  { id: 'charity', emoji: '🪙', labelAr: 'صدقة وبر', labelEn: 'Charity' },
];

export const BARE_MINIMUM_PRESETS = [
  { habitMatch: 'قرآن', titleAr: 'صفحة واحدة من المصحف', titleEn: '1 page of Quran', val: 1, unit: 'صفحات' },
  { habitMatch: 'وتر', titleAr: 'ركعة وتر واحدة خفيفة', titleEn: '1 single Rak\'ah of Witr', val: 1, unit: 'ركعات' },
  { habitMatch: 'رياضة', titleAr: '5 دقائق إحماء خفيف', titleEn: '5 min light workout', val: 5, unit: 'دقائق' },
  { habitMatch: 'ماء', titleAr: 'كوبان كبيران من الماء', titleEn: '2 glasses of water', val: 2, unit: 'أكواب' },
  { habitMatch: 'قراءة', titleAr: 'قراءة صفحتين أو 5 دقائق', titleEn: '2 pages read or 5 min', val: 2, unit: 'صفحات' },
  { habitMatch: 'أذكار', titleAr: '10 تسبيحات واستغفارات موجزة', titleEn: '10 short Tasbeehs', val: 10, unit: 'تسبيحات' },
];

export interface StoreItem {
  id: AvatarGear;
  nameAr: string;
  nameEn: string;
  descAr: string;
  descEn: string;
  price: number;
  icon: string;
  type: 'gear' | 'shield';
  rarityAr: string;
  rarityEn: string;
}

export const GEAR_STORE_ITEMS: StoreItem[] = [
  {
    id: 'plain',
    nameAr: 'وسام البداية والنية',
    nameEn: 'Emblem of Intention',
    descAr: 'الوسام الأول لكل ساعٍ إلى البركة والإنتاجية واغتنام الأوقات.',
    descEn: 'The initial emblem for every seeker of barakah, diligence, and focus.',
    price: 0,
    icon: '💠',
    type: 'gear',
    rarityAr: 'أساسي',
    rarityEn: 'Common',
  },
  {
    id: 'sage-cloak',
    nameAr: 'وسام السكينة السندسي',
    nameEn: 'Emerald Serenity Emblem',
    descAr: 'توريق زمردي هادئ مستوحى من نضرة الطاعة وحسن التخطيط.',
    descEn: 'Emerald arabesque pattern inspired by tranquility and discipline.',
    price: 150,
    icon: '🌿',
    type: 'gear',
    rarityAr: 'نادر',
    rarityEn: 'Rare',
  },
  {
    id: 'bronze-shield',
    nameAr: 'درع العزيمة البرونزي',
    nameEn: 'Bronze Resolve Shield',
    descAr: 'درع هندسي مطروق يرمز للثبات والمصابرة على الواجبات.',
    descEn: 'A reinforced bronze geometric shield symbolizing steadfastness.',
    price: 300,
    icon: '🛡️',
    type: 'gear',
    rarityAr: 'ملحمي',
    rarityEn: 'Epic',
  },
  {
    id: 'silver-aura',
    nameAr: 'وسام الإشراق والهمة',
    nameEn: 'Luminous Resolve Emblem',
    descAr: 'بريق أزرق فيروزي بلوري يحيط برواد التركيز وحفظ الأوقات.',
    descEn: 'A luminous turquoise glow surrounding masters of deep focus.',
    price: 550,
    icon: '✨',
    type: 'gear',
    rarityAr: 'ممتاز',
    rarityEn: 'Masterwork',
  },
  {
    id: 'golden-star',
    nameAr: 'خاتم البركة الثماني المذهب',
    nameEn: 'Golden Barakah Octagram',
    descAr: 'تذهيب إسلامي ناصع لمن جمع بين فضل الطاعة والإتقان في العمل.',
    descEn: 'Radiant gilded Islamic octagram for excellence in worship and work.',
    price: 900,
    icon: '⭐',
    type: 'gear',
    rarityAr: 'فائق التميز',
    rarityEn: 'Supreme',
  },
];

// Quick ready-made subtask chips for 1-click addition
export const READY_SUBTASK_CHIPS = [
  { id: 'prep', ar: '⚡ تجهيز وتحضير', en: 'Prep & Setup' },
  { id: 'draft', ar: '📝 مسودة أولية', en: 'First Draft' },
  { id: 'focus', ar: '🚀 تركيز وتنفيذ', en: 'Deep Execution' },
  { id: 'review', ar: '🔍 مراجعة وتدقيق', en: 'Review & Polish' },
  { id: 'deliver', ar: '📤 إرسال واعتماد', en: 'Deliver & Send' },
  { id: 'quran', ar: '📖 تلاوة وتدبر', en: 'Read & Reflect' },
  { id: 'summary', ar: '💡 تلخيص وتوثيق', en: 'Summarize Notes' },
  { id: 'step5', ar: '🎯 خطوة أولى (5 د)', en: 'Quick 5m Step' },
];

// Pre-made Workflow Subtask Packs (1-click bundle insertion)
export const READY_SUBTASK_PACKS = [
  {
    id: 'pack-work',
    nameAr: 'حزمة العمل والإنجاز (4 خطوات)',
    nameEn: 'Complete Work Flow (4 steps)',
    icon: '💼',
    descAr: 'تجهيز، مسودة، مراجعة، وتسليم',
    descEn: 'Prep, Draft, Review, Deliver',
    items: ['تحديد المتطلبات والهدف الرئيسي', 'البدء وإعداد المسودة الأولى', 'المراجعة والتدقيق الإملائي والفني', 'الإرسال والتسليم النهائي'],
  },
  {
    id: 'pack-study',
    nameAr: 'حزمة المذاكرة والقراءة (3 خطوات)',
    nameEn: 'Study & Reading Flow (3 steps)',
    icon: '📖',
    descAr: 'قراءة، تلخيص، وتطبيق',
    descEn: 'Read, Summarize, Apply',
    items: ['القراءة المركزة للمحتوى', 'استخراج وتدوين أهم النقاط والملخص', 'حل التدريبات أو التطبيق العملي'],
  },
  {
    id: 'pack-worship',
    nameAr: 'حزمة الطاعة والورد (3 خطوات)',
    nameEn: 'Worship & Dhikr Flow (3 steps)',
    icon: '🕌',
    descAr: 'نية، حضور قلب، ودعاء',
    descEn: 'Intention, Mindful Act, Dua',
    items: ['استحضار النية والإخلاص', 'التنفيذ بخشوع وتأنٍ', 'الأذكار المأثورة والدعاء بالقبول'],
  },
  {
    id: 'pack-fast',
    nameAr: 'حزمة السرعة والإتقان (3 خطوات)',
    nameEn: 'Rapid 3-Step Sprint',
    icon: '⚡',
    descAr: 'تحضير سريع، إنجاز، ومراجعة',
    descEn: 'Prep, Sprint, Verify',
    items: ['تهيئة بيئة العمل والمراجع', 'جلسة تركيز كاملة دون تشتيت', 'التأكد من إتمام المطلوب بنجاح'],
  },
];

export interface PresetTag {
  id: string;
  category: 'religious' | 'worldly';
  categoryAr: string;
  categoryEn: string;
  nameAr: string;
  nameEn: string;
  icon: string;
}

export const PRESET_TAGS: PresetTag[] = [
  // Islamic Religious Tags (طاعات وإيمانيات)
  { id: 'quran-wird', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'ورد قرآني', nameEn: 'Quran Wird', icon: '📖' },
  { id: 'qiyam-layl', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'قيام الليل', nameEn: 'Night Prayer', icon: '🌙' },
  { id: 'adhkar', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'أذكار الصباح والمساء', nameEn: 'Morning & Evening Dhikr', icon: '📿' },
  { id: 'family-ties', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'صلة الرحم', nameEn: 'Family Ties', icon: '🤝' },
  { id: 'parents-honoring', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'بر الوالدين', nameEn: 'Honoring Parents', icon: '❤️' },
  { id: 'charity', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'صدقة وإحسان', nameEn: 'Charity & Giving', icon: '🪙' },
  { id: 'islamic-knowledge', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'طلب علم شرعي', nameEn: 'Islamic Knowledge', icon: '📚' },
  { id: 'fasting', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'صيام تطوع', nameEn: 'Voluntary Fasting', icon: '🌅' },
  { id: 'sunnah-prayers', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'سنن رواتب', nameEn: 'Sunnah Prayers', icon: '🕌' },
  { id: 'dua-istighfar', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'دعاء واستغفار', nameEn: 'Dua & Istighfar', icon: '🤲' },
  { id: 'quran-hifz', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'حفظ القرآن', nameEn: 'Quran Memorization', icon: '📖' },
  { id: 'subha-tasbeeh', category: 'religious', categoryAr: 'طاعات وإيمانيات', categoryEn: 'Spiritual & Worship', nameAr: 'تسبيح وتهليل', nameEn: 'Tasbeeh', icon: '✨' },

  // Permissible Worldly Tags (تطوير ودنيا مباحة)
  { id: 'self-dev', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'تطوير ذاتي', nameEn: 'Self Development', icon: '🌱' },
  { id: 'work-prod', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'عمل وإنجاز', nameEn: 'Work & Productivity', icon: '💼' },
  { id: 'health-fitness', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'صحة ولياقة', nameEn: 'Health & Fitness', icon: '💪' },
  { id: 'finance-mgmt', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'إدارة مالية', nameEn: 'Financial Management', icon: '💰' },
  { id: 'skill-learning', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'تعلم مهارة', nameEn: 'Skill Learning', icon: '💡' },
  { id: 'academics-study', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'مذاكرة وتحصيل', nameEn: 'Academics & Study', icon: '🎓' },
  { id: 'organization', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'ترتيب وتنظيم', nameEn: 'Organization', icon: '🧹' },
  { id: 'reading-culture', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'قراءة وإطلاع', nameEn: 'General Reading', icon: '📕' },
  { id: 'side-project', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'مشروع خاص', nameEn: 'Side Project', icon: '🚀' },
  { id: 'sports-walking', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'رياضة ومشي', nameEn: 'Sports & Walking', icon: '🏃' },
  { id: 'parenting', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'تربية الأبناء', nameEn: 'Parenting', icon: '👨‍👩‍👧‍👦' },
  { id: 'deep-focus', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'تركيز عميق', nameEn: 'Deep Focus', icon: '🎯' },
  { id: 'time-mgmt', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'إدارة الوقت', nameEn: 'Time Management', icon: '⏳' },
  { id: 'nutrition', category: 'worldly', categoryAr: 'تطوير ودنيا مباحة', categoryEn: 'Permissible Worldly', nameAr: 'تغذية صحية', nameEn: 'Healthy Nutrition', icon: '🥗' },
];


