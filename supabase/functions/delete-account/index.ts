import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

// No body: the caller deletes their own account.
// { userId }: an approved admin rejects (deletes) a pending member.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const asCaller = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data, error } = await asCaller.auth.getUser();
  if (error || !data.user) return json({ error: 'unauthorized' }, 401);

  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const body = await req.json().catch(() => ({}));
  let targetId = data.user.id;

  if (body?.userId && body.userId !== data.user.id) {
    const { data: me } = await admin.from('profiles').select('role, status').eq('id', data.user.id).maybeSingle();
    if (me?.role !== 'admin' || me?.status !== 'approved') return json({ error: 'forbidden' }, 403);
    const { data: target } = await admin.from('profiles').select('status').eq('id', body.userId).maybeSingle();
    if (target?.status !== 'pending') return json({ error: 'only pending members can be rejected' }, 400);
    targetId = body.userId;
  }

  // Cascades remove profile, firms, listings and push tokens.
  const { error: delError } = await admin.auth.admin.deleteUser(targetId);
  if (delError) return json({ error: delError.message }, 500);
  return json({ ok: true });
});
