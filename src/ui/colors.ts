// Turning an event's colour into the shades a bar is painted with.

export interface Rgb { red: number; green: number; blue: number; }
export interface Hsl { hue: number; saturation: number; lightness: number; }

export function hexToRgb(hex: string): Rgb {
  const value = parseInt(String(hex || '#AFC8F5').replace('#', ''), 16);
  return { red: (value >> 16) & 255, green: (value >> 8) & 255, blue: value & 255 };
}

export function colorWithAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  return `rgba(${rgb.red},${rgb.green},${rgb.blue},${alpha})`;
}

export function hexToHsl(hex: string): Hsl {
  const rgb = hexToRgb(hex);
  const red = rgb.red / 255, green = rgb.green / 255, blue = rgb.blue / 255;
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue);
  const lightness = (max + min) / 2;
  if (max === min) return { hue: 0, saturation: 0, lightness };
  const range = max - min;
  const saturation = lightness > 0.5 ? range / (2 - max - min) : range / (max + min);
  const hue = max === red
    ? (green - blue) / range + (green < blue ? 6 : 0)
    : max === green ? (blue - red) / range + 2 : (red - green) / range + 4;
  return { hue: hue / 6, saturation, lightness };
}

export function hslToHex(hue: number, saturation: number, lightness: number): string {
  const level = Math.min(0.95, Math.max(0.05, lightness));
  const toChannel = (shift: number) => {
    const k = (shift + hue * 12) % 12;
    const amount = saturation * Math.min(level, 1 - level);
    const value = level - amount * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(value * 255).toString(16).padStart(2, '0');
  };
  return '#' + toChannel(0) + toChannel(8) + toChannel(4);
}

// A colour part way from one to another: 0 is the first, 1 the second.
export function mixColors(first: string, second: string, share: number): string {
  const start = hexToRgb(first), end = hexToRgb(second);
  const mix = (one: number, other: number) =>
    Math.round(one + (other - one) * share).toString(16).padStart(2, '0');
  return '#' + mix(start.red, end.red) + mix(start.green, end.green) + mix(start.blue, end.blue);
}

// How bright a colour looks (its relative luminance, 0 black to 1 white).
export function brightness(hex: string): number {
  const rgb = hexToRgb(hex);
  const channel = (value: number) => {
    const share = value / 255;
    return share <= 0.03928 ? share / 12.92 : Math.pow((share + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.red) + 0.7152 * channel(rgb.green) + 0.0722 * channel(rgb.blue);
}

// Two colours in the order an event's colours run (owner, 25 Nov): the darker first, so
// bars go from dark on the left to light on the right, and timelines from dark to light.
export function darkerFirst(one: string, other: string): [string, string] {
  return brightness(one) <= brightness(other) ? [one, other] : [other, one];
}
