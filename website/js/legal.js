/* FlixView website: legal pages
 * Smooth scrolling, the nav and phone menu, the contents list that follows
 * your place, and the reading progress bar. Plain ES2019.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  var lenis = null;
  if (!reduceMotion && typeof window.Lenis === 'function') {
    lenis = new window.Lenis({ lerp: 0.1, autoRaf: true });
  }

  // Contents links glide to their section, landing below the nav.
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href^="#"]');
    if (!link) return;
    var target = $(link.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    closeMenu();
    var top = target.getBoundingClientRect().top + window.scrollY - 96;
    if (lenis) lenis.scrollTo(top, { duration: 1.2 });
    else window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
    history.replaceState(null, '', link.getAttribute('href'));
  });

  var nav = $('[data-nav]');
  var burger = $('[data-burger]');
  var menu = $('[data-menu]');

  function openMenu() {
    menu.hidden = false;
    requestAnimationFrame(function () { menu.classList.add('is-open'); });
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    if (lenis) lenis.stop();
  }
  function closeMenu() {
    if (!menu || menu.hidden) return;
    menu.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    if (lenis) lenis.start();
    setTimeout(function () { if (!menu.classList.contains('is-open')) menu.hidden = true; }, 400);
  }
  burger.addEventListener('click', function () {
    if (burger.getAttribute('aria-expanded') === 'true') closeMenu(); else openMenu();
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });

  var progress = $('[data-progress]');
  var tocLinks = $$('.legal__toc a');
  var sections = tocLinks.map(function (a) { return $(a.getAttribute('href')); });

  (function frame() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    nav.classList.toggle('is-solid', y > 40);
    var docH = document.documentElement.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (docH > 0 ? (y / docH).toFixed(4) : 0) + ')';
    var current = 0;
    sections.forEach(function (s, i) { if (s && s.getBoundingClientRect().top < vh * 0.35) current = i; });
    tocLinks.forEach(function (a, i) { a.classList.toggle('is-here', i === current); });
    requestAnimationFrame(frame);
  })();

  var revealer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-in'); revealer.unobserve(e.target); }
    });
  }, { threshold: 0.1 });
  $$('.reveal').forEach(function (el) { revealer.observe(el); });
  document.documentElement.classList.add('is-loaded');
  var hero = $('.legal');
  if (hero) hero.classList.add('is-ready');

  var year = $('[data-year]');
  if (year) year.textContent = String(new Date().getFullYear());
})();
