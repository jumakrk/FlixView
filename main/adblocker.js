const { ElectronBlocker } = require('@cliqz/adblocker-electron');
const fetch = require('cross-fetch');
const path = require('path');
const fs = require('fs');
const { DATA_ROOT } = require('./constants');
const { installFrameHeaderGuard } = require('./security');

// uBlock Origin filter sets, fetched from the same repo uBO itself uses.
const FILTER_LISTS = [
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/privacy.txt',
    'https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances.txt',
];

const ENGINE_CACHE_PATH = path.join(DATA_ROOT, 'adblock-engine.bin');

// Filter lists are refreshed in the background once the cache is older than
// this. The refresh never blocks startup and never removes blocking: if it
// fails (offline, GitHub down), the existing engine keeps being used.
const CACHE_MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

function isCacheStale() {
    try {
        return Date.now() - fs.statSync(ENGINE_CACHE_PATH).mtimeMs > CACHE_MAX_AGE_MS;
    } catch {
        return false;
    }
}

async function refreshEngine(appSession) {
    try {
        const fresh = await ElectronBlocker.fromLists(fetch, FILTER_LISTS, {});
        await fs.promises.writeFile(ENGINE_CACHE_PATH, fresh.serialize());
        fresh.enableBlockingInSession(appSession);
        installFrameHeaderGuard(appSession, fresh);
        console.log('[adblock] filter lists refreshed');
    } catch (error) {
        console.warn('[adblock] background refresh failed, keeping current engine:', error.message);
    }
}

// Loads the blocking engine. First run: fetches the uBO filter lists and
// writes a binary cache. Later runs: loads the cache instantly (works fully
// offline) and refreshes it in the background when stale.
async function setupAdBlocker(appSession) {
    const caching = {
        path: ENGINE_CACHE_PATH,
        read: fs.promises.readFile,
        write: fs.promises.writeFile,
    };

    try {
        const blocker = await ElectronBlocker.fromLists(fetch, FILTER_LISTS, {}, caching);
        blocker.enableBlockingInSession(appSession);
        // The engine just replaced the session's onHeadersReceived listener.
        installFrameHeaderGuard(appSession, blocker);
        console.log('[adblock] engine enabled');

        if (isCacheStale()) {
            refreshEngine(appSession);
        }
    } catch (error) {
        // No cache and no network (or unreachable lists): the built-in
        // pattern fallback in main/security.js keeps a baseline of protection.
        console.error('[adblock] engine unavailable:', error);
    }
}

module.exports = { setupAdBlocker };
