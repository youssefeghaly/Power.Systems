/* Static checks across all modules: registry, content integrity, answer consistency. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('../calc.js');

const dir = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(dir, f), 'utf8');

let fail = 0;
const ok = (cond, msg, detail) => {
  if (cond) console.log('  ok   ' + msg);
  else { fail++; console.log('  FAIL ' + msg + (detail ? ' — ' + detail : '')); }
};

console.log('module registry');
const ctx = { window: {}, Calc: C, console };
vm.createContext(ctx);
['content.js', 'm1.js', 'm2.js', 'm3.js'].forEach((f) => vm.runInContext(read(f), ctx));
const MODULES = ctx.window.MODULES;
ok(Array.isArray(MODULES), 'MODULES array built');
ok(MODULES.length === 3, 'three modules registered', 'got ' + (MODULES || []).length);
ok(MODULES.map((m) => m.id).join(',') === 'm1,m2,m3', 'module order m1, m2, m3');

MODULES.forEach((m) => {
  ok(typeof m.number === 'string' && m.number.length === 2, m.id + ': has a number');
  ok(Array.isArray(m.sections) && m.sections.length >= 5, m.id + ': at least 5 lesson sections', 'got ' + (m.sections || []).length);
  ok(m.sections.every((s) => s.h && Array.isArray(s.p) && s.p.length), m.id + ': every section has a heading and prose');
  ok(Array.isArray(m.drills) && m.drills.length === 12, m.id + ': 12 drills', 'got ' + m.drills.length);
  ok(m.calc && typeof m.calc.html === 'string' && m.calc.init, m.id + ': has a calculator');
  const ids = m.drills.map((d) => d.id);
  ok(new Set(ids).size === ids.length, m.id + ': drill ids unique');
  ok(m.drills.every((d) => typeof d.q === 'string' && d.q.length > 10), m.id + ': every drill asks something');
  ok(m.drills.every((d) => typeof d.why === 'string' && d.why.length > 15), m.id + ': every drill explains itself');
  m.drills.forEach((d) => {
    if (d.type === 'text') {
      ok(Array.isArray(d.accept) && d.accept.length > 0, m.id + '/' + d.id + ': text drill has accepted answers');
    } else {
      ok(isFinite(d.answer) && d.tol > 0, m.id + '/' + d.id + ': numeric drill has answer and tolerance');
    }
  });
});

console.log('m1 answer consistency');
const m1 = MODULES.find((m) => m.id === 'm1');
const a1 = Object.fromEntries(m1.drills.map((d) => [d.id, d.answer]));
const within = (mod, id, expected) => {
  const d = mod.drills.find((x) => x.id === id);
  return Math.abs(d.answer - expected) <= d.tol;
};
ok(within(m1, 'd2', C.cRate(2)), 'd2 = C-rate of 2 h');
ok(within(m1, 'd3', C.cRate(6)), 'd3 = C-rate of 6 h');
ok(within(m1, 'd11', C.cRate(4)), 'd11 = anchor C-rate');
ok(within(m1, 'd4', C.cellWh(3.2, 280) / 1000), 'd4 = cell energy in kWh');
ok(within(m1, 'd5', C.stringVoltage(416, 3.2)), 'd5 = 416-cell string voltage');
ok(within(m1, 'd7', C.grossUp(200, 8)), 'd7 = gross-up 200 MWh at 8 %');
ok(within(m1, 'd10', C.grossUp(500, 10)), 'd10 = gross-up 500 MWh at 10 %');
ok(within(m1, 'd8', C.containers(C.grossUp(200, 8), 5)), 'd8 = container count');

console.log('m2 answer consistency');
const m2 = MODULES.find((m) => m.id === 'm2');
ok(within(m2, 'm2-d1', C.chainRTE([97, 99])), 'm2-d1 = 97 % and 99 % multiplied');
ok(within(m2, 'm2-d2', C.chainRTE([94, 97])), 'm2-d2 = 94 % and 97 % multiplied');
ok(within(m2, 'm2-d3', C.energyAtPoi(500, 88)), 'm2-d3 = 500 MWh at 88 % RTE');
ok(within(m2, 'm2-d4', C.dcForPoi(440, 88)), 'm2-d4 = grossed up to DC');
ok(within(m2, 'm2-d12', C.chainRTE([99, 99, 99, 99, 99, 99])), 'm2-d12 = six stages at 99 %');
const defaults = [94, 97, 99, 99.5, 99.5, 98.5];
ok(Math.abs(C.chainRTE(defaults) - 88.03) < 0.01, 'calculator defaults land on 88.03 %', C.chainRTE(defaults).toFixed(4));
ok(Math.abs(C.naiveRTE(defaults) - 87.5) < 0.01, 'naive method gives 87.50 %', C.naiveRTE(defaults).toFixed(2));

console.log('m3 answer consistency');
const m3 = MODULES.find((m) => m.id === 'm3');
const pow = (b, e) => Math.pow(b, e);
ok(within(m3, 'm3-d1', 400 * pow(0.98, 10)), 'm3-d1 = 400 MWh at 2 %/yr, year 10');
ok(within(m3, 'm3-d2', 400 * pow(0.98, 20)), 'm3-d2 = same at year 20');
ok(within(m3, 'm3-d3', 100 * pow(0.985, 20)), 'm3-d3 = 1.5 %/yr at year 20');
ok(within(m3, 'm3-d4', 400 / pow(0.98, 20)), 'm3-d4 = BOL needed for pure overbuild');
ok(within(m3, 'm3-d5', (400 / pow(0.98, 20) / 400 - 1) * 100), 'm3-d5 = overbuild percentage');
ok(within(m3, 'm3-d6', 400 - 435 * pow(0.98, 7)), 'm3-d6 = shortfall at year 7');
ok(within(m3, 'm3-d7', 435 * pow(0.98, 7) + 60), 'm3-d7 = capacity just after augmenting');
ok(within(m3, 'm3-d11', 8760 * 0.02), 'm3-d11 = unavailable hours at 98 %');
ok(within(m3, 'm3-d12', 365 * 20), 'm3-d12 = cycles at one per day for 20 years');

console.log('dom ids');
const html = read('index.html');
const appjs = read('app.js');
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const dynamic = new Set(['answer', 'check', 'feedback', 'next', 'reset', 'module-select']);
const used = new Set([...appjs.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]));
used.forEach((id) => {
  if (dynamic.has(id)) return;
  ok(htmlIds.has(id), '#' + id + ' exists in index.html');
});
['in-mw', 'plant-out', 'rte-out', 'rte-battery', 'rte-energy'].forEach((id) => {
  const inModules = MODULES.some((m) => m.calc.html.indexOf('id="' + id + '"') >= 0);
  ok(inModules, '#' + id + ' exists in a module calculator');
});

console.log('scripts');
const scripts = [...html.matchAll(/<script src="\.\/([^"]+)"/g)].map((m) => m[1]);
['calc.js', 'content.js', 'm1.js', 'm2.js', 'm3.js', 'app.js'].forEach((f) => {
  ok(scripts.indexOf(f) >= 0, f + ' is loaded by index.html');
  ok(fs.existsSync(path.join(dir, f)), f + ' exists on disk');
});
ok(/bess-lab-v\d+/.test(read('sw.js')), 'sw cache name present');
const man = JSON.parse(read('manifest.webmanifest'));
ok(man.display === 'standalone', 'manifest is standalone');
man.icons.forEach((i) => ok(fs.existsSync(path.join(dir, i.src.replace('./', ''))), 'icon exists: ' + i.src));

console.log(fail === 0 ? '\nALL STRUCTURE CHECKS PASSED' : '\n' + fail + ' FAILED');
process.exit(fail ? 1 : 0);
