/* Module 3 — degradation, augmentation, guarantees. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  /* ---------- simulation ---------- */
  function simulate(o) {
    var caps = [o.installed];
    var cap = o.installed;
    for (var y = 1; y <= 20; y++) {
      cap = cap * (1 - o.degrade / 100);
      if (o.augYears.indexOf(y) >= 0) cap += o.augSize;
      caps.push(cap);
    }
    return caps;
  }

  function parseYears(str) {
    return String(str).split(/[^0-9]+/).map(Number).filter(function (n) {
      return n >= 1 && n <= 20;
    });
  }

  /* ---------- chart ---------- */
  function niceTicks(lo, hi, count) {
    var span = hi - lo;
    var raw = span / count;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
    var start = Math.floor(lo / step) * step;
    var ticks = [];
    for (var v = start; v <= hi + step * 0.5; v += step) ticks.push(Math.round(v * 100) / 100);
    return ticks;
  }

  function drawChart(host, caps, o) {
    var W = 860, H = 320, padL = 62, padR = 18, padT = 22, padB = 40;
    var iw = W - padL - padR, ih = H - padT - padB;

    var rawHi = Math.max.apply(null, caps.concat([o.installed, o.contract])) * 1.06;
    var rawLo = Math.min.apply(null, caps.concat([o.contract])) * 0.82;
    var ticks = niceTicks(rawLo, rawHi, 4);
    var lo = ticks[0];
    var hi = ticks[ticks.length - 1];

    var x = function (year) { return padL + (year / 20) * iw; };
    var y = function (cap) { return padT + ih - ((cap - lo) / (hi - lo)) * ih; };

    var s = [];
    s.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Capacity over twenty years against the contract minimum">');

    ticks.forEach(function (val) {
      var gy = y(val);
      s.push('<line x1="' + padL + '" y1="' + gy + '" x2="' + (W - padR) + '" y2="' + gy + '" class="chart-grid"/>');
      s.push('<text x="' + (padL - 10) + '" y="' + (gy + 4) + '" class="chart-axis" text-anchor="end">' + Math.round(val) + '</text>');
    });

    [0, 5, 10, 15, 20].forEach(function (yr) {
      s.push('<text x="' + x(yr) + '" y="' + (H - 14) + '" class="chart-axis" text-anchor="middle">y' + yr + '</text>');
    });

    s.push('<line x1="' + padL + '" y1="' + y(o.contract) + '" x2="' + (W - padR) + '" y2="' + y(o.contract) +
           '" class="chart-threshold"/>');
    s.push('<text x="' + (W - padR) + '" y="' + (y(o.contract) - 8) +
           '" class="chart-axis" text-anchor="end">contract ' + o.contract + ' MWh</text>');

    o.augYears.forEach(function (yr) {
      if (yr > 20) return;
      s.push('<line x1="' + x(yr) + '" y1="' + padT + '" x2="' + x(yr) + '" y2="' + (padT + ih) + '" class="chart-aug"/>');
      s.push('<text x="' + x(yr) + '" y="' + (padT - 6) + '" class="chart-axis" text-anchor="middle">+' + o.augSize + '</text>');
    });

    var pts = caps.map(function (c, i) { return x(i) + ',' + y(c); }).join(' ');
    s.push('<polyline points="' + pts + '" class="chart-line"/>');

    caps.forEach(function (c, i) {
      if (c < o.contract) {
        s.push('<circle cx="' + x(i) + '" cy="' + y(c) + '" r="4" class="chart-bad"/>');
      }
    });

    s.push('</svg>');
    host.innerHTML = s.join('');
  }

  /* ---------- calculator ---------- */
  var calcHTML =
    '<div class="card">' +
      '<h2>Twenty-year capacity plan</h2>' +
      '<p class="muted">The plant must never fall below the contract line. Either you build above it, or you come back and add to it.</p>' +
      '<div class="grid">' +
        '<label>Installed at BOL<input id="dg-installed" type="text" inputmode="decimal" value="500" /><span class="hint">MWh</span></label>' +
        '<label>Degradation per year<input id="dg-rate" type="text" inputmode="decimal" value="2" /><span class="hint">%</span></label>' +
        '<label>Contract minimum<input id="dg-contract" type="text" inputmode="decimal" value="400" /><span class="hint">MWh</span></label>' +
        '<label>Augmentation size<input id="dg-aug" type="text" inputmode="decimal" value="60" /><span class="hint">MWh</span></label>' +
        '<label>Augmentation years<input id="dg-years" type="text" inputmode="text" value="7, 14" /><span class="hint">comma separated</span></label>' +
      '</div>' +
      '<div id="dg-chart" class="chart-wrap"></div>' +
      '<div id="dg-out" class="results"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Overbuild or augment?</h2>' +
      '<p><strong>Overbuild</strong> — build 30–50 % above contract at the start, never return. Capex now, no mobilisation later. ' +
      'Sensible where returning is expensive: islands, remote sites, constrained sites.</p>' +
      '<p><strong>Augmentation</strong> — plan additions every 5–8 years. Cheaper up front, and you buy the extra energy at future prices, ' +
      'which have historically fallen. Costs you mobilisation, permits and downtime each time.</p>' +
      '<p class="muted">Merchant projects often plan neither, because nobody contracted them to a floor. Contracted projects almost always plan one.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var o = {
        installed: parseFloat(String($('dg-installed').value).replace(',', '.')),
        degrade: parseFloat(String($('dg-rate').value).replace(',', '.')),
        contract: parseFloat(String($('dg-contract').value).replace(',', '.')),
        augSize: parseFloat(String($('dg-aug').value).replace(',', '.')),
        augYears: parseYears($('dg-years').value)
      };
      var out = $('dg-out');
      var chartHost = $('dg-chart');

      if (!(o.installed > 0) || !(o.degrade >= 0 && o.degrade < 50) || !(o.contract > 0) || !(o.augSize >= 0)) {
        chartHost.innerHTML = '';
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>positive energy, rate 0–50 %</strong></div>';
        return;
      }

      var caps = simulate(o);
      drawChart(chartHost, caps, o);

      var below = caps.filter(function (c) { return c < o.contract; }).length;
      var min = Math.min.apply(null, caps);
      var minYear = caps.indexOf(min);

      out.innerHTML =
        '<div class="row"><span>Capacity at year 20</span><strong>' + caps[20].toFixed(1) + ' MWh</strong></div>' +
        '<div class="row"><span>Lowest capacity</span><strong>' + min.toFixed(1) + ' MWh in year ' + minYear + '</strong></div>' +
        '<div class="row"><span>Years below contract</span><strong class="' + (below ? 'bad-num' : '') + '">' + below + '</strong></div>' +
        '<div class="row"><span>Energy added over life</span><strong>' + (o.augSize * o.augYears.length).toFixed(0) + ' MWh</strong></div>' +
        '<div class="row"><span>Initial overbuild vs contract</span><strong>' + ((o.installed / o.contract - 1) * 100).toFixed(1) + ' %</strong></div>';
    }

    ['dg-installed', 'dg-rate', 'dg-contract', 'dg-aug', 'dg-years'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  /* ---------- drills ---------- */
  var DRILLS = [
    { id: 'm3-d1', q: 'A 400 MWh plant degrades 2 % per year. What is its capacity at year 10, in MWh?',
      unit: 'MWh', answer: 326.8, tol: 0.6,
      why: '400 × 0.98¹⁰ = 326.8 MWh. Degradation compounds — it is not 400 − 20 % = 320.' },

    { id: 'm3-d2', q: 'Same plant, year 20, in MWh?',
      unit: 'MWh', answer: 267.0, tol: 0.6,
      why: '400 × 0.98²⁰ = 267.0 MWh — a third of the nameplate gone, which is why nobody plans a 20-year contract without augmentation or overbuild.' },

    { id: 'm3-d3', q: 'At 1.5 % per year, what share of nameplate is left after 20 years, in %?',
      unit: '%', answer: 74.0, tol: 0.4,
      why: '0.985²⁰ = 73.9 %. Halving the degradation rate from 2 % to 1.5 % is worth about seven points of end-of-life capacity.' },

    { id: 'm3-d4', q: 'You must hold 400 MWh at year 20 with 2 %/yr and no augmentation. What must you build at BOL, in MWh?',
      unit: 'MWh', answer: 599.2, tol: 1.5,
      why: '400 ÷ 0.98²⁰ = 599.2 MWh. This is the pure-overbuild answer, and it explains why the number is always near 50 % overbuild.' },

    { id: 'm3-d5', q: 'That is what overbuild percentage versus the 400 MWh contract?',
      unit: '%', answer: 49.8, tol: 1.0,
      why: '599.2 ÷ 400 − 1 = 49.8 %. Roughly "add half again", which is the rule of thumb for a 20-year LFP project at 2 %/yr.' },

    { id: 'm3-d6', q: 'A 435 MWh plant degrades 2 %/yr. At year 7 its capacity is how far below 400 MWh, in MWh?',
      unit: 'MWh', answer: 22.4, tol: 0.6,
      why: '435 × 0.98⁷ = 377.6 MWh, so it is 22.4 MWh short. That shortfall is what an augmentation has to cover.' },

    { id: 'm3-d7', q: 'You add 60 MWh at that moment. What is the capacity immediately after augmenting, in MWh?',
      unit: 'MWh', answer: 437.6, tol: 0.8,
      why: '377.6 + 60 = 437.6 MWh. Note the new blocks start at 100 % health while the old ones are at 87 % — which is why DC augmentation needs recalibration and AC augmentation is easier.' },

    { id: 'm3-d8', q: 'RTE falls from 88 % at COD to 80 % at end of life. How many percentage points is that?',
      unit: 'pp', answer: 8, tol: 0.1,
      why: '8 points. Unlike capacity, RTE cannot be fixed by adding batteries — it is dominated by cell internal resistance, so contracts usually price it as liquidated damages.' },

    { id: 'm3-d9', q: 'What do BOL and EOL stand for?', type: 'text',
      accept: ['beginning of life end of life', 'beginning of life and end of life', 'beginning and end of life'],
      why: 'Beginning of life and end of life. Every capacity number in a contract must say which one it means, or you will argue about it later.' },

    { id: 'm3-d10', q: 'Name the two strategies for holding contracted energy over 20 years.', type: 'text',
      accept: ['overbuild and augmentation', 'overbuild augmentation', 'augmentation and overbuild', 'overbuild or augmentation'],
      why: 'Overbuild up front, or augment in steps. Every real project picks one, and the choice is commercial far more than technical.' },

    { id: 'm3-d11', q: 'A guarantee is 98 % availability over a year of 8,760 hours. How many hours may the plant be unavailable?',
      unit: 'h', answer: 175.2, tol: 1.0,
      why: '8,760 × 2 % = 175.2 h. Availability is measured, disputed, and paid for in liquidated damages — which is why "available" is defined in painful detail.' },

    { id: 'm3-d12', q: 'One cycle per day for 20 years is how many cycles?',
      unit: 'cycles', answer: 7300, tol: 5,
      why: '365 × 20 = 7,300. Most warranties allow roughly one cycle per day averaged annually, so a 4-hour battery cycling twice a day is outside its warranty unless negotiated.' }
  ];

  window.MODULES.push({
    id: 'm3',
    number: '03',
    title: 'Degradation, augmentation, guarantees',
    lead: 'Twenty years, two contracts, and the arithmetic that decides how much you build.',
    sections: [
      {
        h: 'Two ways a battery ages',
        p: [
          'Calendar fade happens whether you use the battery or not — a cell left in a drawer still loses capacity. It accelerates with temperature and with average state of charge.',
          'Cyclic fade comes from throughput: every charge and discharge consumes a little of the cell\'s ability to hold charge. Faster cycling, higher C-rate and deeper swings all cost more.',
          'The two combine. A plant sitting at 100 % SoC in a hot climate can age faster than one cycling gently at 25 %.'
        ],
        formula: 'Capacity(t) ≈ BOL × (1 − d)ᵗ   (d typically 1.5–2.5 %/yr)'
      },
      {
        h: 'Why 80 % is the number you keep hearing',
        p: [
          'Most guarantees promise a floor — commonly 80 % of beginning-of-life capacity at year 10, or 70 % at year 20. Below roughly 60 % a Li-ion plant is considered unusable and becomes a safety concern.',
          'Degradation is not linear in reality, and it is not the same for every supplier. That is why the number in the contract is a negotiated position, not a physical constant.'
        ],
        formula: 'Guarantee: ≥ 80 % of BOL at year 10\nFloor: ~60 % — below this, replace rather than augment'
      },
      {
        h: 'Overbuild or augment',
        p: [
          'Overbuild means installing 30–50 % more energy than the contract requires at the start, so degradation never breaches the floor. You pay once and never return.',
          'Augmentation means adding blocks every 5–8 years. Cheaper at financial close, and you buy future energy at future prices — but each event costs mobilisation, permits, downtime and re-commissioning.',
          'AC augmentation connects new blocks at medium voltage, so old and new cells can sit at different states of health. DC augmentation is cheaper and avoids touching the interconnection agreement, but forces recalibration of old and new racks.'
        ],
        formula: 'Overbuild: capex now, no return visit\nAugmentation: capex later, repeated mobilisation'
      },
      {
        h: 'Two contracts, two thresholds',
        p: [
          'The warranty covers the product: defects, workmanship, and a performance guarantee measured at the battery terminals.',
          'The offtake agreement covers the service: energy delivered at the POI, measured through the meter, after every loss in the chain.',
          'A plant can pass its capacity test at the DC terminals and still fail its offtake obligation, because the two are measured in different places. When people say "we are at 82 %", always ask: 82 % of what, where?'
        ],
        formula: 'Warranty → at the DC terminals\nOfftake → at the POI, after losses'
      },
      {
        h: 'Liquidated damages shape the design',
        p: [
          'LDs are the money that moves when a guarantee is missed. They are why availability is defined down to the minute, why RTE is measured in a specified test, and why designers add margin they would otherwise skip.',
          'The practical consequence: a plant designed exactly to the contract number will fail it. Every number you size must carry a margin for losses, degradation and measurement.'
        ],
        formula: 'Design value = contract value ÷ (1 − losses) ÷ (1 − degradation)'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
