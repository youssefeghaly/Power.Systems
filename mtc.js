/* Module 16 — testing and commissioning (PV and BESS). */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  function drawTestGallery(host) {
    function panel(title, caption, body) {
      return '<figure class="gallery-item">' +
        '<svg viewBox="0 0 260 190" class="gallery-svg" role="img" aria-label="' + title + '">' + body + '</svg>' +
        '<figcaption><strong>' + title + '</strong><span>' + caption + '</span></figcaption>' +
        '</figure>';
    }

    /* 1 — PV Category 1 sequence */
    var seq = '';
    var items = ['continuity', 'polarity', 'combiner', 'Voc', 'Isc', 'functional', 'insulation'];
    items.forEach(function (t, i) {
      var y = 20 + i * 23;
      seq += '<circle cx="22" cy="' + (y + 7) + '" r="9" class="step-dot-svg"/>';
      seq += '<text x="22" y="' + (y + 11) + '" class="gal-label" text-anchor="middle">' + (i + 1) + '</text>';
      seq += '<text x="40" y="' + (y + 11) + '" class="gal-label">' + t + '</text>';
    });

    /* 2 — insulation resistance test */
    var ins = '';
    ins += '<rect x="30" y="40" width="120" height="60" rx="6" class="concrete"/>';
    ins += '<text x="90" y="75" class="gal-label" text-anchor="middle">PV array</text>';
    ins += '<line x1="90" y1="100" x2="90" y2="140" class="bond-line"/>';
    ins += '<circle cx="90" cy="150" r="14" class="cable-core"/>';
    ins += '<text x="90" y="154" class="gal-label" text-anchor="middle">M</text>';
    ins += '<line x1="160" y1="70" x2="210" y2="70" class="sld-line"/>';
    ins += '<circle cx="222" cy="70" r="12" class="cable-core"/>';
    ins += '<text x="222" y="74" class="gal-label" text-anchor="middle">⊕</text>';
    ins += '<text x="222" y="52" class="gal-label" text-anchor="middle">earth</text>';
    ins += '<text x="130" y="178" class="gal-label" text-anchor="middle">insulation to earth, array isolated</text>';

    /* 3 — I-V curve */
    var iv = '';
    var curve = 'M30,150 C 120,150 150,60 200,40';
    iv += '<line x1="30" y1="150" x2="230" y2="150" class="ground-line"/>';
    iv += '<line x1="30" y1="150" x2="30" y2="30" class="ground-line"/>';
    iv += '<path d="' + curve + '" class="potential-line"/>';
    iv += '<path d="M30,150 C 110,150 135,80 175,50" class="screen" stroke-dasharray="5 4"/>';
    iv += '<text x="230" y="168" class="gal-label" text-anchor="end">voltage</text>';
    iv += '<text x="18" y="34" class="gal-label" text-anchor="end">I</text>';
    iv += '<text x="150" y="120" class="gal-label">corrected</text>';
    iv += '<text x="120" y="96" class="gal-label">measured</text>';

    /* 4 — BESS capacity cycle */
    var cyc = '';
    cyc += '<line x1="30" y1="150" x2="230" y2="150" class="ground-line"/>';
    cyc += '<line x1="30" y1="150" x2="30" y2="30" class="ground-line"/>';
    cyc += '<polyline points="40,140 90,140 90,50 150,50 150,140 210,140" class="strat-a"/>';
    cyc += '<text x="90" y="44" class="gal-label" text-anchor="middle">charge</text>';
    cyc += '<text x="150" y="164" class="gal-label" text-anchor="middle">discharge</text>';
    cyc += '<text x="18" y="36" class="gal-label" text-anchor="end">SoC</text>';

    host.innerHTML =
      '<div class="card">' +
        '<h2>What commissioning actually looks like</h2>' +
        '<p class="muted">Four artefacts: the PV test sequence, the insulation measurement, the I-V curve, and the BESS capacity cycle.</p>' +
        '<div class="gallery">' +
          panel('PV Category 1 sequence', 'The seven tests every system receives, in order.', seq) +
          panel('Insulation resistance', 'Megohmmeter from array to earth, array isolated.', ins) +
          panel('I-V curve', 'Measured against expected, corrected for irradiance.', iv) +
          panel('BESS capacity test', 'Charge, rest, discharge at rated power.', cyc) +
        '</div>' +
      '</div>';
  }

  window.MODULES.push({
    id: 'mtc',
    number: '16',
    title: 'Testing and commissioning',
    lead: 'PV and BESS side by side: what the standards mandate, in what order, and what the record has to prove.',
    sections: [
      {
        h: 'Documentation is the first test',
        p: [
          `Both IEC 62446-1 for PV and IEC 62933-2-1 for storage put documentation before measurement, and for the same reason: a test result means nothing without the design it is compared against. The PV standard lists system data, a wiring diagram, string layout, component datasheets, O&M information and test results as the pack.`,
          `That pack is not bureaucracy. When a string underperforms in year three, the string layout tells you which modules are involved; the datasheet tells you what the nameplate was; the commissioning record tells you what it measured on day one. Without all three, you have a number and an argument.`,
          `For storage the equivalent pack is the single-line diagram, the equipment schedule, the protection settings, the factory test certificates and the capacity test result — with the measurement boundary stated in every one of them.`
        ],
        formula: 'Design data → layout → datasheets → tests → signed record',
        example: {
          title: 'Worked example — the missing string layout',
          steps: [
            `A 500 kWp roof array reports 6 % underperformance in its second year.`,
            `The installer handed over datasheets and test sheets, but no string layout.`,
            `Nobody can tell which strings feed which combiner without climbing the roof and tracing cables.`,
            `Two days of survey to answer a question the pack should have answered in ten minutes.`
          ],
          result: `The omission costs more than the fault it was hiding.`
        },
        mistake: `Treating the documentation pack as paperwork to assemble at the end. It is assembled during design, checked at commissioning, and used for twenty years.`,
        check: `Which document tells you which modules are in which string? Answer: the string layout.`
      },
      {
        h: 'Commissioning has stages, and each has an owner',
        p: [
          `Factory acceptance, delivery, installation, site acceptance, energisation, commercial operation. Each stage tests something different, and each has a different party signing it off. Collapsing them into "commissioning" is how defects arrive at COD undiscovered.`,
          `Factory acceptance tests the product against its datasheet in controlled conditions: capacity, efficiency, protection functions, communications. It is the only stage where you can open things without a permit and measure without weather.`,
          `Site acceptance tests the installed system against the design: wiring, protection settings, response to signals, and the interface to the DSO. It is where integration defects appear, and it is the stage most often compressed to protect a schedule.`,
          `The practical discipline is a single stage-gate list, agreed before mobilisation, naming the evidence required to pass each gate and who signs it.`
        ],
        formula: 'FAT → delivery → installation → SAT → energisation → COD',
        example: {
          title: 'Worked example — the defect that FAT should have caught',
          steps: [
            `A PCS ships with a firmware version whose reactive response differs from the tested one.`,
            `FAT was run on an earlier build and the certificate was not version-locked.`,
            `At SAT the DSO's witness test fails the reactive-power step response.`,
            `The fix is a firmware roll-back and a re-test, six weeks after the schedule had an outage booked.`
          ],
          result: `Write the tested firmware version into the FAT certificate, or the certificate proves nothing. Version-lock the certificate, or the certificate proves a different plant.`
        },
        mistake: `Accepting a FAT certificate that names the product but not the configuration. Version, firmware and options are part of what was tested.`,
        check: `Which stage tests the installed system against the design? Answer: site acceptance testing.`
      },
      {
        h: 'PV: the Category 1 tests',
        p: [
          `IEC 62446-1 clause 6 defines a sequence, and the order is deliberate: prove the safety path first, then polarity, then measurement, then insulation. Each test assumes the previous one passed.`,
          `Continuity of earthing and bonding confirms the protective path exists. Polarity confirms no string is reversed — a fault that can destroy modules and is invisible until measured. The combiner box test checks terminations and fusing. String open-circuit voltage and current confirm that the expected number of modules is present and producing.`,
          `Functional tests then prove the inverter, monitoring and shutdown behave as designed, and only then is the array insulation resistance measured — with the array isolated, because the test is meaningless if the electronics are still connected.`
        ],
        formula: 'Continuity → polarity → combiner → Voc → current → functional → insulation',
        example: {
          title: 'Worked example — why polarity comes before power',
          steps: [
            `A 20-module string should read 20 × 40 V = 800 V open-circuit at reference conditions.`,
            `It reads 760 V: two modules missing, or one module of a different type.`,
            `A reversed string would read a plausible voltage but produce almost no current — which the Isc test then catches.`,
            `Neither fault is visible from the ground, and both are permanent if not found at commissioning.`
          ],
          result: `Measurement against an expected value is the test; the reading alone proves nothing. A reversed string reads a plausible voltage and produces almost nothing — which is why both tests exist.`
        },
        mistake: `Skipping the polarity test because the string "obviously" works — it produced voltage. Voltage and polarity are different questions, and a reversed string still reads a voltage.`,
        check: `Which test confirms the protective earth path? Answer: continuity of earthing and bonding.`
      },
      {
        h: 'PV: I-V curves and irradiance',
        p: [
          `The Category 2 regime measures the I-V curve, which shows far more than a single operating point: whether the array is shaded, soiled, mismatched or degraded, and roughly where. It is the difference between "the array is down 4 %" and "string 7 has two shaded modules".`,
          `The complication is irradiance. A curve measured at 900 W/m² is not comparable with one measured at 1,000, and the correction is not a simple scaling. Every credible I-V measurement records irradiance and cell temperature at the same instant, and the comparison is made after correction.`,
          `This is where commissioning records earn their keep: a corrected curve at handover is the baseline, and every later curve is compared against it rather than against the datasheet.`
        ],
        formula: 'I-V curve + irradiance + cell temperature → corrected comparison',
        example: {
          title: 'Worked example — two curves, one array',
          steps: [
            `At handover the array produces an I-V curve matching the expected shape at 1,000 W/m².`,
            `In year three the measured curve has a step in it — the classic signature of a shaded or failed substring.`,
            `A single-point power reading would have shown a 4 % shortfall and told you nothing about where.`,
            `The curve localises the fault to a substring, and the string layout names the modules.`
          ],
          result: `The curve is a diagnostic; the power reading is only a score.`
        },
        mistake: `Comparing an uncorrected curve with the datasheet and calling the difference degradation. Irradiance and temperature explain most of it, and the remaining few percent is what you are actually measuring.`,
        check: `What must be recorded alongside an I-V curve? Answer: irradiance and cell temperature.`
      },
      {
        h: 'BESS: parameters are the specification, and tests prove them',
        p: [
          `IEC 62933-2-1 lists the unit parameters that define a storage system — nominal energy capacity, input and output power rating, round-trip efficiency, expected service life, system response, auxiliary power consumption, self-discharge, and rated voltage and frequency ranges — and gives a test method for each.`,
          `It also classifies by application: Class A for frequency regulation, fluctuation reduction and voltage regulation; Class B for peak shaving and shifting; Class C for backup. The class tells you which parameters matter most, and therefore which tests are decisive.`,
          `The practical consequence is that "capacity" and "efficiency" are not single numbers. Each must be stated with its measurement boundary — DC terminals or POI — and with the auxiliary load either included or excluded. A test that does not state its boundary is not comparable with any other test.`,
          `Ask for the parameter list as a table with the test method and boundary in the same row, and the specification becomes enforceable.`
        ],
        formula: 'Parameter + test method + boundary = a specification you can enforce',
        example: {
          title: 'Worked example — one cycle, three numbers',
          steps: [
            `Charge: 454.5 MWh drawn at the POI.`,
            `Discharge: 400 MWh delivered at the POI, so round-trip efficiency is 88 %.`,
            `Measured at the DC terminals instead, the same plant might read 94 % — because transformers and cabling are outside the boundary.`,
            `Both numbers are true; only one belongs in the contract.`
          ],
          result: `Always ask where the boundary was drawn before comparing two efficiencies.`
        },
        mistake: `Accepting a supplier's efficiency figure without the boundary and the auxiliary-power treatment. Two datasheets can both say 88 % and describe different plants.`,
        check: `Which IEC document defines the unit parameters and test methods for EES? Answer: IEC 62933-2-1.`
      },
      {
        h: 'Acceptance: what makes a test defensible',
        p: [
          `A test is defensible when four things are recorded: the method, the conditions, the measured value, and the value it was compared against. Miss any one and the result becomes an opinion in the first dispute.`,
          `Witnessing matters as much as measuring. The DSO witnesses the protection and interface tests; the lender's engineer may witness the capacity test; the insurer may want the fire-system test. Each witness needs the procedure in advance, not the result afterwards.`,
          `And the record has to survive its owner. Six years later the commissioning engineer has moved on, and the only defence is a document that says what was measured, how, and against what — signed by someone whose name is still recognisable.`,
          `If you cannot reconstruct the test from the record a year later, it was a measurement, not evidence.`,
          `The witness list, the procedure and the acceptance criteria belong in one annex, circulated before the test week. Anything agreed during the test is a negotiation, and negotiations remembered differently become claims.`
        ],
        formula: 'Method · conditions · measured · expected · signature',
        example: {
          title: 'Worked example — the test that could not be defended',
          steps: [
            `A capacity test records "400 MWh delivered, pass".`,
            `No boundary, no ambient temperature, no auxiliary-load statement.`,
            `Two years later the offtaker measures 380 MWh at the meter and claims a shortfall.`,
            `The owner cannot prove the original number was measured at the same place.`
          ],
          result: `An unqualified number is not evidence; it is a memory with a decimal point.`
        },
        mistake: `Recording only the verdict. "Pass" is a conclusion; the numbers and conditions are the evidence that supports it.`,
        check: `What four things must a defensible test record? Answer: method, conditions, measured value, comparison value.`
      }
    ],
    renderExtra: drawTestGallery,
    drills: [
      { id: 'mtc-d1', q: 'Which IEC standard governs PV system documentation, commissioning tests and inspection?',
        type: 'text', accept: ['62446-1', 'iec 62446-1', '62446'],
        why: 'IEC 62446-1. Part 2 covers maintenance, and both are used together.' },
      { id: 'mtc-d2', q: 'In the PV Category 1 regime, which test comes before polarity — continuity or insulation resistance?',
        type: 'text', accept: ['continuity', 'continuity of earthing and bonding'],
        why: 'Continuity. Prove the safety path first, then polarity, measurement, functional tests, and insulation last with the array isolated.' },
      { id: 'mtc-d3', q: 'A 20-module string of 40 V modules should read what open-circuit voltage, in V?',
        unit: 'V', answer: 800, tol: 5,
        why: '20 × 40 = 800 V at reference conditions. A lower reading means missing or different modules.' },
      { id: 'mtc-d4', q: 'What does a reversed string still produce that can mislead you?',
        type: 'text', accept: ['voltage', 'open circuit voltage', 'a voltage reading'],
        why: 'Voltage. Polarity is a separate test because a reversed string reads a plausible voltage while producing almost no current.' },
      { id: 'mtc-d5', q: 'Which two conditions must be recorded with an I-V curve?',
        type: 'text', accept: ['irradiance and cell temperature', 'irradiance and temperature', 'temperature and irradiance'],
        why: 'Irradiance and cell temperature. Without them the curve cannot be corrected or compared.' },
      { id: 'mtc-d6', q: 'Which IEC standard defines EES unit parameters and their test methods?',
        type: 'text', accept: ['62933-2-1', 'iec 62933-2-1', '62933'],
        why: 'IEC 62933-2-1. It lists nominal energy, power rating, RTE, service life, response, auxiliary power, self-discharge and voltage/frequency ranges.' },
      { id: 'mtc-d7', q: 'In 62933-2-1, which class covers peak shaving and shifting?',
        type: 'text', accept: ['class b', 'b', 'class b peak shaving'],
        why: 'Class B. Class A is frequency regulation, fluctuation reduction and voltage regulation; Class C is backup power.' },
      { id: 'mtc-d8', q: 'A test draws 454.5 MWh and returns 400 MWh, both at the POI. Round-trip efficiency, in %?',
        unit: '%', answer: 88, tol: 0.3,
        why: '400 ÷ 454.5 = 88 %. The same plant measured at the DC terminals would show a higher figure.' },
      { id: 'mtc-d9', q: 'Which stage tests the installed system against the design at site?',
        type: 'text', accept: ['sat', 'site acceptance test', 'site acceptance testing'],
        why: 'Site acceptance testing. Factory acceptance tests the product; SAT tests the integration and the design.' },
      { id: 'mtc-d10', q: 'What must a FAT certificate name besides the product, to remain valid as evidence?',
        type: 'text', accept: ['firmware version', 'the configuration', 'configuration and firmware', 'version'],
        why: 'The configuration and firmware version. A certificate for a different build proves nothing about what was delivered.' },
      { id: 'mtc-d11', q: 'Name the four things that make a test defensible.',
        type: 'text', accept: ['method conditions measured expected', 'method, conditions, measured value, comparison value'],
        why: 'Method, conditions, measured value and the value compared against — plus a signature that survives its owner.' },
      { id: 'mtc-d12', q: 'Which IEC standard provides the cell-level safety test evidence behind a BESS?',
        type: 'text', accept: ['62619', 'iec 62619'],
        why: 'IEC 62619 — safety requirements for secondary lithium cells and batteries for industrial applications.' }
    ]
  });
})();
