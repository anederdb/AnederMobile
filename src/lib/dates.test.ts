import { formatTrDateTime, trDateParts } from './dates';

describe('formatTrDateTime', () => {
  it('formats a local ISO time as GG.AA.YYYY SS:DD', () => {
    expect(formatTrDateTime('2024-01-05T09:30:00')).toBe('05.01.2024 09:30');
  });
});

describe('trDateParts', () => {
  it('splits a local ISO time into day, short Turkish month and time', () => {
    expect(trDateParts('2024-01-05T09:30:00')).toEqual({ day: '5', month: 'Oca', time: '09:30' });
    expect(trDateParts('2024-08-21T18:05:00')).toEqual({ day: '21', month: 'Ağu', time: '18:05' });
  });
});
