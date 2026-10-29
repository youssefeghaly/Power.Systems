/* Module 10 — distribution networks. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Voltage rise on a feeder</h2>' +
      '<p class="muted">Injection pushes voltage up at the far end. This is the calculation that decides whether your plant is allowed to connect.</p>' +
      '<div class="grid">' +
        '<label><span>Injection P</span><input id="dv-p" type="text" inputmode="decimal" value="5" /><span class="hint">MW</span></label>' +
        '<label><span>Reactive Q</span><input id="dv-q" type="text" inputmode="decimal" value="0" /><span class="hint">MVar</span></label>' +
        '<label><span>Feeder resistance R</span><input id="dv-r" type="text" inputmode="decimal" value="1" /><span class="hint">Ω</span></label>' +
        '<label><span>Feeder reactance X</span><input id="dv-x" type="text" inputmode="decimal" value="2" /><span class="hint">Ω</span></label>' +
        '<label><span>Nominal voltage</span><input id="dv-u" type="text" inputmode="decimal" value="20" /><span class="hint">kV</span></label>' +
        '<label><span>Permitted rise</span><input id="dv-limit" type="text" inputmode="decimal" value="2" /><span class="hint">%</span></label>' +
      '</div>' +
      '<div id="dv-out" class="results"></div>' +
      '<div id="dv-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var p = n('dv-p'), q = n('dv-q'), r = n('dv-r'), x = n('dv-x'), kv = n('dv-u'), limit = n('dv-limit');
      var out = $('dv-out'), note = $('dv-note');

      if (!(r > 0) || !(x >= 0) || !(kv > 0) || !(limit > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>feeder impedance and voltage</strong></div>';
        note.textContent = '';
        return;
      }

      var u = kv * 1000;
      var du = (p * 1e6 * r + q * 1e6 * x) / u;
      var pct = (du / u) * 100;
      var maxDu = (limit / 100) * u;
      var headroom = maxDu - du;
      var maxP = ((maxDu * u) - q * 1e6 * x) / (r * 1e6);

      out.innerHTML =
        '<div class="row"><span>Voltage rise</span><strong>' + du.toFixed(0) + ' V (' + pct.toFixed(2) + ' %)</strong></div>' +
        '<div class="row"><span>Permitted</span><strong>' + maxDu.toFixed(0) + ' V (' + limit.toFixed(1) + ' %)</strong></div>' +
        '<div class="row"><span>Headroom</span><strong class="' + (headroom < 0 ? 'bad-num' : '') + '">' +
          (headroom / u * 100).toFixed(2) + ' %</strong></div>' +
        '<div class="row"><span>Injection at that limit</span><strong>' + (maxP > 0 ? maxP.toFixed(2) + ' MW' : 'none') + '</strong></div>';

      note.textContent = headroom < 0
        ? 'Over the limit. The usual answers: connect further upstream, absorb reactive power, curtail the top of the output, or pay for a network upgrade.'
        : 'Inside the limit. Note how reactive power moves the answer — absorbing Q buys headroom without giving up active power.';
    }

    ['dv-p', 'dv-q', 'dv-r', 'dv-x', 'dv-u', 'dv-limit'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm10-d1', q: '5 MW injected at 20 kV through a feeder with R = 1 Ω. Voltage rise, in %? (Q = 0)',
      unit: '%', answer: 1.25, tol: 0.03,
      why: 'ΔU = P·R/U = 5 000 000 × 1 / 20 000 = 250 V, which is 1.25 % of 20 kV.' },

    { id: 'm10-d2', q: 'Same case, but the plant also injects 2 MVar and X = 2 Ω. Voltage rise, in %?',
      unit: '%', answer: 2.25, tol: 0.05,
      why: 'ΔU = (P·R + Q·X)/U = (5 + 4) MVAr-equivalent / 20 kV = 450 V = 2.25 %. Reactive power is not free of consequences.' },

    { id: 'm10-d3', q: 'If the DSO permits 2 %, how much headroom is left in the first case?',
      unit: '%', answer: 0.75, tol: 0.03,
      why: '2 % − 1.25 % = 0.75 %. Headroom is what allows the plant to grow or the feeder to be loaded by someone else later.' },

    { id: 'm10-d4', q: 'With R = 1 Ω at 20 kV and a 2 % limit, what is the maximum active injection (Q = 0), in MW?',
      unit: 'MW', answer: 8, tol: 0.1,
      why: 'ΔU_max = 400 V, so P = 400 × 20 000 / 1 = 8 MW. That number is the feeder\'s hosting capacity for this plant.' },

    { id: 'm10-d5', q: '10 MW at 20 kV through R = 0.5 Ω. Voltage rise, in %?',
      unit: '%', answer: 1.25, tol: 0.03,
      why: 'ΔU = 10 000 000 × 0.5 / 20 000 = 250 V = 1.25 %. Halve the resistance, halve the rise.' },

    { id: 'm10-d6', q: 'Does absorbing reactive power raise or lower the voltage at the connection point?',
      type: 'text', accept: ['lower', 'lowers', 'reduce', 'reduces', 'lower it'],
      why: 'It lowers voltage. That is why an inverter absorbing Q can connect where one at unity power factor cannot — the Q(U) characteristic in Module 4 exists for this.' },

    { id: 'm10-d7', q: 'Why can a 5 MW battery be refused where a 5 MW load is accepted?',
      type: 'text', accept: ['the battery exports and raises voltage', 'export raises voltage', 'injection instead of consumption', 'reverse power flow', 'it exports rather than consumes'],
      why: 'A load lowers voltage; an injection raises it. The feeder was designed for consumption, so the same megawatts in the other direction hit a different limit.' },

    { id: 'm10-d8', q: 'In a ring network operated radially, what is the "open point"?',
      type: 'text', accept: ['the normally open switch', 'a normally open point', 'open switch that separates the ring', 'normally open point'],
      why: 'A normally open switch that separates the ring into two radial feeders. Close it and you can restore supply from the other side — that is the point of building a ring.' },

    { id: 'm10-d9', q: 'Which German regulation governs controllable consumption devices connected to the distribution network?',
      type: 'text', accept: ['14a', '§14a', 'enwg 14a', 'paragraph 14a'],
      why: '§14a EnWG. It lets the DSO dim controllable loads — heat pumps, chargers, storage — in exchange for a reduced grid fee.' },

    { id: 'm10-d10', q: 'From what generator power does a central NA protection become necessary in the low-voltage world?',
      unit: 'kW', answer: 30, tol: 0.5,
      why: '30 kW in the 4105 world. Above it, the protection must be a separate central device with a coupling switch, not a function inside the inverter.' },

    { id: 'm10-d11', q: 'What voltage band must a German distribution connection normally stay within, in % around nominal?',
      unit: '%', answer: 10, tol: 0.1,
      why: '±10 %. That band is shared by every customer on the feeder — your injection consumes part of it, and the DSO cannot give you more than the band allows.' },

    { id: 'm10-d12', q: 'Which earth-fault treatment uses a coil to compensate the capacitive current?',
      type: 'text', accept: ['resonant earthing', 'petersen coil', 'erdschlusskompensation', 'compensated', 'resonant grounding'],
      why: 'Resonant earthing with a Petersen coil. It limits the earth-fault current so a single fault does not trip the feeder — common in German MV networks.' }
  ];


  function drawFeeder(host) {
    var W = 860, H = 340, padL = 70, padR = 30, padT = 30, padB = 54;
    var iw = W - padL - padR, ih = H - padT - padB;
    var kmMax = 10, vMin = 96, vMax = 104;
    var x = function (km) { return padL + (km / kmMax) * iw; };
    var y = function (v) { return padT + ih - ((v - vMin) / (vMax - vMin)) * ih; };

    /* load-only: voltage falls along the feeder; with 5 MW at the end: rises */
    var loadOnly = [], withGen = [];
    for (var k = 0; k <= kmMax; k++) {
      loadOnly.push(100 - 0.2 * k);
      withGen.push(100 + 0.25 * k);
    }

    var p = [];
    p.push('<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart" role="img" aria-label="Voltage profile along a feeder with and without injection">');

    [96, 98, 100, 102, 104].forEach(function (v) {
      p.push('<line x1="' + padL + '" y1="' + y(v) + '" x2="' + (W - padR) + '" y2="' + y(v) + '" class="chart-grid"/>');
      p.push('<text x="' + (padL - 8) + '" y="' + (y(v) + 4) + '" class="chart-axis" text-anchor="end">' + v + '%</text>');
    });
    [0, 2, 4, 6, 8, 10].forEach(function (k) {
      p.push('<text x="' + x(k) + '" y="' + (H - 30) + '" class="chart-axis" text-anchor="middle">' + k + ' km</text>');
    });
    p.push('<text x="' + (W - padR) + '" y="' + (H - 10) + '" class="chart-axis" text-anchor="end">distance from substation</text>');

    p.push('<line x1="' + padL + '" y1="' + y(102) + '" x2="' + (W - padR) + '" y2="' + y(102) + '" class="chart-threshold"/>');
    p.push('<text x="' + (padL + 4) + '" y="' + (y(102) + 16) + '" class="chart-axis">+2 % allowance</text>');

    function line(arr, cls) {
      return '<polyline points="' + arr.map(function (v, i) { return x(i) + ',' + y(v); }).join(' ') + '" class="' + cls + '"/>';
    }

    p.push(line(loadOnly, 'strat-a'));
    p.push(line(withGen, 'strat-c'));
    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>Same feeder, two directions of power</h2>' +
        '<p class="muted">Voltage falls along a loaded feeder. Add injection at the far end and the profile lifts — and it is the far end that breaches the limit first.</p>' +
        '<div class="legend"><span><i class="sw-a"></i>load only</span><span><i class="sw-c"></i>with 5 MW injection</span><span><i class="sw-contract"></i>+2 % allowance</span></div>' +
        '<div class="chart-wrap">' + p.join('') + '</div>' +
        '<p class="muted">The constraint is not at your terminals. It is at the node furthest along the feeder, which is why a plant can pass its own voltage check and still be refused.</p>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'm10',
    number: '10',
    title: 'Distribution',
    lead: 'The network most storage connects to, and the voltage argument that decides whether it may.',
    sections: [
      {
        h: 'Who owns what',
        p: [
          `German distribution runs from the 110 kV regional network down to 10/20/30 kV medium voltage and 400 V low voltage. The DSO owns the network; you own everything behind the meter. The boundary is a document, not a fence, and it decides who pays for every fault on either side of it.`,
          `Most storage — C&I certainly, and a large share of utility-scale — connects at medium voltage. The rules are 4110 and the local truth is the DSO's TAB, which is why two identical plants in neighbouring areas can face different requirements.`,
          `The distribution network was designed for consumption flowing one way, from substation to customer. That single historical fact explains most connection refusals, because your plant asks the network to work in the direction it was never planned for.`
        ],
        formula: '110 kV regional → 20 kV MV → 400 V LV',
        example: {
          title: 'Worked example — why the direction matters',
          steps: [`A 5 MW factory on a 20 kV feeder is unremarkable: the DSO modelled it as load and the feeder voltage profile expects it.`, `A 5 MW battery at the same point injects instead, raising the voltage at every node between it and the substation.`, `The network did not change; the direction did.`],
          result: `The DSO studies your connection against the feeder as it will be, not as it was when the load was connected.`
        },
        mistake: `Assuming the plant's size is the only thing the DSO cares about. What it cares about is the effect on the voltage profile and the fault level at every node on the feeder, not at your terminal alone.`,
        check: `At which voltage do most C&I storage plants connect? Answer: medium voltage, typically 20 kV.`
      },
      {
        h: 'Rings built, radials run',
        p: [
          `MV networks are built as rings so a cable fault can be restored by closing the open point and feeding from the other side. But they are run radially, with one normally open switch, because a closed ring would carry circulating current and make protection ambiguous.`,
          `The position of that open point is a planning decision: it decides which customers lose supply when a section fails, and which direction the fault current comes from at each point on the ring.`,
          `For a connecting plant this means two possible supply directions and therefore two fault levels to check, two protection settings to coordinate, and two sets of evidence in the connection study.`,
          `In practice the DSO will tell you which configuration applies at your point, but the protection study should demonstrate the settings are valid in both — that is the difference between a study and a guess.`
        ],
        formula: 'Built as a ring · operated radially · one open point',
        example: {
          title: 'Worked example — the open point moves the fault level',
          steps: [`Close the open point at one end and the source impedance to your connection point changes, so the fault level at your terminals changes with it.`, `A protection study done for one switching state can be wrong for the other — which is why the DSO studies both and why your relay settings must work in both.`],
          result: `Ask the DSO which switching states were studied; if the answer is one, ask again.`
        },
        mistake: `Treating the ring as a redundancy feature that has nothing to do with you. It is the reason your protection has to be valid in two network configurations.`,
        check: `Why is an MV ring operated with one open point? Answer: to avoid circulating current and keep protection unambiguous.`
      },
      {
        h: 'Voltage rise is the binding constraint',
        p: [
          `Injection raises voltage at the far end of a feeder: <code>ΔU = (P·R + Q·X) / U</code>. Resistance dominates on MV and LV cables, reactance on overhead lines and at higher voltages — which is why the same megawatt has a different effect depending on where it connects.`,
          `The permitted rise is a share of the ±10 % band, and that band is shared with every other customer on the feeder. It is not a property of your plant; it is a budget the network operator allocates.`,
          `The three levers are: connect further upstream where the impedance is lower, absorb reactive power to pull the voltage back down, or accept curtailment at the top of the output. Paying for a network upgrade is the fourth, and it is usually the most expensive.`
        ],
        formula: 'ΔU = (P·R + Q·X) / U   ·   5 MW, 1 Ω, 20 kV → 1.25 %',
        example: {
          title: 'Worked example — the same five megawatts',
          steps: [`Five megawatts at the end of a feeder with 1 Ω gives 250 V, or 1.25 % of 20 kV.`, `Add 2 MVar of reactive injection with X = 2 Ω and the rise becomes 2.25 % — three quarters of a 2 % allowance spent on reactive power nobody asked for.`],
          result: `Absorbing Q instead would buy headroom without giving up a kilowatt of active output.`
        },
        mistake: `Calculating the voltage rise at the plant terminals only. The constraint is the highest node on the feeder, which may be kilometres away and is not on your site.`,
        check: `5 MW at 20 kV through 1 Ω: what is the rise? Answer: 1.25 %.`
      },
      {
        h: 'Hosting capacity, and why 5 MW is not 5 MW',
        p: [
          `Hosting capacity is the injection a feeder can accept without breaching its voltage or thermal limits. It depends on where you connect, what else is on the feeder and the time of day — so it is a property of the network at that point, not a number attached to your project.`,
          `A load and an injection of the same size are not symmetrical. The load lowers voltage into a band the feeder was designed to use; the injection raises it into a band that is already partly consumed by other customers.`,
          `This is why the same 5 MW is approved at one point and refused two kilometres further out, and why the DSO's answer is a calculation rather than a policy position you can negotiate.`
        ],
        formula: 'Hosting capacity = the injection at which ΔU reaches the limit',
        example: {
          title: 'Worked example — the number the DSO computes',
          body: `With 1 Ω and a 2 % limit at 20 kV, the maximum injection is 8 MW: ΔU_max is 400 V, so P = 400 × 20,000 ÷ 1. Ask for 10 MW at that point and the answer is no — not because 10 MW is large, but because this feeder has 8 MW of headroom and someone else may already have booked part of it.`
        },
        mistake: `Assuming the hosting capacity you were quoted is reserved for you. It is a snapshot of the network, and the next connection request may consume it before your contract is signed.`,
        check: `At 1 Ω and a 2 % limit, what injection reaches the limit? Answer: 8 MW.`
      },
      {
        h: 'Protection and earth faults',
        p: [
          `Distribution protection is cheap and layered: fuses, reclosers, and at the connection a central NA protection. Grading is coarser than at transmission because the network is radial and the fault current is deliberately limited.`,
          `Earth-fault treatment matters more here than anywhere else. Isolated networks, resonant earthing with a Petersen coil, and low-impedance earthing all change what a single earth fault does — and whether the network trips at all.`,
          `A storage plant on a resonant-earthed network must not introduce an earth path that defeats the compensation. That is a design question resolved with the DSO before the transformer is ordered.`,
          `Ask the DSO three questions: how is the neutral treated, what earth-fault current flows on a single fault, and does the network trip on the first fault. The answers determine both the transformer and the protection, and none of them is written in the TAR alone — they are network-specific.`
        ],
        formula: 'Isolated · resonant (Petersen) · low-impedance — three different fault behaviours',
        example: {
          title: 'Worked example — one fault, two outcomes',
          steps: [`On a resonant-earthed 20 kV network a single earth fault may not trip anything: the coil compensates the capacitive current and the network continues.`, `On a low-impedance-earthed network the same fault produces a large current and trips immediately.`, `Identical plant, identical fault, completely different protection behaviour.`],
          result: `Confirm the earthing philosophy before specifying the transformer's neutral arrangement, because the two decisions are the same decision.`
        },
        mistake: `Specifying earth-fault protection by copying a previous project. The earthing philosophy of the network decides what protection is even possible.`,
        check: `Which earthing method uses a coil to compensate capacitive current? Answer: resonant earthing (Petersen coil).`
      },
      {
        h: 'The DSO sees you through three systems',
        p: [
          `Beyond protection, the DSO sees you through metering, through the MaStR register, and through §14a if you are a controllable consumption device. It can dim you, and on a cold winter evening it will.`,
          `That is a commercial arrangement as much as a technical one: reduced grid fees in exchange for controllability. Model it before assuming the plant runs when it wants to, because the difference between 8,000 and 7,400 operating hours is most of a business case.`,
          `The relationship is long — twenty years of operation — and the engineers who commissioned your plant will still be there when you need a variation. Cooperating during commissioning is cheaper than negotiating afterwards.`,
          `A practical habit: keep one page of contacts and agreements from commissioning, because the engineer who signs your variation in year eight is often the one who watched your functional test in year one.`
        ],
        formula: '§14a: controllability in exchange for reduced grid fees',
        example: {
          title: 'Worked example — what an hour of dimming costs',
          steps: [`A 100 MW plant earning €100/kW/yr needs those hours to exist.`, `If §14a removes 400 hours a year at the top of the price curve, the lost arbitrage can be a six-figure sum — against a grid-fee saving that is usually five figures.`, `The comparison is the whole negotiation.`],
          result: `Put the avoided grid fee and the lost revenue in the same spreadsheet, at the same discount rate, or the comparison is theatre.`
        },
        mistake: `Treating grid-fee reduction as free money. It is paid for with controllability, and controllability is exactly what a merchant revenue model assumes you keep.`,
        check: `What does §14a let the DSO do? Answer: dim controllable consumption devices.`
      }
    ],
    renderExtra: drawFeeder,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
