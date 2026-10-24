/* Unit tests for calc.js — run with: node app/tests/calc.test.js */
const C = require('../calc.js');

let pass = 0, fail = 0;

function near(actual, expected, tol, label) {
  tol = tol === undefined ? 1e-6 : tol;
  const ok = Math.abs(actual - expected) <= tol;
  report(ok, label, `got ${actual}, expected ${expected} ±${tol}`);
}
function eq(actual, expected, label) {
  report(actual === expected, label, `got ${actual}, expected ${expected}`);
}
function report(ok, label, detail) {
  if (ok) { pass++; console.log('  ok   ' + label); }
  else { fail++; console.log('  FAIL ' + label + ' — ' + detail); }
}
function throws(fn, label) {
  try { fn(); report(false, label, 'did not throw'); }
  catch (e) { report(true, label); }
}

console.log('duration / C-rate');
near(C.durationH(2, 8), 4, 1e-9, '2 MW / 8 MWh = 4 h');
near(C.cRate(4), 0.25, 1e-9, '4-hour system = 0.25C');
near(C.cRate(2), 0.5, 1e-9, '2-hour system = 0.5C');
near(C.cRate(6), 1 / 6, 1e-9, '6-hour system = 0.1667C');
near(C.cRate(C.durationH(100, 400)), 0.25, 1e-9, 'anchor: 100 MW / 400 MWh = 0.25C');

console.log('units');
near(C.cellWh(3.2, 314), 1004.8, 1e-9, '3.2 V x 314 Ah = 1004.8 Wh');
near(C.cellWh(3.2, 314) / 1000, 1.0048, 1e-12, '... = 1.0048 kWh (not 1004.8)');
near(C.stringVoltage(400, 3.2), 1280, 1e-9, '400 cells in series = 1280 V');
near(C.stringVoltage(416, 3.2), 1331.2, 1e-9, '416 cells in series = 1331.2 V');

console.log('gross-up');
near(C.grossUp(400, 8), 434.7826086956522, 1e-9, '400 MWh at POI, 8 % loss = 434.78 MWh DC');
near(C.grossUp(400, 8), 434.7826086956522, 1e-9, 'NOT 432 (400 x 1.08 is wrong)');
near(C.grossUp(200, 8), 217.3913043478261, 1e-9, '200 MWh, 8 % = 217.39 MWh');
near(C.grossUp(500, 10), 555.5555555555555, 1e-9, '500 MWh, 10 % = 555.56 MWh');
near(C.grossUp(400, 0), 400, 1e-9, '0 % loss = unchanged');

console.log('containers');
eq(C.containers(C.grossUp(400, 8), 5), 87, '434.78 MWh at 5 MWh each = 87 containers');
eq(C.containers(435, 5), 87, 'exact multiple does not round up to 88');
eq(C.containers(217.39, 5), 44, '217.39 MWh = 44 containers');
near(C.overbuild(C.containers(C.grossUp(400, 8), 5) * 5, C.grossUp(400, 8)), 0.0005, 1e-4, 'overbuild of 87 x 5 MWh vs 434.78 = 0.05 %');

console.log('protection');
near(C.faultCurrent(20, 0.5), 25.4031, 0.01, '20 kV, 0.5 Ω → 25.40 kA');
near(C.faultCurrent(110, 2), 34.9346, 0.01, '110 kV, 2 Ω → 34.93 kA');
near(C.faultCurrent(20, 1.2), 10.5846, 0.01, '20 kV, 1.2 Ω → 10.58 kA');
near(C.relayTime('SI', 0.2, 1, 10), 0.5941, 0.001, 'SI, TMS 0.2, 10× → 0.594 s');
near(C.relayTime('VI', 0.5, 1, 4), 2.25, 0.001, 'VI, TMS 0.5, 4× → 2.25 s');
near(C.relayTime('EI', 0.1, 1, 3), 1.0, 0.001, 'EI, TMS 0.1, 3× → 1.0 s');
eq(C.relayTime('SI', 0.2, 1, 1), Infinity, 'no trip at pickup');
throws(() => C.relayTime('XX', 0.2, 1, 10), 'unknown curve rejected');
throws(() => C.faultCurrent(0, 1), 'zero voltage rejected');

console.log('guards');
throws(() => C.cRate(0), 'C-rate rejects zero duration');
throws(() => C.grossUp(100, 100), 'gross-up rejects 100 % loss');
throws(() => C.durationH(0, 10), 'duration rejects zero power');

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
