const { app, session, shell } = require('electron');
const { PLAYER_ORIGINS } = require('./constants');

const PLAYER_HOSTS = PLAYER_ORIGINS.map(origin => new URL(origin).hostname);

function isPlayerFrame(details) {
    if (details.resourceType !== 'subFrame') return false;
    try {
        return PLAYER_HOSTS.includes(new URL(details.url).hostname);
    } catch {
        return false;
    }
}

// Packaged builds load the UI from app://-, and the player answers with
// "Content-Security-Policy: frame-ancestors *". CSP's "*" only matches
// http(s)/ws(s) parents, so Chromium refuses to render the player inside the
// app (a black box; dev builds on http://localhost are unaffected). Only the
// framing rules are removed, and only for the player's own frame documents.
function allowPlayerFraming(responseHeaders) {
    const headers = { ...responseHeaders };
    for (const name of Object.keys(headers)) {
        const lower = name.toLowerCase();
        if (lower === 'x-frame-options') {
            delete headers[name];
        } else if (lower === 'content-security-policy') {
            const values = headers[name]
                .map(value => value
                    .split(';')
                    .filter(directive => !/^\s*frame-ancestors\b/i.test(directive))
                    .join(';')
                    .trim())
                .filter(Boolean);
            if (values.length) headers[name] = values;
            else delete headers[name];
        }
    }
    return headers;
}

// Electron keeps a single onHeadersReceived listener per session and the
// adblocker registers its own (for $csp filters), so this guard wraps it: the
// blocker runs first, then the player's framing headers are relaxed. Call it
// at startup without a blocker and again every time a blocker is enabled.
function installFrameHeaderGuard(appSession, blocker) {
    appSession.webRequest.onHeadersReceived({ urls: ['<all_urls>'] }, (details, callback) => {
        const finish = (result = {}) => {
            if (!isPlayerFrame(details)) return callback(result);
            const headers = result.responseHeaders || details.responseHeaders || {};
            callback({ ...result, responseHeaders: allowPlayerFraming(headers) });
        };
        if (blocker) blocker.onHeadersReceived(details, finish);
        else finish();
    });
}

// Simple network-level ad patterns. This is a FALLBACK that is active during
// the window between startup and the uBlock-based engine becoming ready (and
// when the engine cannot initialize at all). Note: only one onBeforeRequest
// listener can be active per session — the adblocker's
// enableBlockingInSession() replaces this one once its engine loads.
const BLOCKED_AD_PATTERNS = [
    'propellerads.com', 'onclickads.net', 'popunder', 'propush.com',
    'adservice.google', 'doubleclick.net', 'clksite.com', 'clkads.com',
    'cloktra.com', 'clkmf.com',
];

// The DOM patches below run in every frame (including player iframes). They
// neutralise the most common ad/redirect techniques used by embedded players:
// forced popups, confirm() traps, and storage-based state that survives too
// long. The Storage override only applies to non-localhost frames so the
// app's own UI keeps normal (persistent) web storage.
const DOM_SAFETY_SCRIPT = `
    // DOM safety patch for AdBlocker conflicts
    const originalRemoveChild = Element.prototype.removeChild;
    Element.prototype.removeChild = function(child) {
        if (child && this.contains(child)) {
            return originalRemoveChild.call(this, child);
        }
        console.warn('AdBlocker attempted to remove non-existent child');
        return child;
    };

    // Global error suppression for common HMR/AdBlocker issues
    window.addEventListener('error', (event) => {
        if (event.message?.includes("Cannot read properties of null (reading 'removeChild')")) {
            console.warn('Suppressed HMR removeChild error');
            event.preventDefault();
            event.stopPropagation();
        }
    });

    // Standard AdBlocker overrides
    window.open = function() { console.log('Ad-Block: Blocked window.open attempt'); return null; };
    window.alert = function() { console.log('Ad-Block: Blocked alert'); };
    window.confirm = function() { return true; };
    window.prompt = function() { return null; };

    // Force external player iframes to be stateless (fixes split-second resume loops)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        try {
            const memoryStore = {};
            Storage.prototype.setItem = function(key, value) { memoryStore[key] = String(value); };
            Storage.prototype.getItem = function(key) { return memoryStore.hasOwnProperty(key) ? memoryStore[key] : null; };
            Storage.prototype.removeItem = function(key) { delete memoryStore[key]; };
            Storage.prototype.clear = function() { for (let k in memoryStore) delete memoryStore[k]; };
        } catch (e) {}
    }
    undefined;
`;

// Network-level guards. Must be called after app ready (webRequest needs a
// live session).
function installNetworkGuards() {
    const filter = { urls: ['*://*/*'] };

    // Player framing works from the first launch, before (or without) the
    // adblocker engine, which re-installs this guard around its own handler.
    installFrameHeaderGuard(session.defaultSession);

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const url = details.url.toLowerCase();
        if (BLOCKED_AD_PATTERNS.some(pattern => url.includes(pattern))) {
            console.log('Blocked ad request:', url);
            return callback({ cancel: true });
        }
        callback({ cancel: false });
    });
}

// --- Popups as hidden decoys ---------------------------------------------
// The player opens one ad popup on the first click and treats a refused popup
// as a sandboxed embed: it then replaces the video with "Remove sandboxing to
// enable playback". So popups are not refused. They are allowed as an
// invisible, inert window (no JavaScript, images or sound) that is blanked
// at once and closed shortly after: the player sees a popup that opened, and
// the viewer never sees an ad. FlixView's own UI opens no popups (donation
// links go to the system browser), so every other popup is treated this way.
const DECOY_LIFETIME_MS = 30 * 1000;

const DECOY_WINDOW_OPTIONS = {
    show: false,
    width: 1,
    height: 1,
    skipTaskbar: true,
    focusable: false,
    paintWhenInitiallyHidden: false,
    webPreferences: {
        javascript: false,
        images: false,
        backgroundThrottling: true,
    },
};

// Popups allowed by the open handler whose BrowserWindow has not been created
// yet; the window sentry turns exactly that many new windows into decoys.
let pendingDecoys = 0;

function neutralizeDecoy(win) {
    const contents = win.webContents;
    contents.setAudioMuted(true);
    // Never follow the ad anywhere, and drop whatever it started loading.
    contents.on('will-navigate', event => event.preventDefault());
    contents.on('will-redirect', event => event.preventDefault());
    contents.stop();
    contents.loadURL('about:blank').catch(() => {});
    const timer = setTimeout(() => {
        if (!win.isDestroyed()) win.destroy();
    }, DECOY_LIFETIME_MS);
    win.on('closed', () => clearTimeout(timer));
}

// "Scorched Earth": the app only ever wants ONE visible window. Popup decoys
// (above) are kept hidden; anything else created at the app level dies
// instantly.
function installWindowSentry(getMainWindow) {
    app.on('browser-window-created', (event, newWin) => {
        const mainWin = getMainWindow();
        if (!mainWin || newWin === mainWin) return;

        if (pendingDecoys > 0) {
            pendingDecoys -= 1;
            neutralizeDecoy(newWin);
            return;
        }

        console.log('Scorched Earth: vaporizing unintended window');
        newWin.destroy();
    });
}

// Web-contents level lockdown: injected DOM patches, safe handling of
// external links (donations), and main-frame navigation filters.
function installWebContentsSentries() {
    app.on('web-contents-created', (event, contents) => {
        contents.on('dom-ready', () => {
            contents.executeJavaScript(DOM_SAFETY_SCRIPT).catch(() => {});
        });

        contents.setWindowOpenHandler(({ url }) => {
            try {
                const parsed = new URL(url);
                if (parsed.hostname.includes('paypal.com') || parsed.hostname.includes('buymeacoffee.com')) {
                    shell.openExternal(url);
                    return { action: 'deny' };
                }
            } catch {}
            // Opened as a hidden decoy instead of refused (see above).
            console.log('Global sentry: popup opened as hidden decoy:', url);
            pendingDecoys += 1;
            return { action: 'allow', overrideBrowserWindowOptions: DECOY_WINDOW_OPTIONS };
        });

        contents.on('will-navigate', (event, url) => {
            let parsed;
            try {
                parsed = new URL(url);
            } catch {
                event.preventDefault();
                return;
            }
            const isLocal = parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
            const isInternal = parsed.protocol === 'app:';
            if (!isLocal && !isInternal) {
                console.log('Global sentry: blocked restricted navigation:', url);
                event.preventDefault();
            }
        });
    });
}

module.exports = { installNetworkGuards, installFrameHeaderGuard, installWindowSentry, installWebContentsSentries };
