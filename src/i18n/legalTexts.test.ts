import { LEGAL_DRAFT_NOTICE, LEGAL_KEYS, LEGAL_PAGES } from './legalTexts';

const allText = (key: (typeof LEGAL_KEYS)[number]) =>
  LEGAL_PAGES[key].sections.map((s) => `${s.heading} ${s.body}`).join(' ');

describe('legal texts', () => {
  it('has the three pages', () => {
    expect([...LEGAL_KEYS].sort()).toEqual(['acik-riza', 'aydinlatma', 'kullanim-sartlari']);
  });

  it.each(LEGAL_KEYS)('%s has a title and at least 4 non-empty sections', (key) => {
    const page = LEGAL_PAGES[key];
    expect(page.title.trim()).not.toBe('');
    expect(page.sections.length).toBeGreaterThanOrEqual(4);
    for (const s of page.sections) {
      expect(s.heading.trim()).not.toBe('');
      expect(s.body.trim()).not.toBe('');
    }
  });

  it('the aydınlatma text cites KVKK (6698) and explains the date of birth', () => {
    expect(allText('aydinlatma')).toMatch(/6698/);
    expect(allText('aydinlatma')).toMatch(/doğum tarihi/i);
  });

  it('the açık rıza text is about e-mail and birthday messages', () => {
    expect(allText('acik-riza')).toMatch(/e-posta/i);
    expect(allText('acik-riza')).toMatch(/doğum/i);
  });

  it('every page can show the draft notice', () => {
    expect(LEGAL_DRAFT_NOTICE.trim()).not.toBe('');
  });
});
