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

  window.MODULES.push({
    id: 'm7',
    number: '07',
    title: 'Cables and laying',
    lead: 'Three checks, one derating chain, and the laying details that actually fail on site.',
    sections: [
      {
        h: 'Three checks, and they are not equal',
        p: [
          'Every cable must pass <strong>thermal</strong> (<code>I_b ≤ I_n ≤ I_z</code>), <strong>voltage drop</strong>, and <strong>short-circuit withstand</strong>. Whichever binds first sizes the cable.',
          'On short runs at high current, thermal governs. On long low-voltage runs, drop governs — which is why LV feeders are often two sizes larger than thermals alone would allow. On MV, the short-circuit duty or the screen arrangement often decides.',
          'The protective device sits between the two currents: the cable must be protected by something that trips before the cable is damaged.'
        ],
        formula: 'I_b ≤ I_n ≤ I_z   ·   ΔU ≤ limit   ·   S ≥ I√t / k'
      },
      {
        h: 'Derating is a chain of multiplications',
        p: [
          'The tabulated capacity assumes reference conditions: a defined ambient, a defined installation, a single circuit. Real installations satisfy none of those.',
          'Ambient temperature, grouping with other circuits, soil thermal resistivity, burial depth, duct vs direct burial vs tray — each contributes a factor between roughly 0.5 and 1.0.',
          'They multiply. Two factors of 0.8 cost you 36 % of the capacity, not 20 %. This is the single most common sizing error, and the one that shows up as a warm cable three summers later.'
        ],
        formula: 'I_z,actual = I_z,table × f_ambient × f_grouping × f_soil × f_depth'
      },
      {
        h: 'DC is not AC with a different label',
        p: [
          'BESS DC runs sit at up to 1,500 V, carry hundreds of amps per rack, and have no natural zero crossing — so an arc does not self-extinguish at a current zero the way it does in AC.',
          'Voltage drop counts the return conductor: <code>ΔU = 2 · I · R · L</code>. Forgetting the factor 2 understates loss by half, which is a common and expensive mistake in container routing.',
          'The DC system is unearthed and monitored by an insulation monitoring device. The first earth fault is a warning; the second creates a fault path through the rack.'
        ],
        formula: 'ΔU_DC = 2 · I · R · L   ·   no zero crossing, so arcing behaves differently'
      },
      {
        h: 'On MV, the screen decides',
        p: [
          'MV cables are XLPE, 20 or 33 kV, single-core or three-core. Single-core cables are preferred for high current, but their screens carry induced voltage and current.',
          'Bonded at both ends, the screens form a loop and circulating current heats the cable. Bonded at one end, the loop is broken but a standing voltage appears on the far screen — which is why the arrangement is designed, not chosen on site.',
          'Single-core cables are laid in trefoil to reduce both the external field and the sheath losses. Flat formation needs more attention to phase spacing and transposition.'
        ],
        formula: 'Both ends bonded → circulating screen current · One end → standing screen voltage'
      },
      {
        h: 'Laying: where the design meets the ground',
        p: [
          'Buried cables need depth, sand bedding, protection and a warning tape; the thermal resistivity of the surrounding soil sets the capacity. Ducts add thermal resistance, and unsealed ducts fill with water.',
          'In trays and in air, grouping and free air movement decide; in a container, ambient is the killer — 50 °C inside a cabinet is normal on a summer afternoon.',
          'Inside buildings, German building law demands a fire class (Eca minimum) and, for safety circuits, functional integrity for a defined time. Bend radius and pulling tension are checked at the rack entry, which is where cables actually get damaged.'
        ],
        formula: 'Buried: depth, bedding, tape · Tray: grouping · Container: ambient'
      },
      {
        h: 'What gets tested before handover',
        p: [
          'Insulation resistance, continuity of protective conductors, and — for MV — a sheath test and partial discharge measurement. A cable that passes at 500 V can still fail at 20 kV.',
          'Document the runs, the derating factors used and the test results. In a dispute about a hot cable, the derating calculation is the evidence.'
        ],
        formula: 'LV: insulation + continuity · MV: + sheath test + partial discharge'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
