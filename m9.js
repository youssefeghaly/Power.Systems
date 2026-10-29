/* Module 9 — the MV connection: the transfer station and what is in it. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var NODES = [
    { id: 'mvg', x: 30, y: 90, w: 150, h: 62, label: 'MV switchgear',
      title: 'MV switchgear (Übergabeschaltfeld)',
      what: 'The DSO-side panel at the transfer station: either a ring-main unit with load-break switches and fuses, or a circuit-breaker panel with a relay. Which one is allowed depends on transformer size and on the DSO.',
      spec: 'Rated voltage, rated current, short-circuit withstand, and whether it is a ring or a radial configuration.',
      risk: 'A ring-main unit with fuses cannot protect a large transformer. Above the DSO\'s threshold, a breaker panel is mandatory — and the threshold is local.' },

    { id: 'meter', x: 210, y: 90, w: 150, h: 62, label: 'Metering',
      title: 'Metering (CT/VT + meter)',
      what: 'Current and voltage transformers feeding the revenue meter. Above 100,000 kWh per year the metering is registrierende Leistungsmessung — RLM, with remote readout.',
      spec: 'CT ratio and class (0.2S or 0.5S), VT accuracy, meter type, and separate metering of consumption versus feed-in when both exist.',
      risk: 'Metering in the wrong place measures the wrong thing: the DSO meters at the transfer point, your PCS meters at the terminals, and the difference is your loss.' },

    { id: 'na', x: 30, y: 280, w: 150, h: 62, label: 'NA protection',
      title: 'NA protection (NA-Schutz)',
      what: 'Watches voltage and frequency at the transfer point and disconnects the plant when either leaves its window. It is a separate, DSO-approved device — not a function of the PCS.',
      spec: 'Central NA protection with a coupling switch, tested and sealed at commissioning by the DSO.',
      risk: 'Bypassed or mis-set, it becomes the device that lets a plant backfeed an isolated network — and the first thing an investigator looks at.' },

    { id: 'trafo', x: 390, y: 90, w: 150, h: 62, label: 'Transformer',
      title: 'Customer transformer',
      what: 'Steps the MV down to the plant voltage — typically 20 kV to 400/690 V, Dyn5 vector group, with the LV star point earthed to form a TN system.',
      spec: 'Rating in kVA, impedance u_k, vector group, cooling, and whether the neutral is brought out.',
      risk: 'Its impedance sets the LV fault current, which sets the rating of every LV device behind it. Changed at the last minute, it invalidates the LV design.' },

    { id: 'lv', x: 570, y: 90, w: 150, h: 62, label: 'LV switchboard',
      title: 'LV main switchboard',
      what: 'Distribution inside the plant: the PCS feeders, auxiliary supplies, and the protection that separates them.',
      spec: 'Busbar rating, short-circuit withstand coordinated with the transformer, and the outgoing devices.',
      risk: 'If the transformer was upsized without re-checking the board, the board\'s fault rating is now the weak link.' },

    { id: 'earth', x: 570, y: 280, w: 150, h: 62, label: 'Earthing',
      title: 'Earthing and the foundation earth',
      what: 'The station earth: foundation earth where the building allows, plus ring or rod electrodes. It ties the switchgear, transformer tank, cable screens and the LV protective conductor to one reference.',
      spec: 'Earth resistance, conductor sizes, connection to the building\'s foundation earth, and the equipotential bonding of all metalwork.',
      risk: 'A station earthed through the cable screen alone is a fault waiting for the day the screen corrodes.' }
  ];

  var CHAIN = [['mvg', 'meter'], ['meter', 'trafo'], ['trafo', 'lv']];

  function node(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }

  function drawStation(host) {
    var p = [];
    p.push('<svg viewBox="0 0 880 380" class="sld" role="img" aria-label="Medium-voltage transfer station single-line">');
    p.push('<defs><marker id="mv-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">' +
           '<path d="M0,0 L8,4 L0,8 z" class="arrowhead"/></marker></defs>');

    p.push('<text x="30" y="70" class="sld-note">20 kV from the DSO</text>');
    p.push('<text x="560" y="70" class="sld-note">400 V inside the plant</text>');

    CHAIN.forEach(function (pair) {
      var a = node(pair[0]), b = node(pair[1]);
      var y = a.y + a.h / 2;
      p.push('<line x1="' + (a.x + a.w) + '" y1="' + y + '" x2="' + (b.x - 3) + '" y2="' + y +
             '" class="sld-line" marker-end="url(#mv-arrow)"/>');
    });

    /* control connection: NA protection trips the MV switchgear */
    var mvg = node('mvg'), na = node('na');
    p.push('<line x1="' + (mvg.x + mvg.w / 2) + '" y1="' + (mvg.y + mvg.h) + '" x2="' + (na.x + na.w / 2) + '" y2="' + (na.y - 3) +
           '" class="sld-control" marker-end="url(#mv-arrow)"/>');
    p.push('<text x="' + (mvg.x + mvg.w / 2 + 8) + '" y="' + (na.y - 10) + '" class="sld-note">trip</text>');

    /* earthing connection */
    var tr = node('trafo'), e = node('earth');
    p.push('<polyline points="' + (tr.x + tr.w / 2) + ',' + (tr.y + tr.h) + ' ' + (tr.x + tr.w / 2) + ',240 ' +
           (e.x + e.w / 2) + ',240 ' + (e.x + e.w / 2) + ',' + (e.y - 3) + '" class="sld-control"/>');

    NODES.forEach(function (n) {
      p.push('<g class="sld-node" data-node="' + n.id + '" tabindex="0" role="button" aria-label="' + n.title + '">');
      p.push('<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="12"/>');
      p.push('<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + n.h / 2 + 6) + '" text-anchor="middle">' + n.label + '</text>');
      p.push('</g>');
    });

    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>The transfer station</h2>' +
        '<p class="muted">Tap a box. Everything here belongs to someone: some to you, some to the DSO — and the boundary is where most disputes live.</p>' +
        '<div id="mv-wrap">' + p.join('') + '</div>' +
        '<div id="mv-detail" class="node-detail"></div>' +
      '</div>';

    var wrap = host.querySelector('#mv-wrap');
    var detail = host.querySelector('#mv-detail');

    function select(id) {
      var n = node(id);
      if (!n) return;
      wrap.querySelectorAll('.sld-node').forEach(function (g) {
        g.classList.toggle('active', g.getAttribute('data-node') === id);
      });
      detail.innerHTML =
        '<h3>' + n.title + '</h3>' +
        '<p>' + n.what + '</p>' +
        '<p class="eff"><strong>Specify:</strong> ' + n.spec + '</p>' +
        '<p class="muted"><strong>What goes wrong:</strong> ' + n.risk + '</p>';
    }

    wrap.querySelectorAll('.sld-node').forEach(function (g) {
      g.addEventListener('click', function () { select(g.getAttribute('data-node')); });
      g.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(g.getAttribute('data-node')); }
      });
    });
    select('trafo');
  }

  var calcHTML =
    '<div class="card">' +
      '<h2>Transformer sizing at the connection</h2>' +
      '<p class="muted">Size the transformer for the load, then check what it does to the fault level behind it.</p>' +
      '<div class="grid">' +
        '<label><span>Plant demand</span><input id="mv-kw" type="text" inputmode="decimal" value="4000" /><span class="hint">kW</span></label>' +
        '<label><span>Power factor</span><input id="mv-pf" type="text" inputmode="decimal" value="0.95" /><span class="hint">cos φ</span></label>' +
        '<label><span>Transformer rating</span><input id="mv-kva" type="text" inputmode="decimal" value="5000" /><span class="hint">kVA</span></label>' +
        '<label><span>Impedance u_k</span><input id="mv-uk" type="text" inputmode="decimal" value="6" /><span class="hint">%</span></label>' +
        '<label><span>MV voltage</span><input id="mv-kv" type="text" inputmode="decimal" value="20" /><span class="hint">kV</span></label>' +
      '</div>' +
      '<div id="mv-out" class="results"></div>' +
      '<div id="mv-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var kw = n('mv-kw'), pf = n('mv-pf'), kva = n('mv-kva'), uk = n('mv-uk'), kv = n('mv-kv');
      var out = $('mv-out'), note = $('mv-note');

      if (!(kw > 0) || !(pf > 0) || !(kva > 0) || !(uk > 0) || !(kv > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>demand, rating, impedance</strong></div>';
        note.textContent = '';
        return;
      }

      var kvaNeeded = kw / pf;
      var loading = (kvaNeeded / kva) * 100;
      var mvCurrent = (kva * 1000) / (Math.sqrt(3) * kv * 1000);
      var lvFault = (kva * 1000) / (Math.sqrt(3) * 400 * (uk / 100)) / 1000;

      out.innerHTML =
        '<div class="row"><span>Apparent power needed</span><strong>' + kvaNeeded.toFixed(0) + ' kVA</strong></div>' +
        '<div class="row"><span>Transformer loading</span><strong class="' + (loading > 100 ? 'bad-num' : '') + '">' + loading.toFixed(1) + ' %</strong></div>' +
        '<div class="row"><span>MV current at full rating</span><strong>' + mvCurrent.toFixed(1) + ' A</strong></div>' +
        '<div class="row"><span>LV fault current behind it</span><strong>' + lvFault.toFixed(2) + ' kA</strong></div>';

      note.textContent = loading > 100
        ? 'Overloaded. Either the transformer is too small or the demand has grown — and the LV switchgear fault rating may already be wrong if it was upsized.'
        : loading > 85
          ? 'Above roughly 85 % the transformer runs hot and loses life. Standard practice is to size for 70–80 % loading.'
          : 'Comfortable loading. Now check the LV fault current against every device behind the transformer.';
    }

    ['mv-kw', 'mv-pf', 'mv-kva', 'mv-uk', 'mv-kv'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm9-d1', q: 'A 5 MVA transformer with u_k = 6 % feeds a 400 V board. Fault current at the LV terminals, in kA?',
      unit: 'kA', answer: 120.3, tol: 1.0,
      why: 'I = 5 000 / (√3 × 0.4 × 0.06) = 120 kA. This is why LV boards behind a large transformer are rated 100 kA — or why the LV voltage is raised to 690 V to halve the current.' },

    { id: 'm9-d2', q: 'What is the MV current at full rating of that 5 MVA, 20 kV transformer?',
      unit: 'A', answer: 144.3, tol: 1.5,
      why: '5 000 / (√3 × 20) = 144.3 A. This is the current the MV switchgear and CT must carry, not the plant current.' },

    { id: 'm9-d3', q: 'A 4 MW load at cos φ 0.95 needs how much apparent power, in kVA?',
      unit: 'kVA', answer: 4211, tol: 20,
      why: '4 000 ÷ 0.95 = 4 211 kVA. Power factor is not a detail — it decides the transformer size you buy.' },

    { id: 'm9-d4', q: 'That load on a 5 MVA transformer is what loading, in %?',
      unit: '%', answer: 84.2, tol: 0.5,
      why: '4 211 ÷ 5 000 = 84.2 %. Above roughly 85 % the transformer runs hot; most designs aim for 70–80 %.' },

    { id: 'm9-d5', q: 'A 200/5 A CT carries 120 A on the primary. What does the secondary show?',
      unit: 'A', answer: 3, tol: 0.05,
      why: '120 × 5/200 = 3 A. The ratio is 40:1, so the secondary current is the primary divided by 40.' },

    { id: 'm9-d6', q: 'From what annual consumption does German metering become RLM?',
      unit: 'kWh', answer: 100000, tol: 100,
      why: '100,000 kWh per year. RLM means remotely read, interval-based metering — and it changes what data you get and who pays for it.' },

    { id: 'm9-d7', q: 'What does the NA protection actually do?',
      type: 'text', accept: ['disconnects on voltage or frequency outside the window', 'disconnects the plant from the grid', 'grid disconnection', 'monitors voltage and frequency and disconnects'],
      why: 'It disconnects the plant when voltage or frequency leaves the permitted window, so the plant never backfeeds an isolated section of network.' },

    { id: 'm9-d8', q: 'What is an RMU, and when is it not enough?',
      type: 'text', accept: ['ring main unit', 'ring main unit and it cannot protect large transformers', 'ring main unit with fuses', 'ring-main-unit'],
      why: 'A ring main unit: load-break switches with fuses in a ring. It cannot protect a large transformer, so above the DSO\'s threshold a circuit-breaker panel with a relay is required.' },

    { id: 'm9-d9', q: 'In a Dyn5 transformer, what are the HV and LV winding connections?',
      type: 'text', accept: ['delta hv star lv', 'hv delta lv star', 'delta star', 'd on hv y on lv'],
      why: 'HV delta, LV star with the neutral brought out — the standard distribution arrangement, giving a TN system on the LV side.' },

    { id: 'm9-d10', q: 'Why is the LV star point earthed?',
      type: 'text', accept: ['to form a tn system', 'to provide an earth fault path', 'so earth faults trip protection', 'to create a reference to earth'],
      why: 'It creates a defined earth-fault path so a fault trips protection quickly instead of leaving metalwork live.' },

    { id: 'm9-d11', q: 'Same 5 MVA transformer at 400 V, but u_k = 12 %. LV fault current, in kA?',
      unit: 'kA', answer: 60.1, tol: 0.8,
      why: '60.1 kA — half of before. Doubling impedance halves the LV fault current, which is why u_k is agreed with the DSO and not left to the supplier.' },

    { id: 'm9-d12', q: 'Which document tells you what this specific DSO requires at the transfer station?',
      type: 'text', accept: ['tab', 'tab mittelspannung', 'the tab', 'technische anschlussbedingungen'],
      why: 'The TAB — Technische Anschlussbedingungen. The TAR (4110) sets the floor; the TAB is what this network operator actually demands.' }
  ];

  window.MODULES.push({
    id: 'm9',
    number: '09',
    title: 'The MV connection',
    lead: 'The transfer station, the metering, the NA protection — the hardware behind the 4110 paperwork.',
    sections: [
      {
        h: 'Where the plant actually meets the grid',
        p: [
          `The transfer station is the physical boundary. On one side is the DSO's network; on the other is your installation. Almost every argument about responsibility, cost and maintenance starts at this line, and the line is drawn in a document, not on the ground.`,
          `Inside it: MV switchgear, metering, NA protection, the customer transformer and the earthing that ties it all to one reference. Your own LV distribution begins behind the transformer and is nobody else's business.`,
          `Module 04 taught the process that gets you permission to build this. This module is about what you build, who owns which part of it, and what gets inspected before it is energised.`
        ],
        formula: 'DSO network → switchgear → metering → transformer → LV board → plant',
        example: {
          title: 'Worked example — the ownership line',
          steps: [`In a typical German configuration the customer builds and owns the transfer station; the DSO specifies it, inspects it and seals the protection.`, `That means the switchgear, the transformer and the building are your capital cost and your maintenance burden for twenty years — even though the DSO told you exactly what to install.`, `Write the maintenance obligations into the O&M contract at financial close, while the DSO is still in the room and before anyone has an incentive to forget.`],
          result: `It is also why the earthing and the building fabric deserve the same attention as the battery.`
        },
        mistake: `Assuming the DSO owns and maintains the station because it specified it. Specification is not ownership, and the maintenance contract is yours to write.`,
        check: `Who owns the transfer station in the usual German arrangement? Answer: the customer.`
      },
      {
        h: 'Ring-main unit or circuit breaker',
        p: [
          `A ring-main unit is the cheap compact option: load-break switches and fuses arranged as a ring so a cable section can be isolated without interrupting the others. It is the standard answer for a modest transformer on a ring network.`,
          `Fuses cannot protect a large transformer — they are not selective enough and their rating runs out. Above the DSO's threshold a circuit-breaker panel with a relay is required, and the threshold is set in the TAB rather than in 4110.`,
          `That is why the same plant can need different switchgear in two neighbouring DSO areas, and why the equipment list is not final until the TAB has been read.`
        ],
        formula: 'RMU: switches + fuses · CB panel: relay + breaker',
        example: {
          title: 'Worked example — where the threshold bites',
          steps: [`A 630 kVA transformer behind a ring-main unit is a common, accepted arrangement.`, `Ask for 2,000 kVA behind the same RMU and the DSO will require a breaker panel with overcurrent and earth-fault protection — a different switchgear type, a different protection concept and a different price.`, `The practical lesson is to confirm the transformer rating before releasing the switchgear order, because the two decisions are coupled through a threshold most people never read.`, `A short written confirmation of the threshold from the DSO is worth more than a catalogue page.`],
          result: `Confirm it in writing before the order, and keep the reply.`
        },
        mistake: `Ordering the RMU before confirming the transformer size, then having to replace the switchgear when the load grows during detailed design.`,
        check: `What protects a large transformer at MV? Answer: a circuit-breaker panel with a relay, not fuses.`
      },
      {
        h: 'Metering is a boundary, not a device',
        p: [
          `The DSO meters at the transfer point; your PCS meters at its terminals. Between them sit the transformer, the cables and the switchgear, and that difference is your loss rather than their measurement error.`,
          `Above 100,000 kWh per year, metering becomes RLM — interval-based and remotely read. That is also the data set your settlement, your warranty claims and your disputes will be argued from, which makes its accuracy and its location commercial matters.`,
          `Where consumption and feed-in both exist, they may be metered separately. Get that wrong and you can find yourself paying for energy you generated, or being paid for energy you consumed.`
        ],
        formula: 'RLM above 100,000 kWh/yr · meter at the boundary, always',
        example: {
          title: 'Worked example — two meters, two stories',
          steps: [`A 5 MW plant with a 5 MVA transformer loses roughly 1 % in the transformer and a little more in the MV cabling.`, `On 20 GWh a year of throughput that is over 200 MWh — about €8,000 at a €40/MWh spread, every year, from a boundary that was drawn without thinking.`, `The same boundary decides which losses are yours and which are the DSO's, so it belongs in the loss budget as a line item rather than a footnote.`, `Ask which register each number comes from before you build a business case on it.`],
          result: `The meter is a contract instrument, and it deserves a contract-level review.`
        },
        mistake: `Assuming the meter the DSO installs is the meter your settlement uses. Check which register, which direction and which tariff each measurement belongs to.`,
        check: `From what annual consumption does metering become RLM? Answer: 100,000 kWh.`
      },
      {
        h: 'NA protection is not a PCS function',
        p: [
          `The NA protection watches voltage and frequency at the transfer point and disconnects the plant when either leaves its permitted window. Its job is to guarantee the plant never backfeeds a section of network that the DSO believes is dead.`,
          `It is a separate, approved device with its own coupling switch, tested at commissioning and sealed by the DSO. Implementing the same logic inside the PCS is not equivalent and is not accepted, however well it is written.`,
          `The most common finding after an incident is that this device was bypassed temporarily during commissioning — a decision taken by someone under schedule pressure, with no authority to take it.`
        ],
        formula: 'Central NA protection + coupling switch, sealed by the DSO',
        example: {
          title: 'Worked example — the seal matters',
          steps: [`During commissioning, a firmware update on the PCS restarts the converter every few minutes.`, `Someone disables the NA protection to finish the test.`, `The plant is energised, the grid has a fault nearby, and the plant keeps feeding an isolated section — which is exactly the scenario the device exists to prevent.`, `The seal exists precisely so that a temporary bypass leaves a physical trace, and breaking it is a reportable event rather than a maintenance decision.`],
          result: `Record who broke the seal, when, and on whose authority; that record is the difference between a finding and a prosecution.`
        },
        mistake: `Assuming the PCS anti-islanding function satisfies the requirement. The DSO requires a certified device at the boundary, not a function inside a converter they have not certified for that purpose.`,
        check: `Is PCS anti-islanding equivalent to NA protection? Answer: no — a separate certified device is required.`
      },
      {
        h: 'The transformer decides everything behind it',
        p: [
          `Vector group, impedance and rating fix the LV fault level, and the LV fault level fixes the rating of every device behind it. Change the transformer late and you invalidate the LV design — switchgear, busbars, cable withstand, everything.`,
          `The standard distribution arrangement is Dyn5: delta on the HV side, star with brought-out neutral on the LV side, earthed to form a TN system. That earthing choice is what makes LV protection operate quickly on an earth fault.`,
          `Loading above roughly 85 % costs transformer life; most designs aim for 70–80 %. And the LV fault current behind a 5 MVA transformer at 400 V is around 120 kA, which is why large transformers are often specified with higher impedance or a higher LV voltage.`
        ],
        formula: 'I_LV = S / (√3 · U_LV · u_k)',
        example: {
          title: 'Worked example — 120 kA at 400 V',
          steps: [`5 MVA with u_k = 6 % at 400 V: 5,000 ÷ (√3 × 0.4 × 0.06) = 120 kA.`, `No standard LV board is rated for that, so the design either raises the LV voltage to 690 V (halving the current), increases u_k, or splits the transformer into smaller units.`],
          result: `That is why the LV voltage level is a design decision taken with the transformer, not a given that arrives with the building.`
        },
        mistake: `Upsizing the transformer during detailed design without re-checking the LV board rating — the single most expensive "small change" in the whole project.`,
        check: `What is the LV fault current behind 5 MVA at 400 V with 6 % impedance? Answer: about 120 kA.`
      },
      {
        h: 'Earthing and cable entry',
        p: [
          `The station earth ties switchgear frames, the transformer tank, cable screens and the LV protective conductor to one electrode system — usually a foundation earth plus a ring. One reference, or the fault current finds a path you did not design.`,
          `Cables enter through sealed ducts or trenches, with fire-rated sealing where they cross a building boundary and Eca-class cable inside. A cable entry that lets water in will find the earth bar within a year, and the resulting corrosion is invisible until it matters.`,
          `All of this is inspected before energisation, and it is the part most often installed provisionally and never corrected — because by the time it fails, the project team has moved on to the next site.`
        ],
        formula: 'One earth reference · sealed entries · Eca inside buildings',
        example: {
          title: 'Worked example — the entry that fails first',
          steps: [`A duct that was sealed with foam instead of a proper gland lets water into the switchgear basement.`, `Two winters later the earth bar has corroded to half its cross-section, which no routine inspection looks for because it is below floor level and behind a panel.`, `Photograph every entry at commissioning, sealed and labelled, and keep those images with the as-built drawings.`],
          result: `Photograph the entries at commissioning, sealed and labelled, and keep the images with the as-built drawings; they are the only record of what was actually installed.`
        },
        mistake: `Treating cable sealing and fire stopping as finishing works. They are inspected items, and they are the first things to be value-engineered out by a contractor under pressure.`,
        check: `What fire class is required for cables inside a building? Answer: Eca, as a minimum.`
      }
    ],
    renderExtra: drawStation,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
