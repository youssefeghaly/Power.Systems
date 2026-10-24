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

  window.MODULES.push({
    id: 'm10',
    number: '10',
    title: 'Distribution',
    lead: 'The network most storage connects to, and the voltage argument that decides whether it may.',
    sections: [
      {
        h: 'Who owns what',
        p: [
          'German distribution runs from the 110 kV regional network down to 10/20/30 kV medium voltage and 400 V low voltage. The DSO owns the network; you own everything behind the meter.',
          'Most storage — C&I certainly, and a good share of utility-scale — connects at medium voltage. The rules are 4110, and the local truth is the DSO\'s TAB.',
          'The distribution network was designed for consumption flowing one way, from substation to customer. That single fact explains most connection refusals.'
        ],
        formula: '110 kV regional → 20 kV MV → 400 V LV'
      },
      {
        h: 'Rings built, radials run',
        p: [
          'MV networks are built as rings so that a cable fault can be restored by closing the open point and feeding from the other side. But they are operated radially, with one normally open switch, because a ring would carry circulating current and make protection ambiguous.',
          'That open point is also a planning tool: where it sits decides which customers lose supply when a section fails.',
          'For a connecting plant, the ring means two possible directions of supply — and therefore two sets of fault levels and protection settings to check.'
        ],
        formula: 'Built as a ring · operated radially · one open point'
      },
      {
        h: 'Voltage rise is the binding constraint',
        p: [
          'Injection raises voltage at the far end of a feeder: <code>ΔU = (P·R + Q·X) / U</code>. Resistance dominates on MV and LV cables, reactance on overhead lines and at higher voltages.',
          'The permitted rise is a share of the ±10 % band, and it is shared with everyone else on the feeder. That is why hosting capacity is a network question, not a plant question.',
          'The three levers: connect further upstream, absorb reactive power, or accept curtailment at the top of the output. A fourth — paying for a network upgrade — is the expensive one.'
        ],
        formula: 'ΔU = (P·R + Q·X) / U   ·   5 MW, 1 Ω, 20 kV → 1.25 %'
      },
      {
        h: 'Hosting capacity, and why 5 MW is not 5 MW',
        p: [
          'Hosting capacity is the injection a feeder can accept without breaching its voltage or thermal limits. It depends on where you connect, what else is on the feeder, and the time of day.',
          'A load and an injection of the same size are not symmetrical: the load lowers voltage and the feeder was designed for it; the injection raises voltage into a band that is already partly used.',
          'This is why the same 5 MW gets approved at one point and refused 2 km further out — and why the DSO\'s answer is a calculation, not a policy.'
        ],
        formula: 'Hosting capacity = the injection at which ΔU reaches the limit'
      },
      {
        h: 'Protection and earth faults',
        p: [
          'Distribution protection is cheap and layered: fuses, reclosers, and at the connection a central NA protection. Grading is coarser than at transmission because the network is radial and the fault current is limited.',
          'Earth-fault treatment matters more here than anywhere: isolated networks, resonant earthing with a Petersen coil, or low-impedance earthing all change what a single earth fault does — and whether the network trips at all.',
          'A storage plant on a resonant-earthed network must not add an earth-fault path that defeats the compensation.'
        ],
        formula: 'Isolated · resonant (Petersen) · low-impedance — three different fault behaviours'
      },
      {
        h: 'The DSO\'s view of you',
        p: [
          'Beyond protection, the DSO sees you through metering, the MaStR register, and §14a if you are a controllable consumption device. It can dim you, and it will, on a winter evening.',
          'That is a commercial arrangement as much as a technical one: reduced grid fees in exchange for controllability. Model it before you assume your plant runs when it wants to.',
          'The relationship is long — twenty years of operation — and the DSO\'s engineers remember who cooperated during commissioning.'
        ],
        formula: '§14a: controllability in exchange for reduced grid fees'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
