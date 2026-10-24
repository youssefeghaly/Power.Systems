/* Module 4 — German grid connection: 4110 / 4120. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  /* ---------- process stepper ---------- */
  var STEPS = [
    { t: 'Anschlussanfrage',
      who: 'Anlagenbetreiber → VNB',
      what: 'You ask the network operator whether the connection is possible, and at what cost. Everything starts here, and everything downstream depends on the answer.',
      risk: 'Asking late. Queue position, not engineering quality, decides the timeline.' },

    { t: 'Anschlusszusage',
      who: 'VNB → Anlagenbetreiber',
      what: 'The operator confirms the connection point, the agreed feed-in power P_AV,E and any network upgrades you must fund.',
      risk: 'P_AV,E is a contractual ceiling, not a suggestion. Exceeding it is a breach, not a rounding error.' },

    { t: 'Anlagenzertifikat',
      who: 'Zertifizierer → VNB',
      what: 'Independent certification that the plant meets the TAR. Required from 135 kW installed. Built on component certificates (E.14) for PCS, transformers, protection.',
      risk: 'The PCS model you submit is the one you must build. Changing it later re-opens the certification.' },

    { t: 'Übergabestation',
      who: 'Anlagenbetreiber / EPC',
      what: 'The transfer station is built: switchgear, metering, protection, and the central NA protection with its coupling switch.',
      risk: 'This is where the DSO inspects hardest. Cable fire class, earthing, CT/VT burden and the protection concept all get checked here.' },

    { t: 'Vorläufige Betriebserlaubnis',
      who: 'VNB → Anlagenbetreiber',
      what: 'From 135 kW installed, the plant may only be switched on after the operator grants provisional permission to operate.',
      risk: 'Energising without it is not a paperwork problem — it is an unpermitted grid connection.' },

    { t: 'Inbetriebsetzung',
      who: 'VNB + Anlagenbetreiber',
      what: 'Commissioning: the plant is energised, protection is proven, and the DSO runs its own functional test at the connection.',
      risk: 'A failed protection test here sends you back to the switchgear, with the schedule and the LDs running.' },

    { t: 'Endgültige Betriebserlaubnis',
      who: 'VNB → Anlagenbetreiber',
      what: 'Permanent permission to operate, granted once all evidence is complete and accepted. Only now is the plant fully commercial.',
      risk: 'Plants can run for months on provisional permission, with documents still open. It becomes a covenant issue at financing.' }
  ];

  function renderSteps(host) {
    var html = '<div class="card">' +
      '<h2>The path through a German connection</h2>' +
      '<p class="muted">Seven gates. Tap one — the interesting part is always what can go wrong at it.</p>' +
      '<ol class="steps">';

    STEPS.forEach(function (s, i) {
      html += '<li><button class="step" data-step="' + i + '">' +
        '<span class="step-dot">' + (i + 1) + '</span>' +
        '<span class="step-label">' + s.t + '</span>' +
        '</button></li>';
    });

    html += '</ol><div id="step-detail" class="node-detail"></div></div>';
    host.innerHTML = html;

    var detail = host.querySelector('#step-detail');

    function select(i) {
      host.querySelectorAll('.step').forEach(function (b) {
        b.classList.toggle('active', Number(b.getAttribute('data-step')) === i);
      });
      detail.innerHTML =
        '<h3>' + STEPS[i].t + '</h3>' +
        '<p class="eff"><strong>Who:</strong> ' + STEPS[i].who + '</p>' +
        '<p>' + STEPS[i].what + '</p>' +
        '<p class="muted"><strong>What goes wrong:</strong> ' + STEPS[i].risk + '</p>';
    }

    host.querySelectorAll('.step').forEach(function (b) {
      b.addEventListener('click', function () { select(Number(b.getAttribute('data-step'))); });
    });
    select(1);
  }

  /* ---------- which rules apply ---------- */
  var calcHTML =
    '<div class="card">' +
      '<h2>Which rules apply to your plant?</h2>' +
      '<p class="muted">Four thresholds decide almost everything. Change them and watch the answer change.</p>' +
      '<div class="grid">' +
        '<label><span>Installed power ΣP<sub>Amax</sub></span><input id="gc-power" type="text" inputmode="decimal" value="100000" /><span class="hint">kW</span></label>' +
        '<label><span>Agreed feed-in P<sub>AV,E</sub></span><input id="gc-feed" type="text" inputmode="decimal" value="100000" /><span class="hint">kW</span></label>' +
        '<label>Connection voltage<input id="gc-volt" type="text" inputmode="decimal" value="110" /><span class="hint">kV</span></label>' +
      '</div>' +
      '<div id="gc-out" class="results"></div>' +
      '<div id="gc-note" class="gc-note"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>The thresholds that matter</h2>' +
      '<p><strong>135 kW</strong> — from here up, an Anlagenzertifikat and a provisional operating permit are required. Below it, a conformity declaration is enough.</p>' +
      '<p><strong>500 kW / 270 kW</strong> — inside this envelope, NELEV §2(4) lets the DSO\'s notification of the connection point count as provisional permission. Still certified, less paperwork.</p>' +
      '<p><strong>Voltage level</strong> — 400 V follows 4105, 20 kV follows 4110, 110 kV follows 4120. The size thresholds live inside each of those worlds.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var p = parseFloat(String($('gc-power').value).replace(',', '.'));
      var feed = parseFloat(String($('gc-feed').value).replace(',', '.'));
      var v = parseFloat(String($('gc-volt').value).replace(',', '.'));

      if (!(p > 0) || !(v > 0)) {
        $('gc-out').innerHTML = '<div class="row"><span>Waiting for input</span><strong>power and voltage</strong></div>';
        $('gc-note').textContent = '';
        return;
      }

      var tar = v >= 110 ? 'VDE-AR-N 4120 (Hochspannung)' :
                v >= 1 ? 'VDE-AR-N 4110 (Mittelspannung)' :
                         'VDE-AR-N 4105 (Niederspannung)';

      var certified = p >= 135;
      var simplified = certified && p > 135 && p <= 500 && isFinite(feed) && feed <= 270;
      var na = p >= 135 ? 'central NA protection at the transfer station' : 'integrated NA protection in the unit';

      $('gc-out').innerHTML =
        '<div class="row"><span>Applies</span><strong>' + tar + '</strong></div>' +
        '<div class="row"><span>Anlagenzertifikat</span><strong>' + (certified ? 'required' : 'not required — conformity declaration') + '</strong></div>' +
        '<div class="row"><span>Provisional operating permit</span><strong>' + (certified ? 'required before energising' : 'not required') + '</strong></div>' +
        '<div class="row"><span>NELEV §2(4) simplification</span><strong>' + (simplified ? 'available' : 'not available') + '</strong></div>' +
        '<div class="row"><span>NA protection</span><strong>' + na + '</strong></div>';

      $('gc-note').textContent = simplified
        ? 'Inside the envelope: the DSO\'s notification of the connection point counts as provisional permission, provided the TAB and TAR are implemented.'
        : (certified ? 'Above 135 kW: certification and a permit to operate before the plant is energised.' : 'Below 135 kW: the light path.');
    }

    ['gc-power', 'gc-feed', 'gc-volt'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  /* ---------- drills ---------- */
  var DRILLS = [
    { id: 'm4-d1', q: 'From what installed power does a storage plant need an Anlagenzertifikat and a provisional operating permit, in kW?',
      unit: 'kW', answer: 135, tol: 0.5,
      why: '135 kW. Below it a conformity declaration suffices; above it, independent certification and a permit before energising.' },

    { id: 'm4-d2', q: 'Which VDE application rule governs a plant connected at 20 kV?',
      type: 'text', accept: ['4110', 'vde-ar-n 4110', 'tar mittelspannung'],
      why: 'VDE-AR-N 4110, the TAR Mittelspannung. 4105 is low voltage, 4120 is high voltage, 4130 is extra-high.' },

    { id: 'm4-d3', q: 'Which rule governs a plant connected at 110 kV?',
      type: 'text', accept: ['4120', 'vde-ar-n 4120', 'tar hochspannung'],
      why: 'VDE-AR-N 4120. Our anchor plant lives here — which is why most of this module is about 4110 mechanics applied at HV.' },

    { id: 'm4-d4', q: 'Which regulation gives the VDE application rules legal force for storage?',
      type: 'text', accept: ['nelev', 'verordnung zum nachweis von elektrotechnischen eigenschaften von energieanlagen'],
      why: 'NELEV — the ordinance on proof of electrical properties of energy installations. It makes VDE-AR-N 4110:2023-09 binding. A standard alone cannot compel you; the ordinance does.' },

    { id: 'm4-d5', q: 'Which form is the plant data sheet for a storage system?',
      type: 'text', accept: ['e.8', 'e8', 'e. 8'],
      why: 'E.8 — Datenblatt einer Erzeugungsanlage / eines Speichers. It is due before commissioning, not at first contact.' },

    { id: 'm4-d6', q: 'Which form is the component certificate for the PCS?',
      type: 'text', accept: ['e.14', 'e14'],
      why: 'E.14. The plant certificate is built from component certificates — no component certificate, no plant certificate.' },

    { id: 'm4-d7', q: 'Which form does the network operator issue to you with its questions?',
      type: 'text', accept: ['e.9', 'e9'],
      why: 'E.9, the Netzbetreiber-Fragebogen, produced from your E.8. This is where the technical dialogue actually starts.' },

    { id: 'm4-d8', q: 'In the NELEV §2(4) simplification, what is the maximum installed power, in kW?',
      unit: 'kW', answer: 500, tol: 0.5,
      why: '500 kW installed, with feed-in no more than 270 kW. Inside that envelope the DSO\'s connection-point notification counts as provisional permission.' },

    { id: 'm4-d9', q: 'When charging at part load, what is the required cos φ range? (give the lower bound)',
      unit: 'cos φ', answer: 0.90, tol: 0.005,
      why: 'cos φ 0.90 under-excited up to 1. The plant must be able to absorb or supply reactive power on demand — the PCS is a grid asset, not just a converter.' },

    { id: 'm4-d10', q: 'What minimum cos φ must be maintained when charging at rated power?',
      unit: 'cos φ', answer: 0.95, tol: 0.005,
      why: '0.95 under-excited at rated power. This is a real PCS sizing constraint, not a setting you apply at the end.' },

    { id: 'm4-d11', q: 'What is the central protection device at the transfer station called? (two words, German)',
      type: 'text', accept: ['na-schutz', 'na schutz', 'zentraler na-schutz', 'nschutz'],
      why: 'Zentraler NA-Schutz, with its coupling switch (Kuppelschalter). It disconnects the plant from the grid when the grid leaves its permitted window.' },

    { id: 'm4-d12', q: 'The agreed feed-in power is P_AV,E = 400 kW and installed power is 900 kW. Is the NELEV simplification available?',
      type: 'text', accept: ['no', 'nein', 'not available', 'nicht verfügbar'],
      why: 'No. Both conditions must hold: installed ≤ 500 kW and feed-in ≤ 270 kW. At 900 kW installed it fails on the first test.' }
  ];

  window.MODULES.push({
    id: 'm4',
    number: '04',
    title: 'German grid connection: 4110 / 4120',
    lead: 'The layer that decides whether a plant can be built at all — and the one an interview will actually probe.',
    sections: [
      {
        h: 'Not one grid code — four',
        p: [
          'Germany regulates grid connection through VDE application rules (VDE-Anwendungsregeln), and you follow the one that matches the voltage you connect at: 4105 for low voltage, 4110 for medium voltage, 4120 for high voltage, 4130 for extra-high.',
          'They are not law in themselves. The <strong>NELEV</strong> — the ordinance on proof of electrical properties of energy installations — makes them binding, and each network operator adds its own TAB with local specifics.',
          'Practical consequence: two identical plants in two DSO areas can face different requirements. The TAR is the floor; the TAB is the local truth.'
        ],
        formula: '400 V → 4105 · 20 kV → 4110 · 110 kV → 4120 · 380 kV → 4130'
      },
      {
        h: 'Who is who',
        p: [
          'The <strong>VNB</strong> (Verteilnetzbetreiber) owns the network you connect to. The <strong>ÜNB</strong> runs transmission. The <strong>Anschlussnehmer</strong> is the party whose property hosts the connection; the <strong>Anlagenbetreiber</strong> runs the plant — often the same company, sometimes not.',
          'The <strong>Anlagenzertifizierer</strong> is an independent body that certifies the design against the TAR. The <strong>Installateur</strong> builds the connection, and the <strong>AHJ</strong> — usually the local fire authority — signs off the site.',
          'Knowing who signs what is half of project management in this market. The other half is knowing which of them can stop you.'
        ]
      },
      {
        h: 'The paper trail',
        p: [
          'E.8 is the plant data sheet, E.9 the network operator\'s questionnaire generated from it, E.14 the component certificate. The Anlagenzertifikat bundles them at plant level.',
          'Two permission stages matter: from <strong>135 kW</strong> installed you may only energise after a <strong>provisional</strong> operating permit, and only operate permanently after the <strong>final</strong> one. Between the two, plants run for months with documents still open.',
          'Inside the NELEV §2(4) envelope — up to 500 kW installed and 270 kW feed-in — the DSO\'s notification of the connection point counts as provisional permission. Still certified, less ceremony.'
        ],
        formula: 'E.8 Datenblatt → E.9 Fragebogen → E.14 Komponenten → Anlagenzertifikat'
      },
      {
        h: 'What the operator actually checks',
        p: [
          '<strong>Netzrückwirkungen</strong>: voltage change, flicker, harmonics, unbalance. The plant must not make the network worse than the TAR allows.',
          '<strong>Reactive power</strong>: cos φ from 0.90 under-excited to 1 at part load, and at least 0.95 at rated power when charging. The PCS must deliver this — it is a sizing input, not a commissioning setting.',
          '<strong>Protection</strong>: the central NA protection with its coupling switch disconnects the plant when the grid leaves its window. At medium voltage it sits in the transfer station, not inside the container.'
        ],
        formula: 'cos φ 0.90 … 1 at part load · ≥ 0.95 at rated power'
      },
      {
        h: 'What this module does not teach',
        p: [
          'The exact fault-ride-through curve, the permitted voltage step and the flicker coefficients live in the 4110 and 4120 documents themselves, which we do not hold. This app teaches the mechanism and the thresholds we can source.',
          'Where a number is not in our documents, it is marked rather than invented. In an interview, saying "that is in 4110 clause 5.4, and I would verify the current edition" beats quoting a figure from memory that has since been amended.'
        ],
        formula: 'Rule: cite what you hold, with edition and year'
      }
    ],
    renderExtra: renderSteps,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
