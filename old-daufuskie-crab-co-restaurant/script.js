(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- home URL ---------- */
  var PAGE_SLUG = 'old-daufuskie-crab-company';
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
    $$('[data-ferry]').forEach(function (a) { a.setAttribute('href', home + 'daufuskie-ferry-schedule/'); });
    $$('[data-barge]').forEach(function (a) { a.setAttribute('href', home + 'daufuskie-barge-schedule/'); });
  }

  /* ---------- navigation ---------- */
  function buildNav() {
    var primary = $('#primaryNav');
    if (!primary) return;
    var html = primary.innerHTML;
    var mobile = $('#mobileNav'), footer = $('#footerNav');
    if (mobile) mobile.innerHTML = html;
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
      menu.hidden = !state;
      if (state) header.classList.remove('is-hidden');
    }
    toggle.addEventListener('click', function () { setOpen(!open); });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && open) setOpen(false); });
    window.addEventListener('resize', function () { if (open && window.innerWidth > 1100) setOpen(false); });
  }
  function initHeader() {
    var header = $('#siteHeader'), catbar = $('#catbar');
    if (!header) return;
    var last = 0, ticking = false;
    function update() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      header.classList.toggle('is-scrolled', y > 40);
      var menuOpen = $('#navToggle').getAttribute('aria-expanded') === 'true';
      if (!menuOpen) header.classList.toggle('is-hidden', y > 360 && y > last + 4);
      if (y < last - 4) header.classList.remove('is-hidden');
      // Menu category bar slides up when the header hides
      if (catbar) catbar.classList.toggle('is-top', header.classList.contains('is-hidden'));
      last = y; ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  }

  /* ---------- menu category bar: highlight the section on screen ---------- */
  function initCategoryBar() {
    var nav = $('#catNav');
    if (!nav || !('IntersectionObserver' in window)) return;
    var links = $$('a[data-cat]', nav);
    function setActive(id) {
      links.forEach(function (a) {
        var on = a.getAttribute('data-cat') === id;
        a.classList.toggle('is-active', on);
        if (on) {
          var left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
          nav.scrollTo({ left: left, behavior: 'smooth' });
        }
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
    }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
    links.forEach(function (a) {
      var t = document.getElementById(a.getAttribute('data-cat'));
      if (t) io.observe(t);
    });
  }

  /* ---------- boot ---------- */
  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    fixHomeLinks();
    buildNav();
    initMobileMenu();
    initHeader();
    initCategoryBar();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();