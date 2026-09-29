(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- home URL ----------
     On the live site (custom domain or GitHub Pages) this page lives at
     .../contact/, so home is the folder above it. On the PayMeGPT preview
     link it falls back to PREVIEW_HOME (update it to the published home page). */
  var PAGE_SLUG = 'contact';
  var PREVIEW_HOME = 'https://paymegpt.com/p/eAxhaRC';
  function homeUrl() {
    var path = location.pathname;
    var i = path.indexOf('/' + PAGE_SLUG);
    if (i > -1) return path.slice(0, i) + '/';
    if (/paymegpt\.com$/i.test(location.hostname)) return PREVIEW_HOME;
    return '../';
  }

  function fixHomeLinks() {
    var home = homeUrl();
    $$('[data-home]').forEach(function (a) { a.setAttribute('href', home); });
    $$('[data-home-section]').forEach(function (a) { a.setAttribute('href', home + '#' + a.getAttribute('data-home-section')); });
  }

  /* ---------- navigation ---------- */
  function buildNav() {
    var primary = $('#primaryNav');
    if (!primary) return;
    var html = primary.innerHTML;
    var mobile = $('#mobileNav'), footer = $('#footerNav');
    if (mobile) {
      mobile.innerHTML = html;
      var ferryLink = mobile.querySelector('a[href="../daufuskie-difference-ferry/"]');
      if (ferryLink) ferryLink.href = 'https://daufuskiedifference.com/daufuskie-difference-ferry/';
    }
    if (footer) {
      footer.innerHTML = html;
      $$('.is-active', footer).forEach(function (a) { a.classList.remove('is-active'); });
    }
  }

  function initMobileMenu() {
    var toggle = $('#navToggle'), menu = $('#mobileMenu'), header = $('#siteHeader');
    if (!toggle || !menu) return;
    var open = false;
    function setOpen(state) {
      open = state;
      toggle.setAttribute('aria-expanded', String(state));
      toggle.setAttribute('aria-label', state ? 'Close menu' : 'Open menu');
      document.body.style.overflow = state ? 'hidden' : '';
      if (state) {
        menu.hidden = false;
        header.classList.remove('is-hidden');
        if (window.gsap) gsap.fromTo($$('#mobileNav li', menu), { opacity: 0, x: -18 }, { opacity: 1, x: 0, duration: .5, stagger: .06, ease: 'power3.out', overwrite: true });
      } else {
        menu.hidden = true;
      }
    }
    toggle.addEventListener('click', function () { setOpen(!open); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    window.addEventListener('resize', function () { if (open && window.innerWidth > 1100) setOpen(false); });
  }

  function initHeader() {
    var header = $('#siteHeader');
    if (!header) return;
    var last = 0, ticking = false;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle('is-scrolled', y > 40);
      var menuOpen = $('#navToggle').getAttribute('aria-expanded') === 'true';
      if (!menuOpen) header.classList.toggle('is-hidden', y > 360 && y > last + 4);
      if (y < last - 4) header.classList.remove('is-hidden');
      last = y; ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- animation (GSAP) ---------- */
  function initAnimations() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Hero entrance and parallax
    gsap.fromTo('.music-hero-media img', { scale: 1.12 }, { scale: 1, duration: 2.8, ease: 'power2.out' });
    gsap.fromTo('.music-hero-inner > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' });
    gsap.to('.music-hero-media img', { yPercent: 10, ease: 'none', scrollTrigger: { trigger: '.music-hero', start: 'top top', end: 'bottom top', scrub: true } });

    // Section reveals: anything already on screen stays put, the rest rises in as you scroll
    var vh = window.innerHeight;
    $$('[data-reveal]').forEach(function (el) {
      if (el.getBoundingClientRect().top < vh * .92) return;
      gsap.set(el, { opacity: 0, y: 30 });
      ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: function () { gsap.to(el, { opacity: 1, y: 0, duration: .9, ease: 'power3.out', overwrite: true }); } });
    });
    $$('[data-reveal-group]').forEach(function (group) {
      if (group.getBoundingClientRect().top < vh * .92) return;
      var items = Array.prototype.slice.call(group.children);
      gsap.set(items, { opacity: 0, y: 30 });
      ScrollTrigger.create({ trigger: group, start: 'top 85%', once: true, onEnter: function () { gsap.to(items, { opacity: 1, y: 0, duration: .8, stagger: .09, ease: 'power3.out', overwrite: true }); } });
    });

    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- boot ---------- */
  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    fixHomeLinks();
    buildNav();
    initMobileMenu();
    initHeader();
    initAnimations();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();