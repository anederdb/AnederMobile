import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const authHeader = req.headers.get('Authorization') ?? '';
  const asCaller = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await asCaller.auth.getUser();
  if (error || !data.user) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: cors });
  }

  // Cascades remove profile, firms, listings and push tokens.
  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { error: delError } = await admin.auth.admin.deleteUser(data.user.id);
  if (delError) {
    return new Response(JSON.stringify({ error: delError.message }), { status: 500, headers: cors });
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { ...cors, 'Content-Type': 'application/json' } });
});
