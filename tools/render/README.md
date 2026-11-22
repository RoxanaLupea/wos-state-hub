# Rendering the site in Claude's workspace

npm packages cannot be installed in Claude's workspace, so the real build (`npm run
build`) only runs on GitHub after a push. These tools render the real page anyway, for
screenshots, with what the workspace already has: esbuild, Chrome and Playwright.

1. Get the data: run fetch-data.sql with the Supabase tool and save the value it returns
   as tools/render/data/main.json. That folder is never committed; the repo is public.
2. Build: `tools/render/build.sh /tmp/render-build`
3. Screenshot: `python3 tools/render/shoot.py /tmp/render-build '[{"width":1440,"height":900,"file":"/tmp/pc.png"},{"width":390,"height":844,"file":"/tmp/phone.png"}]'`

What this does not prove: the workspace's TypeScript is newer than the build's
TypeScript 5, so a clean check here can still fail on GitHub. Check the GitHub build
after every push (`gh run list -R RoxanaLupea/wos-state-hub -L 1`). The site's fonts
(Manrope, Montserrat) cannot load here, so screenshots use a stand-in font.
