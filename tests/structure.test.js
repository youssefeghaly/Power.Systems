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
['content.js','m1.js','m2.js','m3.js','m4.js','m5.js','m6.js','m7.js','m8.js','m9.js','m10.js','m11.js','m12.js','m13.js','m14.js','m15.js','m16.js'].forEach((f) => vm.runInContext(read(f), ctx));
const MODULES = ctx.window.MODULES;
ok(Array.isArray(MODULES), 'MODULES array built');
ok(MODULES.length === 16, 'sixteen modules registered', 'got ' + (MODULES || []).length);
ok(MODULES.map((m) => m.id).join(',') === 'm1,m2,m3,m4,m5,m6,m7,m8,m9,m10,m11,m12,m13,m14,m15,m16', 'module order m1 … m16');

MODULES.forEach((m) => {
  ok(typeof m.number === 'string' && m.number.length === 2, m.id + ': has a number');
  ok(Array.isArray(m.sections) && m.sections.length >= 5, m.id + ': at least 5 lesson sections', 'got ' + (m.sections || []).length);
  ok(m.sections.every((s) => s.h && Array.isArray(s.p) && s.p.length), m.id + ': every section has a heading and prose');
  if (['m1','m2','m3','m4','m5','m6'].includes(m.id)) {
    m.sections.forEach((s) => {
      const words = (s.p.join(' ') + ' ' + (s.example ? s.example.body : '') + ' ' + (s.mistake || '') + ' ' + (s.check || ''))
        .split(/\s+/).filter(Boolean).length;
      ok(words >= 240, 'template depth: "' + s.h.slice(0, 30) + '" has ≥ 240 words', words + ' words');
      ok(!!s.example, 'template: "' + s.h.slice(0, 30) + '" has a worked example');
      ok(!!s.mistake, 'template: "' + s.h.slice(0, 30) + '" names a mistake');
      ok(!!s.check, 'template: "' + s.h.slice(0, 30) + '" has a self-check');
    });
  }
  ok(Array.isArray(m.drills) && m.drills.length === 12, m.id + ': 12 drills', 'got ' + m.drills.length);
  ok((m.calc && typeof m.calc.html === 'string' && m.calc.init) || typeof m.renderExtra === 'function', m.id + ': has an interactive element');
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

console.log('m4 thresholds');
const m4 = MODULES.find((m) => m.id === 'm4');
ok(within(m4, 'm4-d1', 135), 'm4-d1 = certification threshold 135 kW');
ok(within(m4, 'm4-d8', 500), 'm4-d8 = NELEV envelope 500 kW');
ok(within(m4, 'm4-d9', 0.90), 'm4-d9 = cos φ 0.90 at part load');
ok(within(m4, 'm4-d10', 0.95), 'm4-d10 = cos φ 0.95 at rated power');
ok(m4.sections.some((s) => /NELEV/.test(s.p.join(' '))), 'lesson explains NELEV');
ok(typeof m4.renderExtra === 'function', 'module 4 renders the process stepper');

console.log('m5 protection maths');
const m5 = MODULES.find((m) => m.id === 'm5');
ok(within(m5, 'm5-d1', C.faultCurrent(20, 0.5)), 'm5-d1 = fault current at 20 kV, 0.5 Ω');
ok(within(m5, 'm5-d2', C.faultCurrent(110, 2)), 'm5-d2 = fault current at 110 kV, 2 Ω');
ok(within(m5, 'm5-d4', 600 * 0.8), 'm5-d4 = CT ratio scaling');
ok(within(m5, 'm5-d5', 15 / (1 * 1)), 'm5-d5 = burden impedance');
ok(within(m5, 'm5-d6', C.relayTime('SI', 0.2, 1, 10)), 'm5-d6 = SI curve at 10× pickup');
ok(within(m5, 'm5-d7', C.relayTime('VI', 0.5, 1, 4)), 'm5-d7 = VI curve at 4× pickup');
ok(within(m5, 'm5-d8', 0.4 + 0.3), 'm5-d8 = grading margin arithmetic');
ok(C.relayTime('SI', 0.2, 1, 0.5) === Infinity, 'relay does not trip below pickup');

console.log('m6 earthing maths');
const m6 = MODULES.find((m) => m.id === 'm6');
ok(within(m6, 'm6-d1', C.earthRod(100, 3, 0.008)), 'm6-d1 = rod 3 m in 100 Ω·m');
ok(within(m6, 'm6-d2', C.earthRod(300, 3, 0.008)), 'm6-d2 = same rod in 300 Ω·m');
ok(within(m6, 'm6-d3', C.epr(500, 5)), 'm6-d3 = EPR');
ok(within(m6, 'm6-d4', C.requiredEarth(1000, 500)), 'm6-d4 = required earth resistance');
ok(within(m6, 'm6-d5', C.earthRing(100, 10, 0.008)), 'm6-d5 = ring 10 m');
ok(within(m6, 'm6-d6', C.wenner(4, 10)), 'm6-d6 = Wenner resistivity');
ok(within(m6, 'm6-d12', 2500 / 1000), 'm6-d12 = reduction factor');

console.log('m7 cable maths');
const m7 = MODULES.find((m) => m.id === 'm7');
ok(within(m7, 'm7-d1', C.derate(200, [0.8, 0.7])), 'm7-d1 = derating factors multiply');
ok(within(m7, 'm7-d3', C.drop3ph(100, C.cableR(35, 'cu', 70), 50)), 'm7-d3 = three-phase drop');
ok(within(m7, 'm7-d4', C.drop3ph(100, C.cableR(35, 'cu', 70), 50) / 400 * 100), 'm7-d4 = drop in percent');
ok(within(m7, 'm7-d5', C.dropDC(200, C.cableR(95, 'cu', 70), 20)), 'm7-d5 = DC drop counts the return');
ok(within(m7, 'm7-d6', C.adiabaticArea(25000, 0.1, 143)), 'm7-d6 = adiabatic minimum area');
ok(within(m7, 'm7-d7', C.adiabaticArea(16000, 0.3, 143)), 'm7-d7 = slower clearing needs more copper');

console.log('m8 transformer maths');
const m8 = MODULES.find((m) => m.id === 'm8');
const txIk = (mva, kv, uk) => mva * 1e6 / (Math.sqrt(3) * kv * 1000 * (uk / 100)) / 1000;
ok(within(m8, 'm8-d1', txIk(100, 110, 12)), 'm8-d1 = 100 MVA, 110 kV, 12 %');
ok(within(m8, 'm8-d2', txIk(100, 110, 24)), 'm8-d2 = double the impedance halves the current');
ok(within(m8, 'm8-d3', txIk(300, 220, 15)), 'm8-d3 = 300 MVA at 220 kV');
ok(within(m8, 'm8-d10', txIk(80, 110, 9)), 'm8-d10 = 80 MVA, 9 %');
ok(typeof m8.renderExtra === 'function', 'module 8 renders the substation diagram');

console.log('m9 MV connection maths');
const m9 = MODULES.find((m) => m.id === 'm9');
const lvFault = (kva, uk) => kva * 1000 / (Math.sqrt(3) * 400 * (uk / 100)) / 1000;
const mvAmps = (kva, kv) => kva * 1000 / (Math.sqrt(3) * kv * 1000);
ok(within(m9, 'm9-d1', lvFault(5000, 6)), 'm9-d1 = LV fault behind a 5 MVA transformer');
ok(within(m9, 'm9-d2', mvAmps(5000, 20)), 'm9-d2 = MV current at full rating');
ok(within(m9, 'm9-d3', 4000 / 0.95), 'm9-d3 = apparent power at 0.95 pf');
ok(within(m9, 'm9-d4', (4000 / 0.95) / 5000 * 100), 'm9-d4 = loading percentage');
ok(within(m9, 'm9-d5', 120 * 5 / 200), 'm9-d5 = CT secondary current');
ok(within(m9, 'm9-d11', lvFault(5000, 12)), 'm9-d11 = double u_k halves the LV fault');
ok(typeof m9.renderExtra === 'function', 'module 9 renders the transfer station');

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
const scripts = [...html.matchAll(/<script src="\.\/([^"?]+)\?v=\d+"/g)].map((m) => m[1]);
['calc.js','content.js','m1.js','m2.js','m3.js','m4.js','m5.js','m6.js','m7.js','m8.js','m9.js','m10.js','m11.js','m12.js','m13.js','m14.js','m15.js','m16.js','app.js'].forEach((f) => {
  ok(scripts.indexOf(f) >= 0, f + ' is loaded by index.html');
  ok(fs.existsSync(path.join(dir, f)), f + ' exists on disk');
});
const swSrc = read('sw.js');
const swVer = (swSrc.match(/bess-lab-v(\d+)/) || [])[1];
ok(!!swVer, 'sw cache name present');
const htmlVer = (html.match(/id="app-version">v(\d+)</) || [])[1];
ok(htmlVer === swVer, 'visible version stamp matches the cache version', 'sw v' + swVer + ' vs page v' + htmlVer);
const assetVersions = [...html.matchAll(/\?v=(\d+)"/g)].map((m) => m[1]);
ok(assetVersions.length > 0, 'assets carry a version query');
ok(assetVersions.every((v) => v === swVer), 'every asset query matches the cache version', assetVersions.join(','));
const swAssets = [...swSrc.matchAll(/\?v=(\d+)'/g)].map((m) => m[1]);
ok(swAssets.length > 0 && swAssets.every((v) => v === swVer), 'precache list uses the same version', swAssets.join(','));
ok(/wantsHTML/.test(swSrc) && /network first|network-first/i.test(swSrc), 'shell is served network-first');
const man = JSON.parse(read('manifest.webmanifest'));
ok(man.display === 'standalone', 'manifest is standalone');
man.icons.forEach((i) => ok(fs.existsSync(path.join(dir, i.src.replace('./', ''))), 'icon exists: ' + i.src));

console.log(fail === 0 ? '\nALL STRUCTURE CHECKS PASSED' : '\n' + fail + ' FAILED');
process.exit(fail ? 1 : 0);
