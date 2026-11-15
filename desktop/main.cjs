// Synapse desktop shell (epic 38): the thinnest possible Electron wrapper
// around the existing Vite SPA build. The SPA is served from the custom
// privileged scheme app://synapse — NOT file:// (BrowserRouter's pushState and
// crypto's secure-context APIs both die there), NOT a localhost port (a
// colliding port would silently change the CORS origin the api allowlists).
//
// Modes:
//   dev:  SYNAPSE_DESKTOP_DEV_URL set (`just desktop`) → loadURL the Vite dev
//         server; /graphql + /api/stream ride its proxy (same-origin, zero
//         CORS, no deployed-stack dependency).
//   prod: serve desktop/dist (staged by the build recipe / CI before
//         electron-builder packs it); the baked-in VITE_API_URL points at the
//         deployed api, cross-origin via CORS_ORIGIN's app://synapse entry.
"use strict";

const { app, BrowserWindow, dialog, Menu, protocol } = require("electron");
const path = require("node:path");
const fsp = require("node:fs/promises");

const APP_SCHEME = "app";
const APP_HOST = "synapse";
// Load the ROOT, not /index.html: BrowserRouter reads the pathname as a
// route, and "/index.html" is not one (the router 404s). The handler's SPA
// fallback serves index.html for "/" and every other extensionless path.
const APP_URL = `${APP_SCHEME}://${APP_HOST}/`;
const distDir = path.join(__dirname, "dist");

// Must run before app ready. `standard` makes the URL parse with a host (the
// origin the api's CORS_ORIGIN allowlists); `secure` keeps the webview a
// secure context (localStorage, crypto.randomUUID); supportFetchAPI + stream
// let the SPA fetch assets — including the pdf.js worker — through the scheme.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".map": "application/json",
  ".txt": "text/plain; charset=utf-8",
};

async function fileExists(target) {
  try {
    await fsp.access(target);
    return true;
  } catch {
    return false;
  }
}

// Static serving with an SPA fallback: extensionless routes (/, /plans,
// /read/:id, …) resolve to index.html and the router owns everything else.
// Paths are jailed inside dist/ — traversal can never escape the bundle.
// fs reads asar-packed files transparently, so the same code serves the
// packaged app and the staged dev build.
async function serveFromDist(request) {
  const root = path.resolve(distDir);
  const pathname = decodeURIComponent(new URL(request.url).pathname);
  const resolved = path.resolve(root, `.${pathname}`);
  const inside = resolved === root || resolved.startsWith(root + path.sep);
  const isAsset = inside && path.extname(resolved) !== "";

  const target =
    isAsset && (await fileExists(resolved)) ? resolved : path.join(root, "index.html");

  const body = await fsp.readFile(target);
  return new Response(body, {
    headers: { "content-type": MIME[path.extname(target)] || "application/octet-stream" },
  });
}

function installMenu() {
  // Role menus only: macOS needs the system menu bar for copy/paste/select-all
  // shortcuts; View carries reload + devtools. Other platforms hide the
  // in-window bar (autoHideMenuBar) — Alt reveals it.
  const template = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" }] : []),
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 850,
    // 1040 keeps the lg sidebar (264px) always visible: the md icon rail is
    // only 64px wide — too narrow for the macOS traffic lights to overlay.
    minWidth: 1040,
    minHeight: 640,
    title: "Synapse",
    show: false,
    autoHideMenuBar: process.platform !== "darwin",
    // macOS (epic 39 T1): the industry look (VS Code/Notion) — no native
    // title bar; the traffic lights overlay the app's own sidebar brand row
    // and the sidebar is the drag region (AppLayout's desktop-drag-region
    // CSS). Windows keeps its native frame (Window Controls Overlay is a
    // future option, not a v1 need).
    ...(process.platform === "darwin"
      ? { titleBarStyle: "hidden", trafficLightPosition: { x: 14, y: 16 } }
      : {}),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      // no preload: the SPA uses zero Node APIs — nothing crosses the boundary
    },
  });
  win.once("ready-to-show", () => win.show());
  // The SPA opens no popups; deny every window.open so a stray link can never
  // spawn a second, unconfigured BrowserWindow.
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  const devUrl = process.env.SYNAPSE_DESKTOP_DEV_URL;
  if (devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadURL(APP_URL);
  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    const devUrl = process.env.SYNAPSE_DESKTOP_DEV_URL;
    if (!devUrl && !fileExists(path.join(distDir, "index.html"))) {
      dialog.showErrorBox(
        "Synapse desktop",
        "desktop/dist is missing — stage the SPA build first (`just desktop-dist`, or the CI step that copies frontend/dist → desktop/dist).",
      );
      app.quit();
      return;
    }
    protocol.handle(APP_SCHEME, (request) => serveFromDist(request));
    installMenu();
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
