const { app, session, shell } = require('electron');

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

    session.defaultSession.webRequest.onBeforeRequest(filter, (details, callback) => {
        const url = details.url.toLowerCase();
        if (BLOCKED_AD_PATTERNS.some(pattern => url.includes(pattern))) {
            console.log('Blocked ad request:', url);
            return callback({ cancel: true });
        }
        callback({ cancel: false });
    });

    // Spoof headers for the Vidly player. Only the iframe document load is
    // rewritten — spoofing Origin on the player's internal API/XHR calls would
    // break CORS.
    session.defaultSession.webRequest.onBeforeSendHeaders(filter, (details, callback) => {
        if (details.url.includes('vidly.pro') && details.resourceType === 'subFrame') {
            details.requestHeaders['Referer'] = 'https://vidly.pro/';
        }
        callback({ requestHeaders: details.requestHeaders });
    });
}

// "Scorched Earth": the app only ever wants ONE window. Anything else created
// at the app level dies instantly.
function installWindowSentry(getMainWindow) {
    app.on('browser-window-created', (event, newWin) => {
        const mainWin = getMainWindow();
        if (mainWin && newWin !== mainWin) {
            console.log('Scorched Earth: vaporizing unintended window');
            newWin.destroy();
        }
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
            console.log('Global sentry: denied popup to:', url);
            return { action: 'deny' };
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

module.exports = { installNetworkGuards, installWindowSentry, installWebContentsSentries };
