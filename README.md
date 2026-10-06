# Kerning Hero

A typography game. One letter pair in every word is spaced wrong: pinch it closed or spread it open before the timer runs out.
Thirty words per game, with less time and smaller errors as you go, and broken ligatures in the later words.
Live at https://kerninghero.tomtebo.org/. It installs as a PWA (Add to Home Screen).

## Development

    npm install
    npm run dev       # dev server
    npm run build     # build to dist/
    npm run preview   # serve dist/

## Files

- `index.html`: page markup
- `src/main.js`: game logic, input and rendering
- `src/style.css`: styles
- `scripts/icon.svg`: source of the app icon and favicon
- `scripts/render-icons.mjs`: `npm run icons` renders the icon to the PNG files in `public/` (needs a Playwright Chromium)
- `public/manifest.webmanifest`: PWA manifest

## Deploy

A push to `main` deploys the site. The GitHub Action (`.github/workflows/deploy.yml`) builds it and pushes `dist/` to the `deploy` branch.
The push to `deploy` fires the repository webhook. The hook `update-kerning-hero` on ludo.tomtebo.org then runs `deploy/update-site.sh`,
which copies the branch to `/home/staffan/sites/kerninghero.tomtebo.org`. The update log is `/var/log/webhook-updates.log`.

`npm run deploy` builds locally and copies `dist/` with rsync, without GitHub.

One-time server setup: `deploy/setup-server.sh` (nginx site and TLS certificate) and `deploy/setup-webhook.sh` (the hook).
