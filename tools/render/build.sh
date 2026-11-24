#!/bin/bash
# Builds a copy of the site for screenshots, without npm packages: it uses the esbuild
# already installed in Claude's workspace and answers database queries from
# tools/render/data/main.json (see fetch-data.sql).
# Usage, from the repo root: tools/render/build.sh <output folder>
set -e
repo_root="$(cd "$(dirname "$0")/../.." && pwd)"
output_folder="$(mkdir -p "$1" && cd "$1" && pwd)"
esbuild_path="${ESBUILD:-/opt/npm-tools/node_modules/.bin/esbuild}"
rm -rf "$output_folder"/*
cd "$repo_root"
"$esbuild_path" src/main.ts --bundle --format=esm \
  --outfile="$output_folder/main.js" \
  --alias:@supabase/supabase-js="$repo_root/tools/render/supabase-stand-in.js" \
  --define:import.meta.env.VITE_SUPABASE_URL='""' --define:import.meta.env.VITE_SUPABASE_ANON_KEY='""' \
  --define:import.meta.env.BASE_URL='"./"' \
  --loader:.png=file --log-level=warning
cat > "$output_folder/index.html" <<'PAGE'
<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>1458 State Hub</title><link rel="stylesheet" href="main.css"></head>
<body><div id="app"></div><script type="module" src="main.js"></script></body></html>
PAGE
# The pictures, as the site's build makes them (kept in /tmp/webp-cache between renders).
python3 tools/images/make-webp.py public/images /tmp/webp-cache > /dev/null
mkdir -p "$output_folder/images" && cp -r /tmp/webp-cache/. "$output_folder/images/"
echo "built into $output_folder"
