/* Module 14 — markets and revenue. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Revenue stack</h2>' +
      '<p class="muted">A battery earns from several markets at once — but not from the same megawatt at the same moment. Change one and watch the others move.</p>' +
      '<div class="grid">' +
        '<label><span>Power</span><input id="mk-mw" type="text" inputmode="decimal" value="100" /><span class="hint">MW</span></label>' +
        '<label><span>FCR share</span><input id="mk-fcr-share" type="text" inputmode="decimal" value="20" /><span class="hint">% of power</span></label>' +
        '<label><span>FCR price</span><input id="mk-fcr" type="text" inputmode="decimal" value="15" /><span class="hint">€/MW/h</span></label>' +
        '<label><span>aFRR share</span><input id="mk-afrr-share" type="text" inputmode="decimal" value="30" /><span class="hint">% of power</span></label>' +
        '<label><span>aFRR price</span><input id="mk-afrr" type="text" inputmode="decimal" value="8" /><span class="hint">€/MW/h</span></label>' +
        '<label><span>Arbitrage spread</span><input id="mk-spread" type="text" inputmode="decimal" value="40" /><span class="hint">€/MWh</span></label>' +
        '<label><span>Energy</span><input id="mk-mwh" type="text" inputmode="decimal" value="400" /><span class="hint">MWh</span></label>' +
        '<label><span>Cycles per day</span><input id="mk-cycles" type="text" inputmode="decimal" value="1" /><span class="hint">×</span></label>' +
      '</div>' +
      '<div id="mk-out" class="results"></div>' +
      '<div id="mk-note" class="gc-note"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>The conflict nobody escapes</h2>' +
      '<p>Reserve revenue requires the battery to sit ready. Arbitrage requires it to move. The same megawatt-hour cannot do both at 18:00 on a Tuesday.</p>' +
      '<p class="muted">Every operator runs a dispatch algorithm that decides, hour by hour, which market the battery is in — and the value of the whole asset is the sum of those decisions, not the sum of the price sheets.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var mw = n('mk-mw'), fcrShare = n('mk-fcr-share'), fcrP = n('mk-fcr');
      var afrrShare = n('mk-afrr-share'), afrrP = n('mk-afrr');
      var spread = n('mk-spread'), mwh = n('mk-mwh'), cycles = n('mk-cycles');
      var out = $('mk-out'), note = $('mk-note');

      if (!(mw > 0) || !(mwh >= 0) || !(cycles >= 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>power and energy</strong></div>';
        note.textContent = '';
        return;
      }

      var hours = 8760;
      var fcrMW = mw * fcrShare / 100;
      var afrrMW = mw * afrrShare / 100;
      var fcrRev = fcrMW * fcrP * hours;
      var afrrRev = afrrMW * afrrP * hours;
      var arbRev = mwh * spread * cycles * 365;
      var total = fcrRev + afrrRev + arbRev;
      var perKw = total / (mw * 1000);

      function fmt(x) { return Math.round(x).toLocaleString('en-GB'); }

      out.innerHTML =
        '<div class="row"><span>FCR revenue</span><strong>€ ' + fmt(fcrRev) + '</strong></div>' +
        '<div class="row"><span>aFRR revenue</span><strong>€ ' + fmt(afrrRev) + '</strong></div>' +
        '<div class="row"><span>Arbitrage revenue</span><strong>€ ' + fmt(arbRev) + '</strong></div>' +
        '<div class="row"><span>Total per year</span><strong>€ ' + fmt(total) + '</strong></div>' +
        '<div class="row"><span>Per kW per year</span><strong>€ ' + perKw.toFixed(0) + '</strong></div>';

      note.textContent = (fcrShare + afrrShare) > 100
        ? 'You have committed more than 100 % of your power to reserve. That is physically impossible and the kind of error a model hides until the first settlement.'
        : (fcrShare + afrrShare) > 60
          ? 'Most of the plant is held in reserve, so little energy is free for arbitrage — a common shape for a 2-hour battery in a high-price reserve market.'
          : 'Most of the plant is free to trade. This shape suits a 4-hour battery in a market with strong spreads.';
    }

    ['mk-mw', 'mk-fcr-share', 'mk-fcr', 'mk-afrr-share', 'mk-afrr', 'mk-spread', 'mk-mwh', 'mk-cycles'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm14-d1', q: '10 MW held in FCR at €15/MW/h for a full year. Revenue, in €?',
      unit: '€', answer: 1314000, tol: 2000,
      why: '10 × 15 × 8 760 = €1.314 M. Reserve revenue is capacity revenue: you are paid for being ready, not for delivering energy.' },

    { id: 'm14-d2', q: 'That same €1.314 M on a 10 MW plant is how much per kW per year?',
      unit: '€/kW', answer: 131.4, tol: 2,
      why: '1 314 000 ÷ 10 000 kW = €131/kW/yr. This unit — €/kW/yr — is how investors compare assets of different sizes.' },

    { id: 'm14-d3', q: 'A 400 MWh battery captures a €40/MWh spread once per day for 365 days. Arbitrage revenue?',
      unit: '€', answer: 5840000, tol: 10000,
      why: '400 × 40 × 365 = €5.84 M. Note it assumes perfect capture of the spread, every day — which no operator achieves.' },

    { id: 'm14-d4', q: 'To deliver 400 MWh at 88 % round-trip efficiency, how much energy must you buy, in MWh?',
      unit: 'MWh', answer: 454.5, tol: 2,
      why: '400 ÷ 0.88 = 454.5 MWh. The 54.5 MWh difference is the cost of cycling, and it is why arbitrage margin is spread minus losses.' },

    { id: 'm14-d5', q: 'How many hours are in a year (ignoring leap years)?',
      unit: 'h', answer: 8760, tol: 0.5,
      why: '8 760. Every capacity revenue figure is per hour of that number, and every availability calculation divides by it.' },

    { id: 'm14-d6', q: 'What is the MaStR?',
      type: 'text', accept: ['market master data register', 'marktstammdatenregister', 'the register of all plants'],
      why: 'Marktstammdatenregister — the register of every generation and storage unit in Germany. Registration is a legal obligation, and missing it blocks payment.' },

    { id: 'm14-d7', q: 'Why is FCR described as symmetrical?',
      type: 'text', accept: ['it must provide both upward and downward reserve', 'up and down', 'it must absorb and inject', 'both directions'],
      why: 'It must increase and decrease output equally, so the battery must sit mid-range with headroom in both directions — which removes usable energy from the arbitrage business.' },

    { id: 'm14-d8', q: 'Which market trades electricity for delivery the next day, in hourly products?',
      type: 'text', accept: ['day ahead', 'day-ahead', 'epex day ahead', 'day ahead market'],
      why: 'The day-ahead market, on EPEX. Intraday trades closer to delivery and is where forecast errors are corrected.' },

    { id: 'm14-d9', q: 'A 100 MW plant earning €100/kW/yr generates how much per year, in €?',
      unit: '€', answer: 10000000, tol: 20000,
      why: '100 000 kW × €100 = €10 M. This is the sanity check you run before believing any revenue model.' },

    { id: 'm14-d10', q: 'What does a capacity mechanism pay for, as opposed to an energy market?',
      type: 'text', accept: ['availability', 'being available', 'capacity being available', 'readiness'],
      why: 'Availability — being there when needed — rather than energy delivered. Germany has debated one for years; the design decides how much storage revenue is contracted rather than merchant.' },

    { id: 'm14-d11', q: 'Why is negative pricing good news for a battery?',
      type: 'text', accept: ['it is paid to charge', 'you get paid to consume', 'charging earns money', 'you are paid to absorb energy'],
      why: 'A negative price means you are paid to consume. The battery charges and is paid for it, then sells later — two revenues for one cycle.' },

    { id: 'm14-d12', q: 'What does §14a EnWG allow the DSO to do?',
      type: 'text', accept: ['dim controllable loads', 'reduce consumption', 'curtail', 'dim the device'],
      why: 'Dim controllable consumption devices — heat pumps, chargers, storage — in exchange for a reduced grid fee. It is a commercial constraint on when your plant may charge.' }
  ];

  window.MODULES.push({
    id: 'm14',
    number: '14',
    title: 'German markets and revenue',
    lead: 'How the plant actually earns, and why the revenue shape changes the design.',
    sections: [
      {
        h: 'Two kinds of income',
        p: [
          '<strong>Contracted</strong> revenue comes from an agreement: a capacity payment, a tolling fee, a PPA. It is bankable and it is what lenders underwrite.',
          '<strong>Merchant</strong> revenue comes from markets: day-ahead, intraday, balancing. It can be larger, and it is the part that makes a lender nervous.',
          'Most German storage today is a blend: a floor from reserve or capacity, upside from arbitrage. The blend is a design decision, not just a commercial one.'
        ],
        formula: 'Contracted floor + merchant upside = the usual stack'
      },
      {
        h: 'The reserve markets',
        p: [
          'FCR pays for capacity that responds to frequency within 30 seconds, symmetrically. aFRR pays for signalled response within 5 minutes. mFRR, within 15 minutes.',
          'Reserve revenue is per MW per hour of availability — so it scales with power, not energy. That favours short-duration, high-power assets, and it is why 2-hour batteries dominate some markets.',
          'The catch: reserve requires headroom in both directions and continuous availability, which removes energy from arbitrage and exposes you to availability penalties.'
        ],
        formula: 'Reserve revenue ≈ MW × €/MW/h × 8 760 h × availability'
      },
      {
        h: 'Arbitrage, and what the spread really is',
        p: [
          'Arbitrage is buying low and selling high, minus losses. At 88 % round-trip, delivering 400 MWh requires buying 454.5 MWh — so the effective spread is smaller than the market spread by a third of the difference.',
          'Perfect capture is a fiction: the price you see in the day-ahead auction is not the price you get for a cycle that starts and ends at slightly different times.',
          'Negative prices are a gift: you are paid to charge. Markets with high renewable penetration produce them regularly, and they reward fast, automated dispatch.'
        ],
        formula: 'Margin = spread − losses − degradation cost'
      },
      {
        h: 'Stacking, and the physics that limits it',
        p: [
          'Stacking means earning from more than one market with the same asset — sequentially, not simultaneously. A battery can do reserve in the morning and arbitrage in the evening.',
          'What it cannot do is sell the same megawatt twice. Models that add every revenue stream at full capacity are the most common error in storage business cases.',
          'The dispatch algorithm is therefore the real product: it decides, hour by hour, which market the asset is in. Two operators with identical hardware earn very different amounts.'
        ],
        formula: 'Same asset, sequential markets — never simultaneous'
      },
      {
        h: 'German specifics that shape the business case',
        p: [
          'Registration in the MaStR is obligatory; §14a lets the DSO dim controllable loads in exchange for reduced grid fees; grid-fee exemptions for storage have been time-limited and repeatedly amended.',
          'The capacity mechanism debate returns every winter. If one arrives, contracted revenue rises and merchant exposure falls — which changes what gets financed.',
          'None of these are stable facts. Any business case older than a year should be treated as a draft.'
        ],
        formula: 'MaStR · §14a · grid-fee rules · capacity mechanism — all moving'
      }
    ],
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
