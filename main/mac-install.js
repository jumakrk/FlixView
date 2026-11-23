const { app } = require('electron');
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

// macOS updates without Squirrel.Mac.
//
// electron-updater normally hands the downloaded zip to Squirrel.Mac, which
// only installs apps signed with an Apple Developer ID. FlixView's macOS build
// is not signed (CSC_IDENTITY_AUTO_DISCOVERY is off in the release workflow),
// so Squirrel never accepted the update and the app sat on "Restarting to
// update" forever. Instead we unpack the zip ourselves, quit, and let a small
// shell script swap the new FlixView.app into place and reopen it. If
// FlixView is ever signed and notarised, autoUpdater.quitAndInstall() works
// again and this file can go.

/** The running FlixView.app bundle: .../FlixView.app/Contents/MacOS/FlixView. */
function currentAppBundle() {
    return path.resolve(path.dirname(app.getPath('exe')), '..', '..');
}

function unzip(zipPath, destination) {
    return new Promise((resolve, reject) => {
        execFile('/usr/bin/ditto', ['-x', '-k', zipPath, destination], error => (error ? reject(error) : resolve()));
    });
}

// Runs after FlixView quits. Arguments: PID, current app, new app, work folder.
const INSTALL_SCRIPT = `#!/bin/bash
PID="$1"; APP="$2"; NEW="$3"; WORK="$4"
case "$APP" in *.app) ;; *) exit 1 ;; esac
case "$NEW" in *.app) ;; *) exit 1 ;; esac
case "$WORK" in *flixview-update-*) ;; *) exit 1 ;; esac

# Wait up to 30 seconds for FlixView to quit.
for _ in $(seq 1 300); do kill -0 "$PID" 2>/dev/null || break; sleep 0.1; done

# Swap the bundles, keeping the old one until the new one is fully copied.
BACKUP="$APP.previous"
rm -rf "$BACKUP"
if mv "$APP" "$BACKUP"; then
  if /usr/bin/ditto "$NEW" "$APP"; then
    rm -rf "$BACKUP"
  else
    rm -rf "$APP"
    mv "$BACKUP" "$APP"
  fi
fi

/usr/bin/xattr -dr com.apple.quarantine "$APP" 2>/dev/null
/usr/bin/open "$APP"
rm -rf "$WORK"
`;

/**
 * Installs a downloaded update zip and restarts into it. Resolves once the
 * app is quitting; rejects with a message the user can act on.
 */
async function installMacUpdate(zipPath) {
    const appPath = currentAppBundle();
    if (!appPath.endsWith('.app')) throw new Error('Could not find the FlixView app to update.');

    // Opened straight from the disk image or from Downloads (macOS runs those
    // from a read-only, randomised copy): there is nothing to replace.
    if (appPath.startsWith('/Volumes/') || appPath.includes('/AppTranslocation/')) {
        throw new Error('Move FlixView to your Applications folder, open it from there, then update again.');
    }
    try {
        fs.accessSync(path.dirname(appPath), fs.constants.W_OK);
    } catch {
        throw new Error(`FlixView cannot write to ${path.dirname(appPath)}. Move it to your Applications folder, then update again.`);
    }
    if (!zipPath || !fs.existsSync(zipPath)) throw new Error('The downloaded update could not be found. Please try again.');

    const work = fs.mkdtempSync(path.join(os.tmpdir(), 'flixview-update-'));
    const unpacked = path.join(work, 'app');
    fs.mkdirSync(unpacked);
    await unzip(zipPath, unpacked);
    const bundle = fs.readdirSync(unpacked).find(name => name.endsWith('.app'));
    if (!bundle) throw new Error('The downloaded update is not a FlixView app.');

    const script = path.join(work, 'install.sh');
    fs.writeFileSync(script, INSTALL_SCRIPT, { mode: 0o755 });

    const child = spawn('/bin/bash', [script, String(process.pid), appPath, path.join(unpacked, bundle), work], {
        detached: true,
        stdio: 'ignore',
    });
    child.unref();

    app.quit();
    // Something (an unload handler) could hold the quit; the script is waiting.
    setTimeout(() => app.exit(0), 4000).unref();
}

module.exports = { installMacUpdate };
