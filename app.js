/* Module 1 app shell: tabs, calculator, drills, local progress. */
(function () {
  'use strict';

  const STORE_KEY = 'bess.m1.v1';

  /* ---------- state ---------- */
  let state = { view: 'learn', solved: {}, current: 0, checked: false };

  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) Object.assign(state, JSON.parse(raw));
  } catch (e) { /* private mode — run without persistence */ }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ solved: state.solved, current: state.current }));
    } catch (e) { /* ignore */ }
  }

  function num(el) {
    const v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  }

  function fmt(x, d) {
    if (!isFinite(x)) return '—';
    return x.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /* ---------- tabs ---------- */
  const views = ['learn', 'calc', 'drill'];

  function show(view) {
    state.view = view;
    views.forEach(function (v) {
      document.getElementById('view-' + v).hidden = v !== view;
      const tab = document.getElementById('tab-' + v);
      tab.classList.toggle('active', v === view);
      tab.setAttribute('aria-selected', v === view ? 'true' : 'false');
    });
    if (view === 'drill') renderDrill();
    if (location.hash !== '#' + view) {
      try { history.replaceState(null, '', '#' + view); } catch (e) { /* file:// */ }
    }
    if (typeof window.scrollTo === 'function') {
      try { window.scrollTo(0, 0); } catch (e) { /* jsdom */ }
    }
  }

  /* ---------- learn ---------- */
  function renderLesson() {
    const host = document.getElementById('lesson');
    const frag = document.createDocumentFragment();

    const head = document.createElement('header');
    head.className = 'lesson-head';
    head.innerHTML = '<p class="kicker">Module ' + LESSON.number + '</p>' +
      '<h1>' + LESSON.title + '</h1>' +
      '<p class="lead">' + LESSON.lead + '</p>';
    frag.appendChild(head);

    LESSON.sections.forEach(function (s) {
      const sec = document.createElement('section');
      sec.className = 'card';
      const h = document.createElement('h2');
      h.textContent = s.h;
      sec.appendChild(h);
      s.p.forEach(function (text) {
        const p = document.createElement('p');
        p.textContent = text;
        sec.appendChild(p);
      });
      if (s.formula) {
        const pre = document.createElement('pre');
        pre.className = 'formula';
        pre.textContent = s.formula;
        sec.appendChild(pre);
      }
      frag.appendChild(sec);
    });

    host.innerHTML = '';
    host.appendChild(frag);
  }

  /* ---------- calculator ---------- */
  function readPlant() {
    return {
      mw: num(document.getElementById('in-mw')),
      hours: num(document.getElementById('in-hours')),
      loss: num(document.getElementById('in-loss')),
      box: num(document.getElementById('in-box'))
    };
  }

  function updatePlant() {
    const v = readPlant();
    const out = document.getElementById('plant-out');
    const rows = [];
    let ok = v.mw > 0 && v.hours > 0 && v.loss >= 0 && v.loss < 100 && v.box > 0;

    if (ok) {
      const ePoi = v.mw * v.hours;
      const eDc = Calc.grossUp(ePoi, v.loss);
      const c = Calc.cRate(v.hours);
      const boxes = Calc.containers(eDc, v.box);
      const installed = boxes * v.box;
      const over = Calc.overbuild(installed, eDc);

      rows.push(['Energy at POI', fmt(ePoi, 1) + ' MWh']);
      rows.push(['Energy at DC terminals', fmt(eDc, 1) + ' MWh']);
      rows.push(['C-rate', fmt(c, 3) + 'C']);
      rows.push(['Containers needed', boxes + ' × ' + fmt(v.box, 1) + ' MWh']);
      rows.push(['Installed DC energy', fmt(installed, 1) + ' MWh']);
      rows.push(['Overbuild vs required', fmt(over * 100, 2) + ' %']);
    } else {
      rows.push(['Waiting for input', 'power, duration, loss 0–99 %, container size > 0']);
    }

    out.innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
    }).join('');
  }

  function updateCell() {
    const volts = num(document.getElementById('in-volts'));
    const ah = num(document.getElementById('in-ah'));
    const cells = num(document.getElementById('in-cells'));
    const out = document.getElementById('cell-out');
    let rows = [];

    if (volts > 0 && ah > 0) {
      const wh = Calc.cellWh(volts, ah);
      rows.push(['Cell energy', fmt(wh, 1) + ' Wh']);
      rows.push(['… in kWh', fmt(wh / 1000, 4) + ' kWh']);
      rows.push(['Energy of 1,000 cells', fmt(wh * 1000 / 1000000, 2) + ' MWh']);
    }
    if (volts > 0 && cells > 0) {
      rows.push(['String voltage (' + cells + ' in series)', fmt(Calc.stringVoltage(cells, volts), 1) + ' V']);
    }
    if (!rows.length) rows.push(['Waiting for input', 'voltage and Ah']);

    out.innerHTML = rows.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
    }).join('');
  }

  /* ---------- drills ---------- */
  function solvedCount() {
    return DRILLS.filter(function (d) { return state.solved[d.id]; }).length;
  }

  function updateProgress() {
    var n = solvedCount();
    var pct = Math.round((n / DRILLS.length) * 100);
    document.getElementById('bar').style.width = pct + '%';
    document.getElementById('count').textContent = n + ' / ' + DRILLS.length + ' solved';
  }

  /* Next question that is still unsolved, searching forward from `from`. -1 when none. */
  function nextUnsolved(from) {
    for (var step = 1; step <= DRILLS.length; step++) {
      var i = (from + step) % DRILLS.length;
      if (!state.solved[DRILLS[i].id]) return i;
    }
    return -1;
  }

  function renderDone(host) {
    host.innerHTML =
      '<div class="card center">' +
      '<h2>All twelve solved.</h2>' +
      '<p>You can now size a plant from a contract number — which is the whole point of Module 1.</p>' +
      '<p class="muted">Run them again whenever you like. Solved questions come back from scratch, ' +
      'so a second pass measures something different than the first.</p>' +
      '<button class="btn" id="reset">Start over</button>' +
      '</div>';
    document.getElementById('reset').addEventListener('click', function () {
      state.solved = {};
      state.current = 0;
      save();
      updateProgress();
      renderDrill();
    });
  }

  function renderDrill() {
    var host = document.getElementById('drill-body');

    if (solvedCount() === DRILLS.length) {
      renderDone(host);
      return;
    }

    /* Never park the learner on a question they have already solved. */
    if (state.solved[DRILLS[state.current].id]) {
      var jump = nextUnsolved(state.current);
      if (jump !== -1) state.current = jump;
    }

    var d = DRILLS[state.current];
    var left = DRILLS.length - solvedCount();

    host.innerHTML =
      '<div class="card">' +
      '<p class="kicker">' + (state.current + 1) + ' of ' + DRILLS.length + ' · ' + left + ' still open</p>' +
      '<p class="q">' + d.q + '</p>' +
      '<div class="answer-row">' +
      '<input id="answer" type="text" inputmode="decimal" autocomplete="off" ' +
      'aria-label="Your answer" placeholder="number" />' +
      '<span class="unit">' + d.unit + '</span>' +
      '<button class="btn" id="check">Check</button>' +
      '</div>' +
      '<div id="feedback" class="feedback" hidden></div>' +
      '</div>';

    var input = document.getElementById('answer');
    var check = document.getElementById('check');
    var fb = document.getElementById('feedback');

    function judge() {
      var given = num(input);
      var ok = isFinite(given) && Math.abs(given - d.answer) <= d.tol;

      if (ok) {
        state.solved[d.id] = true;
        save();
        updateProgress();
      }

      var allDone = solvedCount() === DRILLS.length;

      fb.hidden = false;
      fb.className = 'feedback ' + (ok ? 'good' : 'bad');
      fb.innerHTML =
        '<p><strong>' + (ok ? 'Correct.' : 'Not quite — ' + d.answer + ' ' + d.unit + '.') + '</strong></p>' +
        '<p>' + (ok ? d.why : d.why + ' This one comes back until you get it.') + '</p>' +
        '<button class="btn" id="next">' + (allDone ? 'Finish' : 'Next') + '</button>';

      document.getElementById('next').addEventListener('click', function () {
        if (allDone) {
          renderDrill();
          return;
        }
        var n = nextUnsolved(state.current);
        if (n !== -1) state.current = n;
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

  /* ---------- boot ---------- */
  function boot() {
    renderLesson();
    updatePlant();
    updateCell();
    updateProgress();

    ['mw', 'hours', 'loss', 'box'].forEach(function (id) {
      document.getElementById('in-' + id).addEventListener('input', updatePlant);
    });
    ['volts', 'ah', 'cells'].forEach(function (id) {
      document.getElementById('in-' + id).addEventListener('input', updateCell);
    });

    views.forEach(function (v) {
      document.getElementById('tab-' + v).addEventListener('click', function () { show(v); });
    });

    var initial = (location.hash || '').replace('#', '');
    show(views.indexOf(initial) >= 0 ? initial : 'learn');
    window.addEventListener('hashchange', function () {
      var v = (location.hash || '').replace('#', '');
      if (views.indexOf(v) >= 0 && v !== state.view) show(v);
    });

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(function () { /* offline still works next visit */ });
    }
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
