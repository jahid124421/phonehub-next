#!/bin/bash
# Patch pg-cloudflare package.json to fix Cloudflare Pages bundling
# The workerd export points to dist/index.js which doesn't get copied by OpenNext.
# Pointing to dist/empty.js (which IS copied) resolves the esbuild error.
PKG="node_modules/pg-cloudflare/package.json"
if [ -f "$PKG" ]; then
  # Use node to patch the JSON
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('$PKG', 'utf8'));
    if (pkg.exports && pkg.exports['.'] && pkg.exports['.'].workerd) {
      pkg.exports['.'].workerd = { import: './dist/empty.js', require: './dist/empty.js' };
      fs.writeFileSync('$PKG', JSON.stringify(pkg, null, 2) + '\n');
      console.log('✓ pg-cloudflare patched for Cloudflare compatibility');
    }
  " 2>/dev/null
fi
