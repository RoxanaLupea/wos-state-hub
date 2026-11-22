// The app's logo: the state number large, with "STATE" over "HUB" to its right. The two
// stacked words are the same width, and together exactly as tall as the number.
// The sizes come from Manrope's capital letters and digits: both are 0.72 of the font
// size, so a 100px number is 72px tall, and the two stacked lines add up to the same 72px.

const CAPITAL_HEIGHT_RATIO = 0.72;
const NUMBER_FONT_SIZE = 100;
const BLOCK_HEIGHT = NUMBER_FONT_SIZE * CAPITAL_HEIGHT_RATIO;
// How wide one digit is drawn. The number's width is set from it, so a state number of
// any length lines up with the words beside it; only the spacing is adjusted, never the
// shape of the digits.
const DIGIT_WIDTH = 64;
const NUMBER_GAP = 14;

const TOP_LINE_FONT_SIZE = 36.89;
const BOTTOM_LINE_FONT_SIZE = 51.11;
const STACK_WIDTH = 118;

/** The logo as SVG. */
export function logoSvg(stateNumber: string, heightPx: number): string {
  const numberWidth = stateNumber.length * DIGIT_WIDTH;
  const stackLeft = numberWidth + NUMBER_GAP;
  const logoWidth = stackLeft + STACK_WIDTH;
  const topBaseline = TOP_LINE_FONT_SIZE * CAPITAL_HEIGHT_RATIO;
  const fitStack = `textLength="${STACK_WIDTH}" lengthAdjust="spacingAndGlyphs"`;
  return `<svg class="logo" viewBox="0 -1.5 ${logoWidth} ${BLOCK_HEIGHT + 3.1}" height="${heightPx}"
    role="img" aria-label="${stateNumber} State Hub">
    <text x="0" y="${BLOCK_HEIGHT}" font-size="${NUMBER_FONT_SIZE}" textLength="${numberWidth}"
      lengthAdjust="spacing" fill="var(--accent)">${stateNumber}</text>
    <text x="${stackLeft}" y="${topBaseline}" font-size="${TOP_LINE_FONT_SIZE}" ${fitStack} fill="var(--text)">STATE</text>
    <text x="${stackLeft}" y="${BLOCK_HEIGHT}" font-size="${BOTTOM_LINE_FONT_SIZE}" ${fitStack} fill="var(--text)">HUB</text>
  </svg>`;
}
