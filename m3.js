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


  function drawStrategies(host) {
    var W = 860, H = 380, padL = 62, padR = 120, padT = 24, padB = 46;
    var iw = W - padL - padR, ih = H - padT - padB;
    var lo = 260, hi = 620;
    var x = function (y) { return padL + (y / 20) * iw; };
    var y = function (c) { return padT + ih - ((c - lo) / (hi - lo)) * ih; };

    var noAction = [], over = [], aug = [];
    for (var i = 0; i <= 20; i++) {
      noAction.push(435 * Math.pow(0.98, i));
      over.push(599.15 * Math.pow(0.98, i));
      aug.push(0);
    }
    var cap = 500;
    aug[0] = cap;
    for (var yr = 1; yr <= 20; yr++) {
      cap = cap * 0.98;
      if (yr === 7 || yr === 14) cap += 60;
      aug[yr] = cap;
    }

    function line(arr, cls) {
      return '<polyline points="' + arr.map(function (c, j) { return x(j) + ',' + y(c); }).join(' ') + '" class="' + cls + '"/>';
    }

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Three capacity strategies against a 400 MWh contract floor">');

    [300, 400, 500, 600].forEach(function (c) {
      p.push('<line x1="' + padL + '" y1="' + y(c) + '" x2="' + (padL + iw) + '" y2="' + y(c) + '" class="chart-grid"/>');
      p.push('<text x="' + (padL - 8) + '" y="' + (y(c) + 4) + '" class="chart-axis" text-anchor="end">' + c + '</text>');
    });
    [0, 5, 10, 15, 20].forEach(function (yr2) {
      p.push('<text x="' + x(yr2) + '" y="' + (H - 20) + '" class="chart-axis" text-anchor="middle">y' + yr2 + '</text>');
    });

    p.push('<line x1="' + padL + '" y1="' + y(400) + '" x2="' + (padL + iw) + '" y2="' + y(400) + '" class="chart-threshold"/>');

    p.push(line(over, 'strat-a'));
    p.push(line(aug, 'strat-c'));
    p.push(line(noAction, 'strat-b'));


    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>Three answers to the same contract</h2>' +
        '<p class="muted">All three start from an honest intention of delivering 400 MWh at year 20. Only two get there.</p>' +
        '<div class="legend"><span><i class="sw-a"></i>overbuild</span><span><i class="sw-c"></i>augment</span>' +
        '<span><i class="sw-b"></i>nothing</span><span><i class="sw-contract"></i>contract floor</span></div>' +
        '<div class="chart-wrap">' + p.join('') + '</div>' +
        '<p class="muted">Overbuild starts at 599 MWh and lands exactly on the line. Augmentation starts at 500 MWh and steps up twice. Doing nothing starts at 435 MWh and ends 110 MWh short — the shape most business cases quietly assume away.</p>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'm3',
    number: '03',
    title: 'Degradation, augmentation, guarantees',
    lead: 'Twenty years, two contracts, and the arithmetic that decides how much you build.',
    sections: [
      {
        h: 'Two ways a battery ages',
        p: [
          `Calendar fade happens whether you use the battery or not — a cell left in a drawer still loses capacity. It accelerates with temperature and with average state of charge, which is why a plant parked at 100 % in a hot climate can age faster than one cycling gently at 25 %.`,
          `Cyclic fade comes from throughput: every charge and discharge consumes a little of the cell's ability to hold charge. Faster cycling, higher C-rate and deeper swings all cost more, and the damage accumulates in a way that is not reversible.`,
          `The two combine, and they interact. A cell that has faded on the calendar has less headroom to absorb cycling damage, so the curve steepens rather than staying straight — which is why a linear model is a planning tool, not a prediction.`
        ],
        formula: 'Capacity(t) ≈ BOL × (1 − d)ᵗ   (d typically 1.5–2.5 %/yr)',
        example: {
          title: 'Worked example — what 2 % a year really means',
          steps: [`Start at 400 MWh and apply 2 % a year.`, `Year 5: 361.6 MWh.`, `Year 10: 326.8 MWh.`, `Year 15: 295.4 MWh.`, `Year 20: 267.0 MWh.`, `A third of the plant has quietly disappeared, and the contract still says 400.`],
          result: `That gap is the entire reason this module exists.`
        },
        mistake: `Modelling degradation as linear — 400 MWh minus 8 MWh per year, reaching 240 MWh at year 20. Compounding gives 267 MWh, so the linear model overstates the loss by 27 MWh and understates the capacity. Both errors cost money, in opposite directions.`,
        check: `400 MWh at 2 % a year: what is left at year 10? Answer: 326.8 MWh.`
      },
      {
        h: 'Why 80 % is the number you keep hearing',
        p: [
          `Most guarantees promise a floor: commonly 80 % of beginning-of-life capacity at year 10, or 70 % at year 20. Below roughly 60 %, a Li-ion plant is considered unusable and increasingly a safety concern, because degraded cells generate more heat for the same current.`,
          `The number is a negotiated position, not a physical constant. It depends on chemistry, on how the plant is cycled, on the temperature it lives at, and on how much the offtaker is willing to pay for certainty.`,
          `It is also measured somewhere specific. A guarantee against capacity at the DC terminals is a different promise from one at the POI, and the difference is every loss in Module 2.`,
          `Ask for the guarantee in writing with three things attached: the metric, the measurement boundary, and the test procedure. Without all three, the number is an aspiration dressed as a contract.`
        ],
        formula: 'Guarantee: ≥ 80 % of BOL at year 10\nFloor: ~60 % — below this, replace rather than augment',
        example: {
          title: 'Worked example — two ways to fail the same promise',
          steps: [`An 80 % guarantee at year 10 on a 400 MWh BOL plant means 320 MWh.`, `A plant measuring 326 MWh at the DC terminals passes.`, `The same plant at the POI, after 8 % losses, delivers 300 MWh — and fails an offtake written at the meter.`],
          result: `Same hardware, same test, two verdicts.`
        },
        mistake: `Treating the guarantee as a target. It is a floor for the contract, not a design aim — designing to land exactly on 80 % at year 10 leaves nothing for a hot summer or an unexpected cycling profile.`,
        check: `A 400 MWh plant must hold 80 % at year 10. What is that in MWh? Answer: 320 MWh.`
      },
      {
        h: 'Overbuild or augment',
        p: [
          `Overbuild means installing 30–50 % more energy than the contract requires at the start, so degradation never breaches the floor. You pay once, never return, and you carry the cost of the extra cells for twenty years.`,
          `Augmentation means adding blocks every 5–8 years. It is cheaper at financial close and you buy the future energy at future prices — but each event costs mobilisation, permits, downtime and re-commissioning, and each one is a chance to lose a month.`,
          `The choice is usually made by the offtake, not by preference. A merchant plant with no capacity floor often plans neither; a contracted plant almost always plans one of them.`,
          `A useful discipline in a review: ask which strategy the financial model assumes and then look for the augmentation capex in the out-years. If it is not there, the model is assuming neither, and year 15 will be a surprise.`
        ],
        formula: 'Overbuild: capex now, no return visit\nAugmentation: capex later, repeated mobilisation',
        example: {
          title: 'Worked example — the same 400 MWh promise, three ways',
          steps: [`No action: start at 435 MWh, end at 290 MWh — 110 MWh short.`, `Overbuild: start at 599 MWh (49.8 % over), end exactly at 400 MWh.`, `Augment: start at 500 MWh, add 60 MWh in year 7 and again in year 14, end at 433 MWh.`],
          result: `The chart below draws all three against the contract line.`
        },
        mistake: `Planning augmentation but not reserving the space, the cable route and the spare breaker for it. The decision costs nothing on paper and everything on site when the containers arrive and there is nowhere to put them.`,
        check: `At 2 % a year with no augmentation, what must you build to still hold 400 MWh in year 20? Answer: 400 ÷ 0.98²⁰ = 599 MWh.`
      },
      {
        h: 'Two contracts, two thresholds',
        p: [
          `The warranty covers the product: defects, workmanship, and a performance guarantee measured at the battery terminals. The offtake covers the service: energy delivered at the POI, measured through the meter, after every loss in the chain.`,
          `They can disagree without either party being dishonest. A plant at 82 % of BOL at the DC terminals passes its warranty and can still fail an offtake written at 80 % of POI energy, because 82 % at the terminals is roughly 72 % at the meter.`,
          `This is why the question "82 % of what, where?" is the most useful sentence in a performance meeting. It separates a real shortfall from a measurement disagreement, and it usually does so in under a minute.`
        ],
        formula: 'Warranty → at the DC terminals\nOfftake → at the POI, after losses',
        example: {
          title: 'Worked example — the 82 % that fails',
          steps: [`BOL 400 MWh.`, `Measured at the DC terminals in year 8: 328 MWh — 82 %, comfortably inside an 80 % guarantee.`, `At the POI with 8 % losses: 302 MWh, which is 75.5 % of BOL.`],
          result: `If the offtake promises 80 % of POI energy at year 8, the asset is short by 18 MWh and owes damages on a plant that just passed its warranty test.`
        },
        mistake: `Assuming one test satisfies both contracts. The warranty test, the offtake test and the capacity test may be the same procedure at three different boundaries — and passing one proves nothing about the others.`,
        check: `82 % at the DC terminals with 8 % losses is what fraction at the POI? Answer: 75.4 %.`
      },
      {
        h: 'Liquidated damages shape the design',
        p: [
          `Liquidated damages are the money that moves when a guarantee is missed. They are why availability is defined to the minute, why RTE is measured in a specified test at a specified boundary, and why designers add margin they would otherwise skip.`,
          `LDs are usually capped, and the cap is usually a percentage of contract value. That cap is what a lender prices, and it explains why a project with tight guarantees can be financed at a worse rate than one with loose guarantees and a bigger contingency.`,
          `The practical consequence is uncomfortable: a plant designed exactly to the contract number will fail it. Every number you size must carry margin for losses, degradation and measurement error — and the margin has to be visible in the pack, not buried in a round number.`
        ],
        formula: 'Design value = contract value ÷ (1 − losses) ÷ (1 − degradation)',
        example: {
          title: 'Worked example — building the margin in',
          steps: [`Contract: 400 MWh at the POI for twenty years, 8 % losses, 2 %/yr degradation, 80 % floor.`, `POI requirement at year 20: 320 MWh.`, `DC requirement: 347.8 MWh.`, `BOL for that with degradation: 347.8 ÷ 0.98²⁰ = 520.9 MWh.`],
          result: `Add the 60 MWh of augmentation and the initial build falls — which is exactly the trade the next twenty years will be argued about.`
        },
        mistake: `Sizing to the contract at COD and assuming degradation is "covered by the guarantee". The guarantee compensates you after the shortfall, at a capped rate, once you have proven it — it does not keep the plant compliant.`,
        check: `What is the design value when losses are 8 % and degradation is 2 %/yr over 20 years, for a 400 MWh contract? Answer: 400 ÷ 0.92 ÷ 0.6676 ≈ 651 MWh, before augmentation.`
      }
    ],
    renderExtra: drawStrategies,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
