import { canRsvp, groupRsvps, nextRsvp } from './rsvp';

describe('nextRsvp', () => {
  it('records the tapped answer when there is none yet', () => {
    expect(nextRsvp(null, 'going')).toBe('going');
    expect(nextRsvp(null, 'not_going')).toBe('not_going');
  });

  it('switches to the other answer', () => {
    expect(nextRsvp('going', 'not_going')).toBe('not_going');
    expect(nextRsvp('not_going', 'going')).toBe('going');
  });

  it('tapping the current answer again clears it', () => {
    expect(nextRsvp('going', 'going')).toBeNull();
    expect(nextRsvp('not_going', 'not_going')).toBeNull();
  });
});

describe('canRsvp', () => {
  const now = new Date('2026-12-01T12:00:00').getTime();

  it('is open until the event starts', () => {
    expect(canRsvp('2026-12-01T12:00:01', now)).toBe(true);
    expect(canRsvp('2027-01-01T10:00:00', now)).toBe(true);
  });

  it('is closed once the event has started', () => {
    expect(canRsvp('2026-12-01T12:00:00', now)).toBe(false);
    expect(canRsvp('2026-11-30T10:00:00', now)).toBe(false);
  });
});

describe('groupRsvps', () => {
  const members = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];

  it('splits members by answer and keeps the member order', () => {
    const rsvps = [
      { member_id: 'd', status: 'going' as const },
      { member_id: 'b', status: 'not_going' as const },
      { member_id: 'a', status: 'going' as const },
    ];
    expect(groupRsvps(members, rsvps)).toEqual({
      going: [{ id: 'a' }, { id: 'd' }],
      notGoing: [{ id: 'b' }],
      noReply: [{ id: 'c' }],
    });
  });

  it('puts everyone in noReply when nobody answered', () => {
    expect(groupRsvps(members, [])).toEqual({ going: [], notGoing: [], noReply: members });
  });

  it('ignores answers from people who are not in the member list', () => {
    expect(groupRsvps(members, [{ member_id: 'zzz', status: 'going' as const }]).going).toEqual([]);
  });
});
