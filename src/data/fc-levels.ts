// The FC levels the site offers, in one place. When the game releases new FC levels,
// the oldest ones are dropped and this range moves up (owner, 23 Nov 2026); everything
// that lists or scores FC levels reads it from here.
export const LOWEST_FC = 5;
export const HIGHEST_FC = 10;
// Exalted troops exist only at this FC level.
export const EXALTED_FC = 10;

export const FC_LEVELS: number[] = Array.from({ length: HIGHEST_FC - LOWEST_FC + 1 }, (_, index) => LOWEST_FC + index);
