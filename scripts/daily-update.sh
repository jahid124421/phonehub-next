#!/bin/bash
set -e
PHONEHUB="/config/Downloads/phonehub"
NEXT="/config/Downloads/phonehub-next"
export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"

echo "=== PhoneHub Daily Update ==="
# Run data pipeline
if [ -f "$PHONEHUB/tools/run_all.py" ]; then
  cd "$PHONEHUB" && python3 tools/run_all.py --limit 200 || echo "Pipeline warning"
fi
# Copy data
cp "$PHONEHUB/data/products.json" "$NEXT/src/data/products.json"
cp "$PHONEHUB/data/brands.json" "$NEXT/src/data/brands.json"
cp "$PHONEHUB/data/news.json" "$NEXT/src/data/news.json"
cp "$PHONEHUB/data/stores.json" "$NEXT/src/data/stores.json" 2>/dev/null || true
# Extract specs
if [ -f "$PHONEHUB/js/specs-data.js" ]; then
  cd "$NEXT"
  node -e "const fs=require('fs');const r=fs.readFileSync('$PHONEHUB/js/specs-data.js','utf8');const m=r.match(/window\\.SPECS\\s*=\\s*(\\{[\\s\\S]*\\});/);if(m)fs.writeFileSync('src/data/specs.json',m[1]);"
fi
# Build and deploy
cd "$NEXT" && npm run build && vercel --prod
echo "=== Done ==="
