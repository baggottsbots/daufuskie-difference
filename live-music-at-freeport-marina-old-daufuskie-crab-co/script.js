(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var scheduleState = { rows: [], filtersBound: false, currentFilter: 'all' };
  var refreshTimer = null;

  /* ---------- home URL ----------
     TEMPLATE NOTE: change PAGE_SLUG to this page's folder name (for example
     'about' or 'live-music'). On the live site the page lives at .../PAGE_SLUG/,
     so home is the folder above it. On the PayMeGPT preview link it falls
     back to PREVIEW_HOME, so update that URL to the published home page. */
  var PAGE_SLUG = 'live-music';
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

  /* ---------- schedule: next show, past dates, filters ---------- */
  function parseSheetDate(value) {
    if (!value) return null;
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      var m = value.match(/^Date\((\d{4}),(\d{1,2}),(\d{1,2})\)$/);
      if (m) return [m[1], String(parseInt(m[2], 10) + 1).padStart(2, '0'), String(m[3]).padStart(2, '0')].join('-');
    }
    if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
      return value.getFullYear() + '-' + String(value.getMonth() + 1).padStart(2, '0') + '-' + String(value.getDate()).padStart(2, '0');
    }
    var d = new Date(value);
    if (!isNaN(d.getTime())) {
      var y = d.getFullYear();
      var m = String(d.getMonth() + 1).padStart(2, '0');
      var day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    }
    return null;
  }

  function formatDayLabel(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'long' }).format(d);
  }

  function formatDisplayDate(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    var parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).formatToParts(d);
    var month = parts.find(function (p) { return p.type === 'month'; }).value;
    var day = parts.find(function (p) { return p.type === 'day'; }).value;
    return { month: month, day: day };
  }

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  function formatWhen(day, dateStr, start, end) {
    return day + ', ' + formatDisplayDate(dateStr).month + ' ' + formatDisplayDate(dateStr).day + ' from ' + start + ' to ' + end;
  }

  function timeToMinutes(text) {
    if (!text) return null;
    var s = String(text).trim();
    var m = s.match(/^(\d{1,2})(?::(\d{2}))?\s*([AP]M)$/i);
    if (!m) return null;
    var h = parseInt(m[1], 10) % 12;
    if (m[3].toUpperCase() === 'PM') h += 12;
    return h * 60 + parseInt(m[2] || '0', 10);
  }

  function groupLabel(dateStr) {
    var d = new Date(dateStr + 'T12:00:00');
    return new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric' }).format(d);
  }

  function buildWeekLabel(startDate, endDate) {
    var s = formatDisplayDate(startDate), e = formatDisplayDate(endDate);
    return s.month + ' ' + s.day + ' to ' + e.month + ' ' + e.day;
  }

  function renderSchedule(rows) {
    var container = $('#scheduleWeeks');
    var fallback = $('#scheduleFallback');
    if (!container) return;
    if (fallback) fallback.hidden = true;
    if (!rows.length) {
      container.innerHTML = '<div class="week" data-reveal><h3 class="week-title">No entries yet</h3><ul class="show-list"><li class="show"><div class="show-main"><h4>The schedule will appear here once the sheet has rows.</h4><div class="show-meta"></div></div></li></ul></div>';
      applyScheduleState([]);
      initFilters();
      updateNextUp([]);
      return;
    }
    rows.sort(function (a, b) { return a.date.localeCompare(b.date) || (a.startMinutes - b.startMinutes); });
    var html = '';
    var i = 0;
    while (i < rows.length) {
      var start = rows[i].date, end = rows[i].date, bucket = [];
      bucket.push(rows[i]);
      i++;
      while (i < rows.length) {
        var current = new Date(rows[i].date + 'T12:00:00');
        var prev = new Date(bucket[bucket.length - 1].date + 'T12:00:00');
        var diff = Math.floor((current - prev) / 86400000);
        if (diff <= 3) { bucket.push(rows[i]); end = rows[i].date; i++; } else break;
      }
      html += '<div class="week" data-reveal><h3 class="week-title">' + escapeHTML(buildWeekLabel(start, end)) + '</h3><ul class="show-list">';
      bucket.forEach(function (row) { html += row.html; });
      html += '</ul></div>';
    }
    container.innerHTML = html;
    applyScheduleState(rows);
    initFilters();
    updateNextUp(rows);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function getNYDateTime() {
    var parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
    var o = {};
    parts.forEach(function (p) { o[p.type] = p.value; });
    return {
      date: o.year + '-' + o.month + '-' + o.day,
      minutes: (parseInt(o.hour, 10) * 60) + parseInt(o.minute, 10)
    };
  }

  function updateNextUp(rows) {
    var now = getNYDateTime();
    var next = null;
    rows.forEach(function (r) {
      if (next) return;
      if (r.date > now.date || (r.date === now.date && r.endMinutes > now.minutes)) next = r;
    });
    var name = $('#nextName'), when = $('#nextWhen');
    if (next) {
      if (name) name.textContent = next.artist;
      if (when) when.textContent = next.when;
    } else {
      if (name) name.textContent = 'Loading schedule…';
      if (when) when.textContent = 'Checking the latest live music dates.';
    }
  }

  function applyScheduleState(rows) {
    var now = getNYDateTime();
    var nextFound = false;
    $$('.show').forEach(function (r) {
      var date = r.getAttribute('data-date') || '';
      var endMinutes = parseInt(r.getAttribute('data-end-minutes') || '0', 10) || 0;
      var isPast = !!date && (date < now.date || (date === now.date && endMinutes <= now.minutes));
      var isUpcoming = !!date && (date > now.date || (date === now.date && endMinutes > now.minutes));
      r.classList.toggle('is-past', isPast);
      if (!nextFound && isUpcoming) {
        r.classList.add('is-next');
        nextFound = true;
      } else {
        r.classList.remove('is-next');
      }
    });
  }

  function applyFilter(filter) {
    scheduleState.currentFilter = filter;
    var weeks = $$('.week');
    $$('.filter').forEach(function (b) { b.setAttribute('aria-pressed', String(b.getAttribute('data-filter') === filter)); });
    $$('.show').forEach(function (r) {
      var ok = filter === 'all' || (filter === 'announced' ? r.getAttribute('data-tba') === '0' : r.getAttribute('data-slot') === filter);
      r.hidden = !ok;
    });
    weeks.forEach(function (w) { w.hidden = !$$('.show:not([hidden])', w).length; });
    applyScheduleState(scheduleState.rows);
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  function initFilters() {
    var group = $('.filters');
    if (!group || scheduleState.filtersBound) return;
    scheduleState.filtersBound = true;
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.filter');
      if (!btn) return;
      applyFilter(btn.getAttribute('data-filter') || 'all');
    });
    applyFilter(scheduleState.currentFilter || 'all');
  }

  function parseGoogleVisualisationResponse(text) {
    var match = String(text || '').match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);\s*$/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return null;
    }
  }

  function normalizeSheetRows(result) {
    if (!result || !result.table || !Array.isArray(result.table.rows)) return [];
    var cols = Array.isArray(result.table.cols) ? result.table.cols : [];
    var labels = cols.map(function (col) { return col && (col.label || col.id || ''); });
    return result.table.rows.map(function (row) {
      var obj = {};
      (row.c || []).forEach(function (cell, idx) {
        var key = labels[idx];
        if (!key) return;
        var value = cell ? (cell.f != null && cell.f !== '' ? cell.f : cell.v) : '';
        if (cell && cell.v && typeof cell.v === 'string' && /^Date\(\d{4},\d{1,2},\d{1,2}\)$/.test(cell.v)) value = cell.v;
        obj[key] = value;
      });
      return obj;
    });
  }

  function buildSheetRow(item) {
    var day = String(item.Day || item.day || '').trim();
    var date = parseSheetDate(item.Date || item.date);
    var performer = String(item.Performer || item.performer || '').trim();
    var startValue = item['Time Start'] || item['Time Start '] || item['Start'] || item.start || '';
    var endValue = item.End || item.end || '';
    var start = String(startValue && typeof startValue === 'object' && startValue.f != null ? startValue.f : startValue).trim();
    var end = String(endValue && typeof endValue === 'object' && endValue.f != null ? endValue.f : endValue).trim();
    if (!date || !start || !end) return null;
    var announced = performer && performer.toLowerCase() !== 'to be announced';
    var tba = announced ? '0' : '1';
    var slot = timeToMinutes(start) === 18 * 60 ? 'evening' : 'afternoon';
    var display = formatDisplayDate(date);
    var when = formatWhen(day || formatDayLabel(date), date, start, end);
    var safeArtist = performer || 'To be announced';
    var safeDay = escapeHTML(day || formatDayLabel(date));
    var safeStart = escapeHTML(start);
    var safeEnd = escapeHTML(end);
    return {
      date: date,
      start: start,
      end: end,
      startMinutes: timeToMinutes(start) || 0,
      endMinutes: timeToMinutes(end) || 0,
      slot: slot,
      tba: tba,
      artist: safeArtist,
      when: when,
      html: '<li class="show' + (tba === '1' ? ' is-tba' : '') + '" data-date="' + escapeHTML(date) + '" data-start="' + escapeHTML(start.replace(/\s+/g, '')) + '" data-end="' + escapeHTML(end.replace(/\s+/g, '')) + '" data-end-minutes="' + escapeHTML(String(timeToMinutes(end) || 0)) + '" data-slot="' + escapeHTML(slot) + '" data-tba="' + escapeHTML(tba) + '" data-artist="' + escapeHTML(safeArtist) + '" data-when="' + escapeHTML(when) + '">' +
        '<time class="show-date" datetime="' + escapeHTML(date) + '"><span>' + escapeHTML(display.month) + '</span><b>' + escapeHTML(display.day) + '</b></time>' +
        '<div class="show-main"><h4>' + escapeHTML(safeArtist) + '</h4><div class="show-meta">' + (slot === 'evening' ? '<span class="tag">Evening</span>' : '') + '</div></div>' +
        '<div class="show-when"><span class="day">' + safeDay + '</span><span class="time tabular">' + safeStart + ' to ' + safeEnd + '</span></div>' +
      '</li>'
    };
  }

  function fetchSchedule() {
    var container = $('#scheduleWeeks');
    var fallback = $('#scheduleFallback');
    var url = 'https://docs.google.com/spreadsheets/d/1UpAYvk__51Obgm2GkAPSMNoNLTU8fteYQld7qbi2VJ8/gviz/tq?tqx=out:json';
    if (!container) return;
    fetch(url).then(function (r) { return r.text(); }).then(function (text) {
      var parsed = parseGoogleVisualisationResponse(text);
      if (!parsed || !parsed.table || !Array.isArray(parsed.table.rows)) {
        throw new Error('Invalid gviz response');
      }
      var rows = normalizeSheetRows(parsed).map(buildSheetRow).filter(Boolean);
      scheduleState.rows = rows;
      if (!rows.length) {
        container.innerHTML = '<div class="week" data-reveal><h3 class="week-title">No entries yet</h3><ul class="show-list"><li class="show"><div class="show-main"><h4>The schedule will appear here once the sheet has rows.</h4><div class="show-meta"></div></div></li></ul></div>';
        if (fallback) fallback.hidden = true;
        applyScheduleState([]);
        initFilters();
        updateNextUp([]);
        return;
      }
      renderSchedule(rows);
    }).catch(function () {
      if (fallback) fallback.hidden = false;
      if (container) container.innerHTML = '';
      applyScheduleState([]);
      initFilters();
      updateNextUp([]);
    });
  }

  function initSchedule() {
    fetchSchedule();
    setInterval(fetchSchedule, 300000);
  }

  /* ---------- boot ---------- */
  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    fixHomeLinks();
    buildNav();
    initMobileMenu();
    initHeader();
    initAnimations();
    initSchedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();