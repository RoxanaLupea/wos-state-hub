# Rendering the site in Claude's workspace

npm packages cannot be installed in Claude's workspace, so the real build (`npm run
build`) only runs on GitHub after a push. These tools render the real page anyway, for
screenshots, with what the workspace already has: esbuild, Chrome and Playwright.

1. Get the data: run fetch-data.sql with the Supabase tool and save the value it returns
   as tools/render/data/main.json. That folder is never committed; the repo is public.
   For the player profile, also run `python3 tools/render/add-test-player.py`: the
   database query does not fetch accounts, so this adds a made-up signed-in player
   (main, alt, two farms, owner role) from test-player.json. For Transfers · Invites and
   Records, then run `python3 tools/render/add-test-transfers.py`: made-up transfers with the
   mockup's players (shoot at a fixed clock, e.g. 2026-12-10, to see the invitation phase).
2. Build: `tools/render/build.sh /tmp/render-build`
3. Screenshot: `python3 tools/render/shoot.py /tmp/render-build '[{"width":1440,"height":900,"file":"/tmp/pc.png"},{"width":390,"height":844,"file":"/tmp/phone.png"}]'`

   For the profile, signed in as the test player: `python3 tools/render/shoot-player.py
   /tmp/render-build '[{"width":1440,"height":900,"file":"/tmp/profile.png"}]'` (steps can
   click, fill and scroll; see the top of the script).

What this does not prove: the workspace's TypeScript is newer than the build's
TypeScript 5, so a clean check here can still fail on GitHub. Check the GitHub build
after every push (`gh run list -R RoxanaLupea/wos-state-hub -L 1`). The site's fonts
(Roboto, Montserrat) are installed here, so screenshots use the site's own fonts.

## Quick renders (27 Nov)

1. Fetch the database copy into tools/render/data/main.json (fetch-data.sql).
2. `bash tools/render/rebuild.sh /tmp/rb`
3. In a Python script: `shoot.serve('/tmp/rb', 8800)`, launch Chrome
   (`/usr/bin/google-chrome`, `--no-sandbox`), then `page.open_site(...)` and `page.click(...)`.
   Set RENDER_USER_ID to her account id to see the site as she does (an R4, admin).
