import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  timesOf, phaseOf, countdownText, currentTransferDate, specialsOf, capOf, statusOf, groupColours, GROUP_COLOURS,
  type Invite, type Transfer
} from '../src/data/invite-rules.ts';

const at = (text: string) => Date.parse(text);

function invite(bits: Partial<Invite>): Invite {
  return {
    id: 1, windowId: 1, playerId: '1', list: 'ordinary', position: 1, setStatus: null, transferredAt: null, groupNumber: null,
    contactTag: '', contactName: '', contactPlayerId: '', name: '', avatar: null, power: null, state: null, furnace: null,
    kills: null, labyrinth: null, migrantScore: null, troops: {}, skills: {}, onSite: false, ...bits
  };
}

function transfer(id: number, date: string, bits: Partial<Transfer> = {}): Transfer {
  return { id, date, stateType: 'ordinary', powerCap: null, managerId: '', managerName: '', managerAvatar: null, managerAlliance: '', ...bits };
}

test('the phases follow the calendar: Pre-Transfer 3 days, invitation 2, open 2', () => {
  const times = timesOf('2026-12-06');
  assert.equal(times.invitation, at('2026-12-09T00:00:00Z'));
  assert.equal(times.open, at('2026-12-11T00:00:00Z'));
  assert.equal(times.end, at('2026-12-13T00:00:00Z'));
  // The list stays until the Monday after the transfer ends.
  assert.equal(times.swap, at('2026-12-14T00:00:00Z'));
  assert.equal(phaseOf('2026-12-06', at('2026-12-08T23:59:00Z')), 'coming');
  assert.equal(phaseOf('2026-12-06', at('2026-12-10T08:40:00Z')), 'invitation');
  assert.equal(phaseOf('2026-12-06', at('2026-12-12T08:40:00Z')), 'open');
  assert.equal(phaseOf('2026-12-06', at('2026-12-13T09:00:00Z')), 'over');
});

test('the current transfer changes on the Monday after the last one ended', () => {
  const dates = ['2026-11-08', '2026-12-06', '2027-01-03'];
  assert.equal(currentTransferDate(dates, at('2026-11-15T12:00:00Z')), '2026-11-08');
  assert.equal(currentTransferDate(dates, at('2026-11-16T00:00:00Z')), '2026-12-06');
  assert.equal(currentTransferDate(dates, at('2026-12-13T23:00:00Z')), '2026-12-06');
  assert.equal(currentTransferDate(dates, at('2026-12-14T00:00:00Z')), '2027-01-03');
});

test('the countdown is written as days, hours and minutes', () => {
  assert.equal(countdownText((1 * 1440 + 14 * 60 + 20) * 60000), '1d 14h 20m');
  assert.equal(countdownText((15 * 60 + 19) * 60000 + 30000), '15h 19m');
  assert.equal(countdownText(5 * 60000), '5m');
});

test('special invites: 3 on 6 Dec 2026, one back each month, at most 3', () => {
  const dates = ['2026-12-06', '2027-01-03', '2027-01-31', '2027-02-28'];
  const transfers = [transfer(1, '2026-12-06'), transfer(2, '2027-01-03')];
  const used = [
    invite({ id: 1, windowId: 1, list: 'special', setStatus: 'transferred' }),
    invite({ id: 2, windowId: 1, list: 'special', setStatus: 'transferred' }),
    invite({ id: 3, windowId: 1, list: 'special', setStatus: 'sent' })
  ];
  assert.deepEqual(specialsOf('2026-12-06', dates, transfers, used), { count: 3, restoredOn: null });
  // Two used in December, one back on 1 January.
  assert.equal(specialsOf('2027-01-03', dates, transfers, used).count, 2);
  // Nothing used in January; 1 February comes during the 31 January transfer, so it counts with its date.
  assert.deepEqual(specialsOf('2027-01-31', dates, transfers, used), { count: 3, restoredOn: '2027-02-01' });
  // The bank never holds more than 3, and a restore that adds nothing has no date.
  assert.deepEqual(specialsOf('2027-02-28', dates, transfers, used), { count: 3, restoredOn: null });
  // A leading state has none.
  assert.equal(specialsOf('2027-01-03', dates, [transfer(2, '2027-01-03', { stateType: 'leading' })], []).count, 0);
});

test('the cap is the one recorded, or the estimate for the generation', () => {
  assert.equal(capOf(undefined, 12), 1e9);
  assert.equal(capOf(undefined, 11), 930e6);
  assert.equal(capOf(transfer(1, '2026-12-06', { powerCap: 1.05e9 }), 12), 1.05e9);
  assert.equal(capOf(undefined, null), null);
});

test('Ready or Over cap follow the power; a special invite is not held to the cap', () => {
  assert.equal(statusOf(invite({ power: 1.1e9 }), 1e9), 'over');
  assert.equal(statusOf(invite({ power: 0.9e9 }), 1e9), 'ready');
  assert.equal(statusOf(invite({ power: 2e9, list: 'special' }), 1e9), 'ready');
  assert.equal(statusOf(invite({ power: 1.1e9, setStatus: 'sent' }), 1e9), 'sent');
});

test('groups take their colours in the order they first appear', () => {
  const colours = groupColours([invite({ groupNumber: 7 }), invite({ groupNumber: null }), invite({ groupNumber: 2 }), invite({ groupNumber: 7 })]);
  assert.equal(colours.get(7), GROUP_COLOURS[0]);
  assert.equal(colours.get(2), GROUP_COLOURS[1]);
});
