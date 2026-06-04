# FlixView Release Notes

## v0.1.12
### 🚀 New Features & Enhancements
* **New Player Integration:** Switched the embedded video player to Peachify for a significantly more stable and robust viewing experience!
* **Player Controls:** The player now features built-in buttons for "Skip Intro", "Skip Recap", and "Skip End Credits".
* **Enhanced Audio & Subtitles:** Enjoy true multi-language SUB and DUB support! You can now freely mix and match your preferred audio track and subtitle languages.
* **Persistent Window State:** The app is now smarter! It remembers your exact window position, size, fullscreen, and maximized states across restarts, so you always pick up right where you left off.
* **Episode Progress Tracking:** A visual progress bar with an exact completion percentage has been added directly to individual episode cards in the season selector, making it easier than ever to track your binge-watching.

## v0.1.11
### 🚀 New Features & Enhancements
* **Interactive Auto-Updater:** We've completely overhauled the update experience! Updates no longer download silently in the background. Instead, you'll be greeted with a beautiful, interactive modal right from the sidebar.
* **Manual Download Control:** You can now choose whether to "Update Now" or "Update Later." You are in full control!
* **Live Download Progress:** Watch the update download in real-time with a sleek new progress bar.
* **Seamless Installation:** Once the update is finished downloading, the app will automatically restart and seamlessly install the new version.

### 🛠️ Fixes & Improvements
* **Advanced Player Synchronization:** Fixed an issue where the embedded media player would desync its internal episode state from the application routing state, ensuring TV show progress always resumes correctly.
* **Progress Cache Sandboxing:** Upgraded the security around external iframe caches, ensuring that external players cannot overwrite your locally saved progress timestamps.

### 🔮 Looking Forward (Deferred Features)
* *Automatic subtitle language detection and translation overlays were explored but deferred to ensure a highly stable and lightweight core player experience. We will be looking at integrating a lighter-weight solution for advanced subtitle handling in a future update!*
* *Trailer playback integrations for third-party endpoints have been temporarily removed due to unreliability on production environments. We are actively investigating stable alternatives.*
