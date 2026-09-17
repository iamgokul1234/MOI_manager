import axios from 'axios';

export { cn } from './cn';
export { formatCurrency, formatCurrencyCompact } from './formatCurrency';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** 15 Sep 2026 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Wed, 15 Sep 2026 */
export function formatDateLong(date: string | Date | null | undefined): string {
  if (!date) return '—';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '—';
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
  return `${day}, ${formatDate(d)}`;
}

/** "18:30" → "6:30 PM". Anything that is not HH:mm is returned unchanged. */
export function formatTime(time: string | null | undefined): string {
  if (!time) return '';
  const m = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!m) return time;
  const h = Number(m[1]);
  const min = m[2];
  if (h > 23) return time;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${min} ${suffix}`;
}

/** YYYY-MM-DD in local time (for <input type="date">). */
export function toInputDate(date: string | Date | null | undefined = new Date()): string {
  const d = date ? new Date(date) : new Date();
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Relative day label for reminders: Today, Tomorrow, In 3 days, 2 days ago. */
export function relativeDayLabel(date: string | Date): string {
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86_400_000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  if (diff > 1) return `In ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

export function isPastDate(date: string | Date): boolean {
  const target = new Date(date);
  const today = new Date();
  target.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return target.getTime() < today.getTime();
}

export function getPersonName(
  person:
    | {
        husbandName?: string | null;
        wifeName?: string | null;
      }
    | null
    | undefined
): string {
  if (!person) return 'Unknown';
  const parts = [person.husbandName, person.wifeName].filter(Boolean);
  return parts.join(' & ') || 'Unknown';
}

export function getInitial(person: { husbandName?: string | null; wifeName?: string | null } | null | undefined): string {
  return (person?.husbandName || person?.wifeName || '?').charAt(0).toUpperCase();
}

/** Human-readable label for a function type (EarPiercing → Ear Piercing). */
export function formatFunctionType(type: string): string {
  const known: Record<string, string> = {
    EarPiercing: 'Ear Piercing',
    BabyShower: 'Baby Shower',
  };
  return known[type] || type;
}

/** Extract the API's human-readable message from an axios error. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string } | undefined;
    if (data?.message) return data.message;
    if (!err.response) return 'Cannot reach the server. Check your connection and try again.';
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

export function isPopulated<T extends { _id: string }>(value: T | string | null | undefined): value is T {
  return !!value && typeof value === 'object';
}

export function idOf(value: { _id: string } | string | null | undefined): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value._id;
}
