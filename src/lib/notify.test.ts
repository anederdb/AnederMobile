import { describePublish, publish } from './notify';
import { supabase } from './supabase';

jest.mock('./supabase', () => ({ supabase: { functions: { invoke: jest.fn() } } }));

const invoke = supabase.functions.invoke as jest.Mock;
const base = { title: 'Genel Kurul', body: '21.12.2026 10:30 · Ankara', eventId: 'ev1' };

beforeEach(() => invoke.mockReset());

describe('publish', () => {
  it('sends push and email when both are on; eventId goes to push only', async () => {
    invoke.mockImplementation(async (name: string) => ({ data: { sent: 3, failed: 0 }, error: null, name }));
    const result = await publish({ ...base, push: true, email: true });
    expect(invoke).toHaveBeenCalledTimes(2);
    expect(invoke).toHaveBeenCalledWith('send-push', { body: { title: 'Genel Kurul', body: base.body, eventId: 'ev1' } });
    expect(invoke).toHaveBeenCalledWith('send-email', { body: { subject: 'Genel Kurul', text: base.body } });
    expect(result).toEqual({ push: { sent: 3, failed: 0 }, email: { sent: 3, failed: 0 }, errors: [] });
  });

  it('keeps the email result when push fails, and reports the push error', async () => {
    invoke.mockImplementation(async (name: string) =>
      name === 'send-push' ? { data: null, error: new Error('boom') } : { data: { sent: 2, failed: 1 }, error: null },
    );
    const result = await publish({ ...base, push: true, email: true });
    expect(result.push).toBeNull();
    expect(result.email).toEqual({ sent: 2, failed: 1 });
    expect(result.errors).toEqual(['push']);
  });

  it('never throws, even when invoke rejects', async () => {
    invoke.mockRejectedValue(new Error('network'));
    const result = await publish({ ...base, push: true, email: true });
    expect(result.errors.sort()).toEqual(['email', 'push']);
  });

  it('sends nothing when both channels are off', async () => {
    const result = await publish({ ...base, push: false, email: false });
    expect(invoke).not.toHaveBeenCalled();
    expect(result).toEqual({ push: null, email: null, errors: [] });
  });

  it('treats zero recipients as a result, not an error', async () => {
    invoke.mockResolvedValue({ data: { sent: 0, failed: 0 }, error: null });
    const result = await publish({ ...base, push: true, email: false });
    expect(result.push).toEqual({ sent: 0, failed: 0 });
    expect(result.errors).toEqual([]);
  });
});

const labels = { push: 'Bildirim', email: 'E-posta', failed: 'gönderilemedi', none: 'alıcı yok' };

describe('describePublish', () => {
  it('says "no recipients" when nothing was sent and nothing failed', () => {
    expect(describePublish({ push: { sent: 0, failed: 0 }, email: null, errors: [] }, labels)).toBe('Bildirim: alıcı yok');
  });

  it('says "failed" when everything failed, not "0"', () => {
    expect(describePublish({ push: null, email: { sent: 0, failed: 5 }, errors: [] }, labels)).toBe('E-posta: gönderilemedi (5)');
  });

  it('shows partial failures next to the sent count', () => {
    expect(describePublish({ push: { sent: 8, failed: 2 }, email: null, errors: [] }, labels)).toBe('Bildirim: 8 (2 gönderilemedi)');
  });

  it('reports a channel that errored outright', () => {
    expect(describePublish({ push: null, email: null, errors: ['push'] }, labels)).toBe('Bildirim: gönderilemedi');
  });
});

describe('publish limits', () => {
  it('shortens long push text to what send-push accepts (title 100, body 500) but not the email', async () => {
    invoke.mockResolvedValue({ data: { sent: 1, failed: 0 }, error: null });
    await publish({ title: 'T'.repeat(150), body: 'B'.repeat(900), push: true, email: true });
    const push = invoke.mock.calls.find((c) => c[0] === 'send-push')![1].body;
    const email = invoke.mock.calls.find((c) => c[0] === 'send-email')![1].body;
    expect(push.title.length).toBe(100);
    expect(push.body.length).toBe(500);
    expect(email.text.length).toBe(900);
  });
});
