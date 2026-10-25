/* Module 11 — transmission. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var BANDS = [
    { id: 'fcr', label: 'FCR — 30 s', from: 0, to: 30, colour: 'band-a',
      text: 'Frequency containment reserve. Automatic, local, proportional to frequency deviation. Must be fully active within 30 seconds and is bought in symmetrical blocks.' },
    { id: 'afrr', label: 'aFRR — 5 min', from: 0, to: 300, colour: 'band-b',
      text: 'Automatic frequency restoration reserve. Activated by a signal from the TSO, fully active within 5 minutes, and it restores frequency rather than just containing it.' },
    { id: 'mfrr', label: 'mFRR — 15 min', from: 0, to: 900, colour: 'band-c',
      text: 'Manual frequency restoration reserve. Dispatched by the TSO, fully active within 15 minutes, used for larger and longer deviations.' }
  ];

  function drawTimeline(host) {
    var W = 860, H = 260, padL = 150, padR = 30, padT = 40;
    var iw = W - padL - padR;
    var total = 900;
    var x = function (s) { return padL + (s / total) * iw; };

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Activation times of the three balancing products">');

    /* axis */
    p.push('<line x1="' + padL + '" y1="' + (H - 40) + '" x2="' + (W - padR) + '" y2="' + (H - 40) + '" class="chart-grid"/>');
    [0, 30, 300, 600, 900].forEach(function (s) {
      p.push('<line x1="' + x(s) + '" y1="' + padT + '" x2="' + x(s) + '" y2="' + (H - 40) + '" class="chart-grid faint"/>');
      var label = s === 0 ? '0' : (s < 60 ? s + ' s' : (s / 60) + ' min');
      p.push('<text x="' + x(s) + '" y="' + (H - 20) + '" class="chart-axis" text-anchor="middle">' + label + '</text>');
    });

    BANDS.forEach(function (b, i) {
      var y = padT + i * 56;
      p.push('<text x="' + (padL - 12) + '" y="' + (y + 19) + '" class="chart-axis" text-anchor="end">' + b.label.split(' — ')[0] + '</text>');
      p.push('<rect x="' + x(b.from) + '" y="' + y + '" width="' + Math.max(2, x(b.to) - x(b.from)) + '" height="26" rx="6" class="' + b.colour + '"/>');
      p.push('<text x="' + (x(b.to) + 8) + '" y="' + (y + 18) + '" class="chart-axis">' + b.label.split(' — ')[1] + '</text>');
    });

    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>Who responds, and how fast</h2>' +
        '<p class="muted">Tap a band. The products are defined by their activation time, and that time is what your battery is paid for.</p>' +
        '<div id="tl-wrap">' + p.join('') + '</div>' +
        '<div id="tl-detail" class="node-detail"></div>' +
      '</div>';

    var wrap = host.querySelector('#tl-wrap');
    var detail = host.querySelector('#tl-detail');

    function select(id) {
      var b = BANDS.filter(function (x2) { return x2.id === id; })[0];
      if (!b) return;
      wrap.querySelectorAll('rect').forEach(function (r) {
        r.classList.toggle('active', r.getAttribute('class').indexOf(b.colour) === 0);
      });
      detail.innerHTML = '<h3>' + b.label + '</h3><p>' + b.text + '</p>';
    }

    wrap.querySelectorAll('rect').forEach(function (r, i) {
      r.addEventListener('click', function () { select(BANDS[i].id); });
    });
    select('fcr');
  }

  var calcHTML =
    '<div class="card">' +
      '<h2>Inertia and rate of change of frequency</h2>' +
      '<p class="muted">Lose generation and the frequency falls. How fast depends on how much kinetic energy is spinning — and storage has none unless it is controlled to behave as if it did.</p>' +
      '<div class="grid">' +
        '<label><span>Lost generation</span><input id="tr-dp" type="text" inputmode="decimal" value="3000" /><span class="hint">MW</span></label>' +
        '<label><span>System inertia</span><input id="tr-e" type="text" inputmode="decimal" value="200000" /><span class="hint">MW·s</span></label>' +
        '<label><span>Nominal frequency</span><input id="tr-f" type="text" inputmode="decimal" value="50" /><span class="hint">Hz</span></label>' +
      '</div>' +
      '<div id="tr-out" class="results"></div>' +
      '<div id="tr-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var dp = n('tr-dp'), e = n('tr-e'), f = n('tr-f');
      var out = $('tr-out'), note = $('tr-note');

      if (!(dp > 0) || !(e > 0) || !(f > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>loss, inertia, frequency</strong></div>';
        note.textContent = '';
        return;
      }

      var rocof = (dp * f) / (2 * e);
      var timeTo49 = 1 / rocof;

      out.innerHTML =
        '<div class="row"><span>Rate of change of frequency</span><strong>' + rocof.toFixed(3) + ' Hz/s</strong></div>' +
        '<div class="row"><span>Time to lose 1 Hz</span><strong>' + (timeTo49 < 60 ? timeTo49.toFixed(1) + ' s' : (timeTo49 / 60).toFixed(1) + ' min') + '</strong></div>' +
        '<div class="row"><span>Inertia needed for 0.5 Hz/s</span><strong>' + ((dp * f) / (2 * 0.5) / 1000).toFixed(0) + ' GW·s</strong></div>';

      note.textContent = rocof > 1
        ? 'Faster than 1 Hz/s — protection settings and RoCoF relays start to matter, and a large synchronous machine would have tripped.'
        : 'Within a range conventional protection can ride through. Note that this is physics, not policy: the same loss with half the inertia doubles the RoCoF.';
    }

    ['tr-dp', 'tr-e', 'tr-f'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm11-d1', q: 'How fast must FCR be fully active, in seconds?',
      unit: 's', answer: 30, tol: 0.5,
      why: '30 seconds. It is the fastest product, bought symmetrically, and the one batteries win most easily.' },

    { id: 'm11-d2', q: 'How fast must aFRR be fully active, in minutes?',
      unit: 'min', answer: 5, tol: 0.05,
      why: '5 minutes. It restores frequency rather than merely containing it, and is dispatched by signal from the TSO.' },

    { id: 'm11-d3', q: 'How fast must mFRR be fully active, in minutes?',
      unit: 'min', answer: 15, tol: 0.1,
      why: '15 minutes. Manual dispatch, larger blocks, used for longer deviations.' },

    { id: 'm11-d4', q: 'Name the four German transmission system operators.',
      type: 'text', accept: ['50hertz amprion tennet transnetbw', 'tennet transnetbw amprion 50hertz', '50hertz amprion tennet transnet bw'],
      why: '50Hertz, Amprion, TenneT and TransnetBW. Knowing which one owns your region is the difference between a phone call and a week of email.' },

    { id: 'm11-d5', q: 'What does n-1 mean?',
      type: 'text', accept: ['single failure', 'one element may fail', 'one contingency', 'the system survives the loss of any single element'],
      why: 'The system must survive the loss of any single element — a line, a transformer, a generator. It is the core planning criterion, and it is why grids are built with redundancy.' },

    { id: 'm11-d6', q: 'What is RoCoF the abbreviation of, and what is its unit?',
      type: 'text', accept: ['rate of change of frequency hz/s', 'rate of change of frequency in hz per second', 'rate of change of frequency'],
      why: 'Rate of change of frequency, in Hz/s. It is the first derivative of frequency and the thing that trips protection before frequency itself moves far.' },

    { id: 'm11-d7', q: '3000 MW is lost from a system with 200,000 MW·s of inertia at 50 Hz. RoCoF, in Hz/s?',
      unit: 'Hz/s', answer: 0.375, tol: 0.01,
      why: 'RoCoF = ΔP·f / (2·E) = 3000 × 50 / (2 × 200 000) = 0.375 Hz/s. This is the number that decides whether protection rides through.' },

    { id: 'm11-d8', q: 'What inertia would keep that same loss to 0.5 Hz/s, in MW·s?',
      unit: 'MW·s', answer: 150000, tol: 2000,
      why: 'E = ΔP·f / (2·RoCoF) = 3000 × 50 / 1 = 150 000 MW·s. Storage can supply this synthetically, but only while it has energy and is controlled to do so.' },

    { id: 'm11-d9', q: 'From what output does Redispatch 2.0 cover a plant, in kW?',
      unit: 'kW', answer: 100, tol: 0.5,
      why: '100 kW. Since the reform, essentially every plant above that size can be redispatched, which is one reason storage became attractive to TSOs.' },

    { id: 'm11-d10', q: 'Why is HVDC used for long connections and between asynchronous grids?',
      type: 'text', accept: ['no reactive power along the cable', 'it decouples frequency', 'asynchronous and long distance', 'lower losses over long distance and no stability coupling'],
      why: 'It decouples the two ends: no reactive current over distance, no frequency coupling, and no stability problem to synchronise. The cost is converter stations at both ends.' },

    { id: 'm11-d11', q: 'What does a grid-forming converter provide that a grid-following one does not?',
      type: 'text', accept: ['voltage and frequency reference', 'a voltage reference', 'it sets voltage and frequency', 'can operate without an existing grid'],
      why: 'It establishes voltage and frequency itself, so it can run an island or support a weak grid. A grid-following converter needs an existing reference to follow.' },

    { id: 'm11-d12', q: 'A 380 kV line carries 1,000 MVA. Current, in kA?',
      unit: 'kA', answer: 1.52, tol: 0.03,
      why: 'I = 1 000 / (√3 × 380) = 1.52 kA. High voltage means modest current — which is the entire reason transmission is built the way it is.' }
  ];

  window.MODULES.push({
    id: 'm11',
    number: '11',
    title: 'Transmission',
    lead: 'The layer where utility-scale storage earns most of its money, and where the physics of stability lives.',
    sections: [
      {
        h: 'The top of the chain',
        p: [
          `Transmission runs at 220 and 380 kV in Germany, split between four TSOs — 50Hertz, Amprion, TenneT and TransnetBW — and coordinated across Europe inside ENTSO-E. The TSOs balance generation and demand second by second, plan the network decades ahead, and buy the services that keep frequency and voltage inside their limits.`,
          `Connection here follows VDE-AR-N 4120 and the TSO's own rules. The engineering is similar to medium voltage; the consequences of being wrong are not, because a 380 kV substation is a national asset and its protection is designed accordingly.`,
          `For a BESS developer, transmission is where the money is: frequency response, redispatch and capacity are all procured at this level, and the interfaces are fewer but much larger.`
        ],
        formula: '220/380 kV · four TSOs · ENTSO-E coordination',
        example: {
          title: 'Worked example — knowing which TSO owns the site',
          body: `The four control areas meet in the middle of the country, and a site near a boundary can sit in either. The connection process, the redispatch rules and sometimes the available products differ between them, and asking the wrong operator for a connection study costs six weeks before anyone tells you it is the wrong operator. The control-area map is published, but the boundary near a large load centre is not always intuitive, so confirm it in writing before commissioning a study.`
        },
        mistake: `Treating the TSO as an obstacle rather than a customer. At transmission level your plant is selling a service to an organisation that publishes what it needs in detail, every year.`,
        check: `Which TAR applies at 380 kV? Answer: 4130 (extra-high voltage).`
      },
      {
        h: 'n-1, congestion, and redispatch',
        p: [
          `The grid is planned to survive the loss of any single element — n-1. Every line, transformer and generator may fail, and the system must remain operable without cascading. That single planning rule explains most of the redundancy you see when you look at a substation.`,
          `When actual flows approach a limit anyway, the TSO redispatches: pays one plant to reduce output and another to increase it, so the physical flow moves away from the constraint. Redispatch 2.0 brought every plant above 100 kW into that mechanism, which turned distributed storage into a resource the TSO can call.`,
          `Congestion is local and temporal — a line is overloaded because wind is strong in the north and demand sits in the south. Storage on the right side of that constraint is worth more than identical storage anywhere else.`
        ],
        formula: 'n-1 planning · redispatch when reality beats the plan',
        example: {
          title: 'Worked example — why location is the whole business case',
          body: `Two identical 100 MW batteries, one at a north German wind cluster and one outside Munich, face different prices, different congestion and different redispatch value. Same hardware, same cost, different revenue by a factor that can exceed two — because one of them is on the correct side of a constraint. That is also why portfolio developers buy options on several sites rather than committing to one before the grid studies return.`
        },
        mistake: `Site selection driven by land price and grid connection speed alone. At transmission level, the constraint map is the commercial map.`,
        check: `From what size does Redispatch 2.0 cover a plant? Answer: 100 kW.`
      },
      {
        h: 'Three balancing products, three timescales',
        p: [
          `<strong>FCR</strong> is automatic and local: it responds to the frequency deviation itself, must be fully active within 30 seconds, and is bought in symmetrical blocks. <strong>aFRR</strong> is signalled by the TSO, restores frequency rather than containing it, and must be fully active within 5 minutes. <strong>mFRR</strong> is manually dispatched and takes up to 15 minutes.`,
          `The products are not interchangeable. Prequalification, metering, control interface and energy obligations differ, and a battery that is fast enough for FCR may still fail aFRR prequalification on control interface or on sustained energy.`,
          `Revenue per MW is highest for FCR and lowest for mFRR, but FCR requires continuous availability and symmetric headroom — which removes usable energy from arbitrage. The product choice is a design decision disguised as a commercial one.`
        ],
        formula: 'FCR 30 s · aFRR 5 min · mFRR 15 min',
        example: {
          title: 'Worked example — the energy an FCR obligation consumes',
          body: `A 100 MW plant offering 20 MW of FCR must hold 20 MW of headroom in each direction, so it can never charge above 80 % or discharge below 20 % of its power capability. That band, multiplied by the hours committed, is energy the arbitrage model assumed it could use. On a four-hour battery that band is the difference between cycling twice a day and cycling once — which changes degradation, augmentation and the whole warranty picture.`
        },
        mistake: `Adding FCR, aFRR and arbitrage revenue at full capacity in the same hour. The products reserve the same megawatt, and a model that stacks them simultaneously overstates revenue by more than the plant costs.`,
        check: `How fast must aFRR be fully active? Answer: 5 minutes.`
      },
      {
        h: 'Voltage and reactive power',
        p: [
          `Transmission voltage is managed by generators and compensation, and the TSO buys reactive power where it needs it. At each connection boundary there is an exchange of U and Q that both sides agree in the connection agreement.`,
          `A battery can supply reactive power without discharging, which is one of its underrated advantages at transmission level. The catch is converter headroom: active and reactive capability trade against each other, so a converter rated at 100 MVA cannot deliver 100 MW and 50 MVar at the same instant.`,
          `This is where the PCS specification meets the grid code. The converter must be able to deliver the reactive current the TSO asks for during a fault, not just in steady state — and that requirement is usually discovered late.`,
          `A useful review question for a PCS specification: what reactive current can the converter deliver at 0 % voltage for 150 ms? If nobody knows the answer, the fault-ride-through requirement has not been engineered.`
        ],
        formula: 'Q without energy, but never without converter headroom',
        example: {
          title: 'Worked example — the rating that is not a single number',
          body: `A converter rated 100 MVA at unity power factor may deliver 100 MW and 0 MVar, or 90 MW and 43 MVar, depending on its capability curve. A connection agreement asking for 0.95 power factor at full active power is therefore a request for a larger converter than the developer budgeted for. Ask for the capability curve at the connection voltage, not the nominal one, and check it at both the maximum and minimum grid voltage.`
        },
        mistake: `Reading a PCS datasheet's MVA rating as available active power at any power factor. The capability curve is the real specification.`,
        check: `Can a battery supply reactive power while idle? Answer: yes, within converter headroom.`
      },
      {
        h: 'Stability: inertia, RoCoF, short-circuit strength',
        p: [
          `Synchronous machines store kinetic energy in their rotors and release it instantly when frequency falls. That inertia is why frequency moves slowly enough for control to act: <code>RoCoF = ΔP·f / (2·E)</code>.`,
          `Inverter-based generation has no rotor, so replacing synchronous plant with inverters reduces inertia and raises RoCoF. The system becomes more sensitive to the same loss of generation, and protection that assumes a slow decline starts to trip on events it used to ride through.`,
          `Grid-forming converters can synthesise an inertia-like response and batteries can provide fast frequency response, but only within their energy and power limits. Storage mitigates the problem; it does not restore the physics of a rotating mass.`,
          `The practical consequence is that grid codes keep tightening: minimum inertia requirements, fast frequency response obligations and grid-forming capability are all attempts to buy back behaviour that used to be free.`
        ],
        formula: 'RoCoF = ΔP · f / (2 · E)   ·   3000 MW lost from 200 GW·s → 0.375 Hz/s',
        example: {
          title: 'Worked example — how much inertia a loss removes',
          body: `Losing 3,000 MW from a system with 200,000 MW·s gives 0.375 Hz/s. Halve the inertia and the same loss gives 0.75 Hz/s, which is the range where RoCoF relays start to operate and where the sequence of events in a blackout report begins. The number that matters operationally is how quickly frequency reaches the first protection threshold, not how far it eventually falls.`
        },
        mistake: `Assuming a battery's fast response equals inertia. Frequency response acts on the deviation that has already occurred; inertia limits how fast that deviation develops.`,
        check: `What is RoCoF? Answer: rate of change of frequency, in Hz/s.`
      },
      {
        h: 'HVDC and the north–south problem',
        p: [
          `Germany generates wind in the north and consumes in the south. HVDC links move bulk power over long distances without coupling the two ends and without the reactive current that AC cables would demand — which is why they are used for subsea and for long land routes.`,
          `The trade is converter stations at both ends, conversion losses, and a new class of failure mode: a converter block that disappears in milliseconds and takes gigawatts with it. Protection and system studies at HVDC terminals look quite different from AC.`,
          `For storage, HVDC matters indirectly. It changes where congestion appears, and therefore where a battery is worth building — which is why the transmission plan is a commercial document for anyone siting storage.`,
          `Read the ten-year network development plan before committing capital, and read it again every two years: the corridors being reinforced and the ones being retired tell you where flexibility will be scarce — and where a battery will be paid for being available rather than for being cheap.`
        ],
        formula: 'HVDC: decoupled ends · converter losses · new failure modes',
        example: {
          title: 'Worked example — reading the network plan as a map',
          body: `A new HVDC link relieves a constraint in one corridor and creates new flows elsewhere. Storage sited on the relieved corridor loses value; storage sited at the new bottleneck gains it. The network development plan publishes both years in advance.`
        },
        mistake: `Treating the grid as static when siting an asset with a twenty-year life. The network plan is public; the siting decision is a bet on it.`,
        check: `Why is HVDC used for long links? Answer: it decouples the ends and avoids reactive current over distance.`
      }
    ],
    renderExtra: drawTimeline,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
