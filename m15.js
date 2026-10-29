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
    title: 'Operations and maintenance',
    lead: 'The plant is built; now it has to earn. Monitoring, triage, dispatch, maintenance and the contracts around them.',
    sections: [
      {
        h: 'What operations actually is',
        p: [
          `Operations is four jobs running at different timescales: watching the data, triaging alarms, deciding how to dispatch, and reporting what happened. None of them is glamorous, and together they decide whether a plant earns its model.`,
          `The data arrives continuously and mostly says nothing. The skill is knowing which deviation matters: a rising cell temperature on one rack, a slowly drifting state-of-charge estimate, a recurring communication fault on one BMS. Each is cheap to fix early and expensive to explain later.`,
          `The dispatch decision is the commercial one. Which market, when to charge, when to hold reserve — taken hour by hour, informed by price forecasts and by the plant's own limitations. Two operators with identical hardware earn different amounts because of this, not because of the equipment, and because one of them treats the dispatch algorithm as part of the asset.`
        ],
        formula: 'Monitor · triage · dispatch · report',
        example: {
          title: 'Worked example — the same plant, two operators',
          steps: [
            `Plant A follows a fixed charge/discharge schedule set at COD.`,
            `Plant B re-optimises daily against forecast prices and reserve commitments.`,
            `Over a year, B captures perhaps 10–20 % more spread on the same hardware.`,
            `Same asset, same market, different operating discipline — that is the whole difference.`
          ],
          result: `The dispatch algorithm is the highest-return upgrade most plants never buy. The gap is invisible in the datasheet and obvious in the monthly revenue report.`
        },
        mistake: `Treating operations as "keep it running". Availability is the floor; the revenue comes from how the available hours are used.`,
        check: `What are the four operational jobs? Answer: monitor, triage, dispatch, report.`
      },
      {
        h: 'Reading the data',
        p: [
          `Cells are polled every couple of seconds; a large plant generates over a gigabyte an hour. Full-fidelity data is kept briefly and compressed afterwards, so the detailed record of an event exists only if someone captures it while it is still there.`,
          `The useful metrics are few: round-trip efficiency, capacity trend, availability, auxiliary consumption, cell temperature spread, and the count of alarms by type. Each is a trend, not a value — the number matters less than its direction over twelve months.`,
          `Compare against the previous year, not against the datasheet. The datasheet describes a factory condition the plant left on day one; last year describes what this plant, on this site, is actually capable of.`
        ],
        formula: 'RTE · capacity · availability · auxiliary · temperature spread · alarm count',
        example: {
          title: 'Worked example — the metric that moved first',
          steps: [
            `RTE falls 0.2 points a year instead of 0.1 — invisible in any single month.`,
            `Auxiliary consumption rises in the same period by 4 %.`,
            `The combination points at cooling: the HVAC is working harder to hold the same temperature.`,
            `A filter service and a condenser clean restore both — for the price of a technician-day.`
          ],
          result: `Efficiency drift is usually a cooling story before it is a cell story. Plot auxiliary consumption against average ambient temperature; when the curves separate, the cooling has a problem.`
        },
        mistake: `Watching only alarm counts. A plant with no alarms and a slowly rising auxiliary load is failing quietly, and that is the more expensive failure.`,
        check: `What do you compare performance against? Answer: the previous twelve months, not the datasheet.`
      },
      {
        h: 'Alarm triage and response',
        p: [
          `Alarms arrive in tiers. A communication loss on one rack is a ticket; a cell over-temperature is a call-out; smoke detection is an emergency response. The plant's own design should have defined these tiers, and the operating contract should have matched response times to them.`,
          `The dangerous tier is the one in between: a fault that is not urgent enough to stop the plant but not trivial enough to ignore. Insulation monitoring warnings on the DC side belong here — the first fault is a warning, and the window to act closes when the second appears.`,
          `Response times are contractual. The LTSA will specify hours for a critical event and days for a minor one, and the difference between those numbers is worth more than the contract price.`
        ],
        formula: 'Alarm tier → response time → who attends → what closes it',
        example: {
          title: 'Worked example — the insulation warning',
          steps: [
            `The DC insulation monitoring device reports 40 kΩ — below the alarm threshold, above a trip.`,
            `On an unearthed system this is the first fault: the plant can continue.`,
            `A second fault would create a path through the rack.`,
            `The right response is a scheduled inspection within days, not a shutdown and not a shrug.`
          ],
          result: `The first insulation fault is a deadline, not a notification. Write the threshold, the response and the owner into the operating procedure before energisation, not after the first alarm.`
        },
        mistake: `Setting response times by what the site can achieve rather than what the risk requires. The second fault does not read the contract.`,
        check: `What does the first DC insulation fault mean? Answer: it is a warning — act before a second fault appears.`
      },
      {
        h: 'Preventive maintenance: what is actually done',
        p: [
          `The list is mundane and largely about heat, dust and connections: HVAC filters and refrigerant circuits, condenser cleaning, fan inspection, torque checks on power connections, thermal imaging of terminals, firmware and control-system updates, and the annual calibration of instruments the contract depends on.`,
          `Thermal imaging earns its place. A loose connection shows as a hot spot long before it fails, and a thermal survey of every enclosure once a year finds the ones that will fail in the next twelve months. It is the highest-value hour in the maintenance calendar.`,
          `The calendar matters as much as the list. Do the work in the low-revenue season, batch tasks that need the same outage, and never schedule a major service in the week the plant is most valuable.`
        ],
        formula: 'Thermal survey · torque check · filters · coolant · firmware · calibration',
        example: {
          title: 'Worked example — the campaign that paid for itself',
          steps: [
            `An annual thermal survey finds three terminals running 15 K above their neighbours.`,
            `Each is a loose lug: ten minutes to torque.`,
            `Left alone, one of them becomes an arc fault — enclosure damage, fire risk, weeks offline.`,
            `The survey costs a day; the avoided event costs six figures.`
          ],
          result: `Preventive maintenance is mostly looking at the right things at the right time. Do the survey on a warm day under load; a thermal image at 10 % load shows nothing.`
        },
        mistake: `Scheduling maintenance by calendar convenience rather than by revenue season. A summer outage on a plant earning its money in summer costs more than the maintenance saves.`,
        check: `Which single task finds the most future failures? Answer: the annual thermal survey.`
      },
      {
        h: 'Corrective maintenance and spares',
        p: [
          `Something will fail: a module, a sensor, a contactor, a fan, an inverter. The question is how long the plant is down, and that is decided years earlier by the spares strategy and the LTSA's response commitments.`,
          `A spare module on site is worth more than a discount on the purchase price. Lead times for cells and modules run to months, and a plant waiting for one rack is a plant earning nothing while the obligation to be available continues.`,
          `The same logic applies to firmware and configuration: keep an archive of the commissioned versions. A controller replaced in year five with new firmware can behave differently from the one that passed the witness test, and proving it is your problem, and the archived version is the only thing that settles it.`
        ],
        formula: 'Downtime = diagnosis + parts lead time + labour + re-commissioning',
        example: {
          title: 'Worked example — the £40 part and the six-week outage',
          steps: [
            `A contactor fails in a single rack.`,
            `The part is not stocked; the supplier quotes six weeks.`,
            `The rack is isolated, so the plant loses 1/40th of its capacity — and some contracts measure availability per unit.`,
            `A stocked spare would have restored it in an afternoon, on a plant whose availability obligation never paused.`
          ],
          result: `Spares are an insurance premium with a known return. List the ten components most likely to fail, and stock the three with the longest lead times.`
        },
        mistake: `Buying spares by price rather than by lead time. The expensive part is the wait, not the component.`,
        check: `What decides downtime after a failure? Answer: parts lead time, plus diagnosis and re-commissioning.`
      },
      {
        h: 'The LTSA, and who pays for what',
        p: [
          `The long-term service agreement defines what the integrator maintains, how fast they respond, what counts as a defect, and what voids the warranty. It is the operating document, and its response-time table matters more day to day than its price.`,
          `Read the exclusions first. Work outside the LTSA falls to the owner, including balance-of-plant, the transformer, the connection, and often anything caused by grid events. Those are the failures that surprise owners, because they are not battery failures.`,
          `The commercial consequence is a second budget: the LTSA covers the battery system, and the plant around it needs its own maintenance plan, its own spares and its own contractor list. Owners who discover this in year four discover it expensively.`,
          `Boundaries matter for the same reason they matter in guarantees: capacity and efficiency are measured at the terminals, availability is measured by the clock, and the LTSA says which party owns which number.`,
          `A useful test in negotiation: ask what happens on a transformer failure, and see whether the answer comes from the LTSA or from silence.`
        ],
        formula: 'Scope · response times · exclusions · measurement boundary',
        example: {
          title: 'Worked example — the transformer that was nobody\'s',
          steps: [
            `An oil leak develops on the site transformer in year four.`,
            `The LTSA covers battery, PCS and controls.`,
            `The transformer is balance-of-plant: owner\'s cost.`,
            `A replacement is eight months on lead time, and the plant is unavailable throughout.`
          ],
          result: `The most expensive asset outside the LTSA is the one nobody planned for, because it sat outside every scope.`
        },
        mistake: `Assuming the LTSA covers the plant. It covers the battery system; the plant includes things the contract never mentions.`,
        check: `Which document defines maintenance scope and response times? Answer: the LTSA.`
      },
      {
        h: 'Two numbers, two fates, and the end',
        p: [
          `Capacity degrades and can be restored by augmentation; RTE degrades and cannot — it is cell internal resistance, and adding batteries does not fix it. That asymmetry shapes the operating regime as well as the contract: you can plan a capacity recovery, but you can only budget for an efficiency shortfall.`,
          `Availability is the third number, and the definition is worth more than the value. A 98 % guarantee over 8,760 hours allows 175 hours down, which one inverter replacement and one grid outage can consume.`,
          `At end of life the plant is re-powered, decommissioned or sold. Re-powering is increasingly attractive because the grid connection is the scarce asset — which means the final augmentation decision should be taken with the re-powering date in view, not in isolation, and usually decided before the final augmentation contract is signed.`,
          `Treat the three numbers separately in the operating budget: one is a capital plan, one is a revenue forecast, and one is a contract negotiation.`
        ],
        formula: 'Capacity: recoverable · RTE: budgeted · Availability: defined',
        example: {
          title: 'Worked example — the last augmentation',
          steps: [
            `A plant is due to augment in year 18 and re-power in year 20.`,
            `The augmentation buys two years of contractual compliance.`,
            `The re-power replaces the cells anyway.`,
            `The cheapest compliant path is a smaller top-up, negotiated with the offtaker, not a full block.`
          ],
          result: `The last augmentation should be decided by the re-powering date, not by the degradation model. The cheapest compliant path is usually a negotiated top-up, not a full block. Decide it with the re-powering date on the same page as the degradation curve.`
        },
        mistake: `Running the augmentation schedule to year 20 without asking whether the plant will be re-powered at 18.`,
        check: `Which of the three numbers cannot be recovered? Answer: RTE.`
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
