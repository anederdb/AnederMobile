import { validateTraining } from './trainings';

describe('validateTraining', () => {
  it('requires a title', () => {
    expect(validateTraining({ title: '   ', videoUrl: 'https://youtu.be/abc.def', note: '' })).toEqual({ ok: false, error: 'title' });
  });

  it('keeps a valid video link', () => {
    expect(validateTraining({ title: 'Sözleşme eğitimi', videoUrl: 'https://youtu.be/abc.def', note: '' })).toEqual({
      ok: true,
      value: { title: 'Sözleşme eğitimi', video_url: 'https://youtu.be/abc.def', note: null },
    });
  });

  it('adds https:// to a link without a scheme', () => {
    const r = validateTraining({ title: 'Eğitim', videoUrl: 'youtube.com/watch?v=1', note: '' });
    expect(r).toEqual({ ok: true, value: { title: 'Eğitim', video_url: 'https://youtube.com/watch?v=1', note: null } });
  });

  it.each(['ftp://aneder.org/video', 'javascript:alert(1)', 'not a link'])('rejects the link %p', (videoUrl) => {
    expect(validateTraining({ title: 'Eğitim', videoUrl, note: '' })).toEqual({ ok: false, error: 'link' });
  });

  it('allows no link and no note', () => {
    expect(validateTraining({ title: 'Sadece not', videoUrl: '', note: '' })).toEqual({
      ok: true,
      value: { title: 'Sadece not', video_url: null, note: null },
    });
  });

  it('trims the title and the note', () => {
    expect(validateTraining({ title: '  Eğitim 1 ', videoUrl: '', note: '  Not metni \n' })).toEqual({
      ok: true,
      value: { title: 'Eğitim 1', video_url: null, note: 'Not metni' },
    });
  });
});
