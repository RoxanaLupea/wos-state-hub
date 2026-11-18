import './ui/tokens.css';
import './ui/layout.css';
import { logoSvg } from './ui/logo.ts';

const STATE_NUMBER = '1458';

function start(): void {
  const app = document.getElementById('app');
  if (!app) throw new Error('The page is missing its #app element.');
  app.className = "app-shell";
  app.innerHTML = `
    <header class="top-bar glass">
      <div class="brand">${logoSvg(STATE_NUMBER, 34)}</div>
    </header>
    <main class="page">
      <p class="placeholder">The foundation is in place. Pages come next.</p>
    </main>`;
}

start();
