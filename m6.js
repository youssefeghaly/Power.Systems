/* Module 6 — earthing and EMC. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Earth resistance and potential rise</h2>' +
      '<p class="muted">Earthing design is one comparison: the voltage the earth rises to, against the voltage a person may safely touch.</p>' +
      '<div class="grid">' +
        '<label><span>Soil resistivity ρ</span><input id="e-rho" type="text" inputmode="decimal" value="100" /><span class="hint">Ω·m</span></label>' +
        '<label><span>Electrode</span><select id="e-type"><option value="rod">vertical rod</option><option value="ring">buried ring</option></select></label>' +
        '<label><span>Length / radius</span><input id="e-size" type="text" inputmode="decimal" value="3" /><span class="hint">m</span></label>' +
        '<label><span>Conductor diameter</span><input id="e-dia" type="text" inputmode="decimal" value="16" /><span class="hint">mm</span></label>' +
        '<label><span>Earth fault current</span><input id="e-current" type="text" inputmode="decimal" value="500" /><span class="hint">A</span></label>' +
        '<label><span>Permissible touch voltage</span><input id="e-limit" type="text" inputmode="decimal" value="1000" /><span class="hint">V</span></label>' +
      '</div>' +
      '<div id="e-out" class="results"></div>' +
      '<div id="e-note" class="gc-note"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Why the comparison, not the number</h2>' +
      '<p>There is no universal target in ohms. What matters is <code>EPR = I_f × R_E</code> against the permissible touch voltage for the clearing time — and that limit comes from the standard, not from this app.</p>' +
      '<p>Below 1 kV, a common rule of thumb is 50 V touch voltage, which is where the classic 30 mA RCD / 1,667 Ω figure comes from. Above 1 kV, EN 50522 governs and the limit depends on clearing time.</p>' +
      '<p class="muted">Electrodes in parallel do not divide resistance by their number: mutual coupling means the second rod buys roughly 60–70 % of the first.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var rho = parseFloat(String($('e-rho').value).replace(',', '.'));
      var size = parseFloat(String($('e-size').value).replace(',', '.'));
      var diaMm = parseFloat(String($('e-dia').value).replace(',', '.'));
      var current = parseFloat(String($('e-current').value).replace(',', '.'));
      var limit = parseFloat(String($('e-limit').value).replace(',', '.'));
      var type = $('e-type').value;

      var out = $('e-out');
      var note = $('e-note');

      if (!(rho > 0) || !(size > 0) || !(diaMm > 0) || !(current > 0) || !(limit > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>positive values please</strong></div>';
        note.textContent = '';
        return;
      }

      var a = diaMm / 2000;
      var re = type === 'rod' ? Calc.earthRod(rho, size, a) : Calc.earthRing(rho, size, a);
      var rise = Calc.epr(current, re);
      var need = Calc.requiredEarth(limit, current);
      var ok = rise <= limit;
      var count = Math.ceil(re / need);

      out.innerHTML =
        '<div class="row"><span>Earth resistance</span><strong>' + re.toFixed(2) + ' Ω</strong></div>' +
        '<div class="row"><span>Earth potential rise</span><strong class="' + (ok ? '' : 'bad-num') + '">' + Math.round(rise).toLocaleString('en-GB') + ' V</strong></div>' +
        '<div class="row"><span>Permissible touch voltage</span><strong>' + limit.toFixed(0) + ' V</strong></div>' +
        '<div class="row"><span>Ratio</span><strong class="' + (ok ? '' : 'bad-num') + '">' + (rise / limit).toFixed(2) + ' ×</strong></div>' +
        '<div class="row"><span>Earth resistance needed</span><strong>' + need.toFixed(2) + ' Ω</strong></div>' +
        '<div class="row"><span>Electrodes in parallel (idealised)</span><strong>' + (count > 0 ? count : 1) + '</strong></div>';

      note.textContent = ok
        ? 'Below the limit as it stands. Check step voltage near the electrode and the clearing time that produced the limit — both can move the answer.'
        : 'Above the limit. Options, cheapest first: extend the electrode, add electrodes, grade the surface, or shorten the clearing time. Reducing fault current is rarely available to you.';
    }

    ['e-rho', 'e-type', 'e-size', 'e-dia', 'e-current', 'e-limit'].forEach(function (id) {
      $(id).addEventListener('input', update);
      $(id).addEventListener('change', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm6-d1', q: 'A 3 m rod of 16 mm diameter in 100 Ω·m soil. Earth resistance, in Ω?',
      unit: 'Ω', answer: 33.5, tol: 0.6,
      why: 'R = ρ/(2πL)·[ln(4L/a) − 1] = 33.5 Ω. Note a is the radius — half the diameter — which is the classic slip.' },

    { id: 'm6-d2', q: 'Same rod in 300 Ω·m soil. Earth resistance, in Ω?',
      unit: 'Ω', answer: 100.5, tol: 1.5,
      why: '100.5 Ω. Resistance is proportional to resistivity: three times the soil resistivity, three times the resistance.' },

    { id: 'm6-d3', q: 'A 500 A earth fault flows through a 5 Ω earthing system. What is the earth potential rise, in V?',
      unit: 'V', answer: 2500, tol: 5,
      why: '500 × 5 = 2,500 V. That voltage appears on every bonded metal part and across the ground surface.' },

    { id: 'm6-d4', q: 'To keep the rise below 1,000 V at 500 A, what earth resistance is needed, in Ω?',
      unit: 'Ω', answer: 2, tol: 0.05,
      why: '1,000 ÷ 500 = 2 Ω. This is the number you design to, not a generic "less than 1 ohm".' },

    { id: 'm6-d5', q: 'A buried ring of 10 m radius, 16 mm conductor, in 100 Ω·m soil. Earth resistance, in Ω?',
      unit: 'Ω', answer: 4.67, tol: 0.15,
      why: 'R = ρ/(2π²r)·ln(8r/a) = 4.67 Ω. A ring is far better than a rod because it couples to much more soil.' },

    { id: 'm6-d6', q: 'Wenner measurement at 4 m spacing reads 10 Ω. What is the soil resistivity, in Ω·m?',
      unit: 'Ω·m', answer: 251, tol: 3,
      why: 'ρ = 2πaR = 2π × 4 × 10 = 251 Ω·m. The spacing sets the depth you are actually measuring.' },

    { id: 'm6-d7', q: 'One rod gives 33.5 Ω and you need 10 Ω. How many electrodes, ignoring mutual coupling?',
      unit: 'rods', answer: 4, tol: 0.05,
      why: '33.5 ÷ 10 = 3.35, so 4. In reality mutual coupling means 4 rods give more than 8.4 Ω — often 12–15 Ω.' },

    { id: 'm6-d8', q: 'Which four-electrode method measures soil resistivity?',
      type: 'text', accept: ['wenner', 'wenner method', 'four electrode', 'vierpunkt'],
      why: 'The Wenner method: four probes in a line, current through the outer pair, voltage across the inner pair.' },

    { id: 'm6-d9', q: 'Which standard covers earthing of AC installations above 1 kV in Germany?',
      type: 'text', accept: ['en 50522', 'din en 50522', 'vde 0101-2', 'iec 61936-1'],
      why: 'EN 50522 (DIN VDE 0101-2). Below 1 kV it is DIN VDE 0100-540. We do not hold either, so the method is taught and the limits are cited, not invented.' },

    { id: 'm6-d10', q: 'What does potential grading do? (one phrase)',
      type: 'text', accept: ['reduces step and touch voltage', 'reduces touch voltage', 'controls surface potential', 'reduces step voltage'],
      why: 'It controls the surface potential so the voltage across a person — hand to feet, or foot to foot — stays below the limit.' },

    { id: 'm6-d11', q: 'Which earthing system earths the source neutral and connects exposed metalwork to it?',
      type: 'text', accept: ['tn', 'tn system', 'tn-s', 'tn-c', 'tn-c-s'],
      why: 'TN. In TT the metalwork has its own local earth; in IT the source is isolated or earthed through impedance.' },

    { id: 'm6-d12', q: 'EPR is 2,500 V and the limit is 1,000 V. By what factor must earth resistance fall?',
      unit: '×', answer: 2.5, tol: 0.05,
      why: '2.5 ×. Since EPR is proportional to resistance, the resistance must drop by the same factor — here from 5 Ω to 2 Ω.' }
  ];

  window.MODULES.push({
    id: 'm6',
    number: '06',
    title: 'Earthing and EMC',
    lead: 'The part nobody demos, and the part that decides whether a person survives a fault.',
    sections: [
      {
        h: 'Earthing exists for one moment',
        p: [
          'In normal operation earthing does nothing visible. It exists for the fault: to give fault current a path back to the source so protection operates, and to hold every touchable surface at a potential a person can survive.',
          'When fault current enters the soil through an electrode, the earth around it rises in voltage — the <strong>earth potential rise</strong>, EPR = I_f × R_E. That rise appears on bonded metalwork and across the ground surface.',
          'Everything else in earthing design is about that single number and the two voltages a body can be exposed to.'
        ],
        formula: 'EPR = I_f × R_E'
      },
      {
        h: 'Touch voltage and step voltage',
        p: [
          '<strong>Touch voltage</strong> is hand-to-feet: someone touching a bonded enclosure during a fault. <strong>Step voltage</strong> is foot-to-foot: someone walking away from the electrode, where the surface potential falls with distance.',
          'Step voltage is highest close to the electrode — which is why the ground within a metre or two of an earth termination is the dangerous place, not the equipment.',
          'Mitigation is either physical (more electrode, deeper, graded surface with a resistive layer) or temporal (clear the fault faster, so the permissible voltage is higher).'
        ],
        formula: 'U_T = hand-to-feet · U_S = foot-to-foot'
      },
      {
        h: 'Soil, and why deep beats wide',
        p: [
          'Resistivity varies by orders of magnitude: from tens of Ω·m in wet clay to thousands in rock and sand. It is measured, not assumed — the Wenner four-probe method is standard.',
          'A rod of length L in soil ρ has resistance roughly proportional to ρ/L. Doubling the length halves it; doubling the diameter barely moves it, because almost all the resistance is in the soil, not the metal.',
          'That is why engineers go deeper rather than thicker, and why a ring or a mesh — which couples to a large soil volume — beats a single rod by an order of magnitude.'
        ],
        formula: 'Rod: R ≈ ρ/(2πL)·[ln(4L/a) − 1]   ·   Ring: R ≈ ρ/(2π²r)·ln(8r/a)'
      },
      {
        h: 'The German method',
        p: [
          'Above 1 kV, EN 50522 (DIN VDE 0101-2) governs; below 1 kV, DIN VDE 0100-540. Both work the same way: establish the permissible touch voltage for the clearing time, calculate the EPR, compare.',
          'If the calculated EPR exceeds the permissible value, the design changes — not the standard. Add electrode, grade the surface, shorten clearing time, or isolate the fault location.',
          'We do not hold EN 50522, so this module teaches the comparison and leaves the permissible values to the standard. Any figure quoted to you without a clause and an edition deserves the same suspicion.'
        ],
        formula: 'EPR ≤ U_TP(t_clear)   →   otherwise change the design'
      },
      {
        h: 'BESS specifics, and the EMC tail',
        p: [
          'The DC side is unearthed and monitored: an insulation monitoring device reports the first earth fault, because a second one creates a fault path through the rack. That is a different discipline from AC earthing, and it is not interchangeable.',
          'Equipotential bonding ties enclosure, rack, cable trays and transformer tank to one reference. Without it, the PCS switching edges create potential differences that find their way into control wiring.',
          'PCS switching produces harmonics and high-frequency noise. Surge protective devices at the LV and MV boundaries, shielded control cables with single-point earthing, and separation of power and signal routing are the standard measures — and every one of them is an inspection item.'
        ],
        formula: 'DC: unearthed + insulation monitoring · AC: earthed + bonded'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
