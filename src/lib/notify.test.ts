import { publish } from './notify';
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
