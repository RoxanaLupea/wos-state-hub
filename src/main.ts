import './ui/tokens.css';
import './ui/layout.css';
import { logoSvg } from './ui/logo.ts';
import { isDatabaseConfigured } from './data/database.ts';
import { loadAlliances } from './data/alliances.ts';
import { loadMovedDates, loadSchedules } from './data/schedules.ts';
import { formatDate, nextRunsAcrossSchedules } from './calendar/schedule-dates.ts';
import { problemPanel, upcomingPanel } from './ui/upcoming-panel.ts';

const STATE_NUMBER = '1458';
// Enough runs to fill both groups on the panel, since several long events are
// usually under way at once.
const HOW_MANY_EVENTS_TO_FETCH = 30;

function pageFrame(contents: string): string {
  return `
    <header class="top-bar glass">
      <div class="brand">${logoSvg(STATE_NUMBER, 34)}</div>
    </header>
    <main class="page">${contents}</main>`;
}

async function buildUpcoming(): Promise<string> {
  if (!isDatabaseConfigured()) {
    return problemPanel(
      'The database address or key is missing. Copy .env.example to .env, fill in ' +
      'both values from the Supabase project, then restart the dev server.'
    );
  }

  // All three reads at once, since none of them depends on the others.
  const [alliances, schedules, movedDates] = await Promise.all([
    loadAlliances(),
    loadSchedules(),
    loadMovedDates()
  ]);

  const today = formatDate(Date.now());
  const coming = nextRunsAcrossSchedules(
    schedules, today, HOW_MANY_EVENTS_TO_FETCH, movedDates
  );

  return upcomingPanel(coming, today, alliances, {
    schedules: schedules.length,
    alliances: alliances.length
  });
}

async function start(): Promise<void> {
  const app = document.getElementById('app');
  if (!app) throw new Error('The page is missing its #app element.');
  app.className = 'app-shell';
  app.innerHTML = pageFrame('<p class="placeholder">Loading…</p>');

  try {
    app.innerHTML = pageFrame(await buildUpcoming());
  } catch (problem) {
    const message = problem instanceof Error ? problem.message : String(problem);
    app.innerHTML = pageFrame(problemPanel(message));
  }
}

void start();
