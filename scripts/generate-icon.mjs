// Renders the FlixView app icon (the sidebar logo: a Cyprus rounded square
// with a Sand play symbol) to the PNGs used by the installer, the window/taskbar
// and the web favicon.
//
//   node scripts/generate-icon.mjs
import sharp from 'sharp';

const SIZE = 1024;

// Drawn on a 1024 grid. The tile is inset 6% so the rounded corners and the
// glow are not clipped by the OS icon mask.
const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="fill" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0a6157"/>
      <stop offset="0.55" stop-color="#004741"/>
      <stop offset="1" stop-color="#00332e"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f0ede4" stop-opacity="0.22"/>
      <stop offset="0.5" stop-color="#f0ede4" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="bloom" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0" stop-color="#f0ede4" stop-opacity="0.16"/>
      <stop offset="1" stop-color="#f0ede4" stop-opacity="0"/>
    </radialGradient>
    <filter id="playShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="14" stdDeviation="22" flood-color="#001815" flood-opacity="0.6"/>
    </filter>
  </defs>

  <rect x="62" y="62" width="900" height="900" rx="236" fill="url(#fill)"/>
  <rect x="62" y="62" width="900" height="900" rx="236" fill="url(#bloom)"/>
  <rect x="62" y="62" width="900" height="900" rx="236" fill="url(#sheen)"/>
  <rect x="64" y="64" width="896" height="896" rx="234" fill="none" stroke="#f0ede4" stroke-opacity="0.3" stroke-width="5"/>

  <!-- Play symbol: vertically centred on the tile (512), and its box sits about
       25px right of centre so the triangle reads as optically centred. -->
  <path filter="url(#playShadow)" fill="#f0ede4"
        d="M368 368 C368 332 406 310 437 328 L684 471 C715 489 715 535 684 553 L437 696 C406 714 368 692 368 656 Z"/>
</svg>`;

const base = sharp(Buffer.from(svg));
await base.clone().png().toFile('public/icon.png');
await base.clone().resize(512, 512).png().toFile('src/app/icon.png');
console.log('Wrote public/icon.png (1024) and src/app/icon.png (512)');
