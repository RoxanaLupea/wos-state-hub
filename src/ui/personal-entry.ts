// A player's own entry for one run of a personal event, as the old app kept it: the
// time they play it (Frostfire's slot, picked from the game's slots), their rank and a
// note. Only they see it.
import { rowForm, type Field } from './data-table.ts';
import { eventTypeById } from '../data/catalog.ts';
import { textFromDay } from '../calendar/days.ts';
import type { Occurrence } from '../calendar/occurrences.ts';
import type { Row } from '../data/records.ts';

export interface PersonalEntryOptions {
  occurrence: Occurrence;
  category: string;
  userId: string | null;
  // The person's entries, or null while they are being read.
  entries: Row[] | null;
}

export function personalEntryOf(entries: Row[], occurrence: Occurrence): Row | undefined {
  const originalDate = textFromDay(occurrence.originalDay);
  return entries.find(one => one.schedule_id === occurrence.scheduleId && one.original_date === originalDate);
}

export function personalEntryForm(options: PersonalEntryOptions): string {
  if (options.category !== 'personal' || !options.userId) return '';
  if (!options.entries) return '<p class="work-empty">Loading…</p>';
  const entry = personalEntryOf(options.entries, options.occurrence);
  const slots = (eventTypeById(options.occurrence.eventTypeId)?.slotTimes ?? '')
    .split(',').map(one => one.trim()).filter(Boolean);
  const time = entry?.my_time ? String(entry.my_time).slice(0, 5) : '';
  const fields: Field[] = [
    slots.length
      ? { name: 'my_time', label: 'Your slot (UTC)', kind: 'select', value: time,
          choices: [['', 'Not picked'], ...slots.map(slot => [slot, slot] as [string, string])] }
      : { name: 'my_time', label: 'Your time (UTC)', kind: 'text', value: time, placeholder: '00:00' },
    { name: 'rank', label: 'Your rank', kind: 'number', value: entry?.rank ?? '' },
    { name: 'note', label: 'Note', kind: 'textarea', value: entry?.note ?? '' }
  ];
  return rowForm({
    form: 'personal',
    key: [options.occurrence.scheduleId, textFromDay(options.occurrence.originalDay), entry ? String(entry.id) : ''].join('|'),
    title: 'Your entry for this run', fields
  });
}
