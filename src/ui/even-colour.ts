// A colour brought to the same lightness and amount of colour as the sections' own
// colours, keeping only its tint, so every page reads as clearly as every other
// (Roxanne, 24 Nov). The player page uses it on its alliance's colour.
// The sums are those of OKLCH, where equal numbers look equally light to the eye.

// The sections' lightness and amount of colour, the Calendar's blue and the Fortress violet.
const EVEN_LIGHTNESS = 0.77;
const EVEN_CHROMA = 0.10;

function toLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function toScreen(value: number): number {
  const clamped = Math.min(1, Math.max(0, value));
  return clamped <= 0.0031308 ? 12.92 * clamped : 1.055 * clamped ** (1 / 2.4) - 0.055;
}

// The tint of a colour, as an angle from 0 to 360.
function hueOf(red: number, green: number, blue: number): number {
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  const a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
  const b = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
  return (Math.atan2(b, a) * 180 / Math.PI + 360) % 360;
}

function colourFrom(lightness: number, chroma: number, hue: number): string {
  const a = chroma * Math.cos(hue * Math.PI / 180);
  const b = chroma * Math.sin(hue * Math.PI / 180);
  const l = (lightness + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (lightness - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (lightness - 0.0894841775 * a - 1.2914855480 * b) ** 3;
  const channels = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
  ];
  return '#' + channels.map(value => Math.round(toScreen(value) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

// Takes the first #RRGGBB colour in what it is given (an alliance colour can come
// mixed, as an academy's does) and returns it evened; anything else comes back as it is.
export function evenColour(colour: string): string {
  const hex = /#([0-9a-f]{6})/i.exec(colour)?.[1];
  if (!hex) return colour;
  const [red, green, blue] = [0, 2, 4].map(start => toLinear(parseInt(hex.slice(start, start + 2), 16) / 255));
  return colourFrom(EVEN_LIGHTNESS, EVEN_CHROMA, hueOf(red, green, blue));
}
