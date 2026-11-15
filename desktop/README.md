# Synapse desktop shell (epic 38)

Electron packaging of the Vite SPA against the deployed api. **Not a fork of
the app**: `frontend/` builds the bundle, the build stages it into
`desktop/dist`, electron-builder packs `main.cjs` + `dist` into the asar.
Zero product-code changes ride in this package — the whole integration is the
build-time `VITE_API_URL` (the existing seam in `apollo/client.ts` +
`ai/sse-client.ts`).

## Layout

- `main.cjs` — the entire shell: single-instance lock, the `app://synapse`
  privileged scheme (standard + secure — BrowserRouter routing and
  crypto's secure context both require it), SPA-fallback static serving from
  `dist` (jailed, asar-transparent), role-only menu (macOS copy/paste
  shortcuts live there), no preload (the SPA uses zero Node APIs).
- `electron-builder.yml` — dmg arm64 + x64 / NSIS x64, unsigned
  (`identity: null`).
- `buildResources/icon.png` — seed icon (512×512, from
  `frontend/public/logo.png`); the builder derives .icns/.ico.

## Commands (repo root)

```bash
just desktop        # dev: run `just dev` FIRST — the shell loads the Vite dev
                    # server (same-origin proxy: zero CORS, no deployed stack)
just desktop-dist   # build the SPA with the deployed VITE_API_URL, stage dist,
                    # package the macOS dmg into desktop/release/
```

`desktop/dist` is gitignored — it exists only between a build and a package,
never as a source.

## Environment

- `SYNAPSE_DESKTOP_DEV_URL` — the dev-server URL (set by `just desktop`).
- `SYNAPSE_DESKTOP_API_URL` — override the api URL `just desktop-dist` bakes
  in (default `https://synapse-api-0lf4.onrender.com/graphql`; CI uses the
  `DESKTOP_API_URL` repo variable over the same default).
- `ELECTRON_MIRROR` — e.g. `https://npmmirror.com/mirrors/electron/` when the
  electron binary download is slow (local networks only; CI doesn't need it).

## Releases — tag-driven (industry posture), not per-merge

Merges to `main` accumulate without releasing. A release happens when a
`desktop-v<version>` tag is pushed: bump `desktop/package.json`'s version,
commit/merge it, then run `just desktop-release` (it tags + pushes). The
workflow builds mac + win and publishes the GitHub Release under that exact
tag, marked latest; a guard step fails the release if the tag's version
doesn't match `package.json`. Pull requests touching `desktop/**` (narrow
paths filter) and `workflow_dispatch` runs are build-only verification.

## Origins / CORS (the one deploy dependency)

The shell serves from `app://synapse`. The deployed api's `CORS_ORIGIN` and
the R2 bucket's CORS rule must each allow that origin — owner-side steps in
`docs/deploy.md` §12. Dev mode (`just dev` + `just desktop`) is same-origin
through the Vite proxy and needs none of it.
