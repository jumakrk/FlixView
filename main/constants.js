const { app } = require('electron');
const path = require('path');
const fs = require('fs');

// ---------------------------------------------------------------------------
// App data location
// ---------------------------------------------------------------------------
// Data lives in the standard Electron user-data directory
// (app.getPath('userData'), e.g. %APPDATA%/FlixView on Windows). Older builds
// wrote to Documents/FlixView User Data; that folder is migrated on first
// launch so existing installs keep their library, watchlist and progress.
const DATA_ROOT = app.getPath('userData');
const LEGACY_DATA_ROOT = path.join(app.getPath('documents'), 'FlixView User Data');

const PROGRESS_DIR = path.join(DATA_ROOT, 'watch progress');
const WATCHLIST_DIR = path.join(DATA_ROOT, 'watchlist');
const FAVORITES_DIR = path.join(DATA_ROOT, 'favourites');

const DATA_DIR_NAMES = ['watch progress', 'watchlist', 'favourites'];

// ---------------------------------------------------------------------------
// Player providers
// ---------------------------------------------------------------------------
// VidRift is currently the ONLY embedded provider (embed.vidrift.in is its
// older domain, serving the same player). Player-specific behaviour in the
// main process (storage purging, frame header guard) is derived from this
// list, so switching or adding a provider later is a one-stop change here plus
// src/lib/player.ts in the renderer.
const PLAYER_ORIGINS = ['https://embed.vidrift.net', 'https://embed.vidrift.in'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function copyRecursiveSync(src, dest) {
    const stats = fs.statSync(src);
    if (stats.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
            copyRecursiveSync(path.join(src, entry), path.join(dest, entry));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// One-time migration from the legacy Documents folder. The legacy folder is
// intentionally left in place (never deleted) so users cannot lose data if
// anything about the new location disappoints them.
function migrateLegacyData() {
    try {
        const legacyHasData = DATA_DIR_NAMES.some(name => fs.existsSync(path.join(LEGACY_DATA_ROOT, name)));
        const newHasData = DATA_DIR_NAMES.some(name => fs.existsSync(path.join(DATA_ROOT, name)));
        if (!legacyHasData || newHasData) return;

        fs.mkdirSync(DATA_ROOT, { recursive: true });
        for (const entry of fs.readdirSync(LEGACY_DATA_ROOT)) {
            copyRecursiveSync(path.join(LEGACY_DATA_ROOT, entry), path.join(DATA_ROOT, entry));
        }
        console.log('[data] migrated legacy user data from Documents to', DATA_ROOT);
    } catch (error) {
        console.error('[data] legacy data migration failed:', error);
    }
}

function prepareDataDirs() {
    migrateLegacyData();
    for (const dir of [PROGRESS_DIR, WATCHLIST_DIR, FAVORITES_DIR]) {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    }
}

function getDirForType(type) {
    if (type === 'watchlist') return WATCHLIST_DIR;
    if (type === 'favorites') return FAVORITES_DIR;
    if (type === 'progress') return PROGRESS_DIR;
    return PROGRESS_DIR;
}

module.exports = {
    DATA_ROOT,
    LEGACY_DATA_ROOT,
    PROGRESS_DIR,
    WATCHLIST_DIR,
    FAVORITES_DIR,
    DATA_DIR_NAMES,
    PLAYER_ORIGINS,
    copyRecursiveSync,
    prepareDataDirs,
    getDirForType,
};
