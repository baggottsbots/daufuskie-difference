(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- BARGE SCHEDULE DATA: live Google Sheet ---------- */
  var SHEET_URL = 'https://docs.google.com/spreadsheets/d/1pG55Y_qApu-7Mm0AdGRZdOoKFwrnOP4EEe_3hgg7Yf4/gviz/tq?tqx=out:csv&gid=1838050786';
  var YEAR = 2026;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYNAMES = { MON:'Mon', TUES:'Tue', WED:'Wed', THUR:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun' };
  var ROWS = [];

  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, '');
    var records = [], row = [], field = '', quoted = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else quoted = false;
        } else field += c;
      } else if (c === '"' && !field.length) {
        quoted = true;
      } else if (c === ',') {
        row.push(field); field = '';
      } else if (c === '\r' || c === '\n') {
        row.push(field); records.push(row); row = []; field = '';
        if (c === '\r' && text[i + 1] === '\n') i++;
      } else field += c;
    }
    if (quoted) throw new Error('Invalid CSV');
    if (field.length || row.length) { row.push(field); records.push(row); }
    return records.filter(function (r) { return r.some(function (v) { return v.trim(); }); });
  }

  function parseSheetDate(value) {
    var s = value.trim(), m, y, mi, day;
    if (!s) return null;
    if ((m = /^Date\(\s*(\d{4}),\s*(\d{1,2}),\s*(\d{1,2})(?:,\s*\d+)*\s*\)$/i.exec(s))) {
      y = +m[1]; mi = +m[2]; day = +m[3];
    } else if ((m = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/.exec(s))) {
      y = m[3] ? +m[3] : YEAR; mi = +m[1] - 1; day = +m[2];
    } else if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ].*)?$/.exec(s))) {
      y = +m[1]; mi = +m[2] - 1; day = +m[3];
    } else {
      s = s.replace(/^(?:Sun(?:day)?|Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?),?\s+/i, '');
      if (!/\b\d{4}\b/.test(s)) s += ' ' + YEAR;
      var parsed = new Date(s);
      if (isNaN(parsed.getTime())) return null;
      y = parsed.getFullYear(); mi = parsed.getMonth(); day = parsed.getDate();
    }
    var date = new Date(y, mi, day);
    return date.getFullYear() === y && date.getMonth() === mi && date.getDate() === day ? date : null;
  }

  function escapeSheetText(value) {
    return value.replace(/[&<>"']/g, function (c) {
      return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
    });
  }

  function loadSchedule() {
    return fetch(SHEET_URL, { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Schedule fetch failed');
      return response.text();
    }).then(function (text) {
      var records = parseCSV(text);
      if (!records.length) throw new Error('Empty schedule');
      var headers = records.shift().map(function (h) { return h.trim().replace(/\s+/g, ' ').toUpperCase(); });
      var required = ['DAY', 'DATE', 'BCM LOAD', 'BCM DEPART', 'FP ARRIVE', 'TIME ON DI', 'FP DEPART', 'BCM ARRIVAL'];
      if (!required.every(function (h) { return headers.indexOf(h) !== -1; })) throw new Error('Invalid schedule headers');
      var days = ['SUN', 'MON', 'TUES', 'WED', 'THUR', 'FRI', 'SAT'];
      ROWS = [];
      records.forEach(function (record) {
        function cell(name) { return (record[headers.indexOf(name)] || '').trim(); }
        var date = parseSheetDate(cell('DATE'));
        if (!date || !cell('BCM LOAD') || !cell('BCM DEPART') || !cell('FP ARRIVE') || !cell('TIME ON DI')) return;
        var dow = cell('DAY');
        var dayKey = { SUN:'SUN', MON:'MON', TUE:'TUES', WED:'WED', THU:'THUR', FRI:'FRI', SAT:'SAT' }[dow.slice(0, 3).toUpperCase()];
        ROWS.push({
          i: ROWS.length, month: MONTHS[date.getMonth()], mi: date.getMonth(),
          dow: dow ? (dayKey || escapeSheetText(dow)) : days[date.getDay()],
          day: date.getDate(), year: date.getFullYear(),
          load: escapeSheetText(cell('BCM LOAD')), depart: escapeSheetText(cell('BCM DEPART')),
          arrive: escapeSheetText(cell('FP ARRIVE')), stay: escapeSheetText(cell('TIME ON DI')),
          fpDepart: cell('FP DEPART'), bcmArrival: cell('BCM ARRIVAL'),
          time: date.getTime()
        });
      });
      if (!ROWS.length) throw new Error('No valid schedule rows');
      ROWS.sort(function (a, b) { return a.time - b.time || a.i - b.i; });
      today = startOfToday();
      nextRow = null;
      ROWS.forEach(function (r) {
        if (r.time >= today && (!nextRow || r.time < nextRow.time)) nextRow = r;
      });
      function inputDate(r) {
        return r.year + '-' + ('0' + (r.mi + 1)).slice(-2) + '-' + ('0' + r.day).slice(-2);
      }
      $('#jumpDate').min = inputDate(ROWS[0]);
      $('#jumpDate').max = inputDate(ROWS[ROWS.length - 1]);
      renderFilters();
      renderList();
      renderNext();
      initJump();
    }).catch(function () {
      $('#scheduleList').innerHTML = '<div class="empty">Schedule is temporarily unavailable. Please call (843) 290-9336.</div>';
      $('#nextTitle').textContent = 'Call for upcoming dates';
    });
  }

  function pretty(t) { return t === 'NOON' ? 'Noon' : t; }
  function stayText(s) { return s.toLowerCase().replace('hours', 'hrs'); }
  function startOfToday() { var d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }

  /* ---------- home URL ---------- */
  var PAGE_SLUG = 'daufuskie-barge-schedule';
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

  /* ---------- schedule rendering ---------- */
  var today = startOfToday();
  var nextRow = null;
  var activeMonth = 'all';

  function rowHtml(r) {
    var isToday = r.time === today;
    var isNext = nextRow && r.i === nextRow.i;
    var cls = 'brow' + (isToday ? ' is-today' : '') + (isNext && !isToday ? ' is-next' : '');
    var tag = isToday ? '<span class="mtag">Today</span>' : (isNext ? '<span class="mtag">Next barge</span>' : '');
    return '<li class="' + cls + '" data-idx="' + r.i + '" id="d-' + r.mi + '-' + r.day + '-' + r.i + '">' +
      '<div class="event-date"><small>' + r.month.slice(0, 3) + '</small><b>' + r.day + '</b><em>' + (DAYNAMES[r.dow] || r.dow) + '</em></div>' +
      '<div class="cell load"><span class="lab">BCM Load</span><span class="val tabular">' + pretty(r.load) + '</span>' + tag + '</div>' +
      '<div class="cell depart"><span class="lab">BCM Depart</span><span class="val tabular">' + pretty(r.depart) + '</span></div>' +
      '<div class="cell arrive"><span class="lab">FP Arrive</span><span class="val tabular">' + pretty(r.arrive) + '</span></div>' +
      '<div class="cell stay"><span class="lab">Time on DI</span><span class="val">' + r.stay.toLowerCase() + '</span></div>' +
      '</li>';
  }

  function renderList() {
    var box = $('#scheduleList');
    var groups = [];
    ROWS.forEach(function (r) {
      if (activeMonth !== 'all' && r.month !== activeMonth) return;
      var g = groups[groups.length - 1];
      if (!g || g.month !== r.month) { g = { month: r.month, rows: [] }; groups.push(g); }
      g.rows.push(r);
    });
    if (!groups.length) { box.innerHTML = '<div class="empty">No barge dates listed for this month yet. Call (843) 290-9336.</div>'; return; }
    box.innerHTML = groups.map(function (g) {
      return '<section class="mmonth" aria-label="' + g.month + '">' +
        '<h2>' + g.month + ' <small>' + g.rows.length + ' listed ' + (g.rows.length === 1 ? 'day' : 'days') + '</small></h2>' +
        '<div class="colhead" aria-hidden="true"><span>Date</span><span>BCM Load</span><span>BCM Depart</span><span>FP Arrive</span><span>Time on DI</span></div>' +
        '<ul class="mrows tabular">' + g.rows.map(rowHtml).join('') + '</ul></section>';
    }).join('');
  }

  function renderFilters() {
    var seen = [];
    ROWS.forEach(function (r) { if (seen.indexOf(r.month) === -1) seen.push(r.month); });
    var opts = ['all'].concat(seen);
    var box = $('#filters');
    box.innerHTML = opts.map(function (m) {
      return '<button type="button" class="mfilter" data-month="' + m + '" aria-pressed="' + (m === activeMonth) + '">' + (m === 'all' ? 'All dates' : m) + '</button>';
    }).join('');
    box.addEventListener('click', function (e) {
      var b = e.target.closest('.mfilter'); if (!b) return;
      activeMonth = b.getAttribute('data-month');
      $$('.mfilter', box).forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      renderList();
    });
  }

  function renderNext() {
    var title = $('#nextTitle'), times = $('#nextTimes'), island = $('#nextIsland'), eyebrow = $('#nextEyebrow');
    if (!nextRow) {
      eyebrow.textContent = 'Barge schedule';
      title.textContent = 'Call for upcoming dates';
      return;
    }
    var r = nextRow;
    eyebrow.textContent = r.time === today ? 'Barge today' : 'Next barge';
    title.textContent = (DAYNAMES[r.dow] || r.dow) + ', ' + r.month.slice(0, 3) + ' ' + r.day;
    $('#nextLoad').textContent = pretty(r.load);
    $('#nextDepart').textContent = pretty(r.depart);
    $('#nextArrive').textContent = pretty(r.arrive);
    island.textContent = r.stay.toLowerCase() + ' on Daufuskie';
    times.hidden = false; island.hidden = false;
  }

  /* ---------- jump to date ---------- */
  function initJump() {
    var input = $('#jumpDate'), msg = $('#jumpMsg');
    input.addEventListener('change', function () {
      var v = input.value; if (!v) return;
      var p = v.split('-');
      var mi = parseInt(p[1], 10) - 1, day = parseInt(p[2], 10);
      var match = ROWS.filter(function (r) { return r.year === parseInt(p[0], 10) && r.mi === mi && r.day === day; })[0];
      msg.hidden = false;
      if (!match) {
        msg.textContent = 'No barge listed for that date. Please call (843) 290-9336.';
        return;
      }
      msg.textContent = 'Showing ' + match.month + ' ' + match.day + '.';
      if (activeMonth !== 'all' && activeMonth !== match.month) {
        activeMonth = 'all';
        $$('.mfilter').forEach(function (x) { x.setAttribute('aria-pressed', String(x.getAttribute('data-month') === 'all')); });
        renderList();
      }
      var el = $('.brow[data-idx="' + match.i + '"]');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.classList.remove('is-flash'); void el.offsetWidth; el.classList.add('is-flash');
      }
    });
  }

  /* ---------- boot ---------- */
  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    fixHomeLinks();
    buildNav();
    initMobileMenu();
    initHeader();
    loadSchedule();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();