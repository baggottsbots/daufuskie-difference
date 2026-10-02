(function () {
  'use strict';

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- BARGE SCHEDULE DATA ----------
     Edit here to update the page. Format:
     Month | Day | Date | BCM Load | BCM Depart | FP Arrive | Time on DI  */
  var DATA = [
    'September|MON|28|6:00 AM|7:00 AM|8:30 AM|3 HOURS',
    'September|TUES|29|6:30 AM|7:30 AM|9:00 AM|3 HOURS',
    'September|WED|30|7:30 AM|8:30 AM|10:00 AM|3 HOURS',
    'October|THUR|1|8:30 AM|9:30 AM|11:00 AM|2 HOURS',
    'October|FRI|2|9:30 AM|10:30 AM|NOON|2 HOURS',
    'October|SAT|3|10:30 AM|11:30 AM|1:00 PM|2 HOURS',
    'October|SUN|4|11:30 AM|12:30 PM|2:00 PM|2 HOURS',
    'October|MON|5|12:30 PM|1:30 PM|3:00 PM|2 HOURS',
    'October|TUES|6|1:30 PM|2:30 PM|4:00 PM|2 HOURS',
    'October|WED|7|2:30 PM|3:30 PM|5:00 PM|2.5 HOURS',
    'October|THUR|8|3:30 PM|4:30 PM|6:00 PM|2.5 HOURS',
    'October|FRI|9|4:00 AM|5:00 AM|6:30 AM|2.5 HOURS',
    'October|SAT|10|4:30 AM|5:30 AM|7:00 AM|3 HOURS',
    'October|SUN|11|5:30 AM|6:30 AM|8:00 AM|2 HOURS',
    'October|MON|12|6:00 AM|7:00 AM|8:30 AM|3 HOURS',
    'October|TUES|13|6:30 AM|7:30 AM|9:00 AM|2.5 HOURS',
    'October|WED|14|7:00 AM|8:00 AM|9:30 AM|2.5 HOURS',
    'October|THUR|15|8:00 AM|9:00 AM|10:30 AM|2 HOURS',
    'October|FRI|16|8:30 AM|9:30 AM|11:00 AM|2 HOURS',
    'October|SAT|17|9:00 AM|10:00 AM|11:30 AM|2 HOURS',
    'October|SUN|18|10:00 AM|11:00 AM|12:30 PM|2 HOURS',
    'October|MON|19|11:00 AM|NOON|1:30 PM|2 HOURS',
    'October|TUES|20|NOON|1:00 PM|2:30 PM|2 HOURS',
    'October|WED|21|1:00 PM|2:00 PM|3:30 PM|2 HOURS',
    'October|THUR|22|2:00 PM|3:00 PM|4:30 PM|2 HOURS',
    'October|FRI|23|3:00 PM|4:00 PM|5:30 PM|2.5 HOURS',
    'October|SAT|24|3:30 PM|4:30 PM|6:00 PM|2.5 HOURS',
    'October|SUN|25|4:00 AM|5:00 AM|6:30 AM|2.5 HOURS',
    'October|MON|26|5:00 AM|6:00 AM|7:30 AM|3 HOURS',
    'October|TUES|27|5:30 AM|6:30 AM|8:00 AM|3 HOURS',
    'October|WED|28|6:30 AM|7:30 AM|9:00 AM|3 HOURS',
    'October|TUES|29|7:00 AM|8:00 AM|9:30 AM|3 HOURS',
    'October|WED|30|8:00 AM|9:00 AM|10:30 AM|2 HOURS',
    'November|SUN|1|9:00 AM|10:00 AM|11:30 AM|2 HOURS|1:30 PM|3:00 PM',
    'November|MON|2|10:30 AM|11:30 AM|1:00 PM|2 HOURS|3:00 PM|4:30 PM',
    'November|TUES|3|11:30 AM|12:30 PM|2:00 PM|2 HOURS|4:00 PM|5:30 PM',
    'November|WED|4|12:30 PM|1:30 PM|3:00 PM|2 HOURS|5:00 PM|6:30 PM',
    'November|THUR|5|1:30 PM|2:30 PM|4:00 PM|2.5 HOURS|6:30 PM|8:00 PM',
    'November|FRI|6|2:00 PM|3:00 PM|4:30 PM|2.5 HOURS|7:00 PM|8:30 PM',
    'November|SAT|7|3:00 PM|4:00 PM|5:30 PM|2.5 HOURS|8:00 PM|9:30 PM',
    'November|SUN|8|3:30 PM|4:30 PM|6:00 PM|2.5 HOURS|8:30 PM|10:00 PM',
    'November|MON|9|4:00 AM|5:00 AM|6:30 AM|2.5 HOURS|9:00 AM|10:30 AM',
    'November|TUES|10|4:30 AM|5:30 AM|7:00 AM|2.5 HOURS|9:30 AM|11:00 AM',
    'November|WED|11|5:00 AM|6:00 AM|7:30 AM|2.5 HOURS|10:00 AM|11:30 AM',
    'November|THUR|12|5:30 AM|6:30 AM|8:00 AM|2.5 HOURS|10:30 AM|12:00 PM',
    'November|FRI|13|6:30 AM|7:30 AM|9:00 AM|2 HOURS|11:00 AM|12:30 PM',
    'November|SAT|14|7:00 AM|8:00 AM|9:30 AM|2 HOURS|11:30 AM|1:00 PM',
    'November|SUN|15|7:30 AM|8:30 AM|10:00 AM|2 HOURS|12:00 PM|1:30 PM',
    'November|MON|16|8:30 AM|9:30 AM|11:00 AM|2 HOURS|1:00 PM|2:30 PM',
    'November|TUES|17|9:30 AM|10:30 AM|12:00 PM|2 HOURS|2:00 PM|3:30 PM',
    'November|WED|18|10:30 AM|11:30 AM|1:00 PM|2 HOURS|3:00 PM|4:30 PM',
    'November|THUR|19|11:30 AM|12:30 PM|2:00 PM|2 HOURS|4:00 PM|5:30 PM',
    'November|FRI|20|12:30 PM|1:30 PM|3:00 PM|2 HOURS|5:00 PM|6:30 PM',
    'November|SAT|21|1:30 PM|2:30 PM|4:00 PM|2 HOURS|6:00 PM|7:30 PM',
    'November|SUN|22|2:30 PM|3:30 PM|5:00 PM|2.5 HOURS|7:30 PM|9:00 PM',
    'November|MON|23|3:00 PM|4:00 PM|5:30 PM|3 HOURS|8:30 PM|10:00 PM',
    'November|TUES|24|3:30 PM|4:30 PM|6:00 PM|3 HOURS|9:00 PM|10:30 PM',
    'November|WED|25|4:00 AM|5:00 AM|6:30 AM|3 HOURS|9:30 AM|11:00 AM',
    'November|THUR|26|5:00 AM|6:00 AM|7:30 AM|3 HOURS|10:30 AM|12:00 PM',
    'November|FRI|27|6:00 AM|7:00 AM|8:30 AM|3 HOURS|11:30 AM|1:00 PM',
    'November|SAT|28|7:00 AM|8:00 AM|9:30 AM|2.5 HOURS|12:00 PM|1:30 PM',
    'November|SUN|29|8:00 AM|9:00 AM|10:30 AM|2 HOURS|12:30 PM|2:00 PM',
    'November|MON|30|9:00 AM|10:00 AM|11:30 AM|2 HOURS|1:30 PM|3:00 PM',
    'December|TUES|30|9:30 AM|10:30 AM|NOON|2 HOURS',
    'December|WED|31|10:30 AM|11:30 AM|1:00 PM|2 HOURS',
    'December|TUES|1|10:00 AM|11:00 AM|12:30 PM|2 HOURS',
    'December|WED|2|11:00 AM|NOON|1:30 PM|2 HOURS',
    'December|THUR|3|NOON|1:00 PM|2:30 PM|2 HOURS',
    'December|FRI|4|1:00 PM|2:00 PM|3:30 PM|2 HOURS',
    'December|SAT|5|2:00 PM|3:00 PM|4:30 PM|2 HOURS',
    'December|SUN|6|2:30 PM|3:30 PM|5:00 PM|2 HOURS',
    'December|MON|7|3:00 PM|4:00 PM|5:30 PM|2 HOURS',
    'December|TUES|8|3:30 PM|4:30 PM|6:00 PM|2 HOURS',
    'December|WED|9|4:00 AM|5:00 AM|6:30 AM|2 HOURS',
    'December|THUR|10|4:30 AM|5:30 AM|7:00 AM|2 HOURS',
    'December|FRI|11|5:30 AM|6:30 AM|8:00 AM|2 HOURS',
    'December|SAT|12|6:00 AM|7:00 AM|8:30 AM|2 HOURS',
    'December|SUN|13|6:30 AM|7:30 AM|9:00 AM|2 HOURS',
    'December|MON|14|7:00 AM|8:00 AM|9:30 AM|2 HOURS',
    'December|TUES|15|8:00 AM|9:00 AM|10:30 AM|2 HOURS',
    'December|WED|16|8:30 AM|9:30 AM|11:00 AM|2 HOURS',
    'December|THUR|17|9:30 AM|10:30 AM|NOON|2 HOURS',
    'December|FRI|18|10:30 AM|11:30 AM|1:00 PM|2 HOURS',
    'December|SAT|19|NOON|1:00 PM|2:30 PM|2 HOURS',
    'December|SUN|20|1:00 PM|2:00 PM|3:30 PM|2 HOURS',
    'December|MON|21|2:00 PM|3:00 PM|4:30 PM|2 HOURS',
    'December|TUES|22|3:00 PM|4:00 PM|5:30 PM|2.5 HOURS',
    'December|WED|23|3:30 PM|4:30 PM|6:00 PM|3 HOURS',
    'December|TUES|24|4:00 AM|5:00 AM|6:30 AM|3 HOURS',
    'December|WED|25|5:00 AM|6:00 AM|7:30 AM|3 HOURS',
    'December|FRI|26|6:00 AM|7:00 AM|8:30 AM|2.5 HOURS',
    'December|SAT|27|6:30 AM|7:30 AM|9:00 AM|2.5 HOURS',
    'December|SUN|28|7:30 AM|8:30 AM|10:00 AM|2 HOURS',
    'December|MON|29|8:30 AM|9:30 AM|11:00 AM|2 HOURS'
  ];

  var YEAR = 2026;
  var MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYNAMES = { MON:'Mon', TUES:'Tue', WED:'Wed', THUR:'Thu', FRI:'Fri', SAT:'Sat', SUN:'Sun' };

  var ROWS = DATA.map(function (line, i) {
    var p = line.split('|');
    var mi = MONTHS.indexOf(p[0]);
    return {
      i: i, month: p[0], mi: mi, dow: p[1], day: parseInt(p[2], 10),
      load: p[3], depart: p[4], arrive: p[5], stay: p[6],
      time: new Date(YEAR, mi, parseInt(p[2], 10)).getTime()
    };
  });

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
  ROWS.forEach(function (r) {
    if (r.time >= today && (!nextRow || r.time < nextRow.time)) nextRow = r;
  });
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
      var match = ROWS.filter(function (r) { return r.mi === mi && r.day === day; })[0];
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
    renderFilters();
    renderList();
    renderNext();
    initJump();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();