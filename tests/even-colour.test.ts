import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evenColour } from '../src/ui/even-colour.ts';

// An alliance colour keeps its tint and takes the sections' lightness and strength.
test('alliance colours are evened to the sections\' strength', () => {
  assert.equal(evenColour('#4A78D8'), '#93B4F5');
  assert.equal(evenColour('#D9483B'), '#ED9C90');
  // An academy's colour comes mixed with white; its main alliance's tint is kept.
  assert.equal(evenColour('color-mix(in srgb, #4A78D8 62%, white)'), '#93B4F5');
  assert.equal(evenColour('var(--accent)'), 'var(--accent)');
});
