// The dates scroll as one sheet, like a spreadsheet: one scroll down moves every
// column together, under date heads that stay at the top. Across and down are two
// scrollers, so a swipe moves the sheet one way at a time. The range this state is in
// sits on the same line in every column, as in the sheet, and the sheet opens with
// our group in view.

// How many ranges stay visible above the group this state is in. Near the top,
// where it is easy to read, but not pinned to the edge.
const ROWS_ABOVE = 2;

export function layoutPredictions(root: ParentNode): void {
  const strip = root.querySelector<HTMLElement>('.prediction-dates');
  const sheet = strip?.querySelector<HTMLElement>('.prediction-sheet');
  if (!strip || !sheet) return;
  // On a phone the page itself is not a fixed height, so the sheet is given the rest
  // of the screen; it then scrolls on its own, both ways, like on a computer.
  // The visible height is taken, not the window's: a phone browser's bar at the bottom
  // can sit over part of the window, and the sheet and its button would end under it.
  if (window.innerWidth < 1000) {
    strip.style.height = '';
    const top = strip.getBoundingClientRect().top + window.scrollY;
    const visibleHeight = Math.min(window.innerHeight, window.visualViewport?.height ?? window.innerHeight);
    const below = pageSpaceBelow(strip);
    strip.style.height = Math.max(240, visibleHeight - top - below) + 'px';
  }
  placeSnapMarks(strip);
  const openAt = layoutStrip(strip, root);

  const columns = Array.from(sheet.querySelectorAll<HTMLElement>('.date-block-scroll'));
  const openOn = (top: number) => {
    strip.scrollLeft = openAt;
    sheet.scrollTop = top;
  };
  if (!columns.length) {
    openOn(0);
    return;
  }

  // Where our range is in each column, measured from the column's top.
  for (const column of columns) column.style.paddingTop = '0px';
  const ourRangeTop = new Map<HTMLElement, number>();
  for (const column of columns) {
    const ourRange = column.querySelector<HTMLElement>('.group-row.is-us');
    if (ourRange) ourRangeTop.set(column, ourRange.getBoundingClientRect().top - column.getBoundingClientRect().top);
  }
  if (!ourRangeTop.size) {
    openOn(0);
    return;
  }

  // A column with fewer lines above our range starts lower, by empty lines, so our
  // range is on the same line in every column. When every date has the same ranges
  // above it, as it does now, nothing is added.
  const lowest = Math.max(...Array.from(ourRangeTop.values()));
  const rowHeight = columns[0].querySelector<HTMLElement>('.group-row:not(.is-us)')?.offsetHeight ?? 0;
  for (const column of columns) {
    const top = ourRangeTop.get(column);
    const space = top === undefined ? 0 : Math.round(lowest - top);
    column.style.paddingTop = space + 'px';
    column.classList.toggle('starts-lower', space > 0);
    column.style.setProperty('--empty-space', space + 'px');
    if (rowHeight) column.style.setProperty('--empty-line', rowHeight + 'px');
  }

  // Opens with a couple of ranges above our group, in the column that needs the most
  // room for that, as long as our range itself stays in view.
  const headsHeight = sheet.querySelector<HTMLElement>('.date-block-top')?.offsetHeight ?? 0;
  const roomBelowHeads = sheet.clientHeight - headsHeight;
  let openingTop = lowest;
  for (const column of columns) {
    const space = parseFloat(column.style.paddingTop) || 0;
    openingTop = Math.min(openingTop, space + openingPlace(column, roomBelowHeads));
  }
  const ourRangeHeight = sheet.querySelector<HTMLElement>('.group-row.is-us')?.offsetHeight ?? 0;
  const groupTop = Math.max(0, openingTop, lowest + ourRangeHeight - roomBelowHeads);
  openOn(groupTop);

  // The way back to our range: shown while it is out of sight above or below, at that
  // edge, and it brings the sheet back to where it opened.
  const toGroup = root.querySelector<HTMLElement>('[data-prediction-group]');
  if (toGroup) {
    toGroup.addEventListener('click', () => sheet.scrollTo({ top: groupTop, behavior: 'smooth' }));
    const place = () => {
      const isAbove = lowest + ourRangeHeight <= sheet.scrollTop + 4;
      const isBelow = lowest >= sheet.scrollTop + roomBelowHeads - 4;
      toGroup.hidden = !isAbove && !isBelow;
      toGroup.classList.toggle('on-top', isAbove);
      // Just under the date heads, when it sits at the top.
      toGroup.style.top = isAbove ? (strip.offsetTop + headsHeight + 10) + 'px' : '';
    };
    sheet.addEventListener('scroll', place, { passive: true });
    place();
  }
}

// The places the strip settles on: one at the left edge of every date. The dates sit
// inside the sheet, which scrolls up and down, so the strip gets marks of its own.
function placeSnapMarks(strip: HTMLElement): void {
  for (const mark of Array.from(strip.querySelectorAll('.snap-mark'))) mark.remove();
  for (const column of Array.from(strip.querySelectorAll<HTMLElement>('.date-block'))) {
    const mark = document.createElement('div');
    mark.className = 'snap-mark';
    mark.style.left = column.offsetLeft + 'px';
    strip.appendChild(mark);
  }
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

  // Measured from where the rows start, below any empty lines added above them.
  const rowsTop = rows[0].getBoundingClientRect().top;
  const topOf = (row: HTMLElement) => row.getBoundingClientRect().top - rowsTop;
  const groupTop = topOf(rows[firstIndex]);
  const groupBottom = topOf(rows[lastIndex]) + rows[lastIndex].offsetHeight;

  // Take as many of the ranges above as still leave the whole group showing.
  for (let above = ROWS_ABOVE; above >= 1; above -= 1) {
    const start = topOf(rows[Math.max(0, firstIndex - above)]);
    if (groupBottom - start <= room) return Math.max(0, start);
  }
  return Math.max(0, groupTop);
}

// How much of the page lies under the strip, its padding included, so the page ends
// at the bottom of the screen instead of scrolling a little past it.
function pageSpaceBelow(strip: HTMLElement): number {
  const stripBottom = strip.getBoundingClientRect().bottom + window.scrollY;
  return Math.max(8, document.documentElement.scrollHeight - stripBottom);
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

  // Only a mouse is followed here. A finger already scrolls the strip by itself, and
  // moving it from here too made the two fight and the scroll slow and jumpy.
  strip.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' || event.button !== 0) return;
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
