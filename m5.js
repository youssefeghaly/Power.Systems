/* Module 5 — protection and fault levels. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var CURVES = [
    { id: 'SI', label: 'SI' },
    { id: 'VI', label: 'VI' },
    { id: 'EI', label: 'EI' },
    { id: 'LTI', label: 'LTI' }
  ];

  /* ---------- time-current chart ---------- */
  function drawTCC(host, a, b, fault) {
    var W = 860, H = 380, padL = 62, padR = 20, padT = 20, padB = 44;
    var iw = W - padL - padR, ih = H - padT - padB;

    var iMin = Math.min(a.is, b.is) * 1.05;
    var iMax = Math.max(a.is, b.is) * 30;
    var tMin = 0.01, tMax = 100;

    var x = function (i) { return padL + (Math.log(i / iMin) / Math.log(iMax / iMin)) * iw; };
    var y = function (t) {
      var clamped = Math.min(Math.max(t, tMin), tMax);
      return padT + ih - (Math.log(clamped / tMin) / Math.log(tMax / tMin)) * ih;
    };

    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Time-current curves for two overcurrent relays">');

    /* decade grid */
    [0.01, 0.1, 1, 10, 100].forEach(function (t) {
      s.push('<line x1="' + padL + '" y1="' + y(t) + '" x2="' + (W - padR) + '" y2="' + y(t) + '" class="chart-grid"/>');
      s.push('<text x="' + (padL - 10) + '" y="' + (y(t) + 4) + '" class="chart-axis" text-anchor="end">' + t + 's</text>');
    });

    var ticks = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];
    ticks.forEach(function (i) {
      if (i < iMin || i > iMax) return;
      s.push('<line x1="' + x(i) + '" y1="' + padT + '" x2="' + x(i) + '" y2="' + (padT + ih) + '" class="chart-grid faint"/>');
      s.push('<text x="' + x(i) + '" y="' + (H - 22) + '" class="chart-axis" text-anchor="middle">' + i + '</text>');
    });

    function curve(device, cls) {
      var pts = [];
      for (var i = device.is * 1.02; i <= iMax; i *= 1.06) {
        var t = Calc.relayTime(device.curve, device.tms, device.is, i);
        if (!isFinite(t) || t < tMin || t > tMax * 2) continue;
        pts.push(x(i) + ',' + y(t));
      }
      if (pts.length < 2) return '';
      return '<polyline points="' + pts.join(' ') + '" class="' + cls + '"/>';
    }

    s.push(curve(a, 'tcc-down'));
    s.push(curve(b, 'tcc-up'));

    if (fault > 0) {
      s.push('<line x1="' + x(fault) + '" y1="' + padT + '" x2="' + x(fault) + '" y2="' + (padT + ih) + '" class="chart-aug"/>');
      s.push('<text x="' + x(fault) + '" y="' + (padT - 4) + '" class="chart-axis" text-anchor="middle">fault ' + Math.round(fault) + ' A</text>');
    }

    s.push('</svg>');
    host.innerHTML = s.join('');
  }

  /* ---------- calculator ---------- */
  var calcHTML =
    '<div class="card">' +
      '<h2>Grading two overcurrent relays</h2>' +
      '<p class="muted">The downstream device must trip first, by a margin. If the curves cross, the upstream trips and a whole feeder goes dark for a fault on one bay.</p>' +
      '<div class="grid">' +
        '<label><span>Downstream pickup</span><input id="p-down-is" type="text" inputmode="decimal" value="200" /><span class="hint">A</span></label>' +
        '<label><span>Downstream TMS</span><input id="p-down-tms" type="text" inputmode="decimal" value="0.10" /><span class="hint">×</span></label>' +
        '<label><span>Downstream curve</span><select id="p-down-curve">' +
          CURVES.map(function (c) { return '<option value="' + c.id + '">' + c.label + '</option>'; }).join('') +
        '</select></label>' +
        '<label><span>Upstream pickup</span><input id="p-up-is" type="text" inputmode="decimal" value="400" /><span class="hint">A</span></label>' +
        '<label><span>Upstream TMS</span><input id="p-up-tms" type="text" inputmode="decimal" value="0.30" /><span class="hint">×</span></label>' +
        '<label><span>Upstream curve</span><select id="p-up-curve">' +
          CURVES.map(function (c) { return '<option value="' + c.id + '">' + c.label + '</option>'; }).join('') +
        '</select></label>' +
        '<label><span>Fault current</span><input id="p-fault" type="text" inputmode="decimal" value="2000" /><span class="hint">A</span></label>' +
      '</div>' +
      '<div class="legend"><span><i class="sw-down"></i>downstream</span><span><i class="sw-up"></i>upstream</span>' +
        '<span class="muted">current, A (log) · time, s (log)</span></div>' +
      '<div id="p-chart" class="chart-wrap"></div>' +
      '<div id="p-out" class="results"></div>' +
      '<p class="muted">SI standard inverse · VI very inverse · EI extremely inverse · LTI long time inverse. ' +
      'The family is chosen to fit the protection problem; the TMS shifts the curve up or down.</p>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Fault level</h2>' +
      '<p>Three-phase fault current, <code>Ik = c · Un / (√3 · Z)</code>, with c = 1.1.</p>' +
      '<div class="grid">' +
        '<label><span>Network voltage</span><input id="p-kv" type="text" inputmode="decimal" value="20" /><span class="hint">kV</span></label>' +
        '<label><span>Source impedance</span><input id="p-z" type="text" inputmode="decimal" value="0.5" /><span class="hint">Ω</span></label>' +
      '</div>' +
      '<div id="p-ik" class="results"></div>' +
      '<p class="muted">This is why switchgear has a rated short-circuit current. If Ik exceeds the rating, the equipment fails — catastrophically and without warning.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function read() {
      return {
        down: {
          is: parseFloat(String($('p-down-is').value).replace(',', '.')),
          tms: parseFloat(String($('p-down-tms').value).replace(',', '.')),
          curve: $('p-down-curve').value
        },
        up: {
          is: parseFloat(String($('p-up-is').value).replace(',', '.')),
          tms: parseFloat(String($('p-up-tms').value).replace(',', '.')),
          curve: $('p-up-curve').value
        },
        fault: parseFloat(String($('p-fault').value).replace(',', '.'))
      };
    }

    function update() {
      var d = read();
      var chartHost = $('p-chart');
      var out = $('p-out');

      if (!(d.down.is > 0) || !(d.up.is > 0) || !(d.fault > 0)) {
        chartHost.innerHTML = '';
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>pickups and fault current</strong></div>';
        return;
      }

      drawTCC(chartHost, d.down, d.up, d.fault);

      var td = Calc.relayTime(d.down.curve, d.down.tms, d.down.is, d.fault);
      var tu = Calc.relayTime(d.up.curve, d.up.tms, d.up.is, d.fault);
      var margin = Calc.gradingMargin(td, tu, d.fault);
      var ok = isFinite(td) && isFinite(tu) && margin >= 0.3;

      var fmtT = function (t) { return isFinite(t) ? t.toFixed(2) + ' s' : 'does not trip'; };

      out.innerHTML =
        '<div class="row"><span>Downstream trip time</span><strong>' + fmtT(td) + '</strong></div>' +
        '<div class="row"><span>Upstream trip time</span><strong>' + fmtT(tu) + '</strong></div>' +
        '<div class="row"><span>Grading margin</span><strong class="' + (ok ? '' : 'bad-num') + '">' +
          (isFinite(margin) ? margin.toFixed(2) + ' s' : '—') + '</strong></div>' +
        '<div class="row"><span>Verdict</span><strong class="' + (ok ? '' : 'bad-num') + '">' +
          (ok ? 'coordinated (≥ 0.3 s)' : 'not coordinated') + '</strong></div>';

      var kv = parseFloat(String($('p-kv').value).replace(',', '.'));
      var z = parseFloat(String($('p-z').value).replace(',', '.'));
      var ik = $('p-ik');
      if (kv > 0 && z > 0) {
        var i = Calc.faultCurrent(kv, z);
        ik.innerHTML =
          '<div class="row"><span>Three-phase fault current</span><strong>' + i.toFixed(2) + ' kA</strong></div>' +
          '<div class="row"><span>Minimum switchgear rating</span><strong>' + (Math.ceil(i / 5) * 5) + ' kA</strong></div>';
      } else {
        ik.innerHTML = '';
      }
    }

    ['p-down-is', 'p-down-tms', 'p-down-curve', 'p-up-is', 'p-up-tms', 'p-up-curve', 'p-fault', 'p-kv', 'p-z'].forEach(function (id) {
      $(id).addEventListener('input', update);
      $(id).addEventListener('change', update);
    });
    update();
  }

  /* ---------- drills ---------- */
  var DRILLS = [
    { id: 'm5-d1', q: 'A 20 kV network has a source impedance of 0.5 Ω. What is the three-phase fault current, in kA?',
      unit: 'kA', answer: 25.40, tol: 0.15,
      why: '1.1 × 20 000 ÷ (√3 × 0.5) = 25.4 kA. Fault level is set by impedance and voltage, not by the plant.' },

    { id: 'm5-d2', q: 'Same formula at 110 kV with 2 Ω. Fault current, in kA?',
      unit: 'kA', answer: 34.93, tol: 0.2,
      why: '1.1 × 110 000 ÷ (√3 × 2) = 34.9 kA. Higher voltage, higher fault level for the same impedance.' },

    { id: 'm5-d3', q: 'A 20 kV feeder shows a calculated 31 kA but the switchgear is rated 25 kA. Acceptable?',
      type: 'text', accept: ['no', 'nein', 'not acceptable', 'nein nicht'],
      why: 'No. Exceeding the rated short-circuit current means the equipment may fail to clear the fault — and fail destructively.' },

    { id: 'm5-d4', q: 'A CT is 600/1 A. The secondary reads 0.8 A. What primary current is flowing?',
      unit: 'A', answer: 480, tol: 1,
      why: '600 × 0.8 = 480 A. The ratio is the whole point of a CT: measure thousands of amps with a 1 A instrument.' },

    { id: 'm5-d5', q: 'A CT has a burden of 15 VA at 1 A secondary. What is the burden impedance, in Ω?',
      unit: 'Ω', answer: 15, tol: 0.2,
      why: 'Z = S / I² = 15 / 1 = 15 Ω. If actual burden exceeds the rated value, the CT saturates and the relay sees a lie.' },

    { id: 'm5-d6', q: 'A standard inverse relay has TMS 0.2 and trips at 10× pickup. Trip time?',
      unit: 's', answer: 0.59, tol: 0.03,
      why: 't = 0.2 × 0.14 / (10^0.02 − 1) = 0.594 s. IEC curves are steep at low multiples and flat at high ones.' },

    { id: 'm5-d7', q: 'A very inverse relay with TMS 0.5 at 4× pickup. Trip time, in s?',
      unit: 's', answer: 2.25, tol: 0.05,
      why: 't = 0.5 × 13.5 / (4 − 1) = 2.25 s. The curve family is chosen to fit the protection problem, not for convenience.' },

    { id: 'm5-d8', q: 'Downstream clears in 0.4 s. What is the minimum acceptable upstream time, using a 0.3 s margin?',
      unit: 's', answer: 0.7, tol: 0.01,
      why: '0.4 + 0.3 = 0.7 s. The margin absorbs breaker opening time, CT errors and relay tolerance.' },

    { id: 'm5-d9', q: 'Which protection principle compares the current entering and leaving a zone?',
      type: 'text', accept: ['differential', 'differential protection', 'differenzschutz'],
      why: 'Differential. It is the only principle that is inherently selective — it sees the zone, not the current level somewhere else.' },

    { id: 'm5-d10', q: 'What does a CT burden calculation actually prove?',
      type: 'text', accept: ['that the ct does not saturate', 'ct does not saturate', 'no saturation', 'that the ct stays accurate'],
      why: 'That the CT will not saturate at the fault current, so the relay sees the real current. A saturated CT is a blind protection.' },

    { id: 'm5-d11', q: 'Which device detects an arc by its light, not only by current?',
      type: 'text', accept: ['arc flash relay', 'arc-flash relay', 'lichtbogenschutz', 'arc flash'],
      why: 'An arc-flash relay. Light plus current picks up an arc in milliseconds, well before an overcurrent element would.' },

    { id: 'm5-d12', q: 'On the DC side, what protects the battery from an external short circuit?',
      type: 'text', accept: ['fuse', 'fuses', 'dc fuse', 'sicherung', 'breaker', 'dc breaker'],
      why: 'Fuses (and contactors for switching). High-speed DC fuses limit let-through energy — but nothing protects a cell from an internal short.' }
  ];

  window.MODULES.push({
    id: 'm5',
    number: '05',
    title: 'Protection and fault levels',
    lead: 'Enough to specify it, review it, and argue with the person who sets it — not to stamp it.',
    sections: [
      {
        h: 'Fault level is a property of the network',
        p: [
          'A three-phase fault current is set by the source impedance and the voltage: <code>Ik = c · Un / (√3 · Z)</code>, with c = 1.1 for maximum current.',
          'It matters because every piece of switchgear has a rated short-circuit current. If the calculated fault level exceeds the rating, the equipment may fail to clear the fault — and fail destructively.',
          'Note what it does not depend on: your battery. The plant contributes to the fault level, but the network decides the magnitude.'
        ],
        formula: 'Ik = c · Un / (√3 · Z)   with c = 1.1'
      },
      {
        h: 'Zones, not devices',
        p: [
          'Protection is designed in zones: each zone has a boundary, a measuring point and a device that clears faults inside it. Overlap at the boundaries means no fault is left unprotected.',
          'Overcurrent protection is the workhorse: it trips when current exceeds a pickup for long enough. It is cheap and it is not inherently selective — it relies on grading.',
          'Differential protection is inherently selective: it compares current in and out of a zone and trips on the difference. That is why transformers and busbars get it and feeders often do not.'
        ],
        formula: 'Overcurrent → graded by time · Differential → selective by physics'
      },
      {
        h: 'Current transformers are the weak link',
        p: [
          'The relay never sees the primary current. It sees a scaled copy through a CT, whose ratio, accuracy class and burden define whether that copy is honest.',
          'Burden is the total impedance on the secondary, including the relay, wiring and any test links. Exceed the rated burden and the CT saturates exactly when you need it most — at the fault current.',
          'This is why a Bürdenberechnung is submitted with the design: it proves the CT stays linear at the currents that matter.'
        ],
        formula: 'Z_burden = S / I²   ·  saturation = blind protection'
      },
      {
        h: 'Grading is a time argument',
        p: [
          'Two overcurrent relays in series must not trip together. The downstream device clears first; the upstream device waits long enough to be sure.',
          'The margin is typically 0.3 s, covering breaker opening, relay tolerance and CT error. On IEC curves the times depend on the current multiple, so grading must be checked across the whole current range — not at one point.',
          'This is what the chart in the calculator is for. When the curves cross, the wrong breaker trips.'
        ],
        formula: 't_upstream(I) − t_downstream(I) ≥ 0.3 s for all I'
      },
      {
        h: 'The parts the book skips',
        p: [
          'On the DC side, fuses and contactors protect the external circuit. Nothing protects a cell from an internal short — which is why thermal runaway is a containment problem, not a protection problem.',
          'Arc-flash relays detect the light of an arc in milliseconds, long before an overcurrent element would pick it up. Arc flash is a worker-safety issue, and it shapes how the plant is operated, not just how it is built.',
          'Where the numbers live: IEC 60909 for fault calculation and IEC 61936-1 for HV installation design. We do not hold either, so the method is taught here and the specifics are marked for verification.'
        ],
        formula: 'DC side: fuses protect the circuit, nothing protects the cell'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
