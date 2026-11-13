const pad = (n: number) => String(n).padStart(2, '0');
const isLeap = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/** 'YYYY-MM-DD' (local time) for a picked date, or null if it is invalid, in the future or before 1900. */
export function toBirthDateString(d: Date, now: Date = new Date()): string | null {
  if (Number.isNaN(d.getTime()) || d.getFullYear() < 1900) return null;
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (day.getTime() > today.getTime()) return null;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** True when `now` (local date) is the member's birthday. 29 February is celebrated on 28 February in non-leap years. */
export function isBirthdayToday(birthDate: string, now: Date = new Date()): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);
  if (!m) return false;
  const month = Number(m[2]);
  let day = Number(m[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return false;
  if (month === 2 && day === 29 && !isLeap(now.getFullYear())) day = 28;
  return now.getMonth() + 1 === month && now.getDate() === day;
}

/** 'YYYY-MM-DD' from the database -> a local Date, or null when blank, malformed or not a real calendar date. */
export function fromBirthDateString(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  return date.getFullYear() === y && date.getMonth() === mo - 1 && date.getDate() === d ? date : null;
}

export function firstName(fullName: string | null | undefined): string {
  return (fullName ?? '').trim().split(/\s+/)[0] ?? '';
}
