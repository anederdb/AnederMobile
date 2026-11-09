import { buildEventShareText, SITE_URL } from './share';

const base = { title: 'Genel Kurul', starts_at: '2026-12-21T10:30:00', location: 'Ankara Palas', description: 'Tüm üyeler davetlidir.' };

describe('buildEventShareText', () => {
  it('includes title, date and time, place, description and the site link', () => {
    const text = buildEventShareText(base);
    expect(text).toContain('Genel Kurul');
    expect(text).toContain('21.12.2026 10:30');
    expect(text).toContain('Ankara Palas');
    expect(text).toContain('Tüm üyeler davetlidir.');
    expect(text.trim().endsWith(SITE_URL)).toBe(true);
  });

  it('leaves out missing parts without printing null', () => {
    const text = buildEventShareText({ ...base, location: null, description: null });
    expect(text).not.toMatch(/null|undefined/);
    expect(text).not.toContain('Ankara Palas');
    expect(text).toContain('Genel Kurul');
  });
});
