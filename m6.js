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


  function drawPotential(host) {
    var W = 860, H = 340, ground = 280, padL = 60, padR = 40;

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Surface potential falling with distance from the electrode">');

    /* remote earth baseline */
    p.push('<line x1="' + padL + '" y1="' + ground + '" x2="' + (W - padR) + '" y2="' + ground + '" class="chart-grid"/>');
    p.push('<text x="' + (W - padR) + '" y="' + (ground + 18) + '" class="chart-axis" text-anchor="end">remote earth, 0 V</text>');

    /* potential mound */
    var path = 'M180,' + ground + ' L180,80 C 250,110 320,200 430,248 S 660,276 800,279 L800,' + ground + ' Z';
    p.push('<path d="' + path + '" class="potential"/>');
    p.push('<path d="M180,' + ground + ' L180,80 C 250,110 320,200 430,248 S 660,276 800,279" class="potential-line"/>');

    /* electrode */
    p.push('<line x1="180" y1="80" x2="180" y2="330" class="sld-line"/>');
    p.push('<text x="180" y="332" class="chart-axis" text-anchor="middle">electrode</text>');

    /* touch voltage marker */
    p.push('<line x1="200" y1="86" x2="200" y2="' + ground + '" class="measure"/>');
    p.push('<text x="208" y="180" class="chart-axis measure-label">U_T</text>');
    p.push('<text x="208" y="198" class="chart-axis">touch: hand to feet</text>');

    /* step voltage marker */
    p.push('<line x1="470" y1="' + (ground - 26) + '" x2="470" y2="' + ground + '" class="measure"/>');
    p.push('<line x1="510" y1="' + (ground - 16) + '" x2="510" y2="' + ground + '" class="measure"/>');
    p.push('<text x="528" y="' + (ground - 30) + '" class="chart-axis">U_S — step across 1 m</text>');

    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>Why the ground itself is dangerous</h2>' +
        '<p class="muted">Fault current entering the electrode lifts the ground surface. The potential falls with distance — and a person is a conductor between two points on that curve.</p>' +
        '<div class="chart-wrap">' + p.join('') + '</div>' +
        '<p class="muted">Near the electrode the curve is steepest, so the voltage between two feet a metre apart is largest there. Touch voltage is the full height of the curve at the equipment; step voltage is the slope between two footprints.</p>' +
      '</div>';
  }


  function drawEarthGallery(host) {
    function panel(title, caption, body) {
      return '<figure class="gallery-item">' +
        '<svg viewBox="0 0 260 190" class="gallery-svg" role="img" aria-label="' + title + '">' + body + '</svg>' +
        '<figcaption><strong>' + title + '</strong><span>' + caption + '</span></figcaption>' +
        '</figure>';
    }

    /* 1 — electrode types */
    var types = '';
    types += '<rect x="0" y="60" width="260" height="120" class="soil"/>';
    types += '<line x1="0" y1="60" x2="260" y2="60" class="ground-line"/>';
    types += '<line x1="45" y1="60" x2="45" y2="150" class="cable-core" stroke-width="4"/>';
    types += '<text x="45" y="176" class="gal-label" text-anchor="middle">rod · 33 Ω</text>';
    types += '<ellipse cx="130" cy="130" rx="34" ry="10" class="screen"/>';
    types += '<text x="130" y="176" class="gal-label" text-anchor="middle">ring · 4.7 Ω</text>';
    types += '<line x1="190" y1="100" x2="246" y2="100" class="screen"/>';
    types += '<line x1="190" y1="130" x2="246" y2="130" class="screen"/>';
    types += '<line x1="205" y1="90" x2="205" y2="145" class="screen"/>';
    types += '<line x1="230" y1="90" x2="230" y2="145" class="screen"/>';
    types += '<text x="218" y="176" class="gal-label" text-anchor="middle">grid · ~2 Ω</text>';

    /* 2 — soil resistivity ranges */
    var soils = [['clay', 20], ['loam', 100], ['sand', 500], ['rock', 2000]];
    var soilSvg = '';
    soils.forEach(function (s, i) {
      var h = 20 * Math.log10(s[1] + 1) * 1.6;
      var x = 30 + i * 56;
      soilSvg += '<rect x="' + x + '" y="' + (150 - h) + '" width="38" height="' + h + '" rx="4" class="cascade-bar"/>';
      soilSvg += '<text x="' + (x + 19) + '" y="' + (142 - h) + '" class="gal-label" text-anchor="middle">' + s[1] + '</text>';
      soilSvg += '<text x="' + (x + 19) + '" y="170" class="gal-label" text-anchor="middle">' + s[0] + '</text>';
    });
    soilSvg += '<text x="130" y="186" class="gal-label" text-anchor="middle">Ω·m — two orders of magnitude</text>';

    /* 3 — foundation earth */
    var found = '';
    found += '<rect x="0" y="120" width="260" height="70" class="soil"/>';
    found += '<line x1="0" y1="120" x2="260" y2="120" class="ground-line"/>';
    found += '<rect x="60" y="50" width="140" height="70" class="concrete"/>';
    found += '<line x1="60" y1="108" x2="200" y2="108" class="bond-line" stroke-width="3"/>';
    found += '<text x="130" y="40" class="gal-label" text-anchor="middle">building</text>';
    found += '<text x="130" y="146" class="gal-label" text-anchor="middle">rebar in foundation concrete</text>';

    /* 4 — bonding star */
    var bond = '';
    bond += '<line x1="130" y1="95" x2="130" y2="70" class="bond-line"/>';
    bond += '<line x1="130" y1="95" x2="60" y2="95" class="bond-line"/>';
    bond += '<line x1="130" y1="95" x2="200" y2="95" class="bond-line"/>';
    bond += '<line x1="130" y1="95" x2="130" y2="140" class="bond-line"/>';
    bond += '<circle cx="130" cy="95" r="7" class="cable-core"/>';
    [['switchgear', 60, 60], ['tank', 200, 60], ['screens', 60, 150], ['LV PE', 200, 150]].forEach(function (b) {
      bond += '<text x="' + b[1] + '" y="' + b[2] + '" class="gal-label" text-anchor="middle">' + b[0] + '</text>';
    });
    bond += '<text x="130" y="176" class="gal-label" text-anchor="middle">one reference, many bonds</text>';

    /* 5 — gravel grading */
    var gravel = '';
    gravel += '<rect x="0" y="110" width="260" height="80" class="soil"/>';
    gravel += '<rect x="0" y="92" width="260" height="18" class="bedding"/>';
    gravel += '<line x1="0" y1="110" x2="260" y2="110" class="ground-line"/>';
    gravel += '<path d="M18,58 C 70,72 120,84 200,88 L250,89" class="potential-line"/>';
    gravel += '<line x1="18" y1="58" x2="18" y2="92" class="measure"/>';
    gravel += '<text x="24" y="80" class="gal-label">U at the surface</text>';
    gravel += '<text x="8" y="104" class="gal-label">gravel</text>';
    gravel += '<text x="8" y="128" class="gal-label">grade</text>';

    host.innerHTML =
      '<div class="card">' +
        '<h2>Electrodes, soil and bonding</h2>' +
        '<p class="muted">Five things that decide whether the earth resistance you calculate is the one you install.</p>' +
        '<div class="gallery">' +
          panel('Electrode type', 'Same 100 Ω·m soil: geometry buys an order of magnitude.', types) +
          panel('Soil resistivity', 'Measured, not assumed — and it varies by two orders of magnitude.', soilSvg) +
          panel('Foundation earth', 'Concrete-encased rebar: cheap, permanent, and often available.', found) +
          panel('Equipotential bonding', 'One reference bar. Every bond is inspected.', bond) +
          panel('Surface grading', 'Gravel does not lower the EPR — it lowers what a body sees.', gravel) +
        '</div>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'm6',
    number: '06',
    title: 'Earthing and EMC',
    lead: 'The part nobody demos, and the part that decides whether a person survives a fault.',
    sections: [
      {
        h: 'Earthing exists for one moment',
        p: [
          `In normal operation earthing does nothing visible. It exists for the fault: to give fault current a path back to the source so protection operates, and to hold every touchable surface at a potential a person can survive for as long as it takes to clear.`,
          `When fault current enters the soil through an electrode, the earth around it rises in voltage. That is the earth potential rise: EPR = I_f × R_E. The rise appears on every bonded metal part and, just as importantly, across the surface of the ground itself.`,
          `Everything else in earthing design is a negotiation between that one number and the two voltages a body can be exposed to.`,
          `Note who the calculation protects: not the equipment, which is already lost, but the person who happens to be standing beside it when a cable fails, and who will never read the calculation that was supposed to protect them.`
        ],
        formula: 'EPR = I_f × R_E',
        example: {
          title: 'Worked example — the number that decides',
          steps: [`A single 3 m rod of 16 mm diameter in 100 Ω·m soil gives 33.49 Ω.`, `A 500 A earth fault then lifts the earthing system to 16,746 V.`],
          result: `Against a permissible touch voltage of 1,000 V, that is a factor of 16.7 — and the design has to change, not the standard.`
        },
        mistake: `Thinking of earthing as a compliance item rather than a fault-current calculation. "We have an earth electrode" answers nothing; the questions are how much current, through what resistance, for how long.`,
        check: `500 A through 5 Ω: what is the EPR? Answer: 2,500 V.`
      },
      {
        h: 'Touch voltage and step voltage',
        p: [
          `Touch voltage is hand-to-feet: someone touching a bonded enclosure during a fault while standing on ground that is at a different potential. Step voltage is foot-to-foot: someone walking away from the electrode across ground where the potential still changes with distance.`,
          `Step voltage is highest close to the electrode, because that is where the surface potential falls fastest. The dangerous place is not the equipment — it is the two metres of gravel beside it.`,
          `Mitigation is either physical or temporal. Physically: more electrode, deeper electrodes, or a graded surface with a resistive layer that forces the potential to drop gradually. Temporally: clear the fault faster, which raises the permissible touch voltage for the shorter exposure.`,
          `In practice you rarely get to choose freely: the fault current is a property of the network and the clearing time is set by protection. That leaves the surface and the electrode — which is why most earthing work is excavation and gravel rather than cleverness.`
        ],
        formula: 'U_T = hand-to-feet · U_S = foot-to-foot\nHigher fault current → higher EPR → shorter clearing time or lower R_E',
        example: {
          title: 'Worked example — why gravel is not decoration',
          steps: [`A station with an EPR of 2,500 V is dangerous to touch anywhere the surface is at remote-earth potential.`, `Laying 100 mm of high-resistivity gravel over the surface does not change the EPR — it changes the voltage a body sees between hand and feet, by inserting resistance in series with the person.`],
          result: `That is why substations have gravel, and why removing it during maintenance is a real hazard.`
        },
        mistake: `Treating touch and step voltage as the same problem. They peak in different places and are mitigated differently; a design that fixes one can leave the other untouched.`,
        check: `Which is higher close to the electrode: step voltage or touch voltage? Answer: step voltage — the surface potential changes fastest there.`
      },
      {
        h: 'Soil, and why deep beats wide',
        p: [
          `Resistivity varies by orders of magnitude: tens of Ω·m in wet clay, thousands in rock and dry sand. It is measured, not assumed, and the Wenner four-probe method is the standard way — current through the outer pair, voltage across the inner pair, ρ = 2πaR.`,
          `A vertical rod of length L in soil ρ has resistance roughly proportional to ρ/L. Doubling the length halves it; doubling the diameter barely moves it, because almost all the resistance is in the soil around the electrode, not in the metal.`,
          `That is why engineers go deeper rather than thicker, and why a ring or a mesh — which couples to a large soil volume — beats a single rod by an order of magnitude.`,
          `Seasonal variation matters as much as the average: resistivity in dry frost can be several times the summer value, so a design that passes on a wet October afternoon may not pass in February.`
        ],
        formula: 'Rod: R ≈ ρ/(2πL)·[ln(4L/a) − 1]   ·   Ring: R ≈ ρ/(2π²r)·ln(8r/a)',
        example: {
          title: 'Worked example — rods versus a ring',
          steps: [`One 3 m rod at 33.49 Ω.`, `A 10 m ring of the same conductor in the same soil: 4.67 Ω, seven times better with a fraction of the excavation.`],
          result: `Four rods in parallel would give roughly 12–15 Ω rather than 8.4 Ω, because mutual coupling means each additional rod buys only 60–70 % of the last.`
        },
        mistake: `Using the diameter as the radius in Dwight's formula. The logarithm changes by ln 2, which moves the answer by about 12 % — enough to make a marginal design look compliant or vice versa.`,
        check: `At 4 m probe spacing the meter reads 10 Ω. What is the resistivity? Answer: 2π × 4 × 10 = 251 Ω·m.`
      },
      {
        h: 'The German method',
        p: [
          `Above 1 kV, EN 50522 (DIN VDE 0101-2) governs; below 1 kV, DIN VDE 0100-540. Both work the same way: establish the permissible touch voltage for the clearing time, calculate the EPR, compare them.`,
          `If the calculated EPR exceeds the permissible value, the design changes — add electrode, grade the surface, shorten the clearing time, or isolate the fault location. The limit itself comes from the standard, not from taste and not from this app.`,
          `We do not hold EN 50522, so this module teaches the comparison and leaves the permissible values to the document. Any figure quoted without a clause and an edition deserves the same suspicion.`,
          `The practical output of this module is a sentence you can defend in a review: the EPR at the specified fault current must stay below the permissible touch voltage for the clearing time, and here is the calculation.`
        ],
        formula: 'EPR ≤ U_TP(t_clear)   →   otherwise change the design',
        example: {
          title: 'Worked example — reading the requirement backwards',
          body: `Work from the limit: a 1,000 V permissible touch voltage and a 500 A fault means the earthing system must be 2 Ω or less. That single number sets the electrode design, the excavation, the cable route — and it is arrived at in one division rather than in a negotiation.`
        },
        mistake: `Quoting a generic target like "less than 1 Ω" without saying which standard, which fault current and which clearing time produced it. The number is an output, not an input.`,
        check: `To keep the rise below 1,000 V at 500 A, what earth resistance do you need? Answer: 2 Ω.`
      },
      {
        h: 'BESS specifics, and the EMC tail',
        p: [
          `The DC side is unearthed and monitored: an insulation monitoring device reports the first earth fault, because a second one creates a fault path through the rack. That is a different discipline from AC earthing and the two are not interchangeable.`,
          `Equipotential bonding ties enclosure, rack, cable trays and transformer tank to one reference. Without it, PCS switching edges create potential differences that find their way into control wiring and are then very expensive to diagnose.`,
          `The converter also produces harmonics and high-frequency noise. Surge protective devices at the LV and MV boundaries, shielded control cables earthed at one end, and separation of power and signal routing are standard — and each is an inspection item, not an optional refinement.`,
          `The temptation on a BESS site is to treat bonding as an EMC nicety. It is a personnel-safety measure first and an EMC measure second, and inspection regimes treat it that way.`
        ],
        formula: 'DC: unearthed + insulation monitoring · AC: earthed + bonded',
        example: {
          title: 'Worked example — a fault that is not a fault',
          steps: [`A container reports an insulation alarm on the DC side at 40 kΩ.`, `Nothing is broken; moisture has entered a connector.`, `On an unearthed system the first fault is a warning, and the plant can keep running — but only until a second fault appears.`],
          result: `Ignoring the first alarm is how a warning becomes a fire.`
        },
        mistake: `Earthing the DC negative to "make it like AC". That defeats the insulation monitoring, removes the warning of the first fault, and turns a maintenance item into an unannounced hazard.`,
        check: `On an unearthed DC system, what does the first insulation fault do? Answer: it raises an alarm — the system can continue until a second fault appears.`
      },
      {
        h: 'Worked design — earthing a 20 kV station',
        p: [
          `Three numbers arrive before the calculation: the earth-fault current the network can deliver, the permissible touch voltage for the clearing time, and the soil resistivity measured on site. Everything else is arithmetic on those three.`,
          `Take 500 A, 1,000 V and 100 Ω·m. The permitted rise gives the target directly: 1,000 ÷ 500 = 2 Ω. That single division sets the whole electrode design, and it is the step most often skipped in favour of a rule of thumb like "under one ohm".`,
          `Then you work up through geometries until one meets the target — rod, ring, grid — and if none does cheaply, you change the other variables: grade the surface, shorten the clearing time, or accept a lower fault current through network design — which is usually someone else's decision, and therefore the last lever you reach for.`
        ],
        formula: 'R_target = U_permissible ÷ I_fault',
        example: {
          title: 'Worked example — from 33 Ω to 2 Ω',
          steps: [
            `Target: 1,000 V ÷ 500 A = <strong>2 Ω</strong>.`,
            `One 3 m rod: <strong>33.5 Ω</strong> — sixteen times too high.`,
            `A 10 m ring: <strong>4.67 Ω</strong> — still over, but within reach of grading.`,
            `A grid over the station footprint, or a shorter clearing time, closes the rest.`
          ],
          result: `The design is not "a rod"; it is a sequence of geometries tested against one number.`
        },
        mistake: `Starting from a preferred electrode and checking afterwards whether it passes. The target comes first, from the fault current and the limit — the geometry is the answer, not the assumption.`,
        check: `500 A, 1,000 V limit: what earth resistance do you need? Answer: 2 Ω.`
      },
      {
        h: 'What fails in the field',
        p: [
          `Earthing calculations are usually right and earthing installations frequently are not. The failure modes are mundane: a bond left loose behind a panel, a test joint buried under gravel, a rod driven into a different soil layer than the one measured.`,
          `Corrosion is the slow one. A copper bond to a galvanised frame in damp soil becomes a battery; five years later the connection is a resistive joint nobody inspected, and the fault current takes the path of least resistance — possibly through a person.`,
          `Seasonal variation is the one that catches designers. Resistivity measured in a wet October can be several times lower than in frozen February, and the compliance argument made on the October number does not survive the winter, when the soil freezes and the resistance rises by a factor nobody modelled.`
        ],
        formula: 'Inspect the bonds · record the test joints · design for the dry season',
        example: {
          title: 'Worked example — the inspection nobody does',
          steps: [
            `Measure the earth resistance at commissioning and record the soil condition.`,
            `Repeat at the same time of year, every year — same method, same weather.`,
            `Photograph every bond and test joint at handover; that record is the baseline.`,
            `A rising trend matters more than a single value: it points at corrosion, not weather.`
          ],
          result: `A test result without its conditions is not a measurement — it is a number.`
        },
        mistake: `Testing once at commissioning and treating the certificate as permanent. Earthing degrades silently, and the only defence is a comparable measurement repeated over time.`,
        check: `Why does a single earth-resistance measurement prove little? Answer: it has no trend and no recorded conditions.`
      }
    ],
    renderExtra: function (host) {
      var a = document.createElement('div');
      var b = document.createElement('div');
      host.appendChild(a);
      host.appendChild(b);
      drawPotential(a);
      drawEarthGallery(b);
    },
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
