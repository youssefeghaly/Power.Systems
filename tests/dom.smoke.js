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

['calc.js','content.js','m1.js','m2.js','m3.js','m4.js','m5.js','m6.js','m7.js','m8.js','m9.js','m10.js','m11.js','m12.js','m13.js','m14.js','m15.js','m16.js','app.js'].forEach((f) => {
  window.eval(fs.readFileSync(path.join(dir, f), 'utf8'));
});
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

let fail = 0;
const ok = (c, m, d) => { if (c) console.log('  ok   ' + m); else { fail++; console.log('  FAIL ' + m + (d ? ' — ' + d : '')); } };
const fire = (el, type) => el.dispatchEvent(new window.Event(type, { bubbles: true }));

console.log('boot');
ok($('module-select').options.length === 16, 'module picker lists sixteen modules', String($('module-select').options.length));
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

console.log('module 4 stepper');
$('module-select').value = 'm4';
fire($('module-select'), 'change');
ok(/German grid connection/.test($('lesson').textContent), 'module 4 lesson renders');
const steps = $('lesson').querySelectorAll('.step');
ok(steps.length === 7, 'seven process gates', String(steps.length));
fire(steps[0], 'click');
ok(/Anschlussanfrage/.test($('lesson').querySelector('#step-detail').textContent), 'tapping a gate updates the detail');
ok(steps[0].classList.contains('active'), 'active gate is marked');

console.log('module 4 rule finder');
$('tab-calc').click();
const g = () => $('gc-out').textContent.replace(/\s+/g, ' ');
ok(/4120/.test(g()), '110 kV → 4120', g().slice(0, 60));
ok(/required/.test(g()), 'default plant needs certification');
$('gc-power').value = '100';
$('gc-volt').value = '0.4';
fire($('gc-power'), 'input'); fire($('gc-volt'), 'input');
ok(/4105/.test(g()), '100 kW at 400 V → 4105');
ok(/not required — conformity/.test(g()), 'small plant needs no plant certificate', g().slice(0, 80));
$('gc-power').value = '400';
$('gc-feed').value = '270';
$('gc-volt').value = '20';
fire($('gc-power'), 'input'); fire($('gc-feed'), 'input'); fire($('gc-volt'), 'input');
ok(/4110/.test(g()), '20 kV → 4110');
ok(flat(g()).includes(flat('NELEV §2(4) simplificationavailable')), 'inside the envelope the simplification applies', g().slice(0, 120));
$('gc-power').value = '900';
fire($('gc-power'), 'input');
ok(/not available/.test(g()), '900 kW falls outside the envelope');

console.log('module 4 drills');
$('tab-drill').click();
const D4 = window.MODULES.find((m) => m.id === 'm4').drills;
let g4 = 0;
while (g4++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D4.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 4 drills complete');

console.log('module 5 protection');
$('module-select').value = 'm5';
fire($('module-select'), 'change');
ok(/Protection and fault levels/.test($('lesson').textContent), 'module 5 lesson renders');
$('tab-calc').click();
ok(!!$('p-chart').querySelector('.tcc-down'), 'downstream curve drawn');
ok(!!$('p-chart').querySelector('.tcc-up'), 'upstream curve drawn');
const po = () => $('p-out').textContent.replace(/\s+/g, ' ');
ok(/coordinated/.test(po()), 'default settings are coordinated', po().slice(0, 100));
ok(/25\.40 kA/.test($('p-ik').textContent.replace(/\s+/g, ' ')), 'fault level 25.40 kA for 20 kV / 0.5 Ω', $('p-ik').textContent.slice(0, 60));
$('p-up-tms').value = '0.02';
fire($('p-up-tms'), 'input');
ok(/not coordinated/.test(po()), 'too-fast upstream is rejected');
$('p-fault').value = '150';
fire($('p-fault'), 'input');
ok(/not coordinated|does not trip/.test(po()), 'fault below pickup does not claim coordination');

console.log('module 5 drills');
$('tab-drill').click();
const D5 = window.MODULES.find((m) => m.id === 'm5').drills;
let g5 = 0;
while (g5++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D5.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 5 drills complete');

console.log('module 6 earthing');
$('module-select').value = 'm6';
fire($('module-select'), 'change');
ok(/Earthing and EMC/.test($('lesson').textContent), 'module 6 lesson renders');
$('tab-calc').click();
const eo = () => $('e-out').textContent.replace(/\s+/g, ' ');
ok(/33\.49 Ω/.test(eo()), 'default rod gives 33.49 Ω', eo().slice(0, 60));
const expectedEPR = Math.round(window.Calc.epr(500, window.Calc.earthRod(100, 3, 0.008)));
ok(eo().replace(/,/g, '').includes(String(expectedEPR) + ' V'), 'EPR equals 500 A x the computed resistance', 'expected ' + expectedEPR + ', got ' + eo().slice(0, 90));
$('e-type').value = 'ring';
$('e-size').value = '10';
fire($('e-type'), 'change'); fire($('e-size'), 'input');
ok(/4\.67 Ω/.test(eo()), 'ring gives 4.67 Ω', eo().slice(0, 60));
$('e-limit').value = '100';
fire($('e-limit'), 'input');
ok(/Above the limit/.test($('e-note').textContent), 'a low limit is flagged as a design problem', $('e-note').textContent.slice(0, 50));

console.log('module 6 drills');
$('tab-drill').click();
const D6 = window.MODULES.find((m) => m.id === 'm6').drills;
let g6 = 0;
while (g6++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D6.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 6 drills complete');

console.log('module 7 cables');
$('module-select').value = 'm7';
fire($('module-select'), 'change');
ok(/Cables and laying/.test($('lesson').textContent), 'module 7 lesson renders');
$('tab-calc').click();
const co = () => $('cb-out').textContent.replace(/\s+/g, ' ');
ok(/108\.0 A/.test(co()), 'derated capacity 150 x 0.9 x 0.8 = 108 A', co().slice(0, 70));
ok(/1\.30 %/.test(co()), 'drop shown as 1.30 % of 400 V', co().slice(0, 90));
ok(/55\.3|55\.0/.test($('cb-sc').textContent.replace(/\s+/g, ' ')), 'adiabatic minimum area appears', $('cb-sc').textContent.slice(0, 60));
$('cb-ib').value = '150';
fire($('cb-ib'), 'input');
ok(/fail/.test(co()), 'overloading flips the thermal verdict');
ok(/thermal/.test(co()), 'binding constraint reports thermal');

console.log('module 7 drills');
$('tab-drill').click();
const D7 = window.MODULES.find((m) => m.id === 'm7').drills;
let g7 = 0;
while (g7++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D7.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 7 drills complete');

console.log('module 8 HV installation');
$('module-select').value = 'm8';
fire($('module-select'), 'change');
ok(/The HV installation/.test($('lesson').textContent), 'module 8 lesson renders');
const hvNodes = $('lesson').querySelectorAll('.sld-node');
ok(hvNodes.length === 8, 'eight HV devices drawn', String(hvNodes.length));
ok(/Circuit breaker/.test($('lesson').querySelector('#hv-detail').textContent), 'default detail shown');
const ds = [...hvNodes].find((n) => n.getAttribute('data-node') === 'ds1');
fire(ds, 'click');
ok(/Disconnector/.test($('lesson').querySelector('#hv-detail').textContent), 'tapping a device updates the panel');
$('tab-calc').click();
const to = () => $('tx-out').textContent.replace(/\s+/g, ' ');
ok(/4\.37 kA/.test(to()), '100 MVA / 110 kV / 12 % → 4.37 kA', to().slice(0, 60));
$('tx-uk').value = '24';
fire($('tx-uk'), 'input');
ok(/2\.19 kA/.test(to()), 'doubling impedance halves the fault current');

console.log('module 8 drills');
$('tab-drill').click();
const D8 = window.MODULES.find((m) => m.id === 'm8').drills;
let g8 = 0;
while (g8++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D8.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 8 drills complete');

console.log('module 9 MV connection');
$('module-select').value = 'm9';
fire($('module-select'), 'change');
ok(/The MV connection/.test($('lesson').textContent), 'module 9 lesson renders');
const mvNodes = $('lesson').querySelectorAll('.sld-node');
ok(mvNodes.length === 6, 'six station components drawn', String(mvNodes.length));
ok(/customer transformer/i.test($('lesson').querySelector('#mv-detail').textContent), 'default detail is the transformer');
$('tab-calc').click();
const mo = () => $('mv-out').textContent.replace(/\s+/g, ' ');
ok(/84\.2 %/.test(mo()), 'loading 84.2 % for 4 MW at 0.95 on 5 MVA', mo().slice(0, 80));
ok(/120\.2\d kA/.test(mo()), 'LV fault 120 kA behind 5 MVA at 6 %', mo().slice(0, 120));
$('mv-kva').value = '3000';
fire($('mv-kva'), 'input');
ok(/140\.4 %|140\.3 %/.test(mo()), 'undersized transformer shows overload', mo().slice(0, 80));

console.log('module 9 drills');
$('tab-drill').click();
const D9 = window.MODULES.find((m) => m.id === 'm9').drills;
let g9 = 0;
while (g9++ < 60 && !/All 12 solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const d = D9.find((x) => x.q === qEl.textContent);
  if (!d) break;
  $('answer').value = d.type === 'text' ? d.accept[0] : String(d.answer);
  $('check').click();
  const nx = $('next');
  if (nx) nx.click();
}
ok(/All 12 solved/.test($('drill-body').textContent), 'module 9 drills complete');

console.log(fail === 0 ? '\nDOM SMOKE PASSED' : '\n' + fail + ' FAILED');
process.exit(fail ? 1 : 0);
