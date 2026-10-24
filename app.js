/* Shell: module registry, tabs, drills, local progress. */
(function () {
  'use strict';

  var MODULES = window.MODULES || [];
  var STORE_KEY = 'bess.v3';
  var VIEWS = ['learn', 'calc', 'drill'];

  var state = { moduleId: MODULES[0] ? MODULES[0].id : 'm1', view: 'learn', progress: {} };

  try {
    var raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* private mode */ }

  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* ignore */ }
  }

  function current() {
    for (var i = 0; i < MODULES.length; i++) if (MODULES[i].id === state.moduleId) return MODULES[i];
    return MODULES[0];
  }

  function prog() {
    var id = current().id;
    if (!state.progress[id]) state.progress[id] = { solved: {}, current: 0 };
    return state.progress[id];
  }

  function num(el) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  }

  function norm(s) {
    return String(s).toLowerCase()
      .replace(/[^a-z0-9äöüß ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* ---------- views ---------- */
  function show(view) {
    state.view = view;
    VIEWS.forEach(function (v) {
      document.getElementById('view-' + v).hidden = v !== view;
      var tab = document.getElementById('tab-' + v);
      tab.classList.toggle('active', v === view);
      tab.setAttribute('aria-selected', v === view ? 'true' : 'false');
    });
    if (view === 'drill') renderDrill();
    try { history.replaceState(null, '', '#' + current().id + '/' + view); } catch (e) { /* file:// */ }
    try { window.scrollTo(0, 0); } catch (e) { /* jsdom */ }
  }

  /* ---------- learn ---------- */
  function renderLearn() {
    var m = current();
    var host = document.getElementById('lesson');
    var html = '';

    html += '<header class="lesson-head">' +
      '<p class="kicker">Module ' + m.number + '</p>' +
      '<h1>' + m.title + '</h1>' +
      '<p class="lead">' + m.lead + '</p></header>';

    m.sections.forEach(function (s) {
      html += '<section class="card"><h2>' + s.h + '</h2>';
      s.p.forEach(function (p) { html += '<p>' + p + '</p>'; });
      if (s.formula) html += '<pre class="formula">' + s.formula + '</pre>';
      html += '</section>';
    });

    host.innerHTML = html;

    if (typeof m.renderExtra === 'function') {
      var extra = document.createElement('div');
      extra.id = 'extra-host';
      host.appendChild(extra);
      m.renderExtra(extra);
    }
  }

  /* ---------- calculator ---------- */
  function renderCalc() {
    var m = current();
    var host = document.getElementById('calc-host');
    if (!m.calc) { host.innerHTML = '<div class="card"><p class="muted">No calculator in this module.</p></div>'; return; }
    host.innerHTML = m.calc.html;
    if (typeof m.calc.init === 'function') m.calc.init(host);
  }

  /* ---------- drills ---------- */
  function drills() { return current().drills || []; }

  function solvedCount() {
    var p = prog();
    return drills().filter(function (d) { return p.solved[d.id]; }).length;
  }

  function updateProgress() {
    var total = drills().length || 1;
    var n = solvedCount();
    document.getElementById('bar').style.width = Math.round((n / total) * 100) + '%';
    document.getElementById('count').textContent = n + ' / ' + drills().length + ' solved';
  }

  function nextUnsolved(from) {
    var list = drills(), p = prog();
    for (var step = 1; step <= list.length; step++) {
      var i = (from + step) % list.length;
      if (!p.solved[list[i].id]) return i;
    }
    return -1;
  }

  function renderDone(host) {
    host.innerHTML =
      '<div class="card center">' +
      '<h2>All ' + drills().length + ' solved.</h2>' +
      '<p>Module ' + current().number + ' is done. Anything you missed is worth a second pass before you move on.</p>' +
      '<p class="muted">Next module is in the menu at the top.</p>' +
      '<button class="btn" id="reset">Start over</button>' +
      '</div>';
    document.getElementById('reset').addEventListener('click', function () {
      prog().solved = {};
      prog().current = 0;
      save();
      updateProgress();
      renderDrill();
    });
  }

  function renderDrill() {
    var host = document.getElementById('drill-body');
    var list = drills(), p = prog();

    if (!list.length) { host.innerHTML = '<div class="card"><p class="muted">No drills yet.</p></div>'; return; }
    if (solvedCount() === list.length) { renderDone(host); return; }

    if (p.solved[list[p.current].id]) {
      var jump = nextUnsolved(p.current);
      if (jump !== -1) p.current = jump;
    }

    var d = list[p.current];
    var left = list.length - solvedCount();

    host.innerHTML =
      '<div class="card">' +
      '<p class="kicker">' + (p.current + 1) + ' of ' + list.length + ' · ' + left + ' still open</p>' +
      '<p class="q">' + d.q + '</p>' +
      '<div class="answer-row">' +
      '<input id="answer" type="text" inputmode="' + (d.type === 'text' ? 'text' : 'decimal') + '" ' +
      'autocomplete="off" aria-label="Your answer" placeholder="' + (d.type === 'text' ? 'answer' : 'number') + '" />' +
      (d.unit ? '<span class="unit">' + d.unit + '</span>' : '') +
      '<button class="btn" id="check">Check</button>' +
      '</div>' +
      '<div id="feedback" class="feedback" hidden></div>' +
      '</div>';

    var input = document.getElementById('answer');
    var check = document.getElementById('check');
    var fb = document.getElementById('feedback');

    function judge() {
      var ok, shown;

      if (d.type === 'text') {
        var given = norm(input.value);
        ok = given.length > 0 && d.accept.some(function (a) {
          var na = norm(a);
          return given === na || given.indexOf(na) >= 0;
        });
        shown = d.accept[0];
      } else {
        var v = num(input);
        ok = isFinite(v) && Math.abs(v - d.answer) <= d.tol;
        shown = d.answer + ' ' + (d.unit || '');
      }

      if (ok) {
        p.solved[d.id] = true;
        save();
        updateProgress();
      }

      var allDone = solvedCount() === list.length;

      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'good' : 'bad');
      fb.innerHTML =
        '<p><strong>' + (ok ? 'Correct.' : 'Not quite — ' + shown + '.') + '</strong></p>' +
        '<p>' + d.why + (ok ? '' : ' This one comes back until you get it.') + '</p>' +
        '<button class="btn" id="next">' + (allDone ? 'Finish' : 'Next') + '</button>';

      document.getElementById('next').addEventListener('click', function () {
        if (allDone) { renderDrill(); return; }
        var n = nextUnsolved(p.current);
        if (n !== -1) p.current = n;
        save();
        renderDrill();
      });

      input.disabled = true;
      check.disabled = true;
    }

    check.addEventListener('click', judge);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') judge(); });
    input.focus();
  }

  /* ---------- module switching ---------- */
  function selectModule(id) {
    state.moduleId = id;
    save();
    renderLearn();
    renderCalc();
    updateProgress();
    var m = current();
    document.getElementById('module-select').value = m.id;
    show('learn');
  }

  function boot() {
    var select = document.getElementById('module-select');
    select.innerHTML = MODULES.map(function (m) {
      return '<option value="' + m.id + '">Module ' + m.number + ' — ' + m.title + '</option>';
    }).join('');
    select.value = current().id;
    select.addEventListener('change', function () { selectModule(select.value); });

    VIEWS.forEach(function (v) {
      document.getElementById('tab-' + v).addEventListener('click', function () { show(v); });
    });

    var hash = (location.hash || '').replace('#', '').split('/');
    if (hash[0] && MODULES.some(function (m) { return m.id === hash[0]; })) state.moduleId = hash[0];

    selectModule(current().id);
    if (hash[1] && VIEWS.indexOf(hash[1]) >= 0) show(hash[1]);

    if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
      navigator.serviceWorker.register('./sw.js').catch(function () {});
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
