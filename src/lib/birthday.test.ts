import { firstName, fromBirthDateString, isBirthdayToday, toBirthDateString } from './birthday';

describe('toBirthDateString', () => {
  const now = new Date(2026, 10, 13, 15, 30);

  it('formats a local date as YYYY-MM-DD', () => {
    expect(toBirthDateString(new Date(1990, 4, 7), now)).toBe('1990-05-07');
  });

  it('accepts today', () => {
    expect(toBirthDateString(new Date(2026, 10, 13, 9, 0), now)).toBe('2026-11-13');
  });

  it('rejects a date in the future', () => {
    expect(toBirthDateString(new Date(2026, 10, 14), now)).toBeNull();
    expect(toBirthDateString(new Date(2030, 0, 1), now)).toBeNull();
  });

  it('rejects dates before 1900', () => {
    expect(toBirthDateString(new Date(1899, 11, 31), now)).toBeNull();
    expect(toBirthDateString(new Date(1900, 0, 1), now)).toBe('1900-01-01');
  });

  it('rejects an invalid Date', () => {
    expect(toBirthDateString(new Date('nope'), now)).toBeNull();
  });
});

describe('isBirthdayToday', () => {
  it('is true on the day, from the first to the last second', () => {
    expect(isBirthdayToday('1990-05-07', new Date(2026, 4, 7, 0, 0, 1))).toBe(true);
    expect(isBirthdayToday('1990-05-07', new Date(2026, 4, 7, 23, 59, 59))).toBe(true);
  });

  it('is false the day before and the day after', () => {
    expect(isBirthdayToday('1990-05-07', new Date(2026, 4, 6, 23, 59, 59))).toBe(false);
    expect(isBirthdayToday('1990-05-07', new Date(2026, 4, 8, 0, 0, 0))).toBe(false);
  });

  it('is false in the same month on another day and on the same day in another month', () => {
    expect(isBirthdayToday('1990-05-07', new Date(2026, 4, 17))).toBe(false);
    expect(isBirthdayToday('1990-05-07', new Date(2026, 5, 7))).toBe(false);
  });

  it('celebrates 29 February on 28 February in a non-leap year', () => {
    expect(isBirthdayToday('2000-02-29', new Date(2026, 1, 28))).toBe(true);
    expect(isBirthdayToday('2000-02-29', new Date(2026, 2, 1))).toBe(false);
  });

  it('celebrates 29 February on 29 February in a leap year, not on the 28th', () => {
    expect(isBirthdayToday('2000-02-29', new Date(2028, 1, 29))).toBe(true);
    expect(isBirthdayToday('2000-02-29', new Date(2028, 1, 28))).toBe(false);
  });

  it('is false for anything that is not a YYYY-MM-DD date', () => {
    expect(isBirthdayToday('', new Date(2026, 4, 7))).toBe(false);
    expect(isBirthdayToday('07.05.1990', new Date(2026, 4, 7))).toBe(false);
    expect(isBirthdayToday('1990-13-07', new Date(2026, 4, 7))).toBe(false);
  });
});

describe('firstName', () => {
  it('returns the first word', () => {
    expect(firstName('Ayşe Nur Demir')).toBe('Ayşe');
  });

  it('trims and handles empty values', () => {
    expect(firstName('  Mehmet  Kaya ')).toBe('Mehmet');
    expect(firstName(null)).toBe('');
    expect(firstName('   ')).toBe('');
  });
});

describe('fromBirthDateString', () => {
  it('builds a local date, not a UTC one', () => {
    const d = fromBirthDateString('1990-05-07');
    expect([d?.getFullYear(), d?.getMonth(), d?.getDate()]).toEqual([1990, 4, 7]);
  });

  it('returns null for blank, malformed or impossible dates', () => {
    expect(fromBirthDateString(null)).toBeNull();
    expect(fromBirthDateString('')).toBeNull();
    expect(fromBirthDateString('07.05.1990')).toBeNull();
    expect(fromBirthDateString('1990-02-31')).toBeNull();
  });
});
