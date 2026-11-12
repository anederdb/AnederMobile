export type RsvpStatus = 'going' | 'not_going';

/** What a tap on one of the two buttons does: set it, switch to it, or clear it when it is already the answer. */
export function nextRsvp(current: RsvpStatus | null, tapped: RsvpStatus): RsvpStatus | null {
  return current === tapped ? null : tapped;
}

/** Answers are accepted until the event starts (the database enforces the same rule). */
export function canRsvp(startsAt: string, now: number = Date.now()): boolean {
  return new Date(startsAt).getTime() > now;
}

/** Splits members into going / not going / no reply, keeping the members' own order. */
export function groupRsvps<M extends { id: string }>(
  members: M[],
  rsvps: { member_id: string; status: RsvpStatus }[],
): { going: M[]; notGoing: M[]; noReply: M[] } {
  const answer = new Map(rsvps.map((r) => [r.member_id, r.status]));
  const out = { going: [] as M[], notGoing: [] as M[], noReply: [] as M[] };
  for (const m of members) {
    const status = answer.get(m.id);
    (status === 'going' ? out.going : status === 'not_going' ? out.notGoing : out.noReply).push(m);
  }
  return out;
}
