/* FlixView website
 * Smooth scrolling (Lenis), the hero slideshow, poster wall and app showcase,
 * scroll reveals, and live download links for the visitor's system.
 * Plain ES2019, no build step. Loaded with `defer` after lenis and tmdb.js.
 */
(function () {
  'use strict';

  var REPO = 'jumakrk/FlixView';
  var RELEASES_PAGE = 'https://github.com/' + REPO + '/releases/latest';
  var API_LATEST = 'https://api.github.com/repos/' + REPO + '/releases/latest';
  var RELEASE_CACHE = 'flixview:latest-release';
  var RELEASE_CACHE_MS = 30 * 60 * 1000;
  var IMG = 'https://image.tmdb.org/t/p/';

  // Direct downloads, used until (or unless) GitHub reports a newer release.
  var FALLBACK_ASSETS = {
    windows: { url: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.20/FlixView-Setup-0.1.20.exe', name: 'FlixView-Setup-0.1.20.exe', size: 0 },
    mac: { url: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.20/FlixView-0.1.20-arm64.dmg', name: 'FlixView-0.1.20-arm64.dmg', size: 0 },
    linux: { url: 'https://github.com/jumakrk/FlixView/releases/download/v0.1.20/FlixView-0.1.20.AppImage', name: 'FlixView-0.1.20.AppImage', size: 0 },
  };

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Pointer effects only where there is a mouse and room for them; phones
  // get gentler speeds.
  var desktopPointer = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1025px)');
  var smallScreen = window.matchMedia('(max-width: 640px)');

  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  var onView = function (el, fn, opts) {
    if (!el) return;
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { fn(e.isIntersecting, e); });
    }, opts || { threshold: 0 }).observe(el);
  };

  /* ================================================================ Lenis */

  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, touchMultiplier: 1.3, autoRaf: true });
  }

  // Glides to a section and lands just under the nav. The position is
  // rechecked on arrival in case the page grew while scrolling.
  function scrollToTarget(el) {
    var where = function () {
      return el && el.getBoundingClientRect ? Math.max(0, el.getBoundingClientRect().top + window.scrollY - 76) : 0;
    };
    if (!lenis) { window.scrollTo({ top: where(), behavior: reduceMotion ? 'auto' : 'smooth' }); return; }
    lenis.resize();
    lenis.scrollTo(where(), {
      duration: 1.4,
      onComplete: function () {
        if (Math.abs(where() - window.scrollY) > 4) lenis.scrollTo(where(), { duration: 0.5 });
      },
    });
  }

  document.addEventListener('click', function (event) {
    var link = event.target.closest('a[href^="#"]');
    if (!link) return;
    var id = link.getAttribute('href');
    if (id.length < 2) return;
    var target = $(id);
    if (!target) return;
    event.preventDefault();
    closeMenu();
    scrollToTarget(id === '#top' ? null : target);
    history.replaceState(null, '', id === '#top' ? location.pathname : id);
  });

  /* ================================================================ Nav */

  var nav = $('[data-nav]');
  var navLinks = $$('.nav__links a');
  var sections = navLinks.map(function (a) { return $(a.getAttribute('href')); });
  var lastY = window.scrollY;

  nav.addEventListener('focusin', function () { nav.classList.remove('is-away'); });

  function updateNav() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    if (!document.body.classList.contains('menu-open')) {
      if (y > vh * 0.9 && y > lastY + 3) nav.classList.add('is-away');
      else if (y < lastY - 3 || y < vh * 0.9) nav.classList.remove('is-away');
    }
    lastY = y;
    var current = -1;
    sections.forEach(function (sec, i) {
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top < vh * 0.45 && r.bottom > vh * 0.45) current = i;
    });
    navLinks.forEach(function (a, i) { a.classList.toggle('is-here', i === current); });
  }

  /* ================================================================ Menu */

  var burger = $('[data-burger]');
  var menu = $('[data-menu]');

  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('menu-open');
    nav.classList.remove('is-away');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('menu-open');
    if (lenis) lenis.start();
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 400);
  }
  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize', function () { if (window.innerWidth > 900) closeMenu(); });

  /* ================================================================ Reveals */

  // Siblings in a grid come in one after another.
  $$('.bento, .faq__head, .dl__head, .show__head, .wall__head, .features__head').forEach(function (group) {
    $$('.reveal', group).forEach(function (el, i) { el.style.setProperty('--d', (i * 0.08) + 's'); });
  });
  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      revealer.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.1 });
  $$('.reveal').forEach(function (el) { revealer.observe(el); });

  // Hero copy rises once the font is ready (or after a short wait).
  var hero = $('[data-hero]');
  var ready = function () { hero.classList.add('is-ready'); };
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise(function (r) { setTimeout(r, 700); })]).then(ready);
  } else ready();

  /* ================================================================ Artwork helpers */

  var PALETTE = [['#0d6b61', '#04201d'], ['#8b5cf6', '#140c2e'], ['#d3a24a', '#2a1d0c'], ['#e07a5f', '#3d1f2b'], ['#7f9cf5', '#151a3a'], ['#6ee7b7', '#06281f'], ['#c084fc', '#1f1035'], ['#f2c14e', '#3a2108']];

  function tile(cls, i) {
    var el = document.createElement('span');
    el.className = cls;
    var c = PALETTE[i % PALETTE.length];
    el.style.setProperty('--a', c[0]);
    el.style.setProperty('--b', c[1]);
    return el;
  }

  function putImage(el, src) {
    if (!src) return;
    var img = el.querySelector('img') || document.createElement('img');
    img.alt = '';
    img.decoding = 'async';
    img.onload = function () { img.classList.add('is-loaded'); };
    img.src = src;
    if (!img.parentNode) el.appendChild(img);
  }

  function posterPool(data) {
    var all = data.trending.concat(data.anime, data.classics);
    // Interleave so neighbouring tiles differ in kind.
    var out = [];
    var lists = [data.trending.slice(), data.anime.slice(), data.classics.slice()];
    while (out.length < all.length) {
      lists.forEach(function (l) { if (l.length) out.push(l.shift()); });
    }
    return out;
  }

  /* ================================================================ Poster wall */

  var wall = $('[data-wall]');
  var rows = $$('[data-row]', wall);
  var ROW_TILES = 14;
  var rowX = [0, 0, 0];
  var rowDir = [-1, 1, -1];
  var rowSpeed = [0.32, 0.42, 0.26];
  var wallVisible = false;

  // Generated tiles first, so the wall is never empty. Each row holds two
  // identical halves so it can loop seamlessly.
  rows.forEach(function (row, r) {
    for (var copy = 0; copy < 2; copy++) {
      for (var i = 0; i < ROW_TILES; i++) row.appendChild(tile('wall__tile', i + r * 3));
    }
  });

  function fillWall(data) {
    var pool = posterPool(data);
    if (pool.length < 12) return;
    rows.forEach(function (row, r) {
      var tiles = row.children;
      for (var i = 0; i < tiles.length; i++) {
        var t = pool[(r * ROW_TILES + (i % ROW_TILES)) % pool.length];
        putImage(tiles[i], IMG + 'w342' + t.poster);
      }
    });
  }
  onView($('.wall'), function (on) { wallVisible = on; }, { rootMargin: '200px 0px' });

  /* ================================================================ Finale mosaic */

  var mosaic = $('[data-mosaic]');
  for (var m = 0; m < 32; m++) mosaic.appendChild(tile('', m + 2));
  function fillMosaic(data) {
    var pool = posterPool(data).slice().reverse();
    $$('span', mosaic).forEach(function (el, i) { putImage(el, IMG + 'w185' + pool[i % pool.length].poster); });
  }

  /* ================================================================ Artwork arrives */

  var artDone = false;
  function onArt(data) {
    if (artDone || !data) return;
    artDone = true;
    // The wall and mosaic load when they get near the screen.
    var wallLoaded = false;
    onView($('.wall'), function (on) { if (on && !wallLoaded) { wallLoaded = true; fillWall(data); } }, { rootMargin: '600px 0px' });
    var mosaicLoaded = false;
    onView($('.finale'), function (on) { if (on && !mosaicLoaded) { mosaicLoaded = true; fillMosaic(data); } }, { rootMargin: '600px 0px' });
  }
  if (window.__tmdb) onArt(window.__tmdb);
  window.addEventListener('flix:tmdb', function (e) { onArt(e.detail); });

  /* ================================================================ How it works */

  var how = $('[data-how]');
  var howSteps = $$('[data-step]');
  var howShots = $$('[data-how-shot]');
  var howDots = $$('.how__dots span');
  var howList = $('.how__steps');
  var howIndex = 0;

  function setHowStep(n) {
    if (n === howIndex) return;
    howIndex = n;
    howSteps.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
    howShots.forEach(function (s, i) { s.classList.toggle('is-on', i === n); });
    howDots.forEach(function (d, i) { d.classList.toggle('is-on', i === n); });
  }
  // Load all three screens up front so switching never shows a blank frame.
  howShots.forEach(function (img) { img.loading = 'eager'; });

  /* ================================================================ Statement */

  var statement = $('[data-fill]');
  var words = [];
  if (statement) {
    var text = statement.textContent.trim();
    statement.setAttribute('aria-label', text);
    statement.textContent = '';
    text.split(/\s+/).forEach(function (w, i) {
      var span = document.createElement('span');
      span.className = 'w';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = w;
      statement.appendChild(span);
      statement.appendChild(document.createTextNode(i < text.split(/\s+/).length - 1 ? ' ' : ''));
      words.push(span);
    });
  }
  var lastLit = -1;

  /* ================================================================ Split headings */

  // Wraps each word (keeping <br> and inner spans) so it can rise in turn.
  function splitWords(el) {
    var n = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var outer = document.createElement('span');
            outer.className = 'w';
            var inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--wd', (n++ * 0.06) + 's');
            outer.appendChild(inner);
            frag.appendChild(outer);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== 'BR') {
          walk(child);
        }
      });
    })(el);
  }
  $$('[data-split]').forEach(function (h) {
    h.setAttribute('aria-label', h.innerText.replace(/\s+/g, ' ').trim());
    splitWords(h);
    $$('.w', h).forEach(function (w) { w.setAttribute('aria-hidden', 'true'); });
    onView(h, function (on) { if (on) h.classList.add('is-in'); }, { rootMargin: '0px 0px -10% 0px' });
  });

  /* ================================================================ Ticker */

  var ticker = $('[data-ticker]');
  var tickerX = 0;
  var tickerVisible = false;
  if (ticker) {
    Array.prototype.slice.call(ticker.children).forEach(function (node) { ticker.appendChild(node.cloneNode(true)); });
    onView(ticker, function (on) { tickerVisible = on; });
  }

  /* ================================================================ Hero stage */

  var stage = $('[data-stage]');
  var stageTarget = { x: 0, y: 0 };
  var stageNow = { x: 0, y: 0 };
  if (stage) {
    hero.addEventListener('pointermove', function (e) {
      if (!desktopPointer.matches || reduceMotion) return;
      stageTarget.x = (e.clientX / window.innerWidth - 0.5) * 2;
      stageTarget.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { stageTarget.x = 0; stageTarget.y = 0; });
  }

  /* ================================================================ Feature tiles */

  // Each tile's demo only animates while the tile is on screen.
  $$('[data-tile]').forEach(function (tile) {
    onView(tile, function (on) { tile.classList.toggle('is-live', on); }, { threshold: 0 });
  });

  // The search tile types a query with no spaces, then shows the match.
  var findBox = $('.find');
  var findText = $('[data-type]');
  if (findBox && findText) {
    var query = findText.getAttribute('data-type');
    var findLive = false;
    var findTimer = null;
    var findStep = function (n) {
      if (!findLive) { findTimer = null; return; }
      if (n <= query.length) {
        findText.textContent = query.slice(0, n);
        findBox.classList.toggle('is-found', n === query.length);
        findTimer = setTimeout(function () { findStep(n + 1); }, n === 0 ? 500 : 95);
      } else {
        findTimer = setTimeout(function () { findBox.classList.remove('is-found'); findStep(0); }, 2600);
      }
    };
    if (reduceMotion) {
      findBox.classList.add('is-found');
    } else {
      findText.textContent = '';
      onView(findBox, function (on) {
        findLive = on;
        if (on && !findTimer) findStep(0);
      }, { threshold: 0 });
    }
  }

  // Real artwork in the tiles once TMDB answers.
  function fillTiles(data) {
    var series = data.trending.filter(function (t) { return t.type === 'Series' && t.backdrop; });
    var movies = data.trending.filter(function (t) { return t.type === 'Movie' && t.backdrop; });
    var resumeArt = $('[data-resume-art]');
    if (resumeArt && series[0]) {
      var img = new Image();
      img.onload = function () { resumeArt.style.backgroundImage = 'url(' + img.src + ')'; resumeArt.classList.add('is-loaded'); };
      img.src = IMG + 'w780' + series[0].backdrop;
      $('[data-resume-title]').textContent = series[0].title;
    }
    var bingeArt = $('[data-binge-art]');
    var bingePick = series[1] || movies[0];
    if (bingeArt && bingePick) {
      var b = new Image();
      b.onload = function () { bingeArt.style.backgroundImage = 'url(' + b.src + ')'; };
      b.src = IMG + 'w1280' + bingePick.backdrop;
    }
    var animeRow = $('[data-anime-row]');
    var anime = (data.anime || []).slice(0, 8);
    if (animeRow && anime.length) {
      $$('span', animeRow).forEach(function (el, i) { putImage(el, IMG + 'w185' + anime[i % anime.length].poster); });
    }
  }
  var tilesDone = false;
  var tilesLoaded = false;
  var tilesArt = function (data) {
    if (tilesDone || !data) return;
    tilesDone = true;
    onView($('.features'), function (on) { if (on && !tilesLoaded) { tilesLoaded = true; fillTiles(data); } }, { rootMargin: '600px 0px' });
  };
  if (window.__tmdb) tilesArt(window.__tmdb);
  window.addEventListener('flix:tmdb', function (e) { tilesArt(e.detail); });

  /* ================================================================ Wordmark */

  var wordmark = $('[data-wordmark]');
  var letters = [];
  if (wordmark) {
    var word = wordmark.textContent;
    wordmark.textContent = '';
    word.split('').forEach(function (ch) {
      var span = document.createElement('span');
      span.textContent = ch;
      wordmark.appendChild(span);
      letters.push(span);
    });
  }

  var progressBar = $('[data-progress]');

  /* ================================================================ Frame loop */

  (function frameLoop() {
    var vh = window.innerHeight;
    var velocity = lenis ? (lenis.velocity || 0) : 0;

    updateNav();

    // Reading progress along the top edge.
    if (progressBar) {
      var docH = document.documentElement.scrollHeight - vh;
      progressBar.style.transform = 'scaleX(' + (docH > 0 ? (window.scrollY / docH).toFixed(4) : 0) + ')';
    }

    // Hero stage: follows the pointer on desktop and settles as you scroll.
    if (stage && !reduceMotion) {
      var wide = window.innerWidth > 1024;
      var settle = clamp(window.scrollY / (vh * 0.8), 0, 1);
      stageNow.x += (stageTarget.x - stageNow.x) * 0.08;
      stageNow.y += (stageTarget.y - stageNow.y) * 0.08;
      if (wide) {
        stage.style.setProperty('--ry', ((-16 + stageNow.x * 6) * (1 - settle * 0.7)).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', ((6 - stageNow.y * 4) * (1 - settle * 0.7)).toFixed(2) + 'deg');
      } else if (!smallScreen.matches) {
        stage.style.setProperty('--rx', (10 * (1 - settle)).toFixed(2) + 'deg');
      }
    }

    // Ticker always drifts to the left, and speeds up while the page scrolls
    // (either way).
    if (ticker && tickerVisible && !reduceMotion) {
      var base = smallScreen.matches ? 0.35 : 0.6;
      tickerX -= base + Math.min(Math.abs(velocity), 40) * 0.3;
      var tHalf = ticker.scrollWidth / 2;
      if (tHalf > 0) {
        if (tickerX <= -tHalf) tickerX += tHalf;
        if (tickerX > 0) tickerX -= tHalf;
      }
      ticker.style.transform = 'translate3d(' + tickerX.toFixed(1) + 'px,0,0)';
    }

    // Footer wordmark: letters rise in as the footer comes up.
    if (letters.length && !reduceMotion) {
      var wr = wordmark.getBoundingClientRect();
      if (wr.top < vh && wr.bottom > 0) {
        var wp = clamp((vh - wr.top) / (wr.height * 1.1), 0, 1);
        letters.forEach(function (l, i) {
          var t = clamp(wp * 1.5 - i * 0.06, 0, 1);
          l.style.setProperty('--ly', ((1 - t) * 100).toFixed(1) + '%');
        });
      }
    }

    // Poster wall drifts, faster while scrolling.
    if (wallVisible && !reduceMotion) {
      var boost = (1 + Math.min(Math.abs(velocity), 60) * 0.08) * (smallScreen.matches ? 0.6 : 1);
      rows.forEach(function (row, r) {
        var half = row.scrollWidth / 2;
        rowX[r] += rowSpeed[r] * rowDir[r] * boost;
        if (half > 0) {
          if (rowX[r] <= -half) rowX[r] += half;
          if (rowX[r] > 0) rowX[r] -= half;
        }
        row.style.transform = 'translate3d(' + rowX[r].toFixed(1) + 'px,0,0)';
      });
    }

    // How it works: the step nearest the middle of the screen leads, and the
    // timeline fills as you go.
    if (how) {
      var hr = how.getBoundingClientRect();
      if (hr.top < vh && hr.bottom > 0) {
        var mid = vh / 2;
        var best = 0, bestDist = Infinity;
        howSteps.forEach(function (s, i) {
          var r = s.getBoundingClientRect();
          var d = Math.abs(r.top + r.height / 2 - mid);
          if (d < bestDist) { bestDist = d; best = i; }
        });
        setHowStep(best);
        var lr = howList.getBoundingClientRect();
        howList.style.setProperty('--fill', clamp((mid - lr.top) / lr.height, 0, 1).toFixed(3));
      }
    }

    // Statement words light up in reading order.
    if (statement && !reduceMotion) {
      var sr = statement.getBoundingClientRect();
      if (sr.top < vh && sr.bottom > 0) {
        var sp = clamp((vh * 0.85 - sr.top) / (vh * 0.55), 0, 1);
        var lit = Math.round(sp * words.length);
        if (lit !== lastLit) {
          lastLit = lit;
          words.forEach(function (w, i) { w.classList.toggle('is-lit', i < lit); });
        }
      }
    }

    // Finale mosaic drifts slowly against the scroll.
    if (mosaic && !reduceMotion) {
      var mr = mosaic.parentNode.getBoundingClientRect();
      if (mr.top < vh && mr.bottom > 0) mosaic.style.setProperty('--my', ((mr.top - vh / 2) * -0.12).toFixed(1) + 'px');
    }

    requestAnimationFrame(frameLoop);
  })();

  /* ================================================================ Downloads */

  var OS_ICONS = {
    windows: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 5.1 10.4 4v7.2H3zm8.3-1.2L21 2.5v8.7h-9.7zM3 12.8h7.4V20L3 18.9zm8.3 0H21v8.7l-9.7-1.4z"/></svg>',
    mac: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M16.4 12.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1ZM13.9 4.9c.7-.9 1.2-2 1.1-3.2-1 0-2.3.7-3 1.6-.7.8-1.3 2-1.1 3.1 1.1.1 2.3-.6 3-1.5Z"/></svg>',
    linux: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 2c-2.2 0-3.6 1.8-3.6 4.4 0 1.4.2 2.4-.4 3.6-.9 1.6-2.6 3.5-3.1 5.9-.3 1.5.1 2.4.6 2.9-.6.5-1.7.7-2 1.3-.4.9.6 1.5 2.4 1.7 1.4.2 2.4.9 3.7.9 1 0 1.6-.6 2.4-.6s1.4.6 2.4.6c1.3 0 2.3-.7 3.7-.9 1.8-.2 2.8-.8 2.4-1.7-.3-.6-1.4-.8-2-1.3.5-.5.9-1.4.6-2.9-.5-2.4-2.2-4.3-3.1-5.9-.6-1.2-.4-2.2-.4-3.6C15.6 3.8 14.2 2 12 2Z"/></svg>',
    download: '<svg class="i" viewBox="0 0 24 24"><path d="M12 3v12m0 0-5-5m5 5 5-5M5 21h14"/></svg>',
  };
  var OS_NAMES = { windows: 'Windows', mac: 'macOS', linux: 'Linux' };

  function detectOS() {
    var uaData = navigator.userAgentData;
    var platform = ((uaData && uaData.platform) || navigator.platform || '').toLowerCase();
    var ua = navigator.userAgent.toLowerCase();
    if (/android|iphone|ipad|ipod/.test(ua) || (platform.indexOf('mac') > -1 && navigator.maxTouchPoints > 1)) return 'mobile';
    if (platform.indexOf('win') > -1 || ua.indexOf('windows') > -1) return 'windows';
    if (platform.indexOf('mac') > -1 || ua.indexOf('mac os') > -1) return 'mac';
    if (platform.indexOf('linux') > -1 || ua.indexOf('linux') > -1 || ua.indexOf('x11') > -1) return 'linux';
    return 'unknown';
  }

  var os = detectOS();
  var assets = { windows: FALLBACK_ASSETS.windows, mac: FALLBACK_ASSETS.mac, linux: FALLBACK_ASSETS.linux };

  var formatSize = function (b) { return b ? Math.round(b / 1048576) + ' MB' : ''; };
  var formatDate = function (iso) {
    try { return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return ''; }
  };

  // Download tabs.
  var dlTabs = $$('[data-os-tab]');
  var dlInk = $('.dl__ink');
  function moveInk(tab) {
    if (!tab || !dlInk) return;
    dlInk.style.width = tab.offsetWidth + 'px';
    dlInk.style.transform = 'translateX(' + tab.offsetLeft + 'px)';
  }
  function selectOS(name, focus) {
    dlTabs.forEach(function (tab) {
      var on = tab.getAttribute('data-os-tab') === name;
      tab.setAttribute('aria-selected', on ? 'true' : 'false');
      tab.tabIndex = on ? 0 : -1;
      if (on) { moveInk(tab); if (focus) tab.focus(); }
    });
    $$('[data-os-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-os-panel') !== name; });
  }
  dlTabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { selectOS(tab.getAttribute('data-os-tab')); });
    tab.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var next = dlTabs[(i + (e.key === 'ArrowRight' ? 1 : dlTabs.length - 1)) % dlTabs.length];
      selectOS(next.getAttribute('data-os-tab'), true);
    });
  });
  window.addEventListener('resize', function () { moveInk($('[data-os-tab][aria-selected="true"]')); });
  window.addEventListener('load', function () { moveInk($('[data-os-tab][aria-selected="true"]')); });

  if (OS_NAMES[os]) {
    selectOS(os);
    var badge = $('[data-os-panel="' + os + '"] [data-recommended]');
    if (badge) badge.hidden = false;
  } else {
    selectOS('windows');
  }

  function paintPrimary(version) {
    var known = OS_NAMES[os];
    $$('[data-primary-download]').forEach(function (btn) {
      var label = btn.querySelector('[data-primary-label]');
      var icon = btn.querySelector('[data-os-icon]');
      if (known) {
        label.textContent = 'Download for ' + known;
        icon.innerHTML = OS_ICONS[os];
        btn.href = assets[os].url;
      } else {
        label.textContent = os === 'mobile' ? 'Get it for your computer' : 'Download free';
        icon.innerHTML = OS_ICONS.download;
        btn.href = '#download';
      }
    });
    var meta = $('[data-primary-meta]');
    if (meta) {
      var bits = [];
      if (version) bits.push(version);
      if (known && assets[os].size) bits.push(formatSize(assets[os].size));
      bits.push(known ? 'Free and open source' : 'Free for Windows, macOS and Linux');
      meta.textContent = bits.join(' · ');
    }
  }

  function paintRelease(release) {
    var version = release && release.tag_name ? release.tag_name : '';
    if (release && release.assets) {
      release.assets.forEach(function (a) {
        var n = a.name.toLowerCase();
        if (n.indexOf('.blockmap') > -1) return;
        var item = { url: a.browser_download_url, size: a.size, name: a.name };
        if (/\.exe$/.test(n)) assets.windows = item;
        else if (/\.dmg$/.test(n)) assets.mac = item;
        else if (/\.appimage$/.test(n)) assets.linux = item;
      });
    }
    Object.keys(assets).forEach(function (key) {
      var link = $('[data-download="' + key + '"]');
      var file = $('[data-file="' + key + '"]');
      link.href = assets[key] ? assets[key].url : RELEASES_PAGE;
      if (assets[key]) file.textContent = assets[key].name + (assets[key].size ? ' · ' + formatSize(assets[key].size) : '');
    });
    if (version) {
      var line = $('[data-release-line]');
      if (line) line.textContent = 'Version ' + version.replace(/^v/, '') + (release.published_at ? ', released ' + formatDate(release.published_at) : '') + '. Always the latest, straight from GitHub.';
      var chipVersion = $('[data-chip-version]');
      if (chipVersion) chipVersion.textContent = 'Version ' + version.replace(/^v/, '');
      var pill = $('[data-release-pill]');
      if (pill) {
        pill.textContent = 'Version ' + version.replace(/^v/, '');
        var more = document.createElement('span');
        more.className = 'pill__more';
        more.textContent = ' · Free for Windows, macOS and Linux';
        pill.appendChild(more);
      }
    }
    paintPrimary(version);
  }

  paintPrimary('');
  (function fetchRelease() {
    try {
      var raw = JSON.parse(localStorage.getItem(RELEASE_CACHE) || 'null');
      if (raw && Date.now() - raw.at < RELEASE_CACHE_MS) { paintRelease(raw.release); return; }
    } catch (e) { /* storage unavailable */ }
    fetch(API_LATEST, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (res) { if (!res.ok) throw new Error(res.status); return res.json(); })
      .then(function (release) {
        try {
          localStorage.setItem(RELEASE_CACHE, JSON.stringify({ at: Date.now(), release: {
            tag_name: release.tag_name,
            published_at: release.published_at,
            assets: (release.assets || []).map(function (a) { return { name: a.name, size: a.size, browser_download_url: a.browser_download_url }; }),
          } }));
        } catch (e) { /* ignore */ }
        paintRelease(release);
      })
      .catch(function () { paintRelease(null); });
  })();

  /* ================================================================ Copy, FAQ, year */

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.parentNode.querySelector('[data-copy-src]').textContent;
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(text).then(function () {
        btn.textContent = 'Copied';
        btn.classList.add('is-done');
        setTimeout(function () { btn.textContent = 'Copy'; btn.classList.remove('is-done'); }, 1600);
      }, function () {});
    });
  });

  $$('.faq__item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var body = item.querySelector('.faq__body');
    summary.addEventListener('click', function (e) {
      if (reduceMotion || !body.animate) return;
      e.preventDefault();
      if (item.open) {
        body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 360, easing: 'cubic-bezier(0.16,1,0.3,1)' })
          .onfinish = function () { item.open = false; };
      } else {
        item.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 520, easing: 'cubic-bezier(0.16,1,0.3,1)' });
      }
    });
  });

  var year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
