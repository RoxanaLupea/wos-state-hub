# Builds the site from tools/render/data/main.json (a copy of the database, never
# committed) into the folder given, with the fonts the renders use.
# Usage: bash tools/render/rebuild.sh /tmp/rb
set -e
cd "$(dirname "$0")/../.."
bash tools/render/build.sh "$1" 2>&1 | tail -1
mkdir -p "$1/fonts"
cp "/usr/share/fonts/truetype/google-fonts/ofl/roboto/Roboto[wdth,wght].ttf" "$1/fonts/roboto.ttf"
cp "/usr/share/fonts/truetype/google-fonts/ofl/montserrat/Montserrat[wght].ttf" "$1/fonts/montserrat.ttf"
