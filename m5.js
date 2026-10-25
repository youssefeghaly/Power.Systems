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


  function drawZones(host) {
    var p = [];
    p.push('<svg viewBox="0 0 880 380" class="chart" role="img" aria-label="Protection zones on a busbar with two feeders">');

    /* busbar zone */
    p.push('<rect x="60" y="46" width="760" height="130" rx="10" class="zone zone-bus"/>');
    p.push('<text x="72" y="40" class="chart-axis zone-label">busbar zone — differential</text>');
    p.push('<line x1="80" y1="86" x2="800" y2="86" class="busbar"/>');
    p.push('<text x="800" y="110" class="chart-axis" text-anchor="end">110 kV busbar</text>');

    /* two feeders */
    [240, 600].forEach(function (x, i) {
      p.push('<line x1="' + x + '" y1="86" x2="' + x + '" y2="150" class="sld-line"/>');
      /* CT */
      p.push('<rect x="' + (x - 16) + '" y="150" width="32" height="26" rx="4" class="ct"/>');
      p.push('<text x="' + (x + 26) + '" y="168" class="chart-axis">CT</text>');
      /* breaker */
      p.push('<line x1="' + x + '" y1="176" x2="' + x + '" y2="210" class="sld-line"/>');
      p.push('<rect x="' + (x - 18) + '" y="210" width="36" height="36" rx="6" class="breaker"/>');
      p.push('<text x="' + (x + 26) + '" y="234" class="chart-axis">breaker</text>');
      /* zone box around feeder */
      p.push('<rect x="' + (x - 60) + '" y="140" width="120" height="155" rx="10" class="zone zone-feeder"/>');
      p.push('<text x="' + (x - 58) + '" y="298" class="chart-axis">feeder zone</text>');
      p.push('<line x1="' + x + '" y1="246" x2="' + x + '" y2="330" class="sld-line" marker-end="url(#z-arrow)"/>');
      p.push('<text x="' + x + '" y="348" class="chart-axis" text-anchor="middle">to load ' + (i + 1) + '</text>');
    });

    p.push('<text x="440" y="368" class="chart-axis" text-anchor="middle">zones overlap at the CTs — no fault is left unprotected</text>');
    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>Where the zones meet</h2>' +
        '<p class="muted">Protection is drawn as boxes, not devices. The overlap at each CT is what guarantees a fault is seen by at least one zone.</p>' +
        '<div class="chart-wrap">' +
          '<svg width="0" height="0"><defs><marker id="z-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">' +
          '<path d="M0,0 L8,4 L0,8 z" class="arrowhead"/></marker></defs></svg>' +
          p.join('') +
        '</div>' +
        '<p class="muted">A busbar fault is seen by every incomer as "downstream", so graded overcurrent waits too long. Differential on the busbar zone is what closes that gap.</p>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'm5',
    number: '05',
    title: 'Protection and fault levels',
    lead: 'Enough to specify it, review it, and argue with the person who sets it — not to stamp it.',
    sections: [
      {
        h: 'Fault level is a property of the network',
        p: [
          `A three-phase fault current is set by the source impedance and the voltage: <code>Ik = c · Un / (√3 · Z)</code>, with c = 1.1 for the maximum case. Nothing about your battery changes the order of magnitude — the network decides.`,
          `It matters because every piece of switchgear has a rated short-circuit current. If the calculated fault level exceeds that rating, the equipment may fail to clear the fault, and it fails destructively rather than gracefully.`,
          `This is also why transformer impedance is a design decision: it is the one element in the chain that lets you deliberately reduce the fault current behind it, at the cost of voltage regulation.`,
          `Fault level also changes as the network grows: a new substation nearby can raise it by a third, and every device rating behind your connection point is then out of date.`
        ],
        formula: 'Ik = c · Un / (√3 · Z)   with c = 1.1',
        example: {
          title: 'Worked example — 20 kV and 110 kV',
          body: `At 20 kV with 0.5 Ω source impedance: 1.1 × 20,000 ÷ (√3 × 0.5) = 25.4 kA. At 110 kV with 2 Ω: 1.1 × 110,000 ÷ (√3 × 2) = 34.9 kA. Higher voltage means higher fault level for the same impedance — which is why HV switchgear is rated in tens of kA and costs accordingly.`
        },
        mistake: `Using c = 1.0 because it is "the nominal case". The maximum fault current is what equipment must withstand, and the 1.1 factor exists precisely for that calculation.`,
        check: `20 kV, 1.2 Ω: what is the fault current? Answer: 10.6 kA.`
      },
      {
        h: 'Zones, not devices',
        p: [
          `Protection is designed in zones: each zone has a boundary, a measuring point and a device that clears faults inside it. Zones overlap at the boundaries so that no fault is left unprotected by both.`,
          `Overcurrent protection is the workhorse — cheap, simple, and not inherently selective. It relies on grading, which means it depends on the fault current actually flowing and on the settings being coordinated.`,
          `Differential protection is inherently selective: it compares current in and out of a zone and trips on the difference. That is why busbars and transformers get it and feeders often do not — the physics does the selectivity instead of the settings.`,
          `The practical consequence for a BESS is that its protection must be coordinated with the DSO's, not designed in isolation — two protection worlds meeting at one boundary, agreed in writing.`,
          `Where the two worlds disagree, the DSO's requirement wins — and finding that out during commissioning is a schedule problem, not a technical one.`
        ],
        formula: 'Overcurrent → graded by time · Differential → selective by physics',
        example: {
          title: 'Worked example — why a busbar needs differential',
          body: `A fault on the busbar itself is seen by every incomer as "downstream", so graded overcurrent has to wait for the feeder protection to fail before it trips — hundreds of milliseconds during which the whole station burns. Busbar differential sees the sum of currents leave the zone and trips in tens of milliseconds.`
        },
        mistake: `Assuming overcurrent protection protects everything. It protects feeders well, transformers acceptably, and busbars badly — which is why the most expensive protection is usually on the cheapest equipment to replace.`,
        check: `Which principle is inherently selective? Answer: differential.`
      },
      {
        h: 'Current transformers are the weak link',
        p: [
          `The relay never sees primary current. It sees a scaled copy through a CT, whose ratio, accuracy class and burden define whether that copy is honest at the currents that matter.`,
          `Burden is the total impedance on the secondary loop — relay, wiring, test links. Exceed the rated burden and the CT saturates exactly when the fault current arrives, so the relay under-reads and clears late or not at all.`,
          `This is why a Bürdenberechnung is submitted with the design: it proves the CT stays linear over the range the protection depends on.`,
          `A useful review question: "what is the burden, and what is the CT rated for?" If nobody can answer both numbers, the calculation was probably never done.`,
          `The same logic applies to voltage transformers: a blown fuse removes the reference and disables protections that looked healthy on the panel.`
        ],
        formula: 'I_sec = I_pri × (ratio)  ·  Z_burden = S / I²',
        example: {
          title: 'Worked example — ratio and burden',
          body: `A 600/1 CT carrying 480 A primary delivers 0.8 A secondary. Its rated burden of 15 VA at 1 A corresponds to 15 Ω. If the wiring plus relay actually presents 18 Ω, the CT saturates before the fault current and the protection becomes optimistic at exactly the wrong moment.`
        },
        mistake: `Ignoring the lead resistance on a long run from the CT to the relay panel. In a substation that is easily several ohms, and it consumes the burden margin that the CT was specified with.`,
        check: `A CT is 200/5 and the primary carries 120 A. What is the secondary current? Answer: 3 A.`
      },
      {
        h: 'Grading is a time argument',
        p: [
          `Two overcurrent relays in series must not trip together. The downstream device clears first; the upstream one waits long enough to be certain. The margin is typically 0.3 s, covering breaker opening, relay tolerance and CT error.`,
          `The trap is that IEC curves are not parallel. Grading checked at one current can look correct and fail at another, where the curves converge or cross. You have to check the margin across the whole range of credible fault currents.`,
          `When the curves cross, a fault on one bay takes out the upstream device and the whole feeder goes dark — which is how a protection settings error becomes a customer complaint.`,
          `Checking the whole range is tedious, which is exactly why it is the step that gets skipped — and why the coordination study is worth reading rather than filing.`,
          `A coordination study is a short document with a long consequence: one page of curves decides whether a fault takes out a bay or a substation.`
        ],
        formula: 't_upstream(I) − t_downstream(I) ≥ 0.3 s for all I',
        example: {
          title: 'Worked example — the margin at one point',
          body: `At a 2,000 A fault, the downstream relay (SI, TMS 0.10, pickup 200 A) trips in 0.30 s and the upstream (SI, TMS 0.30, pickup 400 A) in 1.28 s. Margin 0.98 s — comfortable. Drop the upstream TMS to 0.02 and it trips in 0.09 s: faster than the downstream, so the wrong breaker opens.`
        },
        mistake: `Grading by pickup current instead of by time. Two relays with different pickups can still be badly graded, because what matters is the trip time at the fault current they both see.`,
        check: `Downstream clears in 0.4 s. What is the minimum upstream time with a 0.3 s margin? Answer: 0.7 s.`
      },
      {
        h: 'The DC side, and arc flash',
        p: [
          `On the DC side, fuses and contactors protect the external circuit. Nothing protects a cell from an internal short — which is why thermal runaway is a containment problem, not a protection problem.`,
          `DC arcs do not self-extinguish at a current zero, so a device rated for AC is not automatically suitable for DC. The rating must state the DC voltage and the time constant it was tested at.`,
          `Arc-flash relays detect the light of an arc in milliseconds, long before an overcurrent element picks it up. Arc flash is a worker-safety issue that shapes how the plant is operated, not only how it is built.`,
          `In a review, ask for the DC device ratings and the arc-flash study separately. If only one exists, the other was assumed.`,
          `Neither is expensive to produce at design stage, and both are impossible to reconstruct convincingly after an incident.`
        ],
        formula: 'DC side: fuses protect the circuit, nothing protects the cell',
        example: {
          title: 'Worked example — why the DC breaker matters',
          body: `A 1,500 V DC rack can deliver several thousand amps into a bolted fault. An AC-rated breaker may open the contacts and then arc across them, because there is no zero crossing to extinguish it. The device must be rated for 1,500 V DC at the circuit's time constant — and the datasheet will say so if you ask the right question.`
        },
        mistake: `Using an AC miniature circuit breaker on a DC string because the current rating matches. The current rating is the least interesting number on the label for a DC application.`,
        check: `What protects a cell from an internal short circuit? Answer: nothing — which is why containment matters.`
      }
    ],
    renderExtra: drawZones,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
