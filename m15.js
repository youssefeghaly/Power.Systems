/* Module 15 — testing, commissioning and O&M. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Capacity test</h2>' +
      '<p class="muted">Charge, measure, discharge, measure. Two numbers come out: energy capacity and round-trip efficiency — and both decide money.</p>' +
      '<div class="grid">' +
        '<label><span>Rated (BOL) energy</span><input id="ts-bol" type="text" inputmode="decimal" value="400" /><span class="hint">MWh</span></label>' +
        '<label><span>Energy drawn from grid</span><input id="ts-in" type="text" inputmode="decimal" value="454.5" /><span class="hint">MWh</span></label>' +
        '<label><span>Energy delivered to grid</span><input id="ts-out" type="text" inputmode="decimal" value="400" /><span class="hint">MWh</span></label>' +
      '</div>' +
      '<div id="ts-out" class="results"></div>' +
      '<div id="ts-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var bol = n('ts-bol'), ein = n('ts-in'), eout = n('ts-out');
      var out = $('ts-out'), note = $('ts-note');

      if (!(bol > 0) || !(ein > 0) || !(eout > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>energy values</strong></div>';
        note.textContent = '';
        return;
      }

      var rte = (eout / ein) * 100;
      var soh = (eout / bol) * 100;

      out.innerHTML =
        '<div class="row"><span>Round-trip efficiency</span><strong>' + rte.toFixed(1) + ' %</strong></div>' +
        '<div class="row"><span>State of health (vs BOL)</span><strong>' + soh.toFixed(1) + ' %</strong></div>' +
        '<div class="row"><span>Losses this cycle</span><strong>' + (ein - eout).toFixed(1) + ' MWh</strong></div>' +
        '<div class="row"><span>Warranty verdict at 80 %</span><strong class="' + (soh < 80 ? 'bad-num' : '') + '">' +
          (soh < 80 ? 'below guarantee' : 'within guarantee') + '</strong></div>';

      note.textContent = soh < 80
        ? 'Below the usual guarantee floor. Check where it is measured — DC terminals or POI — before filing anything.'
        : 'Within the guarantee. Note that RTE declines much more slowly than capacity, and cannot be recovered by adding batteries.';
    }

    ['ts-bol', 'ts-in', 'ts-out'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm15-d1', q: 'A test draws 454.5 MWh and returns 400 MWh. Round-trip efficiency, in %?',
      unit: '%', answer: 88, tol: 0.3,
      why: '400 / 454.5 = 88 %. Measured at the same boundary for both directions, or the number means nothing.' },

    { id: 'm15-d2', q: 'That 400 MWh discharge on a 400 MWh rated plant is what state of health, in %?',
      unit: '%', answer: 100, tol: 0.1,
      why: '100 % — it is still at beginning-of-life capacity. SOH compares measured capacity to the BOL rating, not to last year\'s test.' },

    { id: 'm15-d3', q: 'A 400 MWh plant returns 340 MWh. What is its SOH, in %?',
      unit: '%', answer: 85, tol: 0.2,
      why: '85 %. Above an 80 % guarantee, so no claim — but if the guarantee is 85 % at year 10, you are exactly on the line.' },

    { id: 'm15-d4', q: 'How is availability usually calculated?',
      type: 'text', accept: ['available hours divided by total hours', 'available time over total time', 'uptime over period', 'hours available divided by 8760'],
      why: 'Available time / total time over the settlement period. The definition of "available" — and who decides — is where the argument lives.' },

    { id: 'm15-d5', q: 'A plant is unavailable for 175 hours in a year. Availability, in %?',
      unit: '%', answer: 98, tol: 0.05,
      why: '1 - 175/8760 = 98 %. That is exactly the typical guarantee value, so a single bad month can breach the year.' },

    { id: 'm15-d6', q: 'What does the capacity test procedure start with?',
      type: 'text', accept: ['discharge to zero', 'start at 0 percent soc', 'empty the battery', 'full discharge to 0'],
      why: 'Start at 0 % state of charge, charge fully, rest, discharge fully. Without a defined start the result is not comparable to the commissioning test.' },

    { id: 'm15-d7', q: 'Why is RTE deficiency harder to remedy than capacity deficiency?',
      type: 'text', accept: ['it is internal resistance', 'you cannot add batteries to fix it', 'it comes from cell resistance', 'internal resistance cannot be augmented away'],
      why: 'RTE is dominated by cell internal resistance. Adding capacity does not improve it, so failing RTE usually ends in liquidated damages rather than a repair.' },

    { id: 'm15-d8', q: 'What does a workmanship warranty typically cover, and for how long?',
      type: 'text', accept: ['defects one to three years', 'defects for 1 to 3 years', 'manufacturing defects', 'defects in the first years'],
      why: 'Defects in product and workmanship, usually 1-3 years from COD — the teething period of the bathtub curve. Performance guarantees are separate and longer.' },

    { id: 'm15-d9', q: 'Which document sets the guaranteed capacity and RTE over the plant life?',
      type: 'text', accept: ['ltsa', 'long term service agreement', 'performance guarantee', 'the ltsa'],
      why: 'The LTSA — long-term service agreement — carries the performance guarantees. The BESA covers supply; the LTSA covers the twenty years after.' },

    { id: 'm15-d10', q: 'A 40 MW / 160 MWh plant is built with 190 MWh at COD. Overbuild, in %?',
      unit: '%', answer: 18.75, tol: 0.3,
      why: '190 / 160 - 1 = 18.75 %. Deliberate overbuild so degradation never breaches the contracted 160 MWh.' },

    { id: 'm15-d11', q: 'Why discharge fully to 0 % in a capacity test rather than stopping at the contract value?',
      type: 'text', accept: ['to measure the real capacity', 'otherwise the true capacity is unknown', 'to know the actual value', 'to measure full capability'],
      why: 'Stop at the contractual minimum and you learn only that you are above it — not by how much. The full discharge gives the real number and hence the real degradation rate.' },

    { id: 'm15-d12', q: 'What are liquidated damages?',
      type: 'text', accept: ['pre agreed compensation', 'agreed payment for underperformance', 'contractual penalty', 'pre-agreed damages'],
      why: 'Pre-agreed compensation for missed performance or availability. They are why guarantees are measured precisely, and why every design carries a margin.' }
  ];

  window.MODULES.push({
    id: 'm15',
    number: '15',
    title: 'Testing, commissioning and O&M',
    lead: 'The numbers you will be held to for twenty years, and how they are measured.',
    sections: [
      {
        h: 'Commissioning is a sequence, not an event',
        p: [
          `Mechanical completion, energisation, subsystem tests, integrated tests, the capacity test, commercial operation. Each gate has documents, and the DSO is present at the ones that matter. A plant does not "get commissioned" in an afternoon; it passes through a series of doors, and each door has a keeper.`,
          `The capacity test is the anchor: discharge to 0 % state of charge, charge fully, rest, then discharge at rated power. The energy out is the capacity; the ratio of energy in to energy out is the round-trip efficiency. Everything measured here becomes the baseline for twenty years of warranty argument.`,
          `The most valuable thing you can do in this phase is agree the procedure in writing before the test — including where it is measured, at what temperature, and what counts as a pass. Arguments about method after the result are always more expensive than arguments about method before it.`
        ],
        formula: 'Energise → subsystem → integrated → capacity test → COD',
        example: {
          title: 'Worked example — the test that defines the next twenty years',
          body: `A plant measured at 435 MWh at the DC terminals at commissioning has that number written into its warranty baseline. If the test had been run at the POI instead, the baseline would be 400 MWh and every later comparison would shift by the losses — a difference that never leaves the contract.`
        },
        mistake: `Running the capacity test before the thermal system is stable, then accepting a number the plant will never reproduce. A test under abnormal conditions is not a baseline, it is a data point.`,
        check: `What is the first step of a capacity test? Answer: discharge to 0 % state of charge.`
      },
      {
        h: 'Two numbers, two different fates',
        p: [
          `Capacity degrades and can be restored by augmentation. RTE degrades and cannot — it is dominated by cell internal resistance, and adding batteries does not improve it. That asymmetry governs how contracts treat the two.`,
          `A capacity shortfall triggers augmentation or damages, and augmentation is a known cost that can be planned and financed. An RTE shortfall has no engineering remedy at all: the plant either meets the number or pays liquidated damages for the rest of its life.`,
          `It is also why a sensible owner leaves a buffer between expected and guaranteed RTE at COD. The guarantee is a promise about year twenty made in year zero, and the margin you leave is the price of that promise — paid once at the factory, instead of every year for two decades.`
        ],
        formula: 'Capacity: fixable · RTE: not fixable',
        example: {
          title: 'Worked example — the guarantee you cannot fix',
          steps: [`A plant guaranteeing 86 % RTE at end of life, measuring 85.2 % at year 15, has no lever: augmenting adds capacity but not efficiency, and re-powering the cells is a capital project.`, `The damages run for the remaining five years — typically a few percent of revenue, every year, with no way to stop the clock.`],
          result: `The only real protection is to buy margin at the design stage, when a slightly larger transformer or a better-cooled container can still be specified.`
        },
        mistake: `Treating RTE and capacity as equivalent performance guarantees. One is an operating cost you can manage; the other is a defect you can only compensate for.`,
        check: `Which guarantee has no engineering remedy? Answer: RTE.`
      },
      {
        h: 'Availability, and the definition fight',
        p: [
          `Availability is available time divided by total time — but "available" is defined in the contract: at full power or partial, excluding grid-operator outages, excluding force majeure, starting from when. The definition is worth more than the number.`,
          `A 98 % guarantee over 8,760 hours allows 175 hours down. One inverter replacement and one grid-operator outage can consume that allowance before the year is half gone, and then every subsequent hour is chargeable.`,
          `Two contracts both saying 98 % can differ by a week of permitted downtime. When you review a guarantee, read the exclusions first — the headline percentage is the least informative part of the clause, and the exclusions are where the negotiation actually happened. Read them with the same attention you would give a price, because they are a price, and the headline number is only an advertisement for it.`
        ],
        formula: 'Availability = available hours / 8 760 · definition beats value',
        example: {
          title: 'Worked example — 175 hours',
          steps: [`8,760 × 2 % = 175.2 hours.`, `A single container fire, a transformer failure or a two-week grid outage exceeds it.`, `That is why serious contracts define partial availability, pro-rata capacity and outage exclusions rather than a single number.`],
          result: `Ask the broker or the offtaker how they count a partial outage; the answer changes the value of the guarantee more than the percentage does.`
        },
        mistake: `Negotiating the percentage and conceding the definition. The definition is where the money is, and it is usually settled by whoever drafted the clause.`,
        check: `A 98 % guarantee on 8,760 hours allows how many hours down? Answer: 175.2.`
      },
      {
        h: 'Operations: what actually happens day to day',
        p: [
          `Monitoring, alarm triage, monthly performance review, and the discipline of chasing small deviations before they become claims. Most of the job is data, not spanners — and the operators who add value are the ones who notice a 2 % drift in RTE before it becomes a warranty dispute.`,
          `Dispatch decisions sit with operations: which market, when to charge, when to hold reserve. That is where revenue is made or lost, and it is a commercial skill informed by engineering rather than either one alone.`,
          `Maintenance is preventive (HVAC, filters, torque checks, firmware) and corrective (failed modules, sensors, contactors). The LTSA defines who does what, how fast, and who pays — and its response-time table is more operationally important than its price.`
        ],
        formula: 'Monitor · triage · dispatch · maintain · document',
        example: {
          title: 'Worked example — the 2 % drift',
          steps: [`A plant losing 0.2 percentage points of RTE per year instead of 0.1 looks unremarkable at any single test.`, `Over five years it is 5 % of revenue, and by the time it is obvious the warranty period for the affected components may have expired.`, `Monthly review is what catches it while there is still a claim.`],
          result: `Set the monthly review to compare against the previous twelve months rather than against the datasheet, so the trend is visible before the absolute number is alarming.`
        },
        mistake: `Treating O&M as a cost line rather than a revenue function. The dispatch decisions taken by the operations team are worth more than the difference between two maintenance contracts.`,
        check: `What does the LTSA define? Answer: who maintains what, how fast, and who pays.`
      },
      {
        h: 'The end, and the second life',
        p: [
          `At end of life the plant is re-powered with new cells in the same infrastructure, decommissioned, or sold. Re-powering is increasingly attractive because the grid connection is the scarce asset — a new connection may take five years and cannot be bought at any price.`,
          `Decommissioning costs belong in the model from day one, and in Germany the recycling and transport rules apply to every tonne of cells. A plant whose end-of-life cost was never provisioned is a liability that lands on whoever owns it last.`,
          `The best operators plan the re-powering decision years ahead, because it changes the augmentation strategy in the final third of asset life: why augment capacity you are about to replace?`
        ],
        formula: 'Re-power · decommission · or sell — decide years early',
        example: {
          title: 'Worked example — the connection is the asset',
          steps: [`A 100 MW plant reaching end of life in 2045 holds a 110 kV connection that a new project might wait years for.`, `Re-powering the containers costs a fraction of a new build and keeps the connection — which is why the residual value of a BESS may sit more in its paperwork than in its cells.`],
          result: `Treat the connection agreement as an asset in the financial model, with a value and a remaining life, because that is how a buyer will treat it.`
        },
        mistake: `Planning augmentation to year 20 without asking whether the plant will be re-powered at year 18. The last augmentation is often the one that should not happen.`,
        check: `Why is re-powering often better than a new build? Answer: it reuses the grid connection, which is the scarce asset.`
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
