import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bigGroupsOf, followsOf, furnaceCapText, generationText, groupHolds,
  groupOfState, type TransferGroup
} from '../src/data/transfer-rules.ts';

function group(bits: {
  from: number; to: number; generation?: number | null; cap?: number | null;
}): TransferGroup {
  return {
    id: `${bits.from}-${bits.to}`, transferDate: '2026-11-23',
    fromState: bits.from, toState: bits.to,
    generation: bits.generation ?? 12, furnaceCapUpgrades: bits.cap ?? 80
  };
}

test('the furnace ladder reads the way players say it', () => {
  assert.equal(furnaceCapText(30), 'Furnace 30');
  assert.equal(furnaceCapText(35), 'FC1');
  assert.equal(furnaceCapText(55), 'FC5');
  assert.equal(furnaceCapText(80), 'FC10');
  // The two unlocks that sit between FC5 and FC6 are positions, not upgrade counts.
  assert.equal(furnaceCapText(56), 'FC5 · Red Chief Gear');
  assert.equal(furnaceCapText(57), 'FC5 · War Academy');
  assert.equal(furnaceCapText(null), '');
});

test('a generation reads as the game writes it', () => {
  assert.equal(generationText(11), 'Gen 11');
  assert.equal(generationText(null), '');
});

test('a state is found inside its group', () => {
  const one = group({ from: 1400, to: 1500 });
  assert.ok(groupHolds(one, 1458));
  assert.ok(groupHolds(one, 1400));
  assert.ok(groupHolds(one, 1500));
  assert.ok(!groupHolds(one, 1501));
});

test('ranges that touch and share a generation become one big group', () => {
  const big = bigGroupsOf([
    group({ from: 1400, to: 1450 }),
    group({ from: 1451, to: 1500 }),
    group({ from: 1501, to: 1550, generation: 11 })
  ]);
  assert.equal(big.length, 2, 'the first two join, the third has another generation');
  assert.deepEqual([big[0].fromState, big[0].toState], [1400, 1500]);
  assert.equal(big[0].parts.length, 2, 'the big group remembers the ranges it came from');
  assert.deepEqual([big[1].fromState, big[1].toState], [1501, 1550]);
});

test('a furnace cap change splits the group', () => {
  // A player can only move to a state with the same content released as their own,
  // so the cap has to match as well as the generation. On 12 Oct 2025 Gen 7 runs
  // from 1183 to 1552, but 1183-1366 is FC10 and 1367-1552 is FC8: two groups.
  const big = bigGroupsOf([
    group({ from: 1183, to: 1240, generation: 7, cap: 80 }),
    group({ from: 1241, to: 1308, generation: 7, cap: 80 }),
    group({ from: 1309, to: 1366, generation: 7, cap: 80 }),
    group({ from: 1367, to: 1427, generation: 7, cap: 70 }),
    group({ from: 1428, to: 1491, generation: 7, cap: 70 }),
    group({ from: 1492, to: 1552, generation: 7, cap: 70 }),
    group({ from: 1553, to: 1600, generation: 6, cap: 70 })
  ]);
  assert.equal(big.length, 3);
  assert.deepEqual([big[0].fromState, big[0].toState], [1183, 1366]);
  assert.equal(furnaceCapText(big[0].furnaceCapUpgrades), 'FC10');
  assert.deepEqual([big[1].fromState, big[1].toState], [1367, 1552]);
  assert.equal(furnaceCapText(big[1].furnaceCapUpgrades), 'FC8');
});

test('a skipped state number does not split a group', () => {
  // The list leaves out the states that no longer exist (1183 to 1189, say). The
  // ranges on either side are still one group, because the generation is the same.
  const big = bigGroupsOf([
    group({ from: 1124, to: 1182, generation: 12 }),
    group({ from: 1190, to: 1240, generation: 12 }),
    group({ from: 1241, to: 1308, generation: 12 })
  ]);
  assert.equal(big.length, 1);
  assert.deepEqual([big[0].fromState, big[0].toState], [1124, 1308]);
});

test('ranges out of order are still gathered', () => {
  const big = bigGroupsOf([
    group({ from: 1451, to: 1500 }),
    group({ from: 1400, to: 1450 })
  ]);
  assert.equal(big.length, 1);
  assert.deepEqual([big[0].fromState, big[0].toState], [1400, 1500]);
});

test('a transfer follows whichever battle was the day before', () => {
  const svsBattles = new Set([100, 128]);
  const sunfires = new Set([114, 142]);
  assert.equal(followsOf(101, svsBattles, sunfires), 'svs');
  assert.equal(followsOf(115, svsBattles, sunfires), 'sunfire');
  assert.equal(followsOf(143, svsBattles, sunfires), 'sunfire');
  assert.equal(followsOf(120, svsBattles, sunfires), 'neither');
});

test('a state is found in the one group it belongs to', () => {
  const big = bigGroupsOf([
    group({ from: 1183, to: 1300, generation: 7 }),
    group({ from: 1301, to: 1552, generation: 7 }),
    group({ from: 1553, to: 1700, generation: 6 })
  ]);
  assert.deepEqual(
    [groupOfState(big, 1458)?.fromState, groupOfState(big, 1458)?.toState], [1183, 1552]);
  assert.equal(groupOfState(big, 9999), undefined);
});
