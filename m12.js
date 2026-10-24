/* Module 12 — generation. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var STACK = [
    { name: 'Wind', gw: 30, cost: 0 },
    { name: 'Solar', gw: 25, cost: 0 },
    { name: 'Lignite', gw: 8, cost: 35 },
    { name: 'Hard coal', gw: 8, cost: 55 },
    { name: 'Gas CCGT', gw: 12, cost: 70 },
    { name: 'Gas peaker', gw: 6, cost: 110 }
  ];

  function priceAt(demand) {
    var cum = 0;
    for (var i = 0; i < STACK.length; i++) {
      cum += STACK[i].gw;
      if (demand <= cum) return STACK[i];
    }
    return STACK[STACK.length - 1];
  }

  function drawStack(host, demand) {
    var W = 860, H = 340, padL = 56, padR = 24, padT = 20, padB = 64;
    var iw = W - padL - padR, ih = H - padT - padB;
    var total = STACK.reduce(function (a, s) { return a + s.gw; }, 0);
    var maxCost = 120;

    var x = function (gw) { return padL + (gw / total) * iw; };
    var y = function (c) { return padT + ih - (c / maxCost) * ih; };

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Merit order stack and the demand line">');

    [0, 30, 60, 90, 120].forEach(function (c) {
      p.push('<line x1="' + padL + '" y1="' + y(c) + '" x2="' + (W - padR) + '" y2="' + y(c) + '" class="chart-grid"/>');
      p.push('<text x="' + (padL - 8) + '" y="' + (y(c) + 4) + '" class="chart-axis" text-anchor="end">' + c + '</text>');
    });
    p.push('<text x="' + (padL - 8) + '" y="' + (padT - 4) + '" class="chart-axis" text-anchor="end">€/MWh</text>');

    var cum = 0;
    STACK.forEach(function (s, i) {
      var x0 = x(cum), x1 = x(cum + s.gw);
      cum += s.gw;
      p.push('<rect x="' + x0 + '" y="' + y(s.cost) + '" width="' + (x1 - x0) + '" height="' + (padT + ih - y(s.cost)) +
             '" class="stack stack-' + i + '"/>');
      p.push('<text x="' + ((x0 + x1) / 2) + '" y="' + (H - 40) + '" class="chart-axis" text-anchor="middle" ' +
             'transform="rotate(-18 ' + ((x0 + x1) / 2) + ' ' + (H - 40) + ')">' + s.name + '</text>');
    });

    p.push('<line x1="' + x(demand) + '" y1="' + padT + '" x2="' + x(demand) + '" y2="' + (padT + ih) + '" class="demand-line"/>');
    p.push('<text x="' + x(demand) + '" y="' + (padT - 4) + '" class="chart-axis" text-anchor="middle">demand ' + demand + ' GW</text>');

    p.push('</svg>');
    host.innerHTML = p.join('');
  }

  var calcHTML =
    '<div class="card">' +
      '<h2>What sets the price</h2>' +
      '<p class="muted">Move the demand line. The most expensive plant that has to run sets the price for everyone — that is the merit order.</p>' +
      '<div class="grid">' +
        '<label><span>Demand</span><input id="gen-demand" type="range" min="20" max="60" step="1" value="55" />' +
          '<span class="hint"><span id="gen-demand-val">55</span> GW</span></label>' +
      '</div>' +
      '<div id="gen-chart" class="chart-wrap"></div>' +
      '<div id="gen-out" class="results"></div>' +
      '<div id="gen-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var demand = parseFloat($('gen-demand').value);
      $('gen-demand-val').textContent = demand;
      drawStack($('gen-chart'), demand);

      var m = priceAt(demand);
      var zero = STACK.filter(function (s) { return s.cost === 0; }).reduce(function (a, s) { return a + s.gw; }, 0);

      $('gen-out').innerHTML =
        '<div class="row"><span>Marginal plant</span><strong>' + m.name + '</strong></div>' +
        '<div class="row"><span>Price</span><strong>' + m.cost + ' €/MWh</strong></div>' +
        '<div class="row"><span>Zero-marginal-cost capacity</span><strong>' + zero + ' GW</strong></div>';

      $('gen-note').textContent = demand < zero
        ? 'Renewables alone exceed demand. The price collapses toward zero or below — negative prices are the market asking generators to stop, and paying storage to absorb.'
        : m.cost === 0
          ? 'Renewables still set the price at zero.'
          : 'The marginal plant sets the price. Every cheaper generator is paid the same, which is where the inframarginal rent comes from — and why a battery with near-zero marginal cost earns that price too.';
    }

    $('gen-demand').addEventListener('input', update);
    update();
  }

  var DRILLS = [
    { id: 'm12-d1', q: 'Demand is 55 GW and the stack is wind 30, solar 25, lignite 8, coal 8, CCGT 12, peaker 6. Which plant sets the price?',
      type: 'text', accept: ['lignite', 'braunkohle'],
      why: 'Lignite. Cumulative zero-cost capacity is 55 GW, so the first fossil unit on the stack is the marginal one — at 35 €/MWh.' },

    { id: 'm12-d2', q: 'With that stack, at what demand does the gas peaker become marginal?',
      unit: 'GW', answer: 71, tol: 0.5,
      why: '71 GW — above wind+solar+lignite+coal+CCGT (30+25+8+8+12). This only happens on the coldest, darkest evenings, and it is where peakers earn their keep.' },

    { id: 'm12-d3', q: 'What is negative pricing asking generators to do?',
      type: 'text', accept: ['stop generating', 'reduce output', 'curtail', 'switch off'],
      why: 'Stop generating. When supply exceeds demand, the market pays to have output removed — and pays storage to absorb it instead.' },

    { id: 'm12-d4', q: 'What does the inertia constant H describe?',
      type: 'text', accept: ['stored kinetic energy per MVA', 'kinetic energy in seconds', 'energy stored in the rotor relative to rating', 'mw s per mva'],
      why: 'The kinetic energy stored in the rotor, expressed in seconds at rated power: E = S × H. A 1 GW machine with H = 5 s stores 5 000 MW·s.' },

    { id: 'm12-d5', q: 'A 1 GW machine with H = 5 s. Stored kinetic energy, in MW·s?',
      unit: 'MW·s', answer: 5000, tol: 10,
      why: 'E = 1 000 MW × 5 s = 5 000 MW·s. That is the energy released in the first seconds of a frequency event — and the reason frequency moves slowly on a synchronous grid.' },

    { id: 'm12-d6', q: 'What does a 5 % governor droop mean?',
      type: 'text', accept: ['5 percent frequency deviation gives full power change', 'full output at 5 percent deviation', 'droop of 5 percent'],
      why: 'A 5 % frequency deviation moves the machine from no load to full output. Lower droop means a more aggressive response and more equal sharing between machines.' },

    { id: 'm12-d7', q: 'What does the AVR control?',
      type: 'text', accept: ['voltage', 'excitation', 'terminal voltage', 'reactive power and voltage'],
      why: 'The automatic voltage regulator controls excitation, and therefore terminal voltage and reactive output. Governors control frequency and active power; the two are separate loops.' },

    { id: 'm12-d8', q: 'Why does a PV plant contribute no inertia?',
      type: 'text', accept: ['no rotating mass', 'inverter', 'it has no rotor', 'no synchronous machine'],
      why: 'It has no rotating mass — the energy passes through an inverter with no stored kinetic energy. That is the whole reason grid-forming control and fast frequency response became necessary.' },

    { id: 'm12-d9', q: 'In the EEG, what replaced the fixed feed-in tariff for larger plants?',
      type: 'text', accept: ['market premium', 'gleitende marktprämie', 'sliding market premium', 'direct marketing'],
      why: 'Direct marketing with a sliding market premium. Plants sell into the market and receive a top-up to the auction price, which is what exposed them to market signals and negative prices.' },

    { id: 'm12-d10', q: 'What happens to a plant\'s output when prices go negative and it has no subsidy for curtailment?',
      type: 'text', accept: ['it keeps running and loses money', 'it curtails', 'it shuts down', 'it reduces output'],
      why: 'It either curtails or keeps running at a loss. The rules on whether curtailment is compensated changed repeatedly — which is exactly the sort of detail that decides whether a project pencils.' },

    { id: 'm12-d11', q: 'A 500 MW machine with H = 4 s. Kinetic energy, in MW·s?',
      unit: 'MW·s', answer: 2000, tol: 10,
      why: '2 000 MW·s. Half the rating, half the energy — and half the support during the first seconds of a disturbance.' },

    { id: 'm12-d12', q: 'Why are batteries described as having near-zero marginal cost?',
      type: 'text', accept: ['no fuel cost', 'they do not burn fuel', 'the cost is the charging energy', 'no fuel'],
      why: 'No fuel is burned, so the marginal cost of delivering a megawatt-hour is the cost of the energy used to charge it, plus wear. That makes them price-takers in the merit order.' }
  ];

  window.MODULES.push({
    id: 'm12',
    number: '12',
    title: 'Generation',
    lead: 'What storage is compensating for — machines, inverters, and the market that dispatches them.',
    sections: [
      {
        h: 'The synchronous machine, in four ideas',
        p: [
          'A synchronous generator spins at exactly grid frequency, held there by the balance of mechanical power in and electrical power out. Its rotor stores kinetic energy: <code>E = S · H</code>, with H typically 3–7 seconds.',
          'The <strong>governor</strong> adjusts mechanical input as frequency changes, with a droop of a few percent. The <strong>AVR</strong> adjusts excitation to hold voltage and supply reactive power. They are separate loops and are often confused.',
          'That stored energy is invisible until something goes wrong — then it is the only reason the frequency falls slowly enough for control to act.'
        ],
        formula: 'E = S · H   ·   droop ≈ 5 %   ·   AVR holds voltage'
      },
      {
        h: 'Thermal and hydro: ramp rates and minimum load',
        p: [
          'Coal and gas plants take hours to start and have minimum stable loads; they cannot follow a ten-minute forecast error. Hydro is fast but geographically limited.',
          'These constraints — ramp rate, minimum load, start-up cost — are why the dispatch stack has a shape, and why the cheapest plant is not always running.',
          'They are also why frequency response was historically a by-product: a spinning machine responds automatically because physics makes it.'
        ],
        formula: 'Slow to start · minimum load · response for free'
      },
      {
        h: 'Renewables: variable, forecastable, and zero marginal cost',
        p: [
          'Wind and solar have no fuel cost, so they run whenever they can and sit at the bottom of the merit order. Their output is variable and forecast with error, which is what creates the need for flexibility.',
          'When their output exceeds demand, prices go to zero or negative. That is not a market failure: it is the market telling generators to stop and telling storage to charge.',
          'Their inverters also replaced rotating machines, which removed inertia from the system at exactly the moment variability increased.'
        ],
        formula: 'Zero marginal cost · forecast error · no inertia'
      },
      {
        h: 'Inverter-based generation and what it lacks',
        p: [
          'A PV or wind inverter follows the grid: it measures voltage and frequency and injects current in phase. It cannot establish a grid on its own, and it contributes no inertia.',
          'As inverter share rises, the grid gets weaker: lower short-circuit strength, faster RoCoF, and less inherent damping. Grid codes respond by demanding synthetic inertia and grid-forming capability.',
          'Storage is the natural provider — it can inject real power instantly — but only within its energy and power limits. It buys time; it does not restore the physics of a rotating mass.'
        ],
        formula: 'Follow the grid · no inertia · stability becomes a control problem'
      },
      {
        h: 'Merit order and the price',
        p: [
          'Plants are dispatched in order of marginal cost. The most expensive plant that must run sets the price for everyone — which is why a gas peaker at 110 €/MWh can set a price received by a wind farm at zero cost.',
          'The gap between a plant\'s marginal cost and the clearing price is inframarginal rent. It funds fixed costs, and it is the reason cheap generators like a fully depreciated lignite plant are valuable.',
          'A battery with near-zero marginal cost earns the clearing price when it discharges — but pays for the energy it stored. Its margin is the spread, not the price.'
        ],
        formula: 'Price = marginal cost of the marginal plant'
      },
      {
        h: 'The German mix, and how it got there',
        p: [
          'The EEG built the renewables fleet through guaranteed prices, then moved larger plants to direct marketing with a sliding premium. That shift exposed generators to market signals, including negative prices.',
          'The nuclear phase-out and the coal exit removed synchronous capacity in the same decades that inverter capacity grew — a double change to system stability.',
          'Understanding this history matters commercially: it explains why German storage revenue is concentrated in frequency services and why the capacity mechanism debate keeps returning.'
        ],
        formula: 'Feed-in tariff → market premium → market exposure'
      }
    ],
    renderExtra: function (host) {
      host.innerHTML =
        '<div class="card">' +
          '<h2>One caveat on the numbers</h2>' +
          '<p>The stack in the calculator is a teaching model: illustrative capacities and marginal costs, not a snapshot of the German market on any particular day.</p>' +
          '<p class="muted">The shape is what matters — cheap must-run at the bottom, flexible gas at the top, zero-marginal-cost renewables shifting the whole curve left as they grow.</p>' +
        '</div>';
    },
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
