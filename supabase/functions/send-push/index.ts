import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// Admin-only: sends { title, body, eventId? } to every approved member's registered devices.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth, error: authError } = await asCaller.auth.getUser();
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: me } = await admin.from('profiles').select('role, status').eq('id', auth.user.id).maybeSingle();
  if (me?.role !== 'admin' || me?.status !== 'approved') return json({ error: 'forbidden' }, 403);

  const { title, body, eventId } = await req.json().catch(() => ({}));
  if (typeof title !== 'string' || !title.trim() || title.length > 100) return json({ error: 'invalid title' }, 400);
  if (typeof body !== 'string' || !body.trim() || body.length > 500) return json({ error: 'invalid body' }, 400);

  const { data: rows, error: tokenError } = await admin
    .from('push_tokens')
    .select('token, profiles!inner(status)')
    .eq('profiles.status', 'approved');
  if (tokenError) return json({ error: tokenError.message }, 500);
  const tokens = (rows ?? []).map((r: { token: string }) => r.token);

  let sent = 0;
  let failed = 0;
  const dead: string[] = [];
  for (let i = 0; i < tokens.length; i += 100) {
    const batch = tokens.slice(i, i + 100);
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(
        batch.map((to: string) => ({ to, title: title.trim(), body: body.trim(), sound: 'default', data: { eventId } })),
      ),
    });
    const { data: tickets } = await res.json();
    (tickets ?? []).forEach((t: { status: string; details?: { error?: string } }, idx: number) => {
      if (t.status === 'ok') sent++;
      else {
        failed++;
        if (t.details?.error === 'DeviceNotRegistered') dead.push(batch[idx]);
      }
    });
  }
  if (dead.length) await admin.from('push_tokens').delete().in('token', dead);

  return json({ sent, failed, removed: dead.length });
});
