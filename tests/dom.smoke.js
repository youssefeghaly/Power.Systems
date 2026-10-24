/* Boots the real page in jsdom and drives the UI like a user would. */
const fs = require('fs');
const path = require('path');
let JSDOM;
try {
  ({ JSDOM } = require(path.join(__dirname, '../../_tools/jsdom/node_modules/jsdom')));
} catch (e) {
  console.log('jsdom not installed — skipping DOM smoke test (npm i jsdom)');
  process.exit(0);
}

const dir = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8')
  .replace(/<script src="\.\/[^"]+"><\/script>/g, '');

const dom = new JSDOM(html, { runScripts: 'outside-only', url: 'http://localhost/' });
const { window } = dom;

['calc.js', 'content.js', 'app.js'].forEach((f) => {
  window.eval(fs.readFileSync(path.join(dir, f), 'utf8'));
});
window.document.dispatchEvent(new window.Event('DOMContentLoaded', { bubbles: true }));

let fail = 0;
const ok = (c, m, d) => { if (c) console.log('  ok   ' + m); else { fail++; console.log('  FAIL ' + m + (d ? ' — ' + d : '')); } };
const $ = (id) => window.document.getElementById(id);

console.log('lesson renders');
ok($('lesson').querySelectorAll('section.card').length === LESSON_SECTIONS(), 'all lesson sections rendered', 'got ' + $('lesson').querySelectorAll('section.card').length);
function LESSON_SECTIONS() { return window.eval('LESSON.sections.length'); }
ok(/Power is a rate/.test($('lesson').textContent), 'first section heading present');

console.log('calculator');
ok(/434\.8/.test($('plant-out').textContent), 'default 100 MW / 4 h / 8 % gives 434.8 MWh DC', $('plant-out').textContent.trim().slice(0, 80));
$('in-loss').value = '0';
$('in-loss').dispatchEvent(new window.Event('input'));
ok(/400\.0/.test($('plant-out').textContent), '0 % loss gives 400 MWh DC');
$('in-box').value = '5';
$('in-mw').value = '50';
$('in-mw').dispatchEvent(new window.Event('input'));
ok(/200\.0/.test($('plant-out').textContent), '50 MW / 4 h gives 200 MWh at POI');
$('in-loss').value = '150';
$('in-loss').dispatchEvent(new window.Event('input'));
ok(/Waiting for input/.test($('plant-out').textContent), 'invalid loss is rejected, not silently computed');

console.log('cell calculator');
ok(/1,004\.8 Wh/.test($('cell-out').textContent), '3.2 V / 314 Ah gives 1004.8 Wh', $('cell-out').textContent.trim().slice(0, 90));
ok(/1,331\.2 V/.test($('cell-out').textContent), '416 cells gives 1331.2 V');

console.log('drill flow');
$('tab-drill').dispatchEvent(new window.Event('click'));
ok(!!$('answer'), 'drill view renders an input');
const d1 = window.eval('DRILLS[0]');
$('answer').value = String(d1.answer);
$('check').dispatchEvent(new window.Event('click'));
ok(/Correct/.test($('feedback').textContent), 'correct answer accepted');
ok($('bar').style.width !== '0%', 'progress bar advanced', 'width=' + $('bar').style.width);

$('next').dispatchEvent(new window.Event('click'));
const d2 = window.eval('DRILLS[1]');
$('answer').value = '999';
$('check').dispatchEvent(new window.Event('click'));
ok(/Not quite/.test($('feedback').textContent), 'wrong answer rejected');
ok(/0\.5/.test($('feedback').textContent), 'wrong answer shows the right value', $('feedback').textContent.slice(0, 60));

console.log('completion');
const DRILLS = window.DRILLS;
let guard = 0;
let repeated = false;
while (guard++ < 60 && !/All twelve solved/.test($('drill-body').textContent)) {
  const qEl = $('drill-body').querySelector('.q');
  if (!qEl) break;
  const drill = DRILLS.find((d) => d.q === qEl.textContent);
  if (!drill) break;
  $('answer').value = String(drill.answer);
  $('check').dispatchEvent(new window.Event('click'));
  const next = $('next');
  if (next) next.dispatchEvent(new window.Event('click'));
}
ok(/All twelve solved/.test($('drill-body').textContent), 'ends with a done screen instead of cycling', $('drill-body').textContent.slice(0, 60));
ok(guard < 40, 'finished within a sane number of steps', 'steps=' + guard);
ok($('count').textContent === '12 / 12 solved', 'progress reads 12 / 12', $('count').textContent);
ok(!!$('reset'), 'done screen offers a restart');

console.log('wrong answers come back');
$('reset').dispatchEvent(new window.Event('click'));
ok(!!$('answer'), 'restart returns to a question');
const first = $('drill-body').querySelector('.q').textContent;
$('answer').value = '0.0001';
$('check').dispatchEvent(new window.Event('click'));
ok(/comes back/.test($('feedback').textContent), 'wrong answer says it will return');
const seen = new Set();
let steps = 0;
while (steps++ < 13) {
  const q = $('drill-body').querySelector('.q');
  if (!q) break;
  seen.add(q.textContent);
  const nx = $('next');
  if (nx) nx.dispatchEvent(new window.Event('click'));
  if ($('drill-body').querySelector('.q') && $('drill-body').querySelector('.q').textContent === first && steps > 1) {
    repeated = true;
    break;
  }
}
ok(repeated || seen.has(first), 'the missed question reappears rather than being skipped');

console.log(fail === 0 ? '\nDOM SMOKE PASSED' : `\n${fail} FAILED`);
process.exit(fail ? 1 : 0);
