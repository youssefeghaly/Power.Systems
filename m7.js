/* Module 7 — cables and laying. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Cable sizing — thermal and voltage drop</h2>' +
      '<p class="muted">The tabulated capacity is a starting point. Everything after it is multiplication.</p>' +
      '<div class="grid">' +
        '<label><span>Design current I_b</span><input id="cb-ib" type="text" inputmode="decimal" value="100" /><span class="hint">A</span></label>' +
        '<label><span>Tabulated I_z</span><input id="cb-iz" type="text" inputmode="decimal" value="150" /><span class="hint">A</span></label>' +
        '<label><span>Ambient factor</span><input id="cb-f1" type="text" inputmode="decimal" value="0.9" /><span class="hint">×</span></label>' +
        '<label><span>Grouping factor</span><input id="cb-f2" type="text" inputmode="decimal" value="0.8" /><span class="hint">×</span></label>' +
        '<label><span>Laying factor</span><input id="cb-f3" type="text" inputmode="decimal" value="1" /><span class="hint">×</span></label>' +
        '<label><span>Length</span><input id="cb-len" type="text" inputmode="decimal" value="50" /><span class="hint">m</span></label>' +
        '<label><span>Conductor area</span><input id="cb-area" type="text" inputmode="decimal" value="35" /><span class="hint">mm²</span></label>' +
        '<label><span>Material</span><select id="cb-mat"><option value="cu">copper</option><option value="al">aluminium</option></select></label>' +
        '<label><span>System voltage</span><input id="cb-volt" type="text" inputmode="decimal" value="400" /><span class="hint">V</span></label>' +
        '<label><span>Permitted drop</span><input id="cb-limit" type="text" inputmode="decimal" value="3" /><span class="hint">%</span></label>' +
      '</div>' +
      '<div id="cb-out" class="results"></div>' +
      '<div id="cb-note" class="gc-note"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Short-circuit withstand</h2>' +
      '<p>The adiabatic check: the conductor must survive the fault without melting, <code>S ≥ I√t / k</code>. k depends on conductor and insulation — 143 for XLPE copper is the value used here.</p>' +
      '<div class="grid">' +
        '<label><span>Fault current</span><input id="cb-ik" type="text" inputmode="decimal" value="25" /><span class="hint">kA</span></label>' +
        '<label><span>Clearing time</span><input id="cb-t" type="text" inputmode="decimal" value="0.1" /><span class="hint">s</span></label>' +
        '<label><span>k</span><input id="cb-k" type="text" inputmode="decimal" value="143" /><span class="hint">A·√s/mm²</span></label>' +
      '</div>' +
      '<div id="cb-sc" class="results"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var ib = n('cb-ib'), iz = n('cb-iz'), len = n('cb-len');
      var area = n('cb-area'), volt = n('cb-volt'), limit = n('cb-limit');
      var f = [n('cb-f1'), n('cb-f2'), n('cb-f3')];
      var mat = $('cb-mat').value;
      var out = $('cb-out'), note = $('cb-note');

      if (!(ib > 0) || !(iz > 0) || !(len > 0) || !(area > 0) || !(volt > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>positive values please</strong></div>';
        note.textContent = '';
        return;
      }

      var ized = Calc.derate(iz, f);
      var r = Calc.cableR(area, mat, 70);
      var du = Calc.drop3ph(ib, r, len);
      var pct = (du / volt) * 100;
      var thermalOk = ib <= ized;
      var dropOk = pct <= limit;

      var ikA = n('cb-ik') * 1000, tc = n('cb-t'), kk = n('cb-k');
      var need = ikA > 0 && tc > 0 && kk > 0 ? Calc.adiabaticArea(ikA, tc, kk) : NaN;
      var scOk = !isFinite(need) || area >= need;

      out.innerHTML =
        '<div class="row"><span>Derated capacity I_z</span><strong>' + ized.toFixed(1) + ' A</strong></div>' +
        '<div class="row"><span>Thermal check</span><strong class="' + (thermalOk ? '' : 'bad-num') + '">' +
          (thermalOk ? 'pass' : 'fail — ' + (ib - ized).toFixed(1) + ' A over') + '</strong></div>' +
        '<div class="row"><span>Voltage drop</span><strong>' + du.toFixed(2) + ' V (' + pct.toFixed(2) + ' %)</strong></div>' +
        '<div class="row"><span>Drop check</span><strong class="' + (dropOk ? '' : 'bad-num') + '">' +
          (dropOk ? 'pass' : 'fail') + '</strong></div>' +
        '<div class="row"><span>Binding constraint</span><strong>' +
          (!thermalOk ? 'thermal' : (!dropOk ? 'voltage drop' : (!scOk ? 'short-circuit withstand' : 'neither — margin on all three'))) +
          '</strong></div>';

      note.textContent = thermalOk && dropOk && scOk
        ? 'All three checks pass. That is a cable you can defend in a review.'
        : !scOk
          ? 'Thermal and drop may pass while the fault still destroys the conductor. Increase the cross-section or shorten the clearing time.'
          : 'Increase the cross-section, shorten the run, split into parallel cables, or reduce the design current.';
    }

    function updateSC() {
      var ik = n('cb-ik') * 1000, t = n('cb-t'), k = n('cb-k');
      var area = n('cb-area');
      var sc = $('cb-sc');

      if (!(ik > 0) || !(t > 0) || !(k > 0)) { sc.innerHTML = ''; return; }

      var need = Calc.adiabaticArea(ik, t, k);
      var ok = area >= need;

      sc.innerHTML =
        '<div class="row"><span>Minimum area from I²t</span><strong>' + need.toFixed(1) + ' mm²</strong></div>' +
        '<div class="row"><span>Selected conductor</span><strong>' + area.toFixed(0) + ' mm²</strong></div>' +
        '<div class="row"><span>Verdict</span><strong class="' + (ok ? '' : 'bad-num') + '">' +
          (ok ? 'withstands the fault' : 'undersized for the fault') + '</strong></div>';
    }

    ['cb-ib', 'cb-iz', 'cb-f1', 'cb-f2', 'cb-f3', 'cb-len', 'cb-area', 'cb-mat', 'cb-volt', 'cb-limit'].forEach(function (id) {
      $(id).addEventListener('input', function () { update(); updateSC(); });
      $(id).addEventListener('change', function () { update(); updateSC(); });
    });
    ['cb-ik', 'cb-t', 'cb-k'].forEach(function (id) {
      $(id).addEventListener('input', function () { update(); updateSC(); });
    });

    update();
    updateSC();
  }

  var DRILLS = [
    { id: 'm7-d1', q: 'A cable is tabulated at 200 A, with derating factors 0.8 and 0.7. Derated capacity, in A?',
      unit: 'A', answer: 112, tol: 0.5,
      why: '200 × 0.8 × 0.7 = 112 A. Factors multiply — they never add, and they never average.' },

    { id: 'm7-d2', q: 'That cable carries a design current of 100 A. Does the thermal check pass?',
      type: 'text', accept: ['yes', 'ja', 'pass', 'it passes'],
      why: 'Yes — 100 A against 112 A derated. Only 12 A of margin, which a warmer summer or a crowded tray can erase.' },

    { id: 'm7-d3', q: '100 A through 50 m of 35 mm² copper at 70 °C. Voltage drop, in V?',
      unit: 'V', answer: 5.18, tol: 0.15,
      why: 'R = 0.000598 Ω/m, so ΔU = √3 × 100 × 0.000598 × 50 = 5.18 V.' },

    { id: 'm7-d4', q: 'That drop on a 400 V system is what percentage?',
      unit: '%', answer: 1.30, tol: 0.05,
      why: '5.18 ÷ 400 = 1.3 %. Comfortably inside a typical 3 % budget — this run is thermally limited, not by drop.' },

    { id: 'm7-d5', q: 'DC: 200 A over 20 m of 95 mm² copper. Voltage drop, in V?',
      unit: 'V', answer: 1.76, tol: 0.05,
      why: '2 × 200 × 0.00022 × 20 = 1.76 V. The factor 2 is the return conductor — a classic DC omission.' },

    { id: 'm7-d6', q: 'A 25 kA fault clears in 0.1 s. Minimum copper area at k = 143, in mm²?',
      unit: 'mm²', answer: 55.3, tol: 1.0,
      why: 'S = I√t / k = 25 000 × 0.316 / 143 = 55.3 mm². The thermal check often sizes a cable that ampacity alone would not.' },

    { id: 'm7-d7', q: '16 kA for 0.3 s, same k. Minimum area, in mm²?',
      unit: 'mm²', answer: 61.3, tol: 1.0,
      why: '61.3 mm². A slower clearing time hurts more than a smaller current: √t grows faster than I falls.' },

    { id: 'm7-d8', q: 'On a long low-voltage run, which check usually binds first?',
      type: 'text', accept: ['voltage drop', 'drop', 'spannungsfall'],
      why: 'Voltage drop. Thermal capacity is generous at low current; distance is what makes LV runs expensive.' },

    { id: 'm7-d9', q: 'German building law requires a fire class for cables inside buildings. What is it called?',
      type: 'text', accept: ['eca', 'e ca', 'euroclass', 'brandklasse eca'],
      why: 'Eca, the lowest Euroclass that still restricts flame spread — the minimum for cables in buildings under the building codes.' },

    { id: 'm7-d10', q: 'Which German standard series gives current-carrying capacity and derating?',
      type: 'text', accept: ['vde 0298', 'din vde 0298-4', 'vde 0298-4', 'din vde 0298'],
      why: 'DIN VDE 0298-4 for LV installations. We do not hold the tables, which is why this module teaches the method and asks you for the tabulated value.' },

    { id: 'm7-d11', q: 'A 1 % drop on a 400 V system is how many volts?',
      unit: 'V', answer: 4, tol: 0.05,
      why: '4 V. Worth knowing by heart, because "1 % per 100 m" style rules of thumb are built on it.' },

    { id: 'm7-d12', q: 'Why are MV cable screens sometimes bonded at one end only?',
      type: 'text', accept: ['to avoid circulating currents', 'avoid circulating currents', 'prevent sheath currents', 'reduce sheath losses', 'to prevent circulating currents'],
      why: 'Bonding both ends creates a loop in which the screen current circulates, heating the cable and wasting energy. One-ended bonding removes the loop — at the cost of standing voltage on the screen.' }
  ];



  function drawLaying(host) {
    function panel(title, caption, body) {
      return '<figure class="gallery-item">' +
        '<svg viewBox="0 0 260 190" class="gallery-svg" role="img" aria-label="' + title + '">' + body + '</svg>' +
        '<figcaption><strong>' + title + '</strong><span>' + caption + '</span></figcaption>' +
        '</figure>';
    }

    /* 1 — buried direct */
    var buried = '';
    buried += '<rect x="0" y="70" width="260" height="120" class="soil"/>';
    buried += '<line x1="0" y1="70" x2="260" y2="70" class="ground-line"/>';
    buried += '<text x="8" y="62" class="gal-label">grade</text>';
    buried += '<rect x="80" y="86" width="100" height="88" class="trench"/>';
    buried += '<rect x="80" y="140" width="100" height="34" class="bedding"/>';
    buried += '<circle cx="130" cy="158" r="11" class="cable-core"/>';
    buried += '<line x1="80" y1="104" x2="180" y2="104" class="tape"/>';
    buried += '<text x="188" y="108" class="gal-label">tape</text>';
    buried += '<text x="188" y="150" class="gal-label">sand</text>';
    buried += '<line x1="42" y1="70" x2="42" y2="158" class="dim"/>';
    buried += '<text x="90" y="124" class="gal-label">0.6–0.8 m</text>';

    /* 2 — duct bank */
    var duct = '';
    duct += '<rect x="0" y="70" width="260" height="120" class="soil"/>';
    duct += '<line x1="0" y1="70" x2="260" y2="70" class="ground-line"/>';
    duct += '<text x="8" y="62" class="gal-label">grade</text>';
    duct += '<rect x="60" y="96" width="140" height="76" rx="6" class="concrete"/>';
    [90, 130, 170].forEach(function (x) {
      duct += '<circle cx="' + x + '" cy="134" r="18" class="duct"/>';
      duct += '<circle cx="' + x + '" cy="134" r="10" class="cable-core"/>';
    });


    /* 3 — tray in air */
    var tray = '';
    tray += '<rect x="0" y="70" width="260" height="120" class="air"/>';
    tray += '<rect x="40" y="120" width="180" height="10" class="tray"/>';
    tray += '<rect x="40" y="110" width="8" height="60" class="bracket"/>';
    tray += '<rect x="212" y="110" width="8" height="60" class="bracket"/>';
    [70, 100, 130, 160, 190].forEach(function (x) {
      tray += '<circle cx="' + x + '" cy="112" r="9" class="cable-core"/>';
    });
    tray += '<text x="130" y="92" class="gal-label" text-anchor="middle">grouping and airflow decide</text>';

    /* 4 — trefoil vs flat */
    var formation = '';
    formation += '<text x="52" y="24" class="gal-label" text-anchor="middle">trefoil</text>';
    formation += '<circle cx="40" cy="92" r="14" class="cable-core"/>';
    formation += '<circle cx="66" cy="92" r="14" class="cable-core"/>';
    formation += '<circle cx="53" cy="68" r="14" class="cable-core"/>';
    formation += '<text x="52" y="150" class="gal-label" text-anchor="middle">low sheath loss</text>';
    formation += '<text x="190" y="24" class="gal-label" text-anchor="middle">flat</text>';
    formation += '<circle cx="150" cy="80" r="13" class="cable-core"/>';
    formation += '<circle cx="190" cy="80" r="13" class="cable-core"/>';
    formation += '<circle cx="230" cy="80" r="13" class="cable-core"/>';
    formation += '<text x="190" y="150" class="gal-label" text-anchor="middle">spacing + derating</text>';

    /* 5 — screen bonding */
    var bond = '';
    bond += '<text x="66" y="24" class="gal-label" text-anchor="middle">both ends bonded</text>';
    bond += '<circle cx="66" cy="70" r="18" class="cable-core"/>';
    bond += '<circle cx="66" cy="70" r="24" class="screen"/>';
    bond += '<line x1="42" y1="94" x2="42" y2="120" class="bond-line"/>';
    bond += '<line x1="90" y1="94" x2="90" y2="120" class="bond-line"/>';
    bond += '<line x1="42" y1="120" x2="90" y2="120" class="bond-line"/>';
    bond += '<text x="66" y="146" class="gal-label" text-anchor="middle">loop · current</text>';
    bond += '<text x="196" y="24" class="gal-label" text-anchor="middle">one end bonded</text>';
    bond += '<circle cx="196" cy="70" r="18" class="cable-core"/>';
    bond += '<circle cx="196" cy="70" r="24" class="screen"/>';
    bond += '<line x1="172" y1="94" x2="172" y2="120" class="bond-line"/>';
    bond += '<line x1="172" y1="120" x2="206" y2="120" class="bond-line"/>';
    bond += '<text x="196" y="146" class="gal-label" text-anchor="middle">no loop · voltage</text>';

    host.innerHTML =
      '<div class="card">' +
        '<h2>How cables are actually laid</h2>' +
        '<p class="muted">Five arrangements that decide the thermal rating before any calculation begins.</p>' +
        '<div class="gallery">' +
          panel('Buried direct', 'Depth, sand bedding and a warning tape. Soil resistivity sets the rating.', buried) +
          panel('Duct bank', 'The duct adds thermal resistance and the group heats itself.', duct) +
          panel('Tray in air', 'Grouping matters more than length. Airflow decides.', tray) +
          panel('Trefoil vs flat', 'Single-core MV cables: formation changes sheath loss and derating.', formation) +
          panel('Screen bonding', 'Both ends: circulating current heats the cable. One end: standing voltage.', bond) +
        '</div>' +
      '</div>';
  }

  function drawCascade(host) {
    var steps = [
      { label: 'tabulated', value: 150, note: 'reference conditions' },
      { label: '× 0.9', value: 135, note: 'ambient' },
      { label: '× 0.8', value: 108, note: 'grouping' },
      { label: '× 1.0', value: 108, note: 'laying' }
    ];
    var W = 860, H = 300, padL = 70, padB = 70, padT = 30;
    var max = 160;
    var bw = (W - padL - 40) / steps.length;
    var y = function (v) { return padT + (1 - v / max) * (H - padT - padB); };
    var base = H - padB;

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Derating cascade from tabulated capacity to installed capacity">');

    [0, 50, 100, 150].forEach(function (t) {
      p.push('<line x1="' + padL + '" y1="' + y(t) + '" x2="' + (W - 20) + '" y2="' + y(t) + '" class="chart-grid"/>');
      p.push('<text x="' + (padL - 8) + '" y="' + (y(t) + 4) + '" class="chart-axis" text-anchor="end">' + t + '</text>');
    });

    steps.forEach(function (s, i) {
      var x0 = padL + i * bw + 12;
      var w = bw - 24;
      p.push('<rect x="' + x0 + '" y="' + y(s.value) + '" width="' + w + '" height="' + (base - y(s.value)) + '" rx="6" class="cascade-bar"/>');
      p.push('<text x="' + (x0 + w / 2) + '" y="' + (y(s.value) - 8) + '" class="chart-axis" text-anchor="middle">' + s.value + ' A</text>');
      p.push('<text x="' + (x0 + w / 2) + '" y="' + (base + 20) + '" class="chart-axis" text-anchor="middle">' + s.label + '</text>');
      p.push('<text x="' + (x0 + w / 2) + '" y="' + (base + 38) + '" class="chart-axis" text-anchor="middle">' + s.note + '</text>');
    });

    /* design current */
    p.push('<line x1="' + padL + '" y1="' + y(100) + '" x2="' + (W - 20) + '" y2="' + y(100) + '" class="chart-threshold"/>');


    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>150 A on the table, 108 A in the tray</h2>' +
        '<p class="muted">Each factor is a multiplication, not a subtraction. The bar on the left is what the catalogue promised; the one on the right is what the installation delivers.</p>' +
        '<div class="legend"><span><i class="sw-a"></i>derated capacity</span><span><i class="sw-contract"></i>design current 100 A</span></div>' +
        '<div class="chart-wrap">' + p.join('') + '</div>' +
        '<p class="muted">The 100 A design current survives here by 8 A. One more circuit in the tray, or a hotter summer, and the cable is running beyond its rating — quietly, for years.</p>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'm7',
    number: '07',
    title: 'Cables and laying',
    lead: 'Three checks, one derating chain, and the laying details that actually fail on site.',
    sections: [
      {
        h: 'Three checks, and they are not equal',
        p: [
          `Every cable must pass <strong>thermal</strong> where the protective device sits between design current and cable capacity (<code>I_b ≤ I_n ≤ I_z</code>), <strong>voltage drop</strong> across the run, and <strong>short-circuit withstand</strong> for the fault it must survive. Whichever binds first sizes the cable.`,
          `On short runs at high current, thermal governs. On long low-voltage runs, drop governs, which is why LV feeders are often two sizes larger than thermals alone would allow. On MV, the short-circuit duty or the screen arrangement frequently decides.`,
          `A design that checks only one of the three is not a cheap design; it is an unfinished one, and which of the other two it fails depends on the site.`,
          `The practical order is: calculate all three, then take the largest result. Engineers who enjoy the problem do it in that order; engineers who are busy do thermal first and discover the other two during commissioning.`
        ],
        formula: 'I_b ≤ I_n ≤ I_z   ·   ΔU ≤ limit   ·   S ≥ I√t / k',
        example: {
          title: 'Worked example — the cable that passes two checks',
          steps: [`A 35 mm² copper feeder carries 100 A over 50 m: thermal passes, drop is 5.18 V or 1.30 % of 400 V and passes too.`, `Then the adiabatic check: a 25 kA fault clearing in 0.1 s needs 55.3 mm², so the cable is undersized for the fault it will actually see.`],
          result: `Same cable, three verdicts.`
        },
        mistake: `Sizing on ampacity and treating the other two as formalities. On a 400 V run of 100 m the drop alone can force a jump of two sizes, and no thermal table will tell you that.`,
        check: `Which check usually binds on a long LV run? Answer: voltage drop.`
      },
      {
        h: 'Derating is a chain of multiplications',
        p: [
          `The tabulated capacity assumes reference conditions: a defined ambient, a defined installation, a single circuit. Real installations satisfy none of those, so each deviation contributes a factor between roughly 0.5 and 1.0.`,
          `Ambient temperature, grouping with other circuits, soil thermal resistivity, burial depth, duct versus direct burial versus tray — they multiply. Two factors of 0.8 cost you 36 % of capacity, not 20 %.`,
          `This is the single most common sizing error in the field, and it does not fail immediately. It fails on the third hot summer, when a cable that was "about right" has been running at 15 K above design for years.`,
          `Insulation ages by a rule of thumb that doubles its rate for every 8–10 K above rating, so a cable at 15 K over is not mildly stressed — it is on a completely different lifetime curve.`
        ],
        formula: 'I_z,actual = I_z,table × f_ambient × f_grouping × f_soil × f_depth',
        example: {
          title: 'Worked example — a chain of three factors',
          body: `A cable tabulated at 150 A with an ambient factor of 0.9, a grouping factor of 0.8 and no soil correction: 150 × 0.9 × 0.8 = 108 A. Its 100 A design current leaves 8 A of margin, which one more circuit in the tray or a warmer summer will erase.`
        },
        mistake: `Adding the derating percentages — "10 % for ambient plus 20 % for grouping, so 30 % off". The real reduction is 28 %, and with four or five factors the difference becomes a size.`,
        check: `150 A derated by 0.9 and 0.8: what capacity remains? Answer: 108 A.`
      },
      {
        h: 'DC is not AC with a different label',
        p: [
          `BESS DC runs sit at up to 1,500 V, carry hundreds of amps per rack, and have no natural current zero — so an arc does not self-extinguish the way it does in AC. Every switching and protective device on that side must be rated for DC, at the stated voltage and time constant.`,
          `Voltage drop counts the return conductor: <code>ΔU = 2 · I · R · L</code>. Forgetting the factor 2 halves the calculated loss, which is a common and expensive omission in container routing.`,
          `The DC system is unearthed and monitored. The first earth fault is a warning; the second creates a fault path through the rack, which is why the insulation monitoring device is a safety system, not a diagnostic nicety.`,
          `Size DC conductors for the continuous current, then check them again for the fault current the fuses will let through before they open.`
        ],
        formula: 'ΔU_DC = 2 · I · R · L   ·   no zero crossing, so arcing behaves differently',
        example: {
          title: 'Worked example — the return conductor',
          body: `200 A over 20 m of 95 mm² copper: R = 0.00022 Ω/m, so ΔU = 2 × 200 × 0.00022 × 20 = 1.76 V. Without the factor 2 you would calculate 0.88 V and conclude the run is loss-free, then wonder why the measured RTE is a point below the datasheet.`
        },
        mistake: `Applying an AC-rated breaker or fuse to a DC string because the current rating matches. For DC, the voltage and time constant on the label matter more than the amps.`,
        check: `What is the factor in front of I·R·L for a DC run? Answer: 2 — the return conductor.`
      },
      {
        h: 'On MV, the screen decides',
        p: [
          `MV cables are XLPE at 20 or 33 kV, single-core or three-core. Single-core is preferred at high current, but its screen carries induced voltage and current, so the bonding arrangement becomes a design decision rather than a detail.`,
          `Bonded at both ends, the screens form a loop and circulating current heats the cable. Bonded at one end, the loop is broken but a standing voltage appears on the far screen. Both arrangements are legitimate; neither is chosen on site.`,
          `Single-core cables are laid in trefoil to reduce both the external field and the sheath losses. Flat formation needs attention to phase spacing and transposition, and it changes the derating.`,
          `For a BESS, the MV feeder is short and the current is high, which puts the design pressure on the terminations and the bonding rather than on the route.`,
          `Ask for the bonding diagram early. If it appears only at as-built stage, the cable was ordered before the arrangement was decided, and one of the two will have been made to fit the other.`
        ],
        formula: 'Both ends bonded → circulating screen current · one end → standing screen voltage',
        example: {
          title: 'Worked example — a bonding decision with a cost',
          body: `A 400 mm² single-core feeder at 200 A with both ends bonded can circulate tens of amps in the screens, heating the cable and wasting energy for twenty years. Bonding at one end removes the loop and needs sheath voltage limiters at the far end — a small extra component that is easy to value-engineer out and expensive to retrofit.`
        },
        mistake: `Treating the screen as armour and bonding it wherever convenient. The bonding arrangement is part of the cable design, and changing it changes the thermal rating.`,
        check: `Why bond MV screens at one end? Answer: to break the circulating-current loop.`
      },
      {
        h: 'Laying: where the design meets the ground',
        p: [
          `Buried cables need depth, sand bedding, mechanical protection and a warning tape; the thermal resistivity of the surrounding soil sets the capacity. Ducts add thermal resistance, and an unsealed duct eventually fills with water.`,
          `In trays and in air, grouping and airflow decide. Inside a container, ambient is the killer — 50 °C in a cabinet on a summer afternoon is normal, and it is not the temperature the table assumed.`,
          `Inside buildings, German building law demands a fire class (Eca minimum) and, for safety circuits, functional integrity for a defined time. Bend radius and pulling tension are checked at the rack entry, which is where cables are actually damaged.`,
          `Pull tension and bend radius are specified by the manufacturer for a reason: a cable pulled hard around a tight corner has a locally reduced insulation thickness that no test will find until it fails.`,
          `Inspect the entry into every enclosure, because that is where the bend radius is tightest and where the installer has the least room to be careful.`
        ],
        formula: 'Buried: depth, bedding, tape · Tray: grouping · Container: ambient',
        example: {
          title: 'Worked example — the container nobody derated for',
          body: `A DC cable inside a container may see 50 °C ambient rather than the 30 °C reference — a factor near 0.8 on its own. Add grouping with three parallel strings and the cable is at 60 % of its tabulated capacity before any soil or depth factor is considered.`
        },
        mistake: `Using indoor tabulated values for a container installation. The container is hotter than the switch room and the table was not written for it.`,
        check: `What is the minimum fire class for cables inside a building? Answer: Eca.`
      },
      {
        h: 'What gets tested before handover',
        p: [
          `Insulation resistance, continuity of protective conductors, and for MV a sheath test and partial-discharge measurement. A cable that passes at 500 V can still fail at 20 kV, which is why the test voltage is part of the specification.`,
          `Document the runs, the derating factors used and the test results. In a dispute about a hot cable, that derating calculation is the evidence, and reconstructing it three years later is both expensive and unconvincing.`,
          `The test schedule is also a schedule item: partial discharge on MV needs the terminations complete and the weather to cooperate, and it is on the critical path to energisation.`,
          `Book the test window before the terminations are complete, not after: a partial-discharge test needs a stable supply, dry weather and an electrician who has done it before.`,
          `Keep the results with the as-built drawings. When a joint fails in year six, the test record from commissioning is the only evidence of what it looked like when it was new.`
        ],
        formula: 'LV: insulation + continuity · MV: + sheath test + partial discharge',
        example: {
          title: 'Worked example — why the record matters',
          steps: [`A feeder runs hot in year four.`, `Without the derating factors recorded at design, nobody can prove whether the installation matched the calculation or the calculation was optimistic.`],
          result: `With them, the argument is a two-page comparison rather than a blame meeting.`
        },
        mistake: `Recording only "test passed". The value and the conditions are the evidence; the word "passed" is an opinion.`,
        check: `Which test on an MV cable is not done on LV? Answer: partial discharge (with the sheath test).`
      }
    ],
    renderExtra: function (host) {
      var a = document.createElement('div');
      var b = document.createElement('div');
      host.appendChild(a); host.appendChild(b);
      drawCascade(a);
      drawLaying(b);
    },
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
