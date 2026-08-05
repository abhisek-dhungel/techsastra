#!/usr/bin/env bash
# Build TechSastra on Mac and pack a cPanel-ready zip (no build needed on server).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

OUT_DIR="$ROOT/deploy-bundle"
# Prefer .tar.gz — many cPanel ClamAV setups block Node zips as
# Sanesecurity.Foxhole.JS_Zip_*.UNOFFICIAL (false positive on lots of .js files).
TGZ_PATH="$ROOT/techsastra-cpanel.tar.gz"
ZIP_PATH="$ROOT/techsastra-cpanel.zip"

echo "==> Installing deps (if needed)"
if [[ ! -d node_modules ]]; then
  npm ci || npm install
fi

echo "==> Generating Prisma client (MySQL)"
npx prisma generate

echo "==> Building Next.js (standalone)"
npm run build

echo "==> Assembling deploy bundle"
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

# Standalone server output
cp -R .next/standalone/. "$OUT_DIR/"

# Never ship local secrets (standalone may copy .env)
rm -f "$OUT_DIR/.env"

# Static assets Next expects beside standalone server
mkdir -p "$OUT_DIR/.next"
cp -R .next/static "$OUT_DIR/.next/static"
# Replace nested/incomplete public from standalone with the real one
rm -rf "$OUT_DIR/public"
cp -R public "$OUT_DIR/public"

# Prisma schema (for optional db push on server)
mkdir -p "$OUT_DIR/prisma"
cp prisma/schema.prisma "$OUT_DIR/prisma/schema.prisma"

# Env template (real .env must be created on server)
cp .env.example "$OUT_DIR/.env.example"

# Ensure uploads folder exists
mkdir -p "$OUT_DIR/public/uploads"
touch "$OUT_DIR/public/uploads/.gitkeep"

# Prefer our cPanel starter if present; standalone already has server.js
if [[ -f "$ROOT/server.js" ]]; then
  cp "$ROOT/server.js" "$OUT_DIR/server.cpanel.js"
fi

cat > "$OUT_DIR/START-ON-CPANEL.txt" <<'EOF'
TechSastra — cPanel start (pre-built on Mac)
============================================

1. Create MySQL DB + user in cPanel.
2. In this folder create .env (copy from .env.example):

   DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DBNAME"
   AUTH_SECRET="long-random-string"
   ADMIN_USERNAME="admin"
   ADMIN_PASSWORD="strong-password"
   NEXT_PUBLIC_SITE_URL="https://yourdomain.com"

3. In cPanel → Setup Node.js App:
   - Application root = this folder
   - Startup file = server.js
   - Node 18+ (20 recommended)

4. Open app terminal / SSH in this folder and run ONCE:
   npx prisma db push
   (optional) npx prisma db seed

5. Restart the Node.js app.

You do NOT need to run npm run build on the server.
EOF

echo "==> Creating tar.gz (recommended for cPanel upload)"
rm -f "$TGZ_PATH" "$ZIP_PATH"
(
  cd "$OUT_DIR"
  # Portable GNU/BSD tar; exclude macOS junk + secrets
  COPYFILE_DISABLE=1 tar -czf "$TGZ_PATH" \
    --exclude='.DS_Store' \
    --exclude='._*' \
    --exclude='.env' \
    .
)

echo ""
echo "Done."
echo "Upload this file (avoids Foxhole.JS_Zip false positive):"
echo "  $TGZ_PATH"
echo "  Size: $(du -h "$TGZ_PATH" | awk '{print $1}')"
echo ""
echo "In cPanel File Manager: Upload → Extract, OR via SSH:"
echo "  tar -xzf techsastra-cpanel.tar.gz"
echo "Then add .env, prisma db push, restart Node app."
echo ""
echo "Do NOT use .zip on hosts with Sanesecurity Foxhole — it flags Node apps."
