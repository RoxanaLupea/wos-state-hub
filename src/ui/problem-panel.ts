import './problem-panel.css';

// Anything that stopped the page loading, said plainly rather than left blank.
export function problemPanel(message: string): string {
  const safe = message
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  return `<section class="problem glass">
    <h2>Could not load</h2>
    <p>${safe}</p>
  </section>`;
}
