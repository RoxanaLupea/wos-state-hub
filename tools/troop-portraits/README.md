# Troop portraits

The 36 troop portraits in public/images/troops/ (T1 to T10, Helios, Exalted for each type),
336 x 412, made from the owner's camp screenshots (24 Nov 2026).

- The frame, its side, the tier badge and the numeral are drawn as exact shapes, fitted to
  the game's outline over ten portraits (game_outline.py, fit_outline.py, fit_window.py).
- Only the soldier comes from the screenshot, lightly sharpened. Where a head crosses the
  frame it is kept, found against the bare frame (frame_ref.npy, the median of 30 crops).
- make_all.py rebuilds all 36; the screenshot paths in it point to the chat's uploads and
  have to be changed to rerun it.
