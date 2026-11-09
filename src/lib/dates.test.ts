import { formatTrDateTime } from './dates';

describe('formatTrDateTime', () => {
  it('formats a local ISO time as GG.AA.YYYY SS:DD', () => {
    expect(formatTrDateTime('2024-01-05T09:30:00')).toBe('05.01.2024 09:30');
  });
});
