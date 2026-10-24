/* Module 16 — capstone design review. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var CHECKS = [
    { id: 'c1', label: 'Sizing reconciles from the POI back to the DC terminals, including losses and degradation' },
    { id: 'c2', label: 'The single-line diagram matches the equipment actually specified, item by item' },
    { id: 'c3', label: 'Protection is graded at both maximum and minimum fault level' },
    { id: 'c4', label: 'Earthing is justified by an EPR calculation against a stated touch-voltage limit' },
    { id: 'c5', label: 'Cable sizing includes derating, voltage drop and short-circuit withstand' },
    { id: 'c6', label: 'Switchgear and board ratings exceed the calculated fault level' },
    { id: 'c7', label: 'Grid-code compliance is a matrix of clause, design answer and evidence document' },
    { id: 'c8', label: 'Guarantees agree across BESA, LTSA and the offtake — same metric, same boundary' },
    { id: 'c9', label: 'Safety concept covers spacing, venting, access and emergency response, signed by the AHJ' },
    { id: 'c10', label: 'The revenue model does not sell the same megawatt twice' }
  ];

  function renderScorecard(host) {
    var html = '<div class="card">' +
      '<h2>Ten-point review scorecard</h2>' +
      '<p class="muted">A design pack that fails any one of these is not ready to be signed. Tick what you can evidence, not what you believe.</p>' +
      '<div class="checklist">';

    CHECKS.forEach(function (c) {
      html += '<label class="check-item"><input type="checkbox" data-check="' + c.id + '" /> <span>' + c.label + '</span></label>';
    });

    html += '</div><div id="score-out" class="results"></div><div id="score-note" class="gc-note"></div></div>';
    host.innerHTML = html;

    var out = host.querySelector('#score-out');
    var note = host.querySelector('#score-note');

    function update() {
      var boxes = host.querySelectorAll('input[type=checkbox]');
      var done = 0;
      boxes.forEach(function (b) { if (b.checked) done++; });
      var gaps = Array.prototype.filter.call(boxes, function (b) { return !b.checked; }).length;

      out.innerHTML =
        '<div class="row"><span>Checks evidenced</span><strong>' + done + ' / ' + boxes.length + '</strong></div>' +
        '<div class="row"><span>Open gaps</span><strong class="' + (gaps ? 'bad-num' : '') + '">' + gaps + '</strong></div>' +
        '<div class="row"><span>Verdict</span><strong>' +
          (done === boxes.length ? 'ready to sign' : done >= 7 ? 'close — close the gaps first' : 'not ready') +
        '</strong></div>';

      note.textContent = done === boxes.length
        ? 'Every claim is backed by a document. That is what makes a review defensible when a lender or an insurer asks.'
        : 'An unevidenced claim is the finding. "We designed for it" without a calculation is not an answer in a review.';
    }

    host.querySelectorAll('input[type=checkbox]').forEach(function (b) {
      b.addEventListener('change', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm16-d1', q: 'The pack says "4-hour battery, therefore 0.5C". What is wrong?',
      type: 'text', accept: ['a 4 hour battery is 0.25c', '0.25c', 'the c rate is wrong', '4 hour means 0.25c'],
      why: 'A 4-hour battery is 0.25C. 0.5C is a 2-hour battery. This single confusion propagates into PCS sizing and warranty limits.' },

    { id: 'm16-d2', q: 'DC energy is quoted as equal to POI energy. What did the designer forget?',
      type: 'text', accept: ['losses', 'the losses', 'efficiency losses', 'round trip losses'],
      why: 'Losses. DC energy must be larger than POI energy — 400 MWh at the POI needs 434.8 MWh at the terminals with 8 % losses.' },

    { id: 'm16-d3', q: 'Billing is stated to come from BMS current. What is the finding?',
      type: 'text', accept: ['not revenue grade', 'bms is not revenue grade', 'must be at the poi with a certified meter', 'needs a revenue meter'],
      why: 'The BMS is not a revenue-grade instrument and is not at the contractual point. Metering must be certified and at the POI.' },

    { id: 'm16-d4', q: 'The warranty passes at year 10, so the pack claims the offtake obligation is met. What is wrong?',
      type: 'text', accept: ['measured at different points', 'warranty is at dc offtake at poi', 'different boundaries', 'the boundaries differ'],
      why: 'The warranty is measured at the DC terminals, the offtake at the POI. A plant can pass one and fail the other through losses alone.' },

    { id: 'm16-d5', q: 'Cables are sized on ampacity only. What is missing?',
      type: 'text', accept: ['voltage drop and short circuit', 'voltage drop', 'short circuit withstand', 'drop and fault withstand'],
      why: 'Voltage drop and adiabatic short-circuit withstand. A cable can pass thermal and still fail both of the others — often the fault is what sizes it.' },

    { id: 'm16-d6', q: 'Earthing is justified as "1 Ω, which is good". What is missing?',
      type: 'text', accept: ['the fault current and touch voltage', 'epr calculation', 'comparison with permissible touch voltage', 'the epr against the limit'],
      why: 'The comparison. There is no universal target in ohms: EPR = I_f × R_E must be below the permissible touch voltage for the clearing time.' },

    { id: 'm16-d7', q: 'The upstream relay is set faster than the downstream one. What happens?',
      type: 'text', accept: ['the whole feeder trips', 'loss of selectivity', 'it trips first', 'the upstream clears first'],
      why: 'Loss of selectivity: a fault on one bay trips the upstream device and takes the whole feeder or busbar out.' },

    { id: 'm16-d8', q: 'The plant connects at 110 kV and the pack cites VDE-AR-N 4110. What is wrong?',
      type: 'text', accept: ['4120 applies at 110 kv', 'it should be 4120', 'wrong standard'],
      why: '4120 governs high voltage. 4110 is medium voltage — citing the wrong TAR in a submission is a fast way to lose credibility with the DSO.' },

    { id: 'm16-d9', q: 'The LV board was ordered before the transformer was upsized. What is the risk?',
      type: 'text', accept: ['fault rating may be exceeded', 'the board may be underrated', 'short circuit rating too low', 'fault level exceeds board rating'],
      why: 'The board may be rated below the new fault level. Transformer impedance sets LV fault current, so changing the transformer invalidates every device rating behind it.' },

    { id: 'm16-d10', q: 'The revenue model adds 100 % FCR and full arbitrage simultaneously. What is wrong?',
      type: 'text', accept: ['same megawatt twice', 'double counting', 'the same mw cannot do both', 'you cannot sell the same capacity twice'],
      why: 'The same megawatt cannot be in reserve and cycling at the same moment. Stacking is sequential, never simultaneous — this is the commonest storage business-case error.' },

    { id: 'm16-d11', q: 'Containers are spaced at 1 m because the supplier recommended it. What is the finding?',
      type: 'text', accept: ['spacing is set by the ahj and code', 'not by the supplier', 'the fire authority decides', 'code and ahj determine spacing'],
      why: 'Spacing is set by the fire code and the AHJ, not by the manufacturer. A supplier recommendation is not a permission.' },

    { id: 'm16-d12', q: 'What is the single most useful question to ask in a design review?',
      type: 'text', accept: ['show me the calculation', 'where is the evidence', 'what is this based on', 'show me the number'],
      why: 'Show me the calculation. A review is not a conversation about intentions; it is an audit of evidence. Ask it once per claim and the pack either survives or falls apart.' }
  ];

  window.MODULES.push({
    id: 'm16',
    number: '16',
    title: 'Capstone design review',
    lead: 'Everything at once, on one plant, with the errors a real pack contains.',
    sections: [
      {
        h: 'A review is a hunt, not a presentation',
        p: [
          'The developer presents; you look for what is missing. The two activities are different, and the second is the one you are paid for. A review that ends with "looks good" has usually failed.',
          'The pack will be long, confident and mostly right. Your job is the small number of places where confidence outruns evidence — a number without a calculation, a diagram that disagrees with the schedule, a guarantee measured somewhere other than the contract.',
          'You do not need to check everything. You need to check the things that, if wrong, invalidate the rest: sizing boundary, fault level, protection grading, guarantee boundary.'
        ],
        formula: 'Look for missing evidence, not for mistakes in arithmetic'
      },
      {
        h: 'The ten checks that matter',
        p: [
          'Sizing from POI back to DC. The SLD against the equipment schedule. Protection graded at maximum and minimum fault. Earthing justified by EPR against a stated limit.',
          'Cable derating, drop and fault withstand. Switchgear ratings against calculated fault level. A grid-code matrix of clause, answer and evidence. Guarantees consistent across BESA, LTSA and offtake. Safety signed by the AHJ. A revenue model that does not double-count.',
          'Ten items, and any single failure means the pack is not signable — not "needs minor work", not "subject to clarification". Not signable.'
        ],
        formula: 'Ten checks · one failure blocks the signature'
      },
      {
        h: 'Reading a pack in ninety minutes',
        p: [
          'Start with the single-line diagram and the equipment schedule side by side. Disagreements between a drawing and a list are the cheapest findings and they predict the expensive ones.',
          'Then the sizing sheet: follow one number — the contracted POI energy — all the way back to cells. If it cannot be traced, nothing downstream can be trusted.',
          'Then the guarantees. Find the boundary on which each metric is measured and check it matches the contract. Most commercial surprises live in this step.'
        ],
        formula: 'SLD ↔ schedule · trace one number · check every boundary'
      },
      {
        h: 'Red flags that predict trouble',
        p: [
          'Efficiency quoted to two decimal places but no loss budget. A fault level with no impedance basis. Availability defined in a footnote. "To be confirmed by supplier" for anything that affects protection.',
          'Any number that cannot be reproduced from the documents is a finding, even if it happens to be right. The point of a review is that the next person can check it.',
          'And the quiet one: a design that is technically fine but assumes an interface someone else will provide, with nothing in writing from that someone.'
        ],
        formula: 'Precision without basis · interfaces without owners'
      },
      {
        h: 'Findings that change something',
        p: [
          'A finding states what is missing, why it matters, what evidence would close it, and who owns it. "Insufficient detail on protection" is not a finding; it is a complaint.',
          'Rank by consequence, not by ease. A missing calculation that invalidates the switchgear rating outranks ten typos, even though the typos take five minutes to list.',
          'Close the loop: a review is finished when each finding is either evidenced or accepted as a risk by someone with the authority to accept it. Everything else is an open item, and open items are what delay financial close.'
        ],
        formula: 'Gap → why it matters → evidence that closes it → owner'
      }
    ],
    renderExtra: renderScorecard,
    drills: DRILLS
  });
})();
