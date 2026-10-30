# 🍿 FlixView

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/badge/version-0.1.15-blueviolet.svg)](https://github.com/jumakrk/FlixView/releases)
[![Build Status](https://github.com/jumakrk/FlixView/actions/workflows/build.yml/badge.svg)](https://github.com/jumakrk/FlixView/actions)
[![Checks](https://github.com/jumakrk/FlixView/actions/workflows/checks.yml/badge.svg)](https://github.com/jumakrk/FlixView/actions/workflows/checks.yml)

**FlixView** is a premium, cross-platform streaming companion designed for a seamless movie and TV show experience. Built with Next.js and Electron, it combines a stunning glassmorphic UI with robust performance and ad-blocking capabilities.

---

## 🚀 Direct Downloads (v0.1.15)

Get the latest version of FlixView directly for your platform:

| Platform | Download Link |
| :--- | :--- |
| **Windows** | [📥 Download .exe](https://github.com/jumakrk/FlixView/releases/download/v0.1.15/FlixView-Setup-0.1.15.exe) |
| **macOS (Silicon)** | [📥 Download .dmg](https://github.com/jumakrk/FlixView/releases/download/v0.1.15/FlixView-0.1.15-arm64.dmg) |
| **Linux** | [📥 Download .AppImage](https://github.com/jumakrk/FlixView/releases/download/v0.1.15/FlixView-0.1.15.AppImage) |

Or browse [all releases](https://github.com/jumakrk/FlixView/releases).

---

## ✨ Key Features

- **Beautiful UI/UX**: Modern glassmorphic design system using Outfit typography and vibrant purple accents.
- **Cross-Platform**: Native apps for Windows, macOS, and Linux.
- **In-App Updates**: Stay up to date automatically with built-in version detection and one-click installation.
- **Advanced Protection**: Integrated network-level filtering to block ads and malicious redirects.
- **Personalized Experience**: "Continue Watching" sync, Watchlists, and smart search.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Desktop Shell**: Electron
- **Styling**: Tailwind CSS, CSS Modules, Framer Motion
- **Data**: TMDB API Integration
- **Distribution**: electron-builder, GitHub Actions CI/CD

## 🏗️ Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/jumakrk/FlixView.git
   cd FlixView
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure your TMDB API key** (optional):
   ```bash
   cp .env.example .env.local
   # then set NEXT_PUBLIC_TMDB_API_KEY in .env.local
   ```
   Without a key the bundled project key is used, so this step is only needed
   if you want to point the app at your own TMDB account.

4. **Run in development mode**:
   ```bash
   # Terminal 1: Next.js dev server
   npm run dev

   # Terminal 2: Electron runner
   npm run electron:dev
   ```

5. **Quality checks**:
   ```bash
   npm run lint       # ESLint
   npm run typecheck  # TypeScript
   npm test           # Vitest unit tests
   ```

## 📜 License

Distributed under the MIT License. See `LICENSE` for more information.

---

**FlixView** - *Unlimited Entertainment. Zero Constraints.* 🍿🎬✨
