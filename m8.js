/* Module 8 — the HV installation: switchgear, transformers, instrument transformers. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  /* ---------- substation single-line ---------- */
  var NODES = [
    { id: 'ds1', x: 60, y: 80, w: 104, h: 56, label: 'Disconnector',
      title: 'Disconnector (Trennschalter)',
      what: 'Isolates a circuit for work. It cannot break load current — opening it under load draws an arc that does not stop.',
      spec: 'Rated current, rated short-time current, and the interlocks that prevent operation under load.',
      risk: 'Interlocks are the safety case. A defeated interlock is how people die in substations.' },

    { id: 'cb1', x: 190, y: 80, w: 104, h: 56, label: 'Circuit breaker',
      title: 'Circuit breaker (Leistungsschalter)',
      what: 'Breaks load and fault current. This is the device that clears faults and the only switching device allowed to operate under load.',
      spec: 'Rated short-circuit current, breaking time, mechanical endurance, and the trip coil arrangement.',
      risk: 'Its rating must exceed the calculated fault level — otherwise it fails to clear, destructively.' },

    { id: 'ct1', x: 320, y: 80, w: 96, h: 56, label: 'CT',
      title: 'Current transformer',
      what: 'Scales primary current down for protection and metering. Separate cores: one for protection, one for billing.',
      spec: 'Ratio, accuracy class (0.2S for metering, 5P/10P for protection), and burden.',
      risk: 'Exceed the burden and it saturates at the fault current, exactly when the relay needs it.' },

    { id: 'vt', x: 100, y: 250, w: 96, h: 56, label: 'VT',
      title: 'Voltage transformer',
      what: 'Scales voltage down for protection, metering and synchronism checks.',
      spec: 'Ratio, class, burden, and where it is fused — a VT fuse blowing silently disables protection that depends on it.',
      risk: 'Two VTs on one busbar that disagree are a commissioning problem you find only by testing both.' },

    { id: 'ct2', x: 470, y: 330, w: 96, h: 56, label: 'CT',
      title: 'Current transformer, transformer bay',
      what: 'Measures the current into the main power transformer — the basis for differential protection and for billing the offtaker.',
      spec: 'Class 5P for differential, 0.2S for metering. The two must not be the same core.',
      risk: 'Differential protection compares both ends; mismatched CT classes produce false trips or blindness.' },

    { id: 'cb2', x: 600, y: 330, w: 104, h: 56, label: 'Breaker',
      title: 'Circuit breaker, transformer bay',
      what: 'Clears faults on the transformer and its LV side. It also carries the inrush current when the transformer is energised.',
      spec: 'Rated current sized for transformer overload, plus the withstand for inrush.',
      risk: 'Inrush looks like a fault to a badly set relay — nuisance trips on every energisation.' },

    { id: 'ds2', x: 730, y: 330, w: 96, h: 56, label: 'Disconnector',
      title: 'Disconnector, transformer bay',
      what: 'Isolates the transformer for maintenance, after the breaker has opened.',
      spec: 'Interlocked with the breaker and with the earthing switch.',
      risk: 'Earthing switch closed while the circuit is live is the classic fatal error; interlocking is the answer.' },

    { id: 'mpt', x: 700, y: 430, w: 130, h: 56, label: 'MPT',
      title: 'Main power transformer',
      what: '110 kV to the MV collection level. Its impedance sets how much fault current reaches the LV side.',
      spec: 'Rating in MVA, impedance uk %, vector group, cooling class, tap changer range.',
      risk: 'A high-impedance transformer limits fault current but costs you voltage regulation and reactive power.' }
  ];

  var LINKS = [
    ['ds1', 'cb1'], ['cb1', 'ct1'],
    ['ct2', 'cb2'], ['cb2', 'ds2']
  ];

  function node(id) {
    for (var i = 0; i < NODES.length; i++) if (NODES[i].id === id) return NODES[i];
    return null;
  }

  function drawSubstation(host) {
    var p = [];
    p.push('<svg viewBox="0 0 880 520" class="sld" role="img" aria-label="110 kV substation single-line diagram">');
    p.push('<defs><marker id="hv-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">' +
           '<path d="M0,0 L8,4 L0,8 z" class="arrowhead"/></marker></defs>');

    /* busbar */
    p.push('<line x1="40" y1="215" x2="850" y2="215" class="busbar"/>');
    p.push('<text x="40" y="203" class="sld-note">110 kV busbar</text>');

    /* grid connection and drops */
    p.push('<line x1="112" y1="40" x2="112" y2="80" class="sld-line" marker-end="url(#hv-arrow)"/>');
    p.push('<text x="112" y="30" class="sld-note" text-anchor="middle">grid</text>');

    LINKS.forEach(function (pair) {
      var a = node(pair[0]), b = node(pair[1]);
      var y = a.y + a.h / 2;
      p.push('<line x1="' + (a.x + a.w) + '" y1="' + y + '" x2="' + (b.x - 3) + '" y2="' + y +
             '" class="sld-line" marker-end="url(#hv-arrow)"/>');
    });

    /* ct1 down to busbar */
    p.push('<line x1="368" y1="136" x2="368" y2="212" class="sld-line" marker-end="url(#hv-arrow)"/>');
    /* vt up to busbar */
    p.push('<line x1="148" y1="218" x2="148" y2="247" class="sld-line" marker-end="url(#hv-arrow)"/>');
    /* busbar down to ct2 */
    p.push('<line x1="518" y1="218" x2="518" y2="327" class="sld-line" marker-end="url(#hv-arrow)"/>');
    /* ds2 down to transformer */
    p.push('<line x1="778" y1="386" x2="778" y2="427" class="sld-line" marker-end="url(#hv-arrow)"/>');

    p.push('<text x="765" y="510" class="sld-note" text-anchor="middle">to MV collection →</text>');

    NODES.forEach(function (n) {
      p.push('<g class="sld-node" data-node="' + n.id + '" tabindex="0" role="button" aria-label="' + n.title + '">');
      p.push('<rect x="' + n.x + '" y="' + n.y + '" width="' + n.w + '" height="' + n.h + '" rx="12"' +
             (n.id === 'mpt' ? ' class="hl"' : '') + '/>');
      p.push('<text x="' + (n.x + n.w / 2) + '" y="' + (n.y + n.h / 2 + 6) + '" text-anchor="middle">' + n.label + '</text>');
      p.push('</g>');
    });

    p.push('</svg>');

    host.innerHTML =
      '<div class="card">' +
        '<h2>A 110 kV substation, in one line</h2>' +
        '<p class="muted">Tap any device. The order — disconnector, breaker, CT — is not arbitrary: it is what makes the installation safe to work on.</p>' +
        '<div id="hv-wrap">' + p.join('') + '</div>' +
        '<div id="hv-detail" class="node-detail"></div>' +
      '</div>';

    var wrap = host.querySelector('#hv-wrap');
    var detail = host.querySelector('#hv-detail');

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
    select('cb1');
  }

  /* ---------- transformer impedance / fault level ---------- */
  var calcHTML =
    '<div class="card">' +
      '<h2>Why impedance is a design decision</h2>' +
      '<p class="muted">A transformer limits the fault current on its LV side. The higher the impedance, the gentler the fault — and the worse the voltage regulation.</p>' +
      '<div class="grid">' +
        '<label><span>Transformer rating</span><input id="tx-mva" type="text" inputmode="decimal" value="100" /><span class="hint">MVA</span></label>' +
        '<label><span>LV-side voltage</span><input id="tx-kv" type="text" inputmode="decimal" value="110" /><span class="hint">kV</span></label>' +
        '<label><span>Impedance u_k</span><input id="tx-uk" type="text" inputmode="decimal" value="12" /><span class="hint">%</span></label>' +
        '<label><span>Upstream fault level</span><input id="tx-up" type="text" inputmode="decimal" value="40" /><span class="hint">kA</span></label>' +
      '</div>' +
      '<div id="tx-out" class="results"></div>' +
      '<div id="tx-note" class="gc-note"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Vector groups, in one paragraph</h2>' +
      '<p>A vector group like <strong>YNd5</strong> says three things: the HV winding is star (Y) with its neutral brought out (N), the LV winding is delta (d), and the LV phasor is displaced 5 × 30° from the HV.</p>' +
      '<p>It matters twice: parallel transformers must share the same group, and the displacement decides whether your LV phasors line up with the grid you are connecting to. Getting it wrong means a transformer that cannot be paralleled — or a plant that cannot be commissioned.</p>' +
      '<p class="muted">Cooling class (ONAN/ONAF) sets the rating you may actually use; tap changer range sets how much voltage excursion you can absorb.</p>' +
    '</div>';

  function initCalc(root) {
    var $ = function (id) { return root.querySelector('#' + id); };
    var n = function (id) { return parseFloat(String($(id).value).replace(',', '.')); };

    function update() {
      var mva = n('tx-mva'), kv = n('tx-kv'), uk = n('tx-uk'), up = n('tx-up');
      var out = $('tx-out'), note = $('tx-note');

      if (!(mva > 0) || !(kv > 0) || !(uk > 0)) {
        out.innerHTML = '<div class="row"><span>Waiting for input</span><strong>rating, voltage, impedance</strong></div>';
        note.textContent = '';
        return;
      }

      var ikTx = (mva * 1e6) / (Math.sqrt(3) * kv * 1000 * (uk / 100)) / 1000;
      var total = up > 0 ? 1 / (1 / up + 1 / ikTx) : ikTx;

      out.innerHTML =
        '<div class="row"><span>Fault current limited by the transformer</span><strong>' + ikTx.toFixed(2) + ' kA</strong></div>' +
        '<div class="row"><span>With the upstream network</span><strong>' + total.toFixed(2) + ' kA</strong></div>' +
        '<div class="row"><span>Ratio upstream : transformer</span><strong>' + (up > 0 ? (up / ikTx).toFixed(2) : '—') + ' ×</strong></div>';

      note.textContent = uk < 8
        ? 'Low impedance: stiff voltage, but a high fault level and expensive switchgear downstream.'
        : uk > 16
          ? 'High impedance: gentle fault current, but poor voltage regulation and more reactive power to manage.'
          : 'Mid-range impedance — the usual compromise for a grid transformer.';
    }

    ['tx-mva', 'tx-kv', 'tx-uk', 'tx-up'].forEach(function (id) {
      $(id).addEventListener('input', update);
    });
    update();
  }

  var DRILLS = [
    { id: 'm8-d1', q: 'A 100 MVA transformer at 110 kV with u_k = 12 %. Fault current on the LV side, in kA?',
      unit: 'kA', answer: 4.37, tol: 0.05,
      why: 'I_k = S / (√3 · U · u_k) = 100 000 / (√3 × 110 × 0.12) = 4.37 kA. This is what the transformer lets through, before the network is added.' },

    { id: 'm8-d2', q: 'Same rating and voltage, u_k = 24 %. Fault current, in kA?',
      unit: 'kA', answer: 2.19, tol: 0.05,
      why: '2.19 kA — half. Doubling impedance halves the fault current, which is why u_k is chosen with switchgear cost in mind.' },

    { id: 'm8-d3', q: 'A 300 MVA transformer at 220 kV with u_k = 15 %. Fault current, in kA?',
      unit: 'kA', answer: 5.25, tol: 0.06,
      why: '5.25 kA. Higher voltage and rating both push the fault level up; impedance is the only lever you control.' },

    { id: 'm8-d4', q: 'Which device may break fault current: the disconnector or the circuit breaker?',
      type: 'text', accept: ['circuit breaker', 'breaker', 'leistungsschalter', 'the circuit breaker'],
      why: 'The circuit breaker. A disconnector isolates; opening it under load draws an arc it cannot extinguish.' },

    { id: 'm8-d5', q: 'In the vector group YNd5, what does the "d" tell you?',
      type: 'text', accept: ['delta', 'delta winding', 'dreieck', 'the lv winding is delta'],
      why: 'The LV winding is delta. Y is star on the HV side, N means the neutral is brought out, 5 is the clock-number displacement.' },

    { id: 'm8-d6', q: 'Which CT core class is used for billing rather than protection?',
      type: 'text', accept: ['0.2s', '0.2', 'class 0.2s', 'metering class', '0.5s'],
      why: '0.2S (or 0.5S) — accuracy classes for metering. Protection cores use 5P or 10P, defined by composite error at the fault current.' },

    { id: 'm8-d7', q: 'Why are metering and protection on separate CT cores?',
      type: 'text', accept: ['different accuracy requirements', 'metering needs accuracy protection needs saturation behaviour', 'accuracy versus saturation', 'so protection can saturate without affecting billing'],
      why: 'Metering needs accuracy at normal current; protection needs defined behaviour at fault current, where a metering core would saturate. One core cannot serve both.' },

    { id: 'm8-d8', q: 'What does a double busbar arrangement buy you?',
      type: 'text', accept: ['redundancy', 'maintenance without outage', 'availability', 'redundancy and maintenance without shutdown'],
      why: 'Redundancy: a bay can be transferred to the other bar so the busbar or a breaker can be maintained without taking the plant off.' },

    { id: 'm8-d9', q: 'Which is more compact, AIS or GIS?',
      type: 'text', accept: ['gis', 'gas insulated', 'gas-insulated switchgear'],
      why: 'GIS — gas-insulated switchgear. It is far smaller and enclosed, which is why it is used indoors and in dense urban sites; the trade is cost and gas handling.' },

    { id: 'm8-d10', q: 'An 80 MVA transformer at 110 kV with u_k = 9 %. Fault current, in kA?',
      unit: 'kA', answer: 4.67, tol: 0.06,
      why: '4.67 kA. Note how little the rating changed the answer versus the impedance: 9 % is what makes it stiff.' },

    { id: 'm8-d11', q: 'What does the earthing switch do, and when is it operated?',
      type: 'text', accept: ['earths the circuit for work after isolation', 'connects to earth for maintenance', 'earths the circuit after the disconnector opens', 'safety earthing'],
      why: 'It connects the isolated section to earth so it cannot become live while someone works on it. It is interlocked with the disconnector — never closed on a live circuit.' },

    { id: 'm8-d12', q: 'A transformer has u_k = 6 % instead of 12 %. What happens to the LV fault current?',
      type: 'text', accept: ['doubles', 'it doubles', 'increases twofold', 'twice as high'],
      why: 'It doubles. Half the impedance, double the current — and every LV device must now be rated for it.' }
  ];

  window.MODULES.push({
    id: 'm8',
    number: '08',
    title: 'The HV installation',
    lead: 'Switchgear, transformers and instrument transformers — enough to specify and review, not to design a 380 kV station.',
    sections: [
      {
        h: 'The chain, and why the order matters',
        p: [
          'An HV bay is a sequence: <strong>disconnector → circuit breaker → current transformer → busbar</strong>. Each device exists because the one before it cannot do its job.',
          'The disconnector isolates for work but cannot break load. The breaker breaks load and fault current but does not provide a visible isolation gap. The CT measures, so protection has something to act on.',
          'Reversing or omitting a device is not a layout preference — it changes what is safe to operate and what the protection can see.'
        ],
        formula: 'Isolate → break → measure → distribute'
      },
      {
        h: 'Switchgear: AIS, GIS, and what you are buying',
        p: [
          '<strong>AIS</strong> (air-insulated) is the outdoor yard with visible gaps: cheap, maintainable, and large. <strong>GIS</strong> (gas-insulated) is compact, enclosed and expensive, used indoors or where space is scarce.',
          'Every bay needs the same functional set: breaker, disconnectors on both sides, earthing switches, CTs, VTs, and interlocks that make the wrong sequence impossible.',
          'Interlocking is the safety case, not a convenience. A defeated interlock is how a maintenance technician closes an earthing switch onto a live circuit.'
        ],
        formula: 'AIS: space and visibility · GIS: compact and enclosed'
      },
      {
        h: 'Busbars and redundancy',
        p: [
          'A single busbar is cheapest and means any busbar fault takes the whole station off. A double busbar lets a bay be transferred so a bar or breaker can be maintained without an outage.',
          'Sectionalised busbars limit how much is lost when one section trips. Each step up in redundancy is a step up in cost, switchgear count and complexity.',
          'For a BESS, the question is what the offtake and the DSO require: availability obligations decide the arrangement, not engineering taste.'
        ],
        formula: 'Single → double → sectionalised: availability bought with copper'
      },
      {
        h: 'Transformers: four parameters that decide everything',
        p: [
          '<strong>Rating</strong> (MVA), <strong>impedance</strong> (u_k %), <strong>vector group</strong> (e.g. YNd5) and <strong>cooling class</strong> (ONAN/ONAF). Get these right and the transformer is boring for thirty years.',
          'Impedance sets the fault current on the LV side — <code>I_k = S / (√3 · U · u_k)</code>. Lower impedance means better voltage regulation and more expensive switchgear downstream.',
          'Vector group decides what can be paralleled and whether the LV phasors match the network. Cooling class decides which rating you may actually use, and for how long.'
        ],
        formula: 'I_k = S / (√3 · U · u_k)   ·   u_k 12 % → 4.37 kA from 100 MVA at 110 kV'
      },
      {
        h: 'Instrument transformers',
        p: [
          'CTs step current down; VTs step voltage down. Both must be accurate at normal current and honest at fault current — which is why one device rarely does both jobs.',
          'Metering cores use accuracy classes (0.2S, 0.5S) defined near rated current. Protection cores use 5P or 10P, defined by composite error at the fault current. Separate cores, separate wires, separate terminals.',
          'Burden — the total impedance of the secondary loop — must stay below the rated value, or the CT saturates exactly when the relay needs it.'
        ],
        formula: '0.2S for money · 5P/10P for protection · burden decides honesty'
      },
      {
        h: 'Layout, clearances, and where the DSO enters',
        p: [
          'Clearances are set by voltage, by the standard and by the DSO — and they drive the size of the yard. Phase spacing, safety distances to fences and buildings, and access roads are all fixed early and expensive to change.',
          'The interface to the DSO is the metering point and the protection signalling. Your relay must trip their breaker or signal theirs, and the coordination of the two protection worlds is agreed in writing before commissioning.',
          'We do not hold DIN EN 61936-1 or VDE 0101, so this module teaches composition and selection, and leaves clearance tables to the standard and the DSO\'s TAB.'
        ],
        formula: 'Clearances fix the layout early · protection interface agreed in writing'
      }
    ],
    renderExtra: drawSubstation,
    calc: { html: calcHTML, init: initCalc },
    drills: DRILLS
  });
})();
