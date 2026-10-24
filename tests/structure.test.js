/* Static checks: referenced IDs exist, content is well-formed, answers agree with calc. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const C = require('../calc.js');

const dir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const appjs = fs.readFileSync(path.join(dir, 'app.js'), 'utf8');
const content = fs.readFileSync(path.join(dir, 'content.js'), 'utf8');

let fail = 0;
const ok = (cond, msg, detail) => {
  if (cond) console.log('  ok   ' + msg);
  else { fail++; console.log('  FAIL ' + msg + (detail ? ' — ' + detail : '')); }
};

console.log('dom ids');
const htmlIds = new Set([...html.matchAll(/id="([^"]+)"/g)].map((m) => m[1]));
const dynamic = new Set(['answer', 'check', 'feedback', 'next', 'reset']);
const used = new Set([...appjs.matchAll(/getElementById\('([^']+)'\)/g)].map((m) => m[1]));
used.forEach((id) => {
  if (dynamic.has(id)) return;
  ok(htmlIds.has(id), `#${id} exists in index.html`);
});

console.log('content');
const ctx = { console };
vm.createContext(ctx);
vm.runInContext(content + "\n;globalThis.__DRILLS = DRILLS; globalThis.__LESSON = LESSON;", ctx);
const drills = ctx.__DRILLS;
ok(Array.isArray(drills), 'DRILLS is an array');
ok(drills.length === 12, 'exactly 12 drills', 'got ' + drills.length);
ok(new Set(drills.map((d) => d.id)).size === drills.length, 'drill ids unique');
ok(drills.every((d) => typeof d.q === 'string' && d.q.length > 10), 'every drill has a question');
ok(drills.every((d) => isFinite(d.answer) && d.tol > 0), 'every drill has a finite answer and positive tolerance');
ok(drills.every((d) => typeof d.why === 'string' && d.why.length > 10), 'every drill has an explanation');
ok(!!ctx.__LESSON && ctx.__LESSON.sections.length >= 5, 'lesson has at least 5 sections');

console.log('answer consistency');
const byId = Object.fromEntries(drills.map((d) => [d.id, d.answer]));
const near = (a, b) => Math.abs(a - b) < 1e-6;
ok(near(byId.d2, C.cRate(2)), 'd2 = C-rate of 2 h');
ok(near(byId.d3, C.cRate(6)), 'd3 = C-rate of 6 h');
ok(near(byId.d11, C.cRate(4)), 'd11 = anchor C-rate');
ok(near(byId.d4, C.cellWh(3.2, 280) / 1000), 'd4 = cell energy in kWh');
ok(near(byId.d5, C.stringVoltage(416, 3.2)), 'd5 = 416-cell string voltage');
const within = (id, expected) => Math.abs(byId[id] - expected) <= drills.find((d) => d.id === id).tol;
ok(within('d7', C.grossUp(200, 8)), 'd7 = gross-up 200 MWh at 8 % (within drill tolerance)');
ok(within('d10', C.grossUp(500, 10)), 'd10 = gross-up 500 MWh at 10 % (within drill tolerance)');
ok(byId.d8 === C.containers(C.grossUp(200, 8), 5), 'd8 = container count for that DC energy');
ok(near(byId.d1, C.durationH(3, 12)), 'd1 = duration of 3 MW / 12 MWh');
ok(near(byId.d6, 100 * 2), 'd6 = 100 MW x 2 h');
ok(near(byId.d9, C.durationH(50, 100)), 'd9 = 50 MW / 100 MWh');
ok(near(byId.d12, 1.5 * 3), 'd12 = 1.5 MW x 3 h');

console.log('shell');
ok(/serviceWorker/.test(appjs), 'app registers a service worker');
const sw = fs.readFileSync(path.join(dir, 'sw.js'), 'utf8');
ok(/bess-module1-v\d+/.test(sw), 'sw cache name present');
const man = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.webmanifest'), 'utf8'));
ok(man.display === 'standalone', 'manifest is standalone');
ok(man.icons.length >= 2, 'manifest has icons');
man.icons.forEach((i) => {
  const p = path.join(dir, i.src.replace('./', ''));
  ok(fs.existsSync(p), 'icon file exists: ' + i.src);
});

console.log(fail === 0 ? '\nALL STRUCTURE CHECKS PASSED' : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
