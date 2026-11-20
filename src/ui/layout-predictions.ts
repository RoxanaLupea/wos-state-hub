// Places the date columns so the row holding the watched state is already in view,
// then keeps them moving as one: scrolling any column moves them all by the same
// amount, so the group stays side by side across the dates while you read down the
// list. Each column keeps its own starting point, because the group sits at a
// different depth on different dates.

// How many ranges stay visible above the group this state is in. Near the top,
// where it is easy to read, but not pinned to the edge.
const ROWS_ABOVE = 2;

export function layoutPredictions(root: ParentNode): void {
  const strip = root.querySelector<HTMLElement>('.prediction-dates');
  if (strip) layoutStrip(strip, root);

  const columns = Array.from(root.querySelectorAll<HTMLElement>('.date-block-scroll'));
  if (!columns.length) return;

  // Where each column sits when the page opens: its own group on screen.
  const startOf = new Map<HTMLElement, number>();
  for (const column of columns) {
    const start = restingPlace(column);
    startOf.set(column, start);
    column.scrollTop = start;
    showFades(column);
  }

  // How far the reader has moved from those starting points. One number for all six.
  let moved = 0;
  let isFollowing = false;

  for (const column of columns) {
    column.addEventListener('scroll', () => {
      // Ignore the scrolling this code does itself, or the columns would chase
      // each other.
      if (isFollowing) return;
      moved = column.scrollTop - (startOf.get(column) ?? 0);
      isFollowing = true;
      for (const other of columns) {
        if (other !== column) other.scrollTop = (startOf.get(other) ?? 0) + moved;
        showFades(other);
      }
      showFades(column);
      isFollowing = false;
    }, { passive: true });
  }
}

// The scroll position that brings the whole group this state is in near the top,
// with a couple of ranges showing above it. The group is several ranges tall and
// they differ from date to date, so all of its ranges have to be in view; the two
// ranges above it give way if there is not room for both the group and them.
// Without such a group the column stays at the top.
function restingPlace(column: HTMLElement): number {
  const rows = Array.from(column.querySelectorAll<HTMLElement>('.group-row'));
  const inOurGroup = (row: HTMLElement) =>
    row.classList.contains('ours') || row.classList.contains('is-us');
  const firstIndex = rows.findIndex(inOurGroup);
  if (firstIndex < 0) return 0;

  let lastIndex = firstIndex;
  while (lastIndex + 1 < rows.length && inOurGroup(rows[lastIndex + 1])) lastIndex += 1;

  // Measured against the column itself, so it does not matter which element a row is
  // positioned from.
  const columnTop = column.getBoundingClientRect().top;
  const topOf = (row: HTMLElement) => column.scrollTop + row.getBoundingClientRect().top - columnTop;
  const groupTop = topOf(rows[firstIndex]);
  const groupBottom = topOf(rows[lastIndex]) + rows[lastIndex].offsetHeight;

  // Take as many of the ranges above as still leave the whole group showing.
  let wanted = groupTop;
  for (let above = ROWS_ABOVE; above >= 1; above -= 1) {
    const start = topOf(rows[Math.max(0, firstIndex - above)]);
    if (groupBottom - start <= column.clientHeight) {
      wanted = start;
      break;
    }
  }
  return Math.max(0, Math.min(wanted, column.scrollHeight - column.clientHeight));
}

function showFades(column: HTMLElement): void {
  // A pixel of slack, because a scroll position is not always a whole number.
  const canScrollUp = column.scrollTop > 1;
  const canScrollDown = column.scrollTop + column.clientHeight < column.scrollHeight - 1;
  column.classList.toggle('can-up', canScrollUp);
  column.classList.toggle('can-down', canScrollDown);
}


// The strip of dates moves sideways: dragged with the mouse, scrolled with a
// trackpad or Shift and the wheel, or with the arrow keys. It is the only way across
// without a mouse that scrolls both ways, so it does not rely on one.
function layoutStrip(strip: HTMLElement, root: ParentNode): void {
  // Open on the transfer that is next, a peek in from the left so the one before it
  // shows at the edge.
  const peek = parseFloat(getComputedStyle(strip).scrollPaddingLeft) || 0;
  const next = strip.querySelector<HTMLElement>('[data-next-transfer]');
  const openAt = next ? Math.max(0, next.offsetLeft - peek) : 0;
  strip.scrollLeft = openAt;

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
  if (back) {
    back.addEventListener('click', () => { strip.scrollLeft = openAt; });
  }
}

function showStripFades(strip: HTMLElement): void {
  const canGoLeft = strip.scrollLeft > 1;
  const canGoRight = strip.scrollLeft + strip.clientWidth < strip.scrollWidth - 1;
  strip.classList.toggle('can-left', canGoLeft);
  strip.classList.toggle('can-right', canGoRight);
}
