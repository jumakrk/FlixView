# FlixView v0.1.11 Release Notes

## 🚀 New Features & Enhancements
* **Interactive Auto-Updater:** We've completely overhauled the update experience! Updates no longer download silently in the background. Instead, you'll be greeted with a beautiful, interactive modal right from the sidebar.
* **Manual Download Control:** You can now choose whether to "Update Now" or "Update Later." You are in full control!
* **Live Download Progress:** Watch the update download in real-time with a sleek new progress bar.
* **Seamless Installation:** Once the update is finished downloading, the app will automatically restart and seamlessly install the new version.

## 🛠️ Fixes & Improvements
* **Advanced Player Synchronization:** Fixed an issue where the embedded media player would desync its internal episode state from the application routing state, ensuring TV show progress always resumes correctly.
* **Progress Cache Sandboxing:** Upgraded the security around external iframe caches, ensuring that external players cannot overwrite your locally saved progress timestamps.

## 🔮 Looking Forward (Deferred Features)
* *Automatic subtitle language detection and translation overlays were explored but deferred to ensure a highly stable and lightweight core player experience. We will be looking at integrating a lighter-weight solution for advanced subtitle handling in a future update!*
* *Trailer playback integrations for third-party endpoints have been temporarily removed due to unreliability on production environments. We are actively investigating stable alternatives.*
