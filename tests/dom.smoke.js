/* Boots the real page in jsdom and drives it like a user. */
const fs = require('fs');
const path = require('path');

let JSDOM, VirtualConsole;
try {
  ({ JSDOM, VirtualConsole } = require(path.join(__dirname, '../../_tools/jsdom/node_modules/jsdom')));
} catch (e) {
  console.log('jsdom not installed — skipping DOM smoke test (npm i jsdom)');
  process.exit(0);
}

const dir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .replace(/<script src="\.\/[^"]+"><\/script>/g, '');

const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  if (!/Not implemented/.test(e.message)) console.error('page error:', e.message);
});

const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/', virtualConsole: vc });
const { window } = dom;
const $ = (id) => window.document.getElementById(id);

['calc.js', 'content.js', 'm1.js', 'm2.js', 'm3.js', 'app.js'].forEach((f) => {
  window.eval(fs.readFileSync(path.join(dir, f), 'utf8'));
});
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

let fail = 0;
const ok = (c, m, d) => { if (c) console.log('  ok   ' + m); else { fail++; console.log('  FAIL ' + m + (d ? ' — ' + d : '')); } };
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

console.log('boot');
ok($('module-select').options.length === 3, 'module picker lists three modules', String($('module-select').options.length));
ok(/Energy, power, time, money/.test($('lesson').textContent), 'module 1 lesson renders first');

console.log('module 1 calculator');
ok(/434\.8/.test($('plant-out').textContent), '100 MW / 4 h / 8 % → 434.8 MWh DC');
$('in-loss').value = '0';
fire($('in-loss'), 'input');
ok(/400\.0/.test($('plant-out').textContent), '0 % loss → 400 MWh DC');

console.log('switch to module 2');
$('module-select').value = 'm2';
fire($('module-select'), 'change');
ok(/The machine, end to end/.test($('lesson').textContent), 'module 2 lesson renders');
ok($('calc-host').querySelector('#rte-out') !== null, 'module 2 calculator swapped in');

console.log('diagram');
const nodes = $('lesson').querySelectorAll('.sld-node');
ok(nodes.length === 9, 'nine stages drawn', String(nodes.length));
ok(/Power conversion system/.test($('lesson').querySelector('.node-detail').textContent), 'default detail shown');
const poi = [...nodes].find((n) => n.getAttribute('data-node') === 'poi');
fire(poi, 'click');
ok(/Point of interconnection/.test($('lesson').querySelector('.node-detail').textContent), 'tapping POI updates the detail panel');
ok(poi.classList.contains('active'), 'selected node is marked active');

console.log('module 2 calculator');
$('tab-calc').click();
const out = $('rte-out');
ok(/88\.03/.test(out.textContent), 'defaults give 88.03 % RTE', out.textContent.slice(0, 80));
ok(/87\.50/.test(out.textContent), 'naive method shown as 87.50 %');
ok(/382\.9/.test(out.textContent), '435 MWh at 88.03 % → 382.9 MWh after losses');
$('rte-battery').value = '80';
fire($('rte-battery'), 'input');
ok(/74\.92/.test(out.textContent), 'battery at 80 % drags the system to 74.92 %', out.textContent.slice(0, 60));

console.log('module 2 drills');
$('tab-drill').click();
ok(!!$('answer'), 'drill view renders');
const DRILLS = window.MODULES.find((m) => m.id === 'm2').drills;
let guard = 0;
while (guard++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = DRILLS.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const next = $('next');
  if (next) next.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'completes with a done screen', $('drill-body').textContent.slice(0, 50));
ok($('count').textContent === '12 / 12 solved', 'module 2 progress reads 12 / 12', $('count').textContent);

console.log('per-module progress');
$('module-select').value = 'm1';
fire($('module-select'), 'change');
ok($('count').textContent === '0 / 12 solved', 'module 1 progress is untouched', $('count').textContent);
$('module-select').value = 'm2';
fire($('module-select'), 'change');
ok($('count').textContent === '12 / 12 solved', 'module 2 progress survives the switch', $('count').textContent);

console.log('module 3 planner');
$('module-select').value = 'm3';
fire($('module-select'), 'change');
ok(/Degradation, augmentation, guarantees/.test($('lesson').textContent), 'module 3 lesson renders');
ok(!!$('lesson').querySelector('.card'), 'lesson sections render');
$('tab-calc').click();
ok(!!$('dg-chart').querySelector('.chart-line'), 'planner draws a capacity line');
ok(/433\.1/.test($('dg-out').textContent), 'defaults reach 433.1 MWh at year 20', $('dg-out').textContent.slice(0, 90));
const flat = (x) => x.replace(/\s+/g, '');
ok(flat($('dg-out').textContent).includes(flat('Years below contract0')), 'no breach with both augmentations', flat($('dg-out').textContent).slice(0, 80));
$('dg-years').value = '';
fire($('dg-years'), 'input');
ok(flat($('dg-out').textContent).includes(flat('Years below contract9')), 'removing augmentation causes nine breach years', flat($('dg-out').textContent).slice(0, 80));
ok($('dg-chart').querySelectorAll('.chart-bad').length > 0, 'breach years are marked in red');
$('dg-rate').value = '0';
fire($('dg-rate'), 'input');
ok(flat($('dg-out').textContent).includes(flat('Years below contract0')), 'zero degradation never breaches');

console.log('module 3 drills');
$('tab-drill').click();
const D3 = window.MODULES.find((m) => m.id === 'm3').drills;
let g3 = 0;
while (g3++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D3.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 3 drills complete');

console.log(fail === 0 ? '\nDOM SMOKE PASSED' : '\n' + fail + ' FAILED');
process.exit(fail ? 1 : 0);
