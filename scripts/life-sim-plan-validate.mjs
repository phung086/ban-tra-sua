// Design-doc linter: keeps the multi-agent world bible coherent in CI.
// No runtime game imports; safe until the life simulation is integrated.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file) => JSON.parse(readFileSync(resolve(process.cwd(), file), 'utf8'));
const fail = (message) => { throw new Error('Life-plan validation: ' + message); };
const check = (test, message) => { if (!test) fail(message); };

const plan = read('docs/life-sim/agent-backlog.json');
check(plan.schemaVersion === 1 && plan.designOnly === true, 'expected unshipped design schema v1');
check(Array.isArray(plan.tasks) && plan.tasks.length >= 40, 'missing task backlog');
const tasks = new Map();
for (const task of plan.tasks) {
  check(typeof task.id === 'string' && !tasks.has(task.id), 'duplicate or invalid task ID: ' + task.id);
  check(plan.owners.includes(task.owner), 'unknown owner: ' + task.id);
  check(plan.allowedStatuses.includes(task.status), 'invalid status: ' + task.id);
  check(Array.isArray(task.dependsOn), 'missing dependencies array: ' + task.id);
  tasks.set(task.id, task);
}
for (const task of plan.tasks) {
  for (const dependency of task.dependsOn)
    check(tasks.has(dependency), 'unresolved dependency ' + dependency + ' in ' + task.id);
}
const visiting = new Set(), visited = new Set();
function visit(id) {
  if (visited.has(id)) return;
  check(!visiting.has(id), 'dependency cycle at ' + id);
  visiting.add(id);
  for (const dep of tasks.get(id).dependsOn) visit(dep);
  visiting.delete(id);
  visited.add(id);
}
for (const id of tasks.keys()) visit(id);
const days = plan.tasks.filter(task => task.track === 'day-content');
check(days.length === 30, 'expected exactly 30 authored day targets');
for (let n = 1; n <= 30; n++) {
  const id = 'T2-' + String(n).padStart(3, '0');
  const day = tasks.get(id);
  check(day && day.day === n && day.episodeId === 'day-' + String(n).padStart(3,'0'), 'missing day ' + n);
  check(day.status !== 'accepted', 'planning alone cannot mark a day accepted: ' + id);
}

const sample = read('docs/life-sim/examples/day-001.design.json');
check(sample.schemaVersion === 1 && sample.id === 'day-001', 'invalid day 001 example');
check(Array.isArray(sample.beats) && sample.beats.length >= 5, 'day lacks beats');
check(Array.isArray(sample.choices) && sample.choices.length >= 1, 'day lacks a choice');
const beats = new Map();
for (const beat of sample.beats) {
  check(beat.id && !beats.has(beat.id), 'duplicate beat: ' + beat.id);
  check(Array.isArray(beat.timeWindow) && beat.timeWindow.length === 2 &&
    beat.timeWindow[0] <= beat.timeWindow[1], 'invalid time window: ' + beat.id);
  beats.set(beat.id, beat);
}
for (const beat of sample.beats)
  check(beat.exit === null || beats.has(beat.exit), 'dangling beat exit: ' + beat.id);
check(beats.has('sleep') && sample.endings.includes('sleep'), 'no sleep end');
const effects = new Set();
for (const node of sample.choices) {
  check(beats.has(node.beatId), 'choice references missing beat: ' + node.id);
  check(node.choices.length >= 2 && node.choices.length <= 4, 'choices outside 2-4: ' + node.id);
  for (const choice of node.choices) {
    check(beats.has(choice.next), 'choice destination missing: ' + choice.id);
    for (const effect of choice.consequences) {
      check(effect.ledgerKey && !effects.has(effect.ledgerKey), 'duplicate ledger key: ' + effect.ledgerKey);
      effects.add(effect.ledgerKey);
    }
  }
}
console.log('Life design OK: ' + tasks.size + ' tasks; ' + days.length +
  ' planned days; dependency DAG; day-001 sample beats/choices and ledger keys.');
