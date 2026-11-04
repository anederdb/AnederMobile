const TR_DATETIME = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, '0');

/** "GG.AA.YYYY SS:DD" (local time) -> ISO string, or null if malformed or not a real date. */
export function parseTrDateTime(input: string): string | null {
  const m = TR_DATETIME.exec(input.trim());
  if (!m) return null;
  const [day, month, year, hour, minute] = m.slice(1).map(Number);
  const d = new Date(year, month - 1, day, hour, minute);
  const real =
    d.getFullYear() === year && d.getMonth() === month - 1 && d.getDate() === day && d.getHours() === hour && d.getMinutes() === minute;
  return real ? d.toISOString() : null;
}

export function formatTrDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
