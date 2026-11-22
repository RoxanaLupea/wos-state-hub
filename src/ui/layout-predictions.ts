// The dates scroll as one sheet, like a spreadsheet: one scroll down moves every
// column together, under date heads that stay at the top. This state's group sits at
// a different depth on each date, so each column gets space above its rows that lines
// the groups up across the dates, and the sheet opens with the group in view.

// How many ranges stay visible above the group this state is in. Near the top,
// where it is easy to read, but not pinned to the edge.
const ROWS_ABOVE = 2;

export function layoutPredictions(root: ParentNode): void {
  const strip = root.querySelector<HTMLElement>('.prediction-dates');
  if (!strip) return;
  // On a phone the page itself is not a fixed height, so the sheet is given the rest
  // of the screen; it then scrolls on its own, both ways, like on a computer.
  if (window.innerWidth < 1000) {
    strip.style.height = '';
    const top = strip.getBoundingClientRect().top + window.scrollY;
    strip.style.height = Math.max(240, window.innerHeight - top - 8) + 'px';
  }
  const openAt = layoutStrip(strip, root);

  const columns = Array.from(strip.querySelectorAll<HTMLElement>('.date-block-scroll'));
  // Both moves at once and without the strip's smooth scrolling: a smooth move down
  // would cancel the one across, and the strip would stay on the oldest dates.
  const openOn = (top: number) => strip.scrollTo({ left: openAt, top, behavior: 'instant' });
  if (!columns.length) {
    openOn(0);
    return;
  }

  // How far down its own rows each column's opening place is.
  const heads = strip.querySelector<HTMLElement>('.date-block-top');
  const roomBelowHeads = strip.clientHeight - (heads?.offsetHeight ?? 0);
  const openingOf = new Map<HTMLElement, number>();
  for (const column of columns) {
    column.style.paddingTop = '0px';
    openingOf.set(column, openingPlace(column, roomBelowHeads));
  }
  const deepest = Math.max(...Array.from(openingOf.values()));
  for (const column of columns) {
    column.style.paddingTop = (deepest - (openingOf.get(column) ?? 0)) + 'px';
  }
  openOn(deepest);
}

// How far down a column's rows its opening place is: the whole group this state is
// in, with a couple of ranges above it when there is room for both. Without such a
// group the column opens at its top.
function openingPlace(column: HTMLElement, room: number): number {
  const rows = Array.from(column.querySelectorAll<HTMLElement>('.group-row'));
  const inOurGroup = (row: HTMLElement) =>
    row.classList.contains('ours') || row.classList.contains('is-us');
  const firstIndex = rows.findIndex(inOurGroup);
  if (firstIndex < 0) return 0;

  let lastIndex = firstIndex;
  while (lastIndex + 1 < rows.length && inOurGroup(rows[lastIndex + 1])) lastIndex += 1;

  // Measured against the column's own top, whichever element a row is placed from.
  const columnTop = column.getBoundingClientRect().top;
  const topOf = (row: HTMLElement) => row.getBoundingClientRect().top - columnTop;
  const groupTop = topOf(rows[firstIndex]);
  const groupBottom = topOf(rows[lastIndex]) + rows[lastIndex].offsetHeight;

  // Take as many of the ranges above as still leave the whole group showing.
  for (let above = ROWS_ABOVE; above >= 1; above -= 1) {
    const start = topOf(rows[Math.max(0, firstIndex - above)]);
    if (groupBottom - start <= room) return Math.max(0, start);
  }
  return Math.max(0, groupTop);
}

// The strip of dates moves sideways: dragged with the mouse, scrolled with a
// trackpad or Shift and the wheel, or with the arrow keys. It is the only way across
// without a mouse that scrolls both ways, so it does not rely on one.
// Returns where across the strip opens.
function layoutStrip(strip: HTMLElement, root: ParentNode): number {
  // Open on the transfer that is next, a peek in from the left so the one before it
  // shows at the edge.
  const peek = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
  const next = strip.querySelector<HTMLElement>('[data-next-transfer]');
  const openAt = next ? Math.max(0, next.offsetLeft - peek) : 0;

  // How far the pointer has to move before it counts as a drag rather than a click.
  const DRAG_THRESHOLD = 4;

  let pressedAt = 0;
  let scrollAtPress = 0;
  let isDragging = false;

  strip.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    pressedAt = event.clientX;
    scrollAtPress = strip.scrollLeft;
    isDragging = false;
  });

  strip.addEventListener('pointermove', event => {
    if (!pressedAt) return;
    const moved = event.clientX - pressedAt;
    if (!isDragging && Math.abs(moved) < DRAG_THRESHOLD) return;
    if (!isDragging) {
      isDragging = true;
      strip.classList.add('dragging');
      strip.setPointerCapture(event.pointerId);
    }
    strip.scrollLeft = scrollAtPress - moved;
    showStripFades(strip);
  });

  const letGo = () => {
    pressedAt = 0;
    if (!isDragging) return;
    isDragging = false;
    // Snapping comes back on, which settles the strip on whole columns again.
    strip.classList.remove('dragging');
  };
  strip.addEventListener('pointerup', letGo);
  strip.addEventListener('pointercancel', letGo);
  // A drag that ends over a row must not also count as a click on that row.
  strip.addEventListener('click', event => {
    if (strip.classList.contains('dragging')) event.stopPropagation();
  }, true);

  strip.addEventListener('scroll', () => showStripFades(strip), { passive: true });
  showStripFades(strip);

  const back = root.querySelector<HTMLElement>('[data-prediction-back]');
  if (back && next) {
    back.addEventListener('click', () => strip.scrollTo({ left: openAt, behavior: 'smooth' }));
    const place = () => placeWayBack(back, strip, next);
    strip.addEventListener('scroll', place, { passive: true });
    // Once the strip has opened on the next transfer.
    requestAnimationFrame(place);
  }
  return openAt;
}

// The way back to the next transfer: hidden while that date is on screen; otherwise
// shown, its arrow pointing to the side the date went off.
function placeWayBack(back: HTMLElement, strip: HTMLElement, next: HTMLElement): void {
  const stripBox = strip.getBoundingClientRect();
  const nextBox = next.getBoundingClientRect();
  const isLeft = nextBox.right < stripBox.left + 24;
  const isRight = nextBox.left > stripBox.right - 24;
  back.hidden = !isLeft && !isRight;
  back.classList.toggle('on-left', isLeft);
  back.classList.toggle('on-right', isRight);
}

function showStripFades(strip: HTMLElement): void {
  const canGoLeft = strip.scrollLeft > 1;
  const canGoRight = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
  strip.classList.toggle('can-left', canGoLeft);
  strip.classList.toggle('can-right', canGoRight);
}
