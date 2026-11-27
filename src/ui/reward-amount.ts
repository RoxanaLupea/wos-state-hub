// A reward's amount on its tile: from 1,000 up short, with at most one decimal ("3.6K",
// "25.6K", "200K", "1.5M"); smaller ones as they are (Roxanne, 27 Nov: "200000 is 200k, we don't
// write big numbers on rewards like that"; "numbers can be written smarter ... use the k and m").
export function rewardAmount(quantity: number): string {
  const short = (value: number, unit: string) =>
    (Math.floor(value * 10) / 10).toFixed(1).replace(/\.0$/, '') + unit;
  if (quantity >= 1_000_000) return short(quantity / 1_000_000, 'M');
  if (quantity >= 1_000) return short(quantity / 1_000, 'K');
  return String(quantity);
}
