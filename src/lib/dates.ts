const pad = (n: number) => String(n).padStart(2, '0');

export function formatTrDateTime(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MONTHS = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

/** Pieces for a calendar-style date block: day "5", month "Oca", time "09:30". */
export function trDateParts(iso: string): { day: string; month: string; time: string } {
  const d = new Date(iso);
  return { day: String(d.getDate()), month: MONTHS[d.getMonth()], time: `${pad(d.getHours())}:${pad(d.getMinutes())}` };
}
