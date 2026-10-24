/* Module 1 registration: uses the data in content.js, adds its own calculator. */
(function () {
  'use strict';

  window.MODULES = window.MODULES || [];

  var calcHTML =
    '<div class="card">' +
      '<h2>Size a plant</h2>' +
      '<p class="muted">Contract numbers in, hardware out. Losses gross up — watch the DC figure exceed the POI figure.</p>' +
      '<div class="grid">' +
        '<label>Power at POI<input id="in-mw" type="text" inputmode="decimal" value="100" /><span class="hint">MW</span></label>' +
        '<label>Duration<input id="in-hours" type="text" inputmode="decimal" value="4" /><span class="hint">hours</span></label>' +
        '<label>Losses DC → POI<input id="in-loss" type="text" inputmode="decimal" value="8" /><span class="hint">%</span></label>' +
        '<label>Container size<input id="in-box" type="text" inputmode="decimal" value="5" /><span class="hint">MWh</span></label>' +
      '</div>' +
      '<div id="plant-out" class="results"></div>' +
    '</div>' +
    '<div class="card">' +
      '<h2>Cell and string</h2>' +
      '<p class="muted">Series adds voltage, keeps amp-hours. Parallel adds amp-hours, keeps voltage.</p>' +
      '<div class="grid">' +
        '<label>Cell voltage<input id="in-volts" type="text" inputmode="decimal" value="3.2" /><span class="hint">V</span></label>' +
        '<label>Cell capacity<input id="in-ah" type="text" inputmode="decimal" value="314" /><span class="hint">Ah</span></label>' +
        '<label>Cells in series<input id="in-cells" type="text" inputmode="decimal" value="416" /><span class="hint">pcs</span></label>' +
      '</div>' +
      '<div id="cell-out" class="results"></div>' +
    '</div>';

  function num(el) {
    var v = parseFloat(String(el.value).replace(',', '.'));
    return isFinite(v) ? v : NaN;
  }

  function fmt(x, d) {
    if (!isFinite(x)) return '—';
    return x.toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  function rows(list) {
    return list.map(function (r) {
      return '<div class="row"><span>' + r[0] + '</span><strong>' + r[1] + '</strong></div>';
    }).join('');
  }

  function init(root) {
    var $ = function (id) { return root.querySelector('#' + id); };

    function updatePlant() {
      var mw = num($('in-mw')), hours = num($('in-hours'));
      var loss = num($('in-loss')), box = num($('in-box'));
      var out = $('plant-out');
      var ok = mw > 0 && hours > 0 && loss >= 0 && loss < 100 && box > 0;

      if (!ok) {
        out.innerHTML = rows([['Waiting for input', 'power, duration, loss 0–99 %, container > 0']]);
        return;
      }

      var ePoi = mw * hours;
      var eDc = Calc.grossUp(ePoi, loss);
      var boxes = Calc.containers(eDc, box);
      var installed = boxes * box;

      out.innerHTML = rows([
        ['Energy at POI', fmt(ePoi, 1) + ' MWh'],
        ['Energy at DC terminals', fmt(eDc, 1) + ' MWh'],
        ['C-rate', fmt(Calc.cRate(hours), 3) + 'C'],
        ['Containers needed', boxes + ' × ' + fmt(box, 1) + ' MWh'],
        ['Installed DC energy', fmt(installed, 1) + ' MWh'],
        ['Overbuild vs required', fmt(Calc.overbuild(installed, eDc) * 100, 2) + ' %']
      ]);
    }

    function updateCell() {
      var volts = num($('in-volts')), ah = num($('in-ah')), cells = num($('in-cells'));
      var out = $('cell-out');
      var list = [];

      if (volts > 0 && ah > 0) {
        var wh = Calc.cellWh(volts, ah);
        list.push(['Cell energy', fmt(wh, 1) + ' Wh']);
        list.push(['… in kWh', fmt(wh / 1000, 4) + ' kWh']);
        list.push(['1,000 cells', fmt(wh / 1000, 3) + ' kWh']);
      }
      if (volts > 0 && cells > 0) {
        list.push(['String voltage', fmt(Calc.stringVoltage(cells, volts), 1) + ' V']);
      }
      out.innerHTML = rows(list.length ? list : [['Waiting for input', 'voltage and Ah']]);
    }

    ['mw', 'hours', 'loss', 'box'].forEach(function (id) {
      $('in-' + id).addEventListener('input', updatePlant);
    });
    ['volts', 'ah', 'cells'].forEach(function (id) {
      $('in-' + id).addEventListener('input', updateCell);
    });

    updatePlant();
    updateCell();
  }

  window.MODULES.push({
    id: 'm1',
    number: '01',
    title: 'Energy, power, time, money',
    lead: 'The arithmetic that every later module sits on. If this is solid, everything else is vocabulary.',
    sections: LESSON.sections,
    calc: { html: calcHTML, init: init },
    drills: DRILLS
  });
})();
