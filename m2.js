/* Module 2 — the machine, end to end. Diagram, loss budget, drills. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  /* ---------- single-line diagram ---------- */
  var NODES = [
    { id: 'cell', x: 30, y: 80, w: 160, h: 70, lines: ['Cell'],
      title: 'Cell',
      what: 'A single electrochemical unit, today usually a prismatic LFP cell of 280–600 Ah at 3.2 V nominal. Holds about 1 kWh.',
      eff: 'Not rated on its own — it is the 94 % DC round-trip that matters.',
      note: 'Cells are never replaced individually in the field. The module is the smallest serviceable unit, which is why the next box exists.' },

    { id: 'module', x: 230, y: 80, w: 160, h: 70, lines: ['Module'],
      title: 'Module',
      what: 'Ten to sixty cells in series, clamped in a frame with voltage and temperature sensing.',
      eff: 'Adds no conversion loss; adds sensing and balancing.',
      note: 'Voltages add in series, amp-hours stay the same. 40 cells at 3.2 V gives 128 V and the same Ah.' },

    { id: 'rack', x: 430, y: 80, w: 160, h: 70, lines: ['Rack'],
      title: 'Rack',
      what: 'Five to thirty modules in series, plus a rack controller, contactors, fusing and communications. Typically 200–400 kWh.',
      eff: 'DC resistance here is real but small; the big losses start at the converter.',
      note: 'This is where thermal management begins — coolant plates in liquid-cooled products, fans in air-cooled ones.' },

    { id: 'enclosure', x: 630, y: 80, w: 160, h: 70, lines: ['Enclosure', '(DC block)'],
      title: 'Enclosure / DC block',
      what: 'Racks in parallel inside a 20-foot container, today typically 5–6 MWh. Output is DC.',
      eff: 'No conversion — but fire suppression, HVAC and aux power live here and cost energy.',
      note: 'An AC-block product puts the PCS and MV transformer inside this box instead, so the output is already AC.' },

    { id: 'pcs', x: 30, y: 260, w: 140, h: 70, lines: ['PCS'],
      title: 'Power conversion system',
      what: 'Bidirectional inverter: DC to AC on discharge, AC to DC on charge. Usually 2–6 MW per unit.',
      eff: 'About 97–98.5 % round-trip; the largest single loss in the chain after the battery.',
      note: 'Grid-following PCS synchronises to the grid; grid-forming PCS can establish voltage and frequency itself, which microgrids need.' },

    { id: 'mvt', x: 195, y: 260, w: 140, h: 70, lines: ['MV', 'transformer'],
      title: 'MV transformer',
      what: 'Steps the PCS output (typically 690 V or 800 V) up to the medium-voltage collection level, usually 20 or 33 kV.',
      eff: 'Around 99 % — small per unit, but it runs continuously.',
      note: 'In an AC block this transformer ships inside the enclosure, which is why AC blocks need only AC collection.' },

    { id: 'coll', x: 360, y: 260, w: 140, h: 70, lines: ['MV', 'collector'],
      title: 'MV collector',
      what: 'Cables and switchgear gathering every block onto one or more MV feeders.',
      eff: 'Cabling losses of roughly 0.5 %, higher if runs are long or undersized.',
      note: 'This is where you can lose a design review: cable ampacity, derating and voltage drop all live here.' },

    { id: 'mpt', x: 525, y: 260, w: 140, h: 70, lines: ['Main power', 'transformer'],
      title: 'Main power transformer (MPT)',
      what: 'Steps MV up to the grid voltage — 110 kV in our anchor plant.',
      eff: 'Around 99.5 %, with no-load losses that never switch off.',
      note: 'It must handle bi-directional flow and the harmonic content of the PCS, not just nameplate power.' },

    { id: 'poi', x: 690, y: 260, w: 140, h: 70, lines: ['POI'],
      title: 'Point of interconnection',
      what: 'Where the plant meets the grid, and where the revenue-grade meter sits.',
      eff: 'This is the boundary where the contract is measured.',
      note: 'Everything upstream of this point is your loss. Everything downstream is someone else\'s.' }
  ];

  var EDGES = [['cell', 'module'], ['module', 'rack'], ['rack', 'enclosure'],
               ['pcs', 'mvt'], ['mvt', 'coll'], ['coll', 'mpt'], ['mpt', 'poi']];

  function nodeById(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }

  function drawDiagram(host) {
    var parts = [];
    parts.push('<svg viewBox="0 0 880 358" class="sld" role="img" aria-label="Single-line diagram from cell to point of interconnection">');
    parts.push('<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">' +
               '<path d="M0,0 L8,4 L0,8 z" class="arrowhead"/></marker></defs>');

    parts.push('<text x="30" y="56" class="sld-band">DC</text>');
    parts.push('<text x="30" y="236" class="sld-band">AC</text>');

    EDGES.forEach(function (pair) {
      var a = nodeById(pair[0]), b = nodeById(pair[1]);
      var y = a.y + a.h / 2;
      var x1 = a.x + a.w + 3, x2 = b.x - 3;
      parts.push('<line x1="' + x1 + '" y1="' + y + '" x2="' + x2 + '" y2="' + y + '" class="sld-line" marker-end="url(#arrow)"/>');
    });

    /* enclosure down and across to the PCS */
    var enc = nodeById('enclosure'), pcs = nodeById('pcs');
    var ex = enc.x + enc.w / 2, px = pcs.x + pcs.w / 2;
    parts.push('<polyline points="' + ex + ',' + (enc.y + enc.h) + ' ' + ex + ',215 ' + px + ',215 ' + px + ',' + (pcs.y - 3) +
               '" class="sld-line" marker-end="url(#arrow)"/>');

    parts.push('<text x="' + ((ex + px) / 2) + '" y="207" class="sld-note" text-anchor="middle">DC bus</text>');

    NODES.forEach(function (n) {
      parts.push('<g class="sld-node" data-node="' + n.id + '" tabindex="0" role="button" aria-label="' + n.title + '">');
      parts.push('<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="12"/>');
      var startY = n.y + n.h / 2 - (n.lines.length - 1) * 9;
      n.lines.forEach(function (line, i) {
        parts.push('<text x="' + (n.x + n.w / 2) + '" y="' + (startY + i * 18 + 5) + '" text-anchor="middle">' + line + '</text>');
      });
      parts.push('</g>');
    });

    parts.push('<text x="862" y="296" class="sld-note" text-anchor="end">grid →</text>');
    parts.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>The plant, in one line</h2>' +
        '<p class="muted">Tap any stage. The chain is the whole module: each box is a place where energy is lost or measured.</p>' +
        '<div id="sld-wrap">' + parts.join('') + '</div>' +
        '<p class="sld-hint">Swipe the diagram sideways on a narrow screen.</p>' +
        '<div id="node-detail" class="node-detail"></div>' +
      '</div>';

    var wrap = host.querySelector('#sld-wrap');
    var detail = host.querySelector('#node-detail');

    function select(id) {
      var n = nodeById(id);
      if (!n) return;
      wrap.querySelectorAll('.sld-node').forEach(function (g) {
        g.classList.toggle('active', g.getAttribute('data-node') === id);
      });
      detail.innerHTML =
        '<h3>' + n.title + '</h3>' +
        '<p>' + n.what + '</p>' +
        '<p class="eff"><strong>Efficiency:</strong> ' + n.eff + '</p>' +
        '<p class="muted">' + n.note + '</p>';
    }

    wrap.querySelectorAll('.sld-node').forEach(function (g) {
      g.addEventListener('click', function () { select(g.getAttribute('data-node')); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g.getAttribute('data-node')); }
      });
    });

    select('pcs');
  }

  /* ---------- loss budget ---------- */
  var STAGES = [
    { id: 'battery', label: 'Battery DC round-trip', def: 94 },
    { id: 'pcs', label: 'PCS DC ↔ AC', def: 97 },
    { id: 'mvt', label: 'MV transformer', def: 99 },
    { id: 'cable', label: 'Cabling / collector', def: 99.5 },
    { id: 'mpt', label: 'Main power transformer', def: 99.5 },
    { id: 'aux', label: 'Auxiliary load', def: 98.5 }
  ];

  var calcHTML = (function () {
    var grids = STAGES.map(function (s) {
      return '<label>' + s.label +
        '<input id="rte-' + s.id + '" type="text" inputmode="decimal" value="' + s.def + '" />' +
        '<span class="hint">%</span></label>';
    }).join('');

    return '<div class="card">' +
      '<h2>Loss budget</h2>' +
      '<p class="muted">Efficiencies multiply. They do not add. Change one stage and watch the system number move far less than you expect.</p>' +
      '<div class="grid">' + grids + '</div>' +
      '<div class="grid">' +
        '<label>Energy at DC terminals<input id="rte-energy" type="text" inputmode="decimal" value="435" /><span class="hint">MWh</span></label>' +
      '</div>' +
      '<div id="rte-out" class="results"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Why adding losses is wrong</h2>' +
      '<p>Six stages at 94, 97, 99, 99.5, 99.5 and 98.5 % look like "about 12 % lost", so 88 %.</p>' +
      '<p>The product is 88.03 %. The sum of the shortfalls gives 87.5 %. Close — and off by half a point, ' +
      'which on a 400 MWh contract is 2 MWh per cycle, every cycle, for twenty years.</p>' +
      '<p class="muted">The gap grows the more stages you add and the worse they get.</p>' +
    '</div>';
  })();

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var values = STAGES.map(function (s) {
        var v = parseFloat(String($('rte-' + s.id).value).replace(',', '.'));
        return isFinite(v) ? v : NaN;
      });
      var energy = parseFloat(String($('rte-energy').value).replace(',', '.'));
      var out = $('rte-out');
      var valid = values.every(function (v) { return v > 0 && v <= 100; });

      if (!valid) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>each stage must be 0–100 %</strong></div>';
        return;
      }

      var rte = Calc.chainRTE(values);
      var poi = isFinite(energy) ? Calc.energyAtPoi(energy, rte) : NaN;
      var lost = isFinite(energy) ? energy - poi : NaN;
      var naive = Calc.naiveRTE(values);

      out.innerHTML =
        '<div class="row"><span>System round-trip efficiency</span><strong>' + rte.toFixed(2) + ' %</strong></div>' +
        (isFinite(poi)
          ? '<div class="row"><span>Energy at POI</span><strong>' + poi.toFixed(1) + ' MWh</strong></div>' +
            '<div class="row"><span>Energy lost in the chain</span><strong>' + lost.toFixed(1) + ' MWh</strong></div>'
          : '') +
        '<div class="row"><span>Naive "add the losses" answer</span><strong class="bad-num">' + naive.toFixed(2) + ' %</strong></div>' +
        '<div class="row"><span>Naive method is off by</span><strong>' + Math.abs(naive - rte).toFixed(2) + ' percentage points</strong></div>';
    }

    STAGES.forEach(function (s) { $('rte-' + s.id).addEventListener('input', update); });
    $('rte-energy').addEventListener('input', update);
    update();
  }

  /* ---------- drills ---------- */
  var DRILLS = [
    { id: 'm2-d1', q: 'A PCS stage is 97 % and a transformer is 99 %. What is their combined round-trip efficiency, in %?',
      unit: '%', answer: 96.03, tol: 0.02,
      why: '0.97 × 0.99 = 0.9603, so 96.03 %. Efficiencies multiply.' },

    { id: 'm2-d2', q: 'The battery is 94 % and the PCS is 97 %. Combined, in %?',
      unit: '%', answer: 91.18, tol: 0.02,
      why: '0.94 × 0.97 = 0.9118. Two "small" losses already cost you nearly 9 points.' },

    { id: 'm2-d3', q: 'You put 500 MWh into the DC terminals. System RTE is 88 %. How much reaches the POI, in MWh?',
      unit: 'MWh', answer: 440, tol: 0.1,
      why: '500 × 0.88 = 440 MWh. The other 60 MWh became heat, mostly at the converter.' },

    { id: 'm2-d4', q: 'You must deliver 440 MWh at the POI at 88 % RTE. How much is needed at the DC terminals, in MWh?',
      unit: 'MWh', answer: 500, tol: 0.15,
      why: '440 ÷ 0.88 = 500 MWh. Same relationship as the gross-up in Module 1.' },

    { id: 'm2-d5', q: 'A 100 MW plant uses 5 MW PCS units. How many units?',
      unit: 'units', answer: 20, tol: 0.01,
      why: '100 ÷ 5 = 20. Real designs usually add one for redundancy, which is a commercial decision as much as a technical one.' },

    { id: 'm2-d6', q: 'An enclosure holds 12 racks, each with 416 cells. How many cells in one enclosure?',
      unit: 'cells', answer: 4992, tol: 0.5,
      why: '12 × 416 = 4,992. At 100 MW scale you cross a million cells quickly — which is why per-cell telemetry is a data problem.' },

    { id: 'm2-d7', q: 'Auxiliary load is 1.5 % of 400 MWh. How much energy goes to HVAC and controls, in MWh?',
      unit: 'MWh', answer: 6, tol: 0.02,
      why: '400 × 0.015 = 6 MWh. Auxiliary load is often excluded from a quoted RTE — always ask which boundary is meant.' },

    { id: 'm2-d8', q: '100 MWh passes through a transformer at 99 %. How much is lost, in MWh?',
      unit: 'MWh', answer: 1, tol: 0.02,
      why: '1 % of 100 MWh = 1 MWh. Small per hour, relentless over twenty years.' },

    { id: 'm2-d9', q: 'Which device converts DC to AC? (name it)', type: 'text',
      accept: ['pcs', 'power conversion system', 'inverter', 'wechselrichter', 'converter'],
      why: 'The PCS — power conversion system. "Inverter" is the everyday word for the same thing.' },

    { id: 'm2-d10', q: 'What does SLD stand for?', type: 'text',
      accept: ['single line diagram', 'single-line diagram', 'einlinienschaltbild', 'single line schematic'],
      why: 'Single-line diagram — the drawing that defines scopes, contracts and reviews. If you cannot read one, you cannot review a design.' },

    { id: 'm2-d11', q: 'Which transformer connects the MV collector to the high-voltage grid? (name it)', type: 'text',
      accept: ['main power transformer', 'mpt', 'maschinentransformator', 'netztransformator', 'main transformer', 'grid transformer'],
      why: 'The main power transformer (MPT) — MV to 110 kV in our anchor plant.' },

    { id: 'm2-d12', q: 'Six stages each at 99 %. What is the combined efficiency, in %?',
      unit: '%', answer: 94.15, tol: 0.05,
      why: '0.99⁶ = 0.9415. The same 1 % repeated six times costs 6 points, not 6 × 1 % added naively.' }
  ];

  window.MODULES.push({
    id: 'm2',
    number: '02',
    title: 'The machine, end to end',
    lead: 'Cell to point of interconnection, and where the energy actually goes.',
    sections: [
      {
        h: 'From a kilowatt-hour to a hundred megawatts',
        p: [
          'A cell holds about 1 kWh. A 100 MW / 400 MWh plant holds 400,000 of them. The gap is bridged by three groupings — module, rack, enclosure — and then by equipment that turns DC into AC.',
          'Series adds voltage and keeps amp-hours. Parallel adds amp-hours and keeps voltage. Every group in the plant is one of those two operations repeated.'
        ],
        formula: 'Cells → modules → racks → enclosure (DC)\nEnclosure → PCS → MV transformer → collector → MPT → POI (AC)'
      },
      {
        h: 'Two product architectures',
        p: [
          'A DC block ships batteries only; each block needs its own PCS, so the site has both DC and AC collection.',
          'An AC block puts the PCS and MV transformer inside the container. The output is already medium voltage, so only AC collection is needed. Tesla and Sungrow build this way; most Chinese integrators sell DC blocks.'
        ],
        formula: 'DC block: batteries only → external PCS\nAC block: batteries + PCS + MV transformer → AC out'
      },
      {
        h: 'The converter is where the losses live',
        p: [
          'The PCS is the single largest loss after the battery itself, and the only place where the plant\'s behaviour on the grid is defined — reactive power, frequency response, fault ride-through.',
          'Grid-following PCS synchronises to an existing grid. Grid-forming PCS can create voltage and frequency on its own, which is what a microgrid or a weak grid needs.'
        ],
        formula: 'PCS: DC ↔ AC, ~97–98.5 % round-trip'
      },
      {
        h: 'Efficiency multiplies. It never adds.',
        p: [
          'Six stages of 94, 97, 99, 99.5, 99.5 and 98.5 % do not give 88 % by subtraction. They give 88.03 % by multiplication.',
          'The difference looks academic until you price it: half a point on a 400 MWh contract is 2 MWh per cycle, for twenty years.'
        ],
        formula: 'RTE = η₁ × η₂ × … × ηₙ\n(never 100 − Σ(100 − ηᵢ))'
      },
      {
        h: 'The meter is the boundary',
        p: [
          'Everything upstream of the POI is your loss; everything downstream is someone else\'s. The revenue-grade meter sits at the POI, with certified CTs and VTs — not the BMS, not the PCS sensors.',
          'This is why a plant can pass its DC capacity test and still fail its offtake obligation: they are measured in different places, through different losses.'
        ],
        formula: 'Contract is measured at the POI. Design is specified at the DC terminals.'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    renderExtra: drawDiagram,
    drills: DRILLS
  });
})();
