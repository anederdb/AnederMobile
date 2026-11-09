import { singleFlight } from './singleFlight';

describe('singleFlight', () => {
  it('ignores overlapping calls', async () => {
    let release!: (v: string) => void;
    const fn = jest.fn(() => new Promise<string>((r) => (release = r)));
    const guarded = singleFlight(fn);
    const first = guarded();
    const second = await guarded();
    expect(second).toBeUndefined();
    expect(fn).toHaveBeenCalledTimes(1);
    release('ok');
    expect(await first).toBe('ok');
  });

  it('runs again after the first call settles', async () => {
    const fn = jest.fn(async (n: number) => n * 2);
    const guarded = singleFlight(fn);
    expect(await guarded(1)).toBe(2);
    expect(await guarded(2)).toBe(4);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('releases the lock when fn rejects', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValueOnce('fine');
    const guarded = singleFlight(fn);
    await expect(guarded()).rejects.toThrow('boom');
    expect(await guarded()).toBe('fine');
  });
});
