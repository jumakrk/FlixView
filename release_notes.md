# FlixView Release Notes

User-facing notes, as published on each GitHub release. The developer's
account of what changed and how is in [devlogs/](devlogs/README.md).

## v0.1.20
Smoother scrolling everywhere, a new Trending page, better filters and a fix for Mac updates.

### ⚡ Smoother Scrolling
* Fixed lag when scrolling through pages and through content rows and grids
* Rows, filter chips, episode lists, search results and the sidebar now glide smoothly too

### 🔥 A New Trending Page
* The No. 1 title gets a big spotlight, followed by the runners-up and the full chart
* See which titles are climbing or falling compared with this week's chart
* Bolder rank numbers, here and on the home page's Top 10 row

### 🎛️ Better Filtering
* The filter bar now stays at the top while you scroll on the Movies, Series, Anime, Studios and Streaming pages
* Changing a filter takes you straight back to the first row of results

### 🐞 Fixes
* Fixed the Anime page opening part-way down instead of at the top
* Fixed letters like g and y being cut off at the bottom of headings
* Fixed Mac updates getting stuck on "Restarting to update"

### 🍎 Mac users
Updating from v0.1.19 needs one last manual step: download **FlixView-0.1.20-arm64.dmg** from the release and drag FlixView into your Applications folder. From v0.1.20 on, updates install and restart by themselves.

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
