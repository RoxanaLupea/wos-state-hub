import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

// A style rule that uses a colour or size name nobody defined is thrown away by the
// browser, and the whole rule goes with it. That is how the month grid lost its
// seven columns once, so every name used is checked against the names defined.

function filesUnder(folder: string): string[] {
  return readdirSync(folder).flatMap((entry: string) => {
    const path = join(folder, entry);
    return statSync(path).isDirectory() ? filesUnder(path) : [path];
  });
}

test('every colour and size name used in the styles is defined', () => {
  const files = filesUnder('src').filter(path => path.endsWith('.css') || path.endsWith('.ts'));
  const defined = new Set<string>();
  const used: { name: string; file: string }[] = [];

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    // A name is defined wherever it is given a value, which can be anywhere in a
    // rule, not only at the start of a line.
    for (const match of text.matchAll(/(--[a-z0-9-]+)\s*:/g)) defined.add(match[1]);
    // A name written as var(--thing, something) carries its own stand-in value, so it
    // does not have to be defined.
    for (const match of text.matchAll(/var\(\s*(--[a-z0-9-]+)\s*\)/g)) {
      used.push({ name: match[1], file });
    }
  }

  const missing = used.filter(one => !defined.has(one.name));
  assert.deepEqual(missing, [], 'these names are used but never defined');
});
