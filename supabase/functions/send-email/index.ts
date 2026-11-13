import { createClient } from 'npm:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const FOOTER =
  '\n\n—\nANEDER üye bilgilendirmesi · info@aneder.org\nBu e-postaları almak istemiyorsanız uygulamada Profil → E-posta bildirimleri bölümünden kapatabilirsiniz.';

// Admin-only: emails { subject, text } to every approved member who agreed to ANEDER emails.
// One message per member (addresses are never shown to each other), sent through Resend.
// Secrets: RESEND_API_KEY (required), MAIL_FROM (default "ANEDER <info@aneder.org>").
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

  const { subject, text } = await req.json().catch(() => ({}));
  if (typeof subject !== 'string' || !subject.trim() || subject.length > 150) return json({ error: 'invalid subject' }, 400);
  if (typeof text !== 'string' || !text.trim() || text.length > 5000) return json({ error: 'invalid text' }, 400);

  const apiKey = Deno.env.get('RESEND_API_KEY');
  if (!apiKey) return json({ error: 'email is not configured' }, 500);
  const from = Deno.env.get('MAIL_FROM') ?? 'ANEDER <info@aneder.org>';

  const { data: members, error: memberError } = await admin
    .from('profiles')
    .select('id')
    .eq('status', 'approved')
    .eq('email_consent', true);
  if (memberError) return json({ error: memberError.message }, 500);
  const wanted = new Set((members ?? []).map((m: { id: string }) => m.id));

  // Addresses live in auth.users; page through them.
  const emails: string[] = [];
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return json({ error: error.message }, 500);
    for (const u of data.users) if (u.email && wanted.has(u.id)) emails.push(u.email);
    if (data.users.length < 1000) break;
  }

  let sent = 0;
  let failed = 0;
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100);
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(batch.map((to) => ({ from, to: [to], subject: subject.trim(), text: text.trim() + FOOTER }))),
    });
    if (res.ok) sent += batch.length;
    else failed += batch.length;
  }

  return json({ sent, failed });
});
