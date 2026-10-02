(function () {
  'use strict';

  /* =====================================================================
     EDITABLE CONTENT
     Update these lists when the schedules change. Dates use YYYY-MM-DD.
     Past dates hide automatically, so old rows can stay in the list.
     ===================================================================== */

  // Live music at Old Daufuskie Crab Company
  // day = weekday label as printed on the schedule; tag = special event name (optional)
  var EVENTS = [
    { date: '2026-09-29', day: 'Tue', artist: 'The Restless Natives', detail: 'Allman Brothers Tribute', start: '1:30 PM', end: '5:30 PM', tag: 'Take-Off Tuesday' },
    { date: '2026-09-30', day: 'Wed', artist: 'The Horan Brothers Band', start: '1:30 PM', end: '5:30 PM', tag: 'No-Work Wednesday' },
    { date: '2026-10-01', day: 'Wed', artist: 'Eric Daubert', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-02', day: 'Thu', artist: 'Whitley Deputy', start: '12:30 PM', end: '4:30 PM' },
    { date: '2026-10-03', day: 'Fri', artist: 'HBB', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-04', day: 'Sat', artist: 'The Bozwellz', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-07', day: 'Tue', artist: 'Pete Carroll', start: '6:00 PM', end: '9:00 PM' },
    { date: '2026-10-08', day: 'Wed', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-09', day: 'Thu', artist: 'Mike Bagenstose', start: '12:30 PM', end: '4:30 PM' },
    { date: '2026-10-10', day: 'Fri', artist: 'Ernest Ray Hendrix', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-11', day: 'Sat', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-14', day: 'Tue', artist: 'Josephine Johnson', start: '6:00 PM', end: '9:00 PM' },
    { date: '2026-10-15', day: 'Wed', artist: 'Eric Daubert', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-16', day: 'Thu', artist: 'Whitley Deputy', start: '12:30 PM', end: '4:30 PM' },
    { date: '2026-10-17', day: 'Fri', artist: 'Willie Jackson', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-18', day: 'Sat', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-21', day: 'Tue', artist: 'Wayne Altman', start: '6:00 PM', end: '9:00 PM' },
    { date: '2026-10-22', day: 'Wed', artist: 'Pete Carroll', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-23', day: 'Thu', artist: 'TBA', start: '12:30 PM', end: '4:30 PM' },
    { date: '2026-10-24', day: 'Fri', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-25', day: 'Sat', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-28', day: 'Tue', artist: 'Jack Keiser', start: '6:00 PM', end: '9:00 PM' },
    { date: '2026-10-29', day: 'Wed', artist: 'Mike Bagenstose', start: '1:00 PM', end: '5:00 PM' },
    { date: '2026-10-30', day: 'Thu', artist: 'TBA', start: '12:30 PM', end: '4:30 PM' },
    { date: '2026-10-31', day: 'Fri', artist: 'TBA', start: '1:00 PM', end: '5:00 PM' }
  ];

  var BARGE_SCHEDULE_URL = 'https://docs.google.com/spreadsheets/d/1pG55Y_qApu-7Mm0AdGRZdOoKFwrnOP4EEe_3hgg7Yf4/gviz/tq?tqx=out:csv&gid=1838050786';
  var BARGE_SCHEDULE = [];
  var BARGE_SCHEDULE_READY = false;
  var BARGE_SCHEDULE_ERROR = false;
  var BARGE_SCHEDULE_PROMISE = null;
  function parseCsvLine(line) {
    var out = [], cur = '', i = 0, q = false;
    while (i < line.length) {
      var ch = line.charAt(i);
      if (q) {
        if (ch === '"') {
          if (line.charAt(i + 1) === '"') { cur += '"'; i += 1; }
          else q = false;
        } else {
          cur += ch;
        }
      } else if (ch === ',') {
        out.push(cur); cur = '';
      } else if (ch === '"') {
        q = true;
      } else {
        cur += ch;
      }
      i += 1;
    }
    out.push(cur);
    return out;
  }
  function csvToRows(csv) {
    var rows = [], row = [], cur = '', i = 0, q = false;
    for (i = 0; i < csv.length; i++) {
      var ch = csv.charAt(i), next = csv.charAt(i + 1);
      if (q) {
        if (ch === '"' && next === '"') { cur += '"'; i++; }
        else if (ch === '"') q = false;
        else cur += ch;
      } else if (ch === '"') {
        q = true;
      } else if (ch === ',') {
        row.push(cur); cur = '';
      } else if (ch === '\n') {
        row.push(cur); rows.push(row); row = []; cur = '';
      } else if (ch !== '\r') {
        cur += ch;
      }
    }
    row.push(cur);
    rows.push(row);
    return rows;
  }
  function normalizeDate(value) {
    value = String(value || '').trim();
    if (!value) return '';
    var m = value.match(/^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/);
    if (m) {
      var year = m[3] ? (+m[3] < 100 ? 2000 + +m[3] : +m[3]) : 2026;
      return year + '-' + ('0' + m[1]).slice(-2) + '-' + ('0' + m[2]).slice(-2);
    }
    m = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return m[1] + '-' + ('0' + m[2]).slice(-2) + '-' + ('0' + m[3]).slice(-2);
    return '';
  }
  function loadBargeSchedule() {
    if (BARGE_SCHEDULE_PROMISE) return BARGE_SCHEDULE_PROMISE;
    BARGE_SCHEDULE_PROMISE = fetch(BARGE_SCHEDULE_URL, { cache: 'no-store' }).then(function (res) { return res.text(); }).then(function (csv) {
      var rows = csvToRows(csv);
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        var r = rows[i];
        if (!r || r.length < 8) continue;
        var date = normalizeDate(r[1]);
        var load = String(r[2] || '').trim();
        var depart = String(r[3] || '').trim();
        var arrive = String(r[4] || '').trim();
        var time = String(r[5] || '').trim();
        if (!date || !load || !depart || !arrive || !time) continue;
        data.push({ date: date, load: load, depart: depart, arrive: arrive, time: time, fpDepart: String(r[6] || '').trim(), bcmArrival: String(r[7] || '').trim() });
      }
      BARGE_SCHEDULE = data;
      BARGE_SCHEDULE_READY = true;
      BARGE_SCHEDULE_ERROR = !data.length;
      return data;
    }).catch(function () {
      BARGE_SCHEDULE = [];
      BARGE_SCHEDULE_READY = true;
      BARGE_SCHEDULE_ERROR = true;
      return [];
    });
    return BARGE_SCHEDULE_PROMISE;
  }

  /* ===================================================================== */

  var MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  var MONTHS_LONG = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function parseDate(iso) { var p = iso.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------- navigation ---------- */
  function buildNav() {
    var primary = $('#primaryNav');
    if (!primary) return;
    var page = document.body.getAttribute('data-page');
    var isHome = !page || page === 'home';
    if (!isHome) {
      $$('a[href^="#"]', primary).forEach(function (a) { a.setAttribute('href', '/' + a.getAttribute('href')); });
    }
    var html = primary.innerHTML;
    var mobile = $('#mobileNav'), footer = $('#footerNav');
    if (mobile) mobile.innerHTML = html;
    if (footer) footer.innerHTML = html;
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

  function initActiveLinks() {
    if (!('IntersectionObserver' in window)) return;
    var links = $$('#primaryNav a[href^="#"], #mobileNav a[href^="#"]');
    if (!links.length) return;
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); (map[id] = map[id] || []).push(a); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.classList.remove('is-active'); });
        (map[en.target.id] || []).forEach(function (a) { a.classList.add('is-active'); });
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ---------- live music ---------- */
  function renderEvents() {
    var grid = $('#eventGrid');
    var scroll = $('#eventScroll');
    if (!grid) return;
    var now = today();
    var upcoming = EVENTS.filter(function (e) { return parseDate(e.date) >= now; });
    if (!upcoming.length) {
      grid.innerHTML = '<div class="events-empty"><strong>New dates are being booked now.</strong><br>Call (843) 785-8242 for this week\'s lineup.</div>';
      return;
    }
    if (scroll) {
      scroll.scrollLeft = 0;
    }
    grid.innerHTML = upcoming.map(function (e, i) {
      var d = parseDate(e.date);
      var tba = /^tba$/i.test(e.artist);
      var cls = 'event' + (i === 0 ? ' is-next' : '') + (tba ? ' is-tba' : '');
      var tag = e.tag ? '<span class="tag">' + esc(e.tag) + '</span>' : (i === 0 ? '<span class="tag">Next up</span>' : '');
      return '<article class="' + cls + '">' +
        '<div class="event-date"><small>' + MONTHS[d.getMonth()] + '</small><b>' + d.getDate() + '</b><em>' + esc(e.day || DAYS[d.getDay()]) + '</em></div>' +
        '<div class="event-body"><h3>' + (tba ? 'Artist to be announced' : esc(e.artist)) + '</h3>' +
        '<span class="time">' + esc(e.start) + ' to ' + esc(e.end) + '</span>' +
        (e.detail ? '<span class="detail">' + esc(e.detail) + '</span>' : '') + tag + '</div></article>';
    }).join('');
  }

  /* ---------- live music page ---------- */
  var DAY_LONG = { Sun: 'Sunday', Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };
  function toMinutes(t) {
    var m = /(\d+):(\d+)\s*(AM|PM)/i.exec(t || '');
    if (!m) return 0;
    var h = (+m[1]) % 12;
    if (/pm/i.test(m[3])) h += 12;
    return h * 60 + (+m[2]);
  }
  function isTba(e) { return /^tba$/i.test(e.artist); }
  function dayLong(e, d) { return DAY_LONG[e.day] || DAY_LONG[DAYS[d.getDay()]]; }
  var MUSIC_FILTERS = {
    all: function () { return true; },
    afternoon: function (e) { return toMinutes(e.start) < 17 * 60; },
    evening: function (e) { return toMinutes(e.start) >= 17 * 60; },
    weekend: function (e) { return /^(fri|sat|sun)/i.test(e.day || ''); },
    confirmed: function (e) { return !isTba(e); }
  };
  function upcomingEvents() {
    var now = today();
    return EVENTS.filter(function (e) { return parseDate(e.date) >= now; });
  }

  function renderMusicSummary() {
    var next = $('#musicNext'), stats = $('#musicStats');
    var up = upcomingEvents();
    if (stats) {
      var confirmed = up.filter(function (e) { return !isTba(e); }).length;
      var evenings = up.filter(MUSIC_FILTERS.evening).length;
      stats.innerHTML = up.length ? '<span class="chip">' + up.length + ' upcoming shows</span><span class="chip">' + confirmed + ' confirmed artists</span><span class="chip">' + evenings + ' evening shows</span>' : '';
    }
    if (!next) return;
    if (!up.length) {
      next.innerHTML = '<span class="eyebrow">Coming soon</span><h2>New dates are being booked.</h2><p class="meta">Call (843) 785-8242 for this week\'s lineup.</p>';
      return;
    }
    var e = up[0], d = parseDate(e.date);
    next.innerHTML = '<span class="eyebrow">Next up</span>' +
      '<h2>' + (isTba(e) ? 'Artist to be announced' : esc(e.artist)) + '</h2>' +
      '<span class="when">' + dayLong(e, d) + ', ' + MONTHS_LONG[d.getMonth()] + ' ' + d.getDate() + '</span>' +
      '<span class="meta">' + esc(e.start) + ' to ' + esc(e.end) + ' on the deck at Old Daufuskie Crab Company</span>' +
      (e.detail ? '<span class="meta">' + esc(e.detail) + '</span>' : '') +
      (e.tag ? '<div class="mtags"><span class="mtag">' + esc(e.tag) + '</span></div>' : '');
  }

  function renderMusicPage(filter) {
    var list = $('#musicList');
    if (!list) return;
    var up = upcomingEvents();
    var nextDate = up.length ? up[0].date : null;
    var shown = up.filter(MUSIC_FILTERS[filter] || MUSIC_FILTERS.all);
    if (!shown.length) {
      list.innerHTML = '<div class="events-empty">' + (up.length ? 'No shows match that filter right now. Try another one.' : '<strong>New dates are being booked now.</strong><br>Call (843) 785-8242 for this week\'s lineup.') + '</div>';
      return;
    }
    var groups = [], cur = null;
    shown.forEach(function (e) {
      var d = parseDate(e.date), key = d.getFullYear() + '-' + d.getMonth();
      if (!cur || cur.key !== key) { cur = { key: key, label: MONTHS_LONG[d.getMonth()] + ' ' + d.getFullYear(), items: [] }; groups.push(cur); }
      cur.items.push(e);
    });
    list.innerHTML = groups.map(function (g) {
      return '<div class="mmonth"><h2>' + g.label + ' <small>' + g.items.length + (g.items.length === 1 ? ' show' : ' shows') + '</small></h2><div class="mrows">' +
        g.items.map(function (e) {
          var d = parseDate(e.date), tba = isTba(e), isNext = e.date === nextDate;
          var evening = toMinutes(e.start) >= 17 * 60;
          var tags = '';
          if (isNext) tags += '<span class="mtag">Next up</span>';
          if (e.tag) tags += '<span class="mtag">' + esc(e.tag) + '</span>';
          if (evening) tags += '<span class="mtag soft">Evening show</span>';
          return '<article class="mrow' + (isNext ? ' is-next' : '') + (tba ? ' is-tba' : '') + '">' +
            '<div class="event-date"><small>' + MONTHS[d.getMonth()] + '</small><b>' + d.getDate() + '</b><em>' + esc(e.day || DAYS[d.getDay()]) + '</em></div>' +
            '<div class="mrow-main"><h3>' + (tba ? 'Artist to be announced' : esc(e.artist)) + '</h3>' +
            '<span class="meta">' + dayLong(e, d) + (e.detail ? ' &middot; ' + esc(e.detail) : '') + '</span>' +
            (tags ? '<div class="mtags">' + tags + '</div>' : '') + '</div>' +
            '<div class="mrow-time tabular"><span>' + (evening ? 'Evening' : 'Afternoon') + '</span>' + esc(e.start) + ' to ' + esc(e.end) + '</div>' +
            '</article>';
        }).join('') + '</div></div>';
    }).join('');
  }

  function initMusicFilters() {
    var btns = $$('.mfilter');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        btns.forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        renderMusicPage(b.getAttribute('data-filter'));
        if (window.gsap) gsap.fromTo('#musicList .mrow', { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: .45, stagger: .03, ease: 'power2.out', overwrite: true });
        if (window.ScrollTrigger) ScrollTrigger.refresh();
      });
    });
  }

  /* ---------- simple page routing (home vs. live music page) ---------- */
  var HOME_TITLE = document.title;
  function route() {
    var home = $('#top'), music = $('#live-music-page');
    if (!home || !music) return;
    var isMusic = location.hash === '#live-music-page' || location.hash === '#lineup' && !music.hidden || /live-music/i.test(location.pathname);
    music.hidden = !isMusic;
    home.hidden = isMusic;
    document.title = isMusic ? 'Live Music Lineup | Old Daufuskie Crab Company at Freeport Marina' : HOME_TITLE;
    if (isMusic) {
      if (location.hash === '#lineup') { var l = $('#lineup'); if (l) l.scrollIntoView(); }
      else window.scrollTo(0, 0);
      if (window.gsap) gsap.fromTo('#live-music-page .music-hero-inner > *', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: .9, stagger: .12, ease: 'power3.out' });
    } else if (location.hash && location.hash.length > 1) {
      var t = document.getElementById(location.hash.slice(1));
      if (t) requestAnimationFrame(function () { t.scrollIntoView(); });
    }
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }

  /* ---------- barge schedule ---------- */
  function renderBarge() {
    var tbody = $('#bargeTable tbody');
    if (!tbody) return;
    if (BARGE_SCHEDULE_ERROR) {
      tbody.innerHTML = '<tr><td colspan="5">Schedule is temporarily unavailable. Please call 843-290-9336.</td></tr>';
      return;
    }
    var now = today(), lastMonth = -1, rows = [];
    BARGE_SCHEDULE.forEach(function (item) {
      var d = parseDate(item.date);
      if (d < now) return;
      if (d.getMonth() !== lastMonth) {
        lastMonth = d.getMonth();
        rows.push('<tr class="month"><td colspan="5">' + MONTHS_LONG[lastMonth] + ' ' + d.getFullYear() + '</td></tr>');
      }
      var isToday = d.getTime() === now.getTime();
      rows.push('<tr' + (isToday ? ' class="today"' : '') + '><td>' + DAYS[d.getDay()] + ', ' + MONTHS[d.getMonth()] + ' ' + d.getDate() + (isToday ? ' (today)' : '') + '</td><td>' + item.load + '</td><td>' + item.depart + '</td><td>' + item.arrive + '</td><td>' + item.time + '</td></tr>');
    });
    tbody.innerHTML = rows.length ? rows.join('') : '<tr><td colspan="5">Schedule is temporarily unavailable. Please call 843-290-9336.</td></tr>';
  }

  /* ---------- animation (GSAP) ---------- */
  function initAnimations() {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || !window.gsap) return;
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Hero entrance
    var title = $('#heroTitle');
    if (title) title.innerHTML = title.textContent.trim().split(/\s+/).map(function (w) { return '<span class="word">' + esc(w) + '</span>'; }).join('');
    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    tl.fromTo('.hero-media img', { scale: 1.12 }, { scale: 1, duration: 2.8, ease: 'power2.out' }, 0)
      .from('#heroScript', { opacity: 0, y: 16, duration: .8 }, .25)
      .from('#heroTitle .word', { opacity: 0, y: 46, duration: .9, stagger: .09 }, .4)
      .from('#heroSub', { opacity: 0, y: 20, duration: .8 }, .85)
      .from('#heroActions .btn', { opacity: 0, y: 16, duration: .6, stagger: .1 }, 1.05)
      .from('#heroFacts li', { opacity: 0, x: -10, duration: .5, stagger: .08 }, 1.25);

    // Hero parallax and waves
    gsap.to('.hero-media img', { yPercent: 14, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.wave-a', { xPercent: -50, duration: 18, ease: 'none', repeat: -1 });
    gsap.to('.wave-b', { xPercent: -50, duration: 27, ease: 'none', repeat: -1 });

    // Ticker
    var track = $('#tickerTrack');
    if (track) {
      track.innerHTML += track.innerHTML;
      var tick = gsap.to(track, { xPercent: -50, duration: 32, ease: 'none', repeat: -1 });
      track.parentNode.addEventListener('mouseenter', function () { tick.pause(); });
      track.parentNode.addEventListener('mouseleave', function () { tick.play(); });
    }

    // Section reveals: anything already on screen stays put, the rest rises in as you scroll
    var vh = window.innerHeight;
    if (scroll) {
      gsap.set(scroll, { overflowX: 'auto', overflowY: 'hidden' });
    }
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

    // Weddings parallax
    gsap.to('.weddings-media img', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.weddings', start: 'top bottom', end: 'bottom top', scrub: true } });

    // Keep scroll positions accurate when menus expand or images finish loading
    $$('details').forEach(function (d) { d.addEventListener('toggle', function () { ScrollTrigger.refresh(); }); });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  }

  /* ---------- boot ---------- */
  function init() {
    var y = $('#year'); if (y) y.textContent = new Date().getFullYear();
    buildNav();
    renderEvents();
    loadBargeSchedule().then(function () { renderBarge(); });
    renderMusicSummary();
    renderMusicPage('all');
    initMusicFilters();
    var grid = $('#eventGrid'); if (grid && grid.children.length > 1) grid.setAttribute('data-reveal-group', '');
    initMobileMenu();
    initHeader();
    initActiveLinks();
    route();
    window.addEventListener('hashchange', route);
    initAnimations();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

(function () {
  var player = document.getElementById('filmPlayer');
  var video = document.getElementById('filmVideo');
  var cover = document.getElementById('filmCover');
  if (!player || !video || !cover) return;
  cover.addEventListener('click', function () {
    video.controls = true;
    player.classList.add('is-playing');
    var p = video.play();
    if (p && p.catch) p.catch(function () { video.controls = true; });
  });
  video.addEventListener('ended', function () {
    player.classList.remove('is-playing');
    video.controls = false;
    video.currentTime = 0.1;
  });
})();