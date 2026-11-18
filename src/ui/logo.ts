// The app's logo: "STATE" over the state number, both the same width, and together exactly as tall as "EVENTS".
// The sizes come from measuring Manrope's capital letters: a capital is 0.72 of the font size, so a 100px
// "EVENTS" is 72px tall, and the two stacked lines are sized to add up to the same 72px.

const CAPITAL_HEIGHT_RATIO = 0.72;
const EVENTS_FONT_SIZE = 100;
const BLOCK_HEIGHT = EVENTS_FONT_SIZE * CAPITAL_HEIGHT_RATIO;

const TOP_LINE_FONT_SIZE = 36.89;
const BOTTOM_LINE_FONT_SIZE = 51.11;
const STACK_WIDTH = 112;
const EVENTS_LEFT = 121.45;
const LOGO_WIDTH = 506;

/** The logo as SVG. The state number can be any length and still lines up with "STATE". */
export function logoSvg(stateNumber: string, heightPx: number): string {
  const topBaseline = TOP_LINE_FONT_SIZE * CAPITAL_HEIGHT_RATIO;
  const fit = `textLength="${STACK_WIDTH}" lengthAdjust="spacingAndGlyphs"`;
  return `<svg class="logo" viewBox="0 -1.5 ${LOGO_WIDTH} ${BLOCK_HEIGHT + 3.1}" height="${heightPx}"
    role="img" aria-label="State ${stateNumber} Events">
    <text x="0" y="${topBaseline}" font-size="${TOP_LINE_FONT_SIZE}" ${fit} fill="var(--accent)">STATE</text>
    <text x="0" y="${BLOCK_HEIGHT}" font-size="${BOTTOM_LINE_FONT_SIZE}" ${fit} fill="var(--accent)">${stateNumber}</text>
    <text x="${EVENTS_LEFT}" y="${BLOCK_HEIGHT}" font-size="${EVENTS_FONT_SIZE}" fill="var(--text)">EVENTS</text>
  </svg>`;
}
