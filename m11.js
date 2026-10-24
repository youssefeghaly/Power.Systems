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
          'Transmission runs at 220 and 380 kV in Germany, split between four TSOs — 50Hertz, Amprion, TenneT and TransnetBW — and coordinated inside ENTSO-E across Europe.',
          'TSOs balance generation and demand second by second, plan the network decades ahead, and buy the services that keep frequency and voltage inside limits.',
          'Connection here follows VDE-AR-N 4120 and the TSO\'s own rules. The engineering is similar to MV; the consequences of being wrong are not.'
        ],
        formula: '220/380 kV · four TSOs · ENTSO-E coordination'
      },
      {
        h: 'n-1, congestion, and redispatch',
        p: [
          'The grid is planned to survive the loss of any single element — n-1. When actual flows approach a limit anyway, the TSO redispatches: pays one plant to reduce output and another to increase it.',
          'Redispatch 2.0 brought every plant above 100 kW into that mechanism, which turned distributed storage into a resource the TSO can call on.',
          'Congestion is local and temporal: a line is overloaded because wind is strong in the north and demand is in the south. Storage placed on the right side of that constraint is worth more than storage placed anywhere else.'
        ],
        formula: 'n-1 planning · redispatch when reality beats the plan'
      },
      {
        h: 'Three balancing products, three timescales',
        p: [
          '<strong>FCR</strong> is automatic and local: it responds to frequency deviation itself and must be fully active in 30 seconds. <strong>aFRR</strong> is signalled by the TSO and restores frequency within 5 minutes. <strong>mFRR</strong> is manual and takes up to 15 minutes.',
          'The products are not interchangeable: prequalification, metering and control differ. A battery that is fast enough for FCR may still fail aFRR prequalification on energy or on its control interface.',
          'Revenue per MW is highest for FCR and lowest for mFRR — but FCR requires continuous availability and a symmetrical reserve, which eats into your usable energy.'
        ],
        formula: 'FCR 30 s · aFRR 5 min · mFRR 15 min'
      },
      {
        h: 'Voltage and reactive power',
        p: [
          'Transmission voltage is managed by generators and compensation, and the TSO buys reactive power where it needs it. At the connection boundary there is an exchange of U and Q that both sides must agree.',
          'A battery can supply reactive power without discharging, which is one of its underrated advantages at transmission level — but it consumes converter headroom, so active and reactive capability trade against each other.',
          'This is where the PCS specification meets the grid code: the converter must be able to deliver the reactive current the TSO asks for at the moment of a fault.'
        ],
        formula: 'Q without energy, but never without converter headroom'
      },
      {
        h: 'Stability: inertia, RoCoF, short-circuit strength',
        p: [
          'Synchronous machines store kinetic energy in their rotors and release it instantly when frequency falls. That inertia is why the frequency moves slowly enough for control to act.',
          'Inverter-based generation has no rotor, so replacing synchronous plant with inverters reduces inertia and raises RoCoF. <code>RoCoF = ΔP·f / (2·E)</code>.',
          'Grid-forming converters can synthesise an inertia-like response, and batteries can provide fast frequency response — but only within their energy and power limits. Storage mitigates the problem; it does not restore the physics.'
        ],
        formula: 'RoCoF = ΔP · f / (2 · E)   ·   3000 MW lost from 200 GW·s → 0.375 Hz/s'
      },
      {
        h: 'HVDC and the north–south problem',
        p: [
          'Germany generates wind in the north and consumes in the south. HVDC links move bulk power over long distances without coupling the two ends, and without the reactive current that AC cables would demand.',
          'The trade is converter stations at both ends, losses in conversion, and a new class of failure mode: a converter block that disappears in milliseconds.',
          'For storage, HVDC matters indirectly: it changes where congestion appears, and therefore where a battery is worth building.'
        ],
        formula: 'HVDC: decoupled ends · converter losses · new failure modes'
      }
    ],
    renderExtra: drawTimeline,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
