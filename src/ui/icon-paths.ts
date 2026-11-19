// The drawn icons, one per shape the catalog names. An event without a picture in
// the image repo is drawn with one of these, in the event's own colour.
// Every one is a path inside a 24 by 24 box, so they all sit the same way.
export const ICON_PATHS: Record<string, string> = {
  'swords': '<path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M9.5 17.5L21 6V3h-3L6.5 14.5M11 19l-6-6M8 16l-4 4"/>',
  'castle': '<path d="M4 21V8l2 1V5l3 1V3h6v3l3-1v4l2-1v13zM10 21v-4h4v4"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
  'shield': '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
  'crown': '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  'flag': '<path d="M5 21V4h12l-2 4 2 4H5"/>',
  'factory': '<path d="M3 21V10l5 3v-3l5 3V4h6v17z"/>',
  'mountain': '<path d="M2 20l6-11 4 6 3-4 7 9z"/>',
  'paw': '<circle cx="6" cy="10" r="2"/><circle cx="10" cy="6" r="2"/><circle cx="14" cy="6" r="2"/><circle cx="18" cy="10" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 3-4 3s-4-1-4-3z"/>',
  'skull': '<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.3 4.5 3 5.6V19h8v-3.4c1.7-1.1 3-3.1 3-5.6a7 7 0 0 0-7-7z"/><circle cx="9.5" cy="10.5" r="1.3"/><circle cx="14.5" cy="10.5" r="1.3"/><path d="M10 19v2M14 19v2"/>',
  'target': '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  'snow': '<path d="M12 2v20M4 7l16 10M4 17L20 7M9 4l3 2 3-2M9 20l3-2 3 2"/>',
  'star': '<path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z"/>',
  'flame': '<path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z"/>',
  'dragon': '<path d="M4 20c2-6 6-9 11-9l3-4 1 5-3 2c0 4-3 6-7 6"/><path d="M15 11l-2-5 4 2"/><circle cx="16.5" cy="9.5" r="0.6"/>',
  'arrows': '<path d="M4 8h14l-4-4M20 16H6l4 4"/>',
  'gift': '<rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M3 13h18M12 9C10 5 6 5 7 8M12 9c2-4 6-4 5-1"/>',
  'trophy': '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  'bell': '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  'calendar': '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  'wheel': '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><path d="M12 3v7M12 14v7M3 12h7M14 12h7M5.6 5.6l5 5M13.4 13.4l5 5M18.4 5.6l-5 5M10.6 13.4l-5 5"/>',
};
