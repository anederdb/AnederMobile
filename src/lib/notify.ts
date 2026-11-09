import { supabase } from './supabase';

export type SendResult = { sent: number; failed: number };

export type PublishResult = {
  push: SendResult | null;
  email: SendResult | null;
  /** Channels that failed outright: 'push' and/or 'email'. */
  errors: ('push' | 'email')[];
};

type Options = {
  title: string;
  body: string;
  /** Longer text for the email; defaults to `body`. */
  emailText?: string;
  eventId?: string;
  push: boolean;
  email: boolean;
};

async function call(name: string, body: Record<string, unknown>): Promise<SendResult | null> {
  try {
    const { data, error } = await supabase.functions.invoke(name, { body });
    if (error || !data) return null;
    return { sent: Number(data.sent) || 0, failed: Number(data.failed) || 0 };
  } catch {
    return null;
  }
}

/** Sends the chosen channels after a post is saved. Never throws: a failed channel is reported, not raised. */
export async function publish(opts: Options): Promise<PublishResult> {
  const [push, email] = await Promise.all([
    opts.push ? call('send-push', { title: opts.title.slice(0, 100), body: opts.body.slice(0, 500), eventId: opts.eventId }) : null,
    opts.email ? call('send-email', { subject: opts.title, text: opts.emailText ?? opts.body }) : null,
  ]);
  const errors: PublishResult['errors'] = [];
  if (opts.push && !push) errors.push('push');
  if (opts.email && !email) errors.push('email');
  return { push, email, errors };
}

type Labels = { push: string; email: string; failed: string; none: string };

/** One line for the admin after publishing, e.g. "Bildirim: 12 · E-posta: gönderilemedi (3)". Never a bare "0". */
export function describePublish(r: PublishResult, labels: Labels): string {
  const part = (name: string, res: SendResult) => {
    if (res.sent === 0 && res.failed === 0) return `${name}: ${labels.none}`;
    if (res.sent === 0) return `${name}: ${labels.failed} (${res.failed})`;
    return `${name}: ${res.sent}${res.failed ? ` (${res.failed} ${labels.failed})` : ''}`;
  };
  const parts: string[] = [];
  if (r.push) parts.push(part(labels.push, r.push));
  if (r.email) parts.push(part(labels.email, r.email));
  for (const e of r.errors) parts.push(`${labels[e]}: ${labels.failed}`);
  return parts.join(' · ');
}
