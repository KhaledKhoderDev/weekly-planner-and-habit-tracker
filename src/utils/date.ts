export interface DayInfo {
  dateString: string; // YYYY-MM-DD
  dayNameAr: string;
  dayNameEn: string;
  shortNameAr: string;
  shortNameEn: string;
  dayNumber: number;
  monthNameAr: string;
  monthNameEn: string;
  isToday: boolean;
}

const AR_DAY_NAMES = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const EN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AR_MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];
const EN_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function formatDateToYMD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function parseYMD(str: string): Date {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday to avoid daylight saving issues
}

export function getTodayYMD(): string {
  return formatDateToYMD(new Date());
}

/**
 * Returns the Saturday of the week containing the given date
 * In Islamic calendar custom, Saturday is the start of the week:
 * 6: Saturday (offset 0)
 * 0: Sunday (offset 1)
 * 1: Monday (offset 2)
 * 2: Tuesday (offset 3)
 * 3: Wednesday (offset 4)
 * 4: Thursday (offset 5)
 * 5: Friday (offset 6)
 */
export function getWeekStartSaturday(baseDate: Date): Date {
  const date = new Date(baseDate);
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday
  const diff = (day + 1) % 7; // if Sat(6) => (6+1)%7 = 0. If Sun(0) => 1. If Fri(5) => 6.
  date.setDate(date.getDate() - diff);
  date.setHours(12, 0, 0, 0);
  return date;
}

export function getWeekDays(startSaturday: Date): DayInfo[] {
  const todayYMD = getTodayYMD();
  const days: DayInfo[] = [];

  for (let i = 0; i < 7; i++) {
    const current = new Date(startSaturday);
    current.setDate(startSaturday.getDate() + i);
    const dateStr = formatDateToYMD(current);
    const dayOfWeek = current.getDay();
    const month = current.getMonth();

    days.push({
      dateString: dateStr,
      dayNameAr: AR_DAY_NAMES[dayOfWeek],
      dayNameEn: EN_DAY_NAMES[dayOfWeek],
      shortNameAr: AR_DAY_NAMES[dayOfWeek],
      shortNameEn: EN_DAY_NAMES[dayOfWeek].slice(0, 3),
      dayNumber: current.getDate(),
      monthNameAr: AR_MONTH_NAMES[month],
      monthNameEn: EN_MONTH_NAMES[month],
      isToday: dateStr === todayYMD,
    });
  }

  return days;
}

export function formatFriendlyDate(dateStr: string, lang: 'ar' | 'en'): string {
  const date = parseYMD(dateStr);
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  const month = date.getMonth();

  if (lang === 'ar') {
    return `${AR_DAY_NAMES[dayOfWeek]}، ${day} ${AR_MONTH_NAMES[month]}`;
  }
  return `${EN_DAY_NAMES[dayOfWeek]}, ${day} ${EN_MONTH_NAMES[month]}`;
}
