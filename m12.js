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
          `A synchronous generator spins at exactly grid frequency, held there by the balance between mechanical power in and electrical power out. Its rotor stores kinetic energy: <code>E = S · H</code>, with H typically 3–7 seconds, so a 1 GW machine holds several thousand megawatt-seconds of energy that nobody paid for explicitly.`,
          `The <strong>governor</strong> adjusts mechanical input as frequency changes, with a droop of a few percent — a 5 % droop means a 5 % frequency deviation moves the machine from no load to full output. The <strong>AVR</strong> adjusts excitation to hold voltage and supply reactive power. Two separate loops, routinely confused with each other.`,
          `The point of all this is that a synchronous machine provides stability as a by-product of existing. Nobody had to specify inertia, voltage support or fault current: physics supplied them, and the market price never showed them.`
        ],
        formula: 'E = S · H   ·   droop ≈ 5 %   ·   AVR holds voltage',
        example: {
          title: 'Worked example — the energy in a rotor',
          steps: [`A 1 GW machine with H = 5 s stores 5,000 MW·s.`, `If 3,000 MW of generation is lost, that stored energy is what slows the frequency decline for the first seconds — before governors respond at all.`],
          result: `Multiply it across the fleet and you have the system inertia that decides how fast RoCoF develops.`
        },
        mistake: `Assuming a battery provides the same thing because it responds quickly. Fast response acts on a deviation that has already happened; inertia determines how fast that deviation develops in the first place.`,
        check: `A 500 MW machine with H = 4 s: what is the stored energy? Answer: 2,000 MW·s.`
      },
      {
        h: 'Thermal and hydro: ramp rates and minimum load',
        p: [
          `Coal and gas plants take hours to start and have minimum stable loads; they cannot follow a ten-minute forecast error. Hydro is fast but geographically limited, and its energy is limited by water rather than by fuel.`,
          `These constraints — ramp rate, minimum load, start-up cost — are why the dispatch stack has a shape at all, and why the cheapest plant is not always running. A unit held at minimum load for system reasons is being paid for something other than energy.`,
          `They are also why frequency response was historically a by-product: a spinning machine responds automatically because physics makes it. The control room did not buy response; it received it with the generation.`
        ],
        formula: 'Slow to start · minimum load · response for free',
        example: {
          title: 'Worked example — why the coal plant stays on',
          steps: [`A 500 MW coal unit with a 40 % minimum load must stay above 200 MW whenever it is running, even when the market price says zero.`, `That is 200 MW of must-run capacity sitting under the renewables, which is why negative prices appear before the coal fleet has switched off.`],
          result: `The same logic explains why a gas plant can be running while the price is below its own short-run marginal cost: it is being kept warm for a later peak, and the cost of being warm is a line item someone has to justify.`
        },
        mistake: `Reading merit-order charts as if every plant can start and stop freely. The chart describes marginal cost; the constraints behind it describe what can actually happen.`,
        check: `What happens to price when must-run output exceeds demand? Answer: it goes to zero or negative.`
      },
      {
        h: 'Renewables: variable, forecastable, zero marginal cost',
        p: [
          `Wind and solar have no fuel cost, so they run whenever they can and sit at the bottom of the merit order. Their output is variable and forecast with error, and the error is what creates the need for flexibility at every timescale from seconds to seasons.`,
          `When their output exceeds demand, prices go to zero or negative. That is not a market failure; it is the market telling generators to stop and telling storage to charge. The signal is correct — the question is who can respond to it.`,
          `Their inverters also replaced rotating machines, which removed inertia from the system at exactly the moment variability increased. That coincidence is the technical story of the German Energiewende.`
        ],
        formula: 'Zero marginal cost · forecast error · no inertia',
        example: {
          title: 'Worked example — the midday collapse',
          steps: [`On a sunny Sunday, 25 GW of solar against 55 GW of demand pushes the marginal plant down the stack to a zero-cost unit, so the clearing price goes to zero.`, `Add strong wind and the price crosses into negative territory: generators pay to keep running rather than shut down, and a battery is paid to charge.`],
          result: `Note that the battery is not competing with the solar farm; it is buying its output at the moment the solar farm cannot give it away.`
        },
        mistake: `Assuming negative prices are temporary anomalies. In high-renewable systems they are a structural feature, and a storage business case that ignores them is ignoring its cheapest charging hours.`,
        check: `What is the marginal cost of wind generation? Answer: essentially zero.`
      },
      {
        h: 'Inverter-based generation and what it lacks',
        p: [
          `A PV or wind inverter follows the grid: it measures voltage and frequency and injects current in phase with what it finds. It cannot establish a grid on its own, and it contributes no inertia because there is no rotating mass.`,
          `As inverter share rises the grid gets weaker — lower short-circuit strength, faster RoCoF, less inherent damping. The controls that used to be a curiosity become mandatory, which is why grid codes have moved from "ride through" to "support".`,
          `Grid-forming control is the response: a converter that establishes voltage and frequency rather than following them. Storage is the natural provider because it can inject real power instantly — but only within its energy and power limits.`
        ],
        formula: 'Follow the grid · no inertia · stability becomes a control problem',
        example: {
          title: 'Worked example — what a weak grid does to a converter',
          steps: [`At a low short-circuit ratio the voltage at the converter terminals moves as the converter injects current, so a control loop tuned for a stiff grid becomes unstable.`, `That is why grid-forming inverters and careful tuning are required on weak parts of the network, and why a plant that worked on one site may oscillate on another.`],
          result: `The short-circuit ratio at the connection point is therefore a design parameter, not a network curiosity, and it belongs in the PCS specification, right next to the efficiency figures nobody argues about.`
        },
        mistake: `Assuming a grid-following inverter is a drop-in replacement for a synchronous machine. It replaces the energy, not the behaviour — and the behaviour was free before.`,
        check: `What does grid-forming control establish? Answer: voltage and frequency, without needing an existing reference.`
      },
      {
        h: 'Merit order and the price',
        p: [
          `Plants are dispatched in order of marginal cost. The most expensive plant that must run sets the price for everyone — so a gas peaker at 110 €/MWh sets a price that a wind farm at zero cost also receives.`,
          `The gap between a plant's own marginal cost and the clearing price is inframarginal rent. It funds fixed costs, and it explains why a fully depreciated lignite plant is a valuable asset even when it runs rarely.`,
          `A battery with near-zero marginal cost earns the clearing price when it discharges, but pays for the energy it stored. Its margin is the spread, not the price — which is why storage business cases look nothing like generation business cases.`
        ],
        formula: 'Price = marginal cost of the marginal plant',
        example: {
          title: 'Worked example — who sets the price at 55 GW',
          steps: [`Stack: 30 GW wind and 25 GW solar at zero, then lignite at 35 €/MWh.`, `At 55 GW demand the zero-cost capacity is exactly exhausted, so the first lignite unit is marginal and sets 35 €/MWh — for every megawatt-hour sold, including the 55 GW of renewables that cost nothing to run.`],
          result: `That gap between cost and price is the money that funds the whole fleet, and it is the reason merit-order charts are studied by investors as closely as by engineers.`
        },
        mistake: `Thinking the price reflects the average cost of generation. It reflects the cost of the last unit needed, which can be far above or below the average.`,
        check: `Who sets the price when demand exceeds all zero-cost capacity? Answer: the cheapest fossil unit that must run.`
      },
      {
        h: 'The German mix, and how it got there',
        p: [
          `The EEG built the renewables fleet through guaranteed prices, then moved larger plants to direct marketing with a sliding premium. That shift exposed generators to market signals, including negative prices, and changed what "operating" a renewable plant means.`,
          `The nuclear phase-out and the coal exit removed synchronous capacity in the same decades that inverter capacity grew — a double change to system stability that no single policy intended.`,
          `Understanding this history matters commercially. It explains why German storage revenue is concentrated in frequency services, why the capacity mechanism debate keeps returning, and why the regulatory framework you learn today will look different in three years.`
        ],
        formula: 'Feed-in tariff → market premium → market exposure',
        example: {
          title: 'Worked example — the same plant under two regimes',
          steps: [`Under a fixed feed-in tariff a PV plant runs whenever the sun shines, because every kilowatt-hour is paid the same.`, `Under direct marketing with a sliding premium it faces the market price, so on a negative-price afternoon it may curtail.`, `Same asset, same sun, different behaviour — driven entirely by the settlement mechanism.`],
          result: `Any storage business case therefore needs a view on policy, not just on price spreads — and it should state that view explicitly so it can be argued with — and revisited when the next amendment lands.`
        },
        mistake: `Learning the current subsidy rules as if they were engineering constants. They are policy, they change with governments, and any business case older than a year should be treated as a draft.`,
        check: `What replaced the fixed feed-in tariff for larger plants? Answer: direct marketing with a sliding market premium.`
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
