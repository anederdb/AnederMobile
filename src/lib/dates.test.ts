import { formatTrDateTime, parseTrDateTime } from './dates';

describe('parseTrDateTime', () => {
  it('parses GG.AA.YYYY SS:DD into an ISO string', () => {
    const iso = parseTrDateTime('21.12.2023 13:04');
    expect(iso).not.toBeNull();
    const d = new Date(iso!);
    expect([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()]).toEqual([2023, 12, 21, 13, 4]);
  });

  it('round-trips through formatTrDateTime', () => {
    expect(formatTrDateTime(parseTrDateTime('05.01.2024 09:30')!)).toBe('05.01.2024 09:30');
  });

  it.each(['', '21/12/2023 13:04', '31.02.2024 10:00', '21.12.2023', '21.12.2023 25:00', '1.1.2024 10:00'])(
    'rejects %p',
    (input) => {
      expect(parseTrDateTime(input)).toBeNull();
    },
  );
});
