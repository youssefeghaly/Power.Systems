/* Module 13 — safety, fire and permitting. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var LAYERS = [
    { t: 'Prevention', who: 'Design and product',
      what: 'Keep the cell inside its window: correct voltage limits, thermal management, quality control at the factory, and a BMS that derates before it trips.',
      detail: 'Most incidents begin with a defect or an integration error, not with abuse. Factory audits and incoming inspection are prevention, even though they feel like procurement.' },

    { t: 'Warning', who: 'Detection',
      what: 'Smoke, gas and temperature detection at cell, module and container level, with redundancy and a defined response to each alarm tier.',
      detail: 'Gas detection matters more than smoke: electrolyte vapour appears before visible smoke, and an explosive mixture can form before there is any fire.' },

    { t: 'Containment', who: 'Physical design',
      what: 'Prevent propagation from module to module and container to container: barriers, spacing, deflagration venting, and a layout that lets a fire burn without taking the site.',
      detail: 'Deflagration panels release pressure in a controlled direction. Without them, a container becomes a pressure vessel — which is how the McMicken incident injured responders.' },

    { t: 'Emergency response', who: 'Site and fire brigade',
      what: 'An emergency response plan written for this technology, shared with the local fire brigade before commissioning, and rehearsed.',
      detail: 'The doctrine is usually to let the affected container burn while cooling neighbours. Response plans that assume "put it out" lead to water on a lithium fire and responders close to venting gas.' }
  ];

  function drawLayers(host) {
    var html = '<div class="card">' +
      '<h2>Four layers, in order</h2>' +
      '<p class="muted">Each layer assumes the one before it failed. Tap any layer.</p>' +
      '<ol class="steps">';

    LAYERS.forEach(function (l, i) {
      html += '<li><button class="step" data-layer="' + i + '">' +
        '<span class="step-dot">' + (i + 1) + '</span>' +
        '<span class="step-label">' + l.t + '</span>' +
        '</button></li>';
    });

    html += '</ol><div id="layer-detail" class="node-detail"></div></div>';
    host.innerHTML = html;

    var detail = host.querySelector('#layer-detail');

    function select(i) {
      host.querySelectorAll('.step').forEach(function (b) {
        b.classList.toggle('active', Number(b.getAttribute('data-layer')) === i);
      });
      detail.innerHTML =
        '<h3>' + LAYERS[i].t + '</h3>' +
        '<p class="eff"><strong>Owner:</strong> ' + LAYERS[i].who + '</p>' +
        '<p>' + LAYERS[i].what + '</p>' +
        '<p class="muted">' + LAYERS[i].detail + '</p>';
    }

    host.querySelectorAll('.step').forEach(function (b) {
      b.addEventListener('click', function () { select(Number(b.getAttribute('data-layer'))); });
    });
    select(0);
  }

  var calcHTML =
    '<div class="card">' +
      '<h2>Where incidents actually come from</h2>' +
      '<p class="muted">EPRI\'s incident database found that most BESS failures originate in the integration, not in the cell. Set the share and see what it implies for your due diligence.</p>' +
      '<div class="grid">' +
        '<label><span>Integration-related share</span><input id="sf-share" type="range" min="0" max="100" step="5" value="65" />' +
          '<span class="hint"><span id="sf-val">65</span> %</span></label>' +
        '<label><span>Site incidents per year</span><input id="sf-n" type="text" inputmode="decimal" value="4" /><span class="hint">count</span></label>' +
      '</div>' +
      '<div id="sf-out" class="results"></div>' +
      '<div id="sf-note" class="gc-note"></div>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function update() {
      var share = parseFloat($('sf-share').value);
      var n = parseFloat(String($('sf-n').value).replace(',', '.'));
      $('sf-val').textContent = share;

      if (!(n >= 0)) { $('sf-out').innerHTML = ''; return; }

      var integration = n * share / 100;
      $('sf-out').innerHTML =
        '<div class="row"><span>Attributable to integration</span><strong>' + integration.toFixed(1) + ' per year</strong></div>' +
        '<div class="row"><span>Attributable to cells</span><strong>' + (n - integration).toFixed(1) + ' per year</strong></div>';

      $('sf-note').textContent = share >= 50
        ? 'If most failures are integration, then your leverage is in design review, commissioning and quality of installation — not in choosing a different cell supplier.'
        : 'At this share the cell itself dominates, and supplier qualification becomes the main lever.';
    }

    $('sf-share').addEventListener('input', update);
    $('sf-n').addEventListener('input', update);
    update();
  }

  var DRILLS = [
    { id: 'm13-d1', q: 'What is thermal runaway?',
      type: 'text', accept: ['uncontrolled temperature rise', 'uncontrollable temperature increase', 'self sustaining exothermic reaction', 'uncontrolled heating that spreads'],
      why: 'An uncontrolled, self-sustaining temperature rise inside a cell that can spread to its neighbours. Above roughly 400 °C the cell releases flammable and toxic gases.' },

    { id: 'm13-d2', q: 'Which gas build-up creates the explosion risk in a container?',
      type: 'text', accept: ['hydrogen', 'flammable gases', 'co and hydrogen', 'toxic and flammable gases'],
      why: 'Flammable gases vented from the cell — hydrogen among them — accumulating in a closed container. That is why deflagration venting exists.' },

    { id: 'm13-d3', q: 'What does a deflagration panel do?',
      type: 'text', accept: ['vents pressure', 'releases pressure', 'prevents overpressure', 'opens to release pressure'],
      why: 'It opens at a defined pressure and releases the gas in a controlled direction, so the container does not become a bomb.' },

    { id: 'm13-d4', q: 'What does UL 9540A test?',
      type: 'text', accept: ['thermal runaway fire propagation', 'fire propagation', 'propagation testing', 'cell to cell propagation'],
      why: 'Thermal runaway fire propagation — cell, module, rack and container level. It produces data for the fire code, not a pass/fail certificate for the product.' },

    { id: 'm13-d5', q: 'Which German guideline covers fire protection for lithium battery storage?',
      type: 'text', accept: ['vds 3103', 'vds', 'vds 3103 brandschutz'],
      why: 'VdS 3103. It is a guideline rather than law, but it is what insurers and fire departments reference in practice.' },

    { id: 'm13-d6', q: 'Which German building code paragraph governs privileged construction in the open countryside?',
      type: 'text', accept: ['35', '§35', 'bauGB 35', 'paragraph 35 bauGB'],
      why: 'BauGB §35 — the Außenbereich rule. Whether a BESS is privileged there is a live legal question, and it decides whether a site is buildable at all.' },

    { id: 'm13-d7', q: 'According to the EPRI incident database, roughly what share of BESS incidents came from integration rather than cells, in %?',
      unit: '%', answer: 65, tol: 3,
      why: 'About 65 %. The cell is the least likely culprit — which is why design reviews and commissioning matter more than supplier selection.' },

    { id: 'm13-d8', q: 'Who is the AHJ for a BESS project?',
      type: 'text', accept: ['authority having jurisdiction', 'the fire authority', 'local fire department', 'building authority'],
      why: 'The authority having jurisdiction — in practice the local fire department and building authority. Their interpretation, not the code text, decides what you build.' },

    { id: 'm13-d9', q: 'What does the emergency response plan have to be shared with, before commissioning?',
      type: 'text', accept: ['the fire brigade', 'local fire department', 'fire service', 'the ahj'],
      why: 'The local fire brigade. They need to know the technology, the hazards, the water supply and the access before they are called at 3 a.m.' },

    { id: 'm13-d10', q: 'What is the usual doctrine for a container already in thermal runaway?',
      type: 'text', accept: ['let it burn and protect the neighbours', 'let it burn', 'cool adjacent containers', 'contain and let it burn'],
      why: 'Let it burn while cooling adjacent containers. Entering to save equipment puts responders next to venting gas and an unpredictable fire.' },

    { id: 'm13-d11', q: 'Which IEC standard covers safety of grid-integrated electrical energy storage systems?',
      type: 'text', accept: ['62933-5-2', 'iec 62933-5-2'],
      why: 'IEC 62933-5-2. We do not hold it, which is why this module teaches the layers and marks the clause numbers for verification.' },

    { id: 'm13-d12', q: 'Why does spacing between containers matter more than the suppression system?',
      type: 'text', accept: ['it stops propagation', 'prevents fire spread', 'to prevent propagation to neighbouring containers', 'it limits propagation'],
      why: 'Because containment of a single container is usually accepted as lost, while propagation is what turns an incident into a disaster. Spacing, walls and orientation are what stop it.' }
  ];

  window.MODULES.push({
    id: 'm13',
    number: '13',
    title: 'Safety, fire and permitting',
    lead: 'Four layers, one doctrine, and the German permission path that decides whether the site exists.',
    sections: [
      {
        h: 'What thermal runaway actually is',
        p: [
          `A cell heated past its limit enters an exothermic reaction it cannot stop. Temperature climbs to several hundred degrees, the electrolyte vaporises, and the cell vents a mixture of flammable and toxic gases — hydrogen, carbon monoxide, hydrogen fluoride among them.`,
          `The gases are the underrated hazard. In a closed container they accumulate, and ignition produces a deflagration rather than a fire: a pressure event that can injure responders before they reach the door. That is what happened at McMicken in 2019, and it changed the way containers are designed.`,
          `Propagation is the risk to the business. One container is a loss; a row of containers is a disaster, a planning scandal and an insurance dispute that outlives the project team.`
        ],
        formula: 'Heat → venting → flammable gas → deflagration → propagation',
        example: {
          title: 'Worked example — the ten minutes',
          body: `In the McMicken incident the cell temperature went from about 30 °C to over 700 °C in under ten minutes, after an internal short caused by dendrites. Nothing the controls could do would have stopped it once the short formed — which is why the design effort goes into detection, venting and keeping the next container cool rather than into extinguishing this one. The practical lesson for design is that the timeline of a cell event is shorter than any human response, so the layout must assume the container is lost.`
        },
        mistake: `Designing for fire and forgetting gas. Most of the serious injuries in this industry come from deflagration and toxic exposure, not from flames reaching people.`,
        check: `What creates the explosion risk in a container? Answer: accumulation of flammable vented gas.`
      },
      {
        h: 'The standards landscape, honestly',
        p: [
          `<strong>IEC 62933-5-2</strong> covers safety of grid-integrated storage; <strong>IEC 62619</strong> covers cells for industrial use. <strong>UL 9540A</strong> is the American propagation test whose data now informs fire codes worldwide, and <strong>NFPA 855</strong> is the US installation standard often quoted in Europe by analogy.`,
          `In Germany, <strong>VdS 3103</strong> is the practical fire guideline, sitting alongside the building codes and the industrial building directive. It is a guideline rather than law, but it is what insurers and fire departments actually reference when they form a view.`,
          `We hold neither VdS 3103 nor 62933-5-2, so this module teaches the structure and marks the numbers. Anyone quoting a distance in metres without naming the document, the edition and the authority deserves a second question — including me.`
        ],
        formula: '62933-5-2 system · 62619 cells · UL 9540A propagation · VdS 3103 German practice',
        example: {
          title: 'Worked example — why UL 9540A data matters in Germany',
          body: `A German authority may not apply NFPA 855, but it will ask what happens when one module goes into runaway. The UL 9540A test answers exactly that question with measured data — temperatures, gas composition, whether propagation occurred — and that data is often the only quantitative evidence available to the fire department. Ask suppliers for the module-level results, not the headline summary; the summary is marketing and the data is evidence. Present it as supporting evidence attached to the fire concept, not as a claim of compliance.`
        },
        mistake: `Treating the American standard as legally applicable in Germany. It is evidence, not law — useful evidence, but the permission comes from the Landesbauordnung and the AHJ.`,
        check: `Which German guideline covers fire protection for lithium storage? Answer: VdS 3103.`
      },
      {
        h: 'Design measures that actually matter',
        p: [
          `Spacing and orientation, fire walls, deflagration venting, gas detection, and a layout that lets one container burn without heating the next. Suppression is useful; containment is decisive, because the industry generally accepts the loss of a single container.`,
          `Access for fire vehicles, a water supply the AHJ accepts, and a fire command post are site-level requirements that are cheap early and impossible late. They also determine the layout of everything else, because a fire engine needs a turning circle.`,
          `Every one of these is inspected before energisation. They are also the items most often installed provisionally and never finished, because by the time the inspection comes the contractor has demobilised.`
        ],
        formula: 'Contain the container, protect the site',
        example: {
          title: 'Worked example — spacing beats suppression',
          body: `Two layouts with identical suppression: one with containers 3 m apart, one with 6 m. The first propagates in a wind-driven fire; the second loses one container and keeps the plant. The extra 3 m costs land; the propagation costs the asset, the insurance and possibly the planning consent for the next project. Fire engineering can sometimes justify closer spacing with a barrier and a calculation, but that argument is made with the authority before the layout is drawn, not after. Land is the constraint in most German industrial estates, which is why this argument is usually won or lost at site selection.`
        },
        mistake: `Buying a more elaborate suppression system to compensate for tight spacing. Suppression acts after the event has started; spacing prevents the event from becoming a site emergency.`,
        check: `What limits propagation between containers most reliably? Answer: spacing and physical barriers.`
      },
      {
        h: 'The German permission path',
        p: [
          `Land use first: is the site inside a built-up area or outside it? Under BauGB §35 the privileged outdoor category is narrow, and a battery storage plant does not obviously fit it — which is why the first legal question is often the one that decides the project.`,
          `Then building law: a BESS is usually a structure requiring a permit under the Landesbauordnung. BImSchG may apply for certain installations, and that question is asked early because a positive answer changes the timeline by a year and the evidence pack by a filing cabinet.`,
          `Then the fire authority signs off the concept and the DSO signs off the connection. Neither is a formality, and neither can be fixed after construction — both are design inputs pretending to be approvals.`
        ],
        formula: 'BauGB → LBO (and possibly BImSchG) → fire authority → DSO',
        example: {
          title: 'Worked example — the paragraph that decides the site',
          body: `A site outside a village, on agricultural land, looks cheap and is often the one that fails at §35: the plant is not agriculture, not forestry, and not a privileged utility in the narrow sense the paragraph uses. A site inside an industrial estate costs more per square metre and saves a year of legal argument. The same logic applies to grid connection: the cheapest land is often the most expensive project.`
        },
        mistake: `Buying or optioning land before establishing the planning category. Land cost is visible and planning risk is not, which is exactly why the cheap site wins the spreadsheet and loses the project.`,
        check: `Which paragraph governs privileged construction outside built-up areas? Answer: BauGB §35.`
      },
      {
        h: 'Emergency response is a design input',
        p: [
          `An emergency response plan written for lithium storage, shared with the fire brigade before commissioning, changes what you build: hydrant positions, access roads, isolation points, and a gate wide enough for a fire engine.`,
          `The doctrine for a container already in runaway is usually to let it burn and cool the neighbours. Design decisions that make that possible — spacing, venting, remote isolation — are worth more than a larger extinguisher, and they are decisions taken in the layout, not in the response plan.`,
          `Rehearse it. A plan nobody has walked through is a document, not a capability, and the fire brigade will discover the difference at three in the morning, on your site, with your name on the fire concept.`
        ],
        formula: 'Write it with the brigade · rehearse it · design for it',
        example: {
          title: 'Worked example — the gate that was too narrow',
          body: `A site with a 3.5 m gate and a 6 m turning circle looks adequate until the local brigade arrives with its largest appliance and cannot enter. Rebuilding the entrance after commissioning costs a variation, a delay and a conversation with the authority who now doubts everything else in the pack. Walk the route with the brigade before the fence goes up; they will tell you what their largest appliance needs, and it is never what the drawing assumes.`
        },
        mistake: `Writing the emergency plan after construction, to match what was built. It should be written with the brigade before the layout is frozen.`,
        check: `What is the usual doctrine for a container in runaway? Answer: let it burn while cooling neighbours.`
      }
    ],
    renderExtra: drawLayers,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
