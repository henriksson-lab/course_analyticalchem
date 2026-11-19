'use strict';
const assert = require('node:assert/strict');
const {atomicModel} = require('../demos/modules/atomic-methods.js');
const {separationModel} = require('../demos/modules/separations.js');
const {injectionModel} = require('../demos/modules/gc-hplc.js');
const {assessRecord, measurePreparation} = require('../demos/modules/defending-results.js');
const close = (actual, expected, tolerance = 1e-9) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
// The method blank is undiluted, while sample contamination is diluted along with the digest.
const isolated = atomicModel({isolated: true, blank: 0.010});
close(isolated.apparentMgKg, 160);
close(isolated.apparentMeasured, 0.405);
close(isolated.apparentDigest, 0.800);
close(atomicModel({isolated: true, blank: 0.100, subtractBlank: false}).apparentMgKg, 180);
const overlap = atomicModel({distance: 0.006, interferenceHeight: 200, blank: 0});
close(overlap.biasMgKg, 200 * Math.exp(-0.5) / 1000 * 2 * 0.05 / 0.00025);
assert.ok(atomicModel({distance: 0.006}).biasMgKg > atomicModel({distance: 0.03}).biasMgKg);
assert.throws(() => atomicModel({distance: 0}), RangeError);
// Resolution uses baseline widths; complete areas survive both broadening and spacing changes.
const base = separationModel();
close(base.resolution, 20 / 9);
close(base.kA, 2); close(base.kB, 3); close(base.alpha, 1.5);
close(separationModel({widthFactor: 2}).resolution, base.resolution / 2);
const integrate = (rows, field) => rows.slice(1).reduce((sum, row, i) => sum +
  (row.time_min - rows[i].time_min) * (row[field] + rows[i][field]) / 2, 0);
for (const model of [base, separationModel({spacing: 0.15, widthFactor: 3, areaB: 500}), separationModel({widthFactor: 0.5})]) {
  close(integrate(model.rows, 'component_a'), 100, 0.001);
  close(integrate(model.rows, 'component_b'), model.areaB, 0.001);
}
close(base.aWindow, 95.4499736, 0.0001);
const near = separationModel({spacing: 0.25});
assert.ok(near.bWindow > base.bWindow);
assert.ok(separationModel({spacing: 0.25, areaB: 500}).contaminationPercent > near.contaminationPercent);
assert.throws(() => separationModel({widthFactor: 0}), RangeError);
// The retained constant offset prevents exact cancellation, matching the course example.
const injection = injectionModel();
close(injection.caffeineArea, 603); close(injection.standardArea, 400);
close(injection.externalFinalMgL, 12); close(injection.ratioFinalMgL, 15.015);
close(injectionModel({injectionFactor: 1}).ratioFinalMgL, 15);
const late = injectionModel({injectionFactor: 1, recovery: 0.6, timing: 'after'});
const early = injectionModel({injectionFactor: 1, recovery: 0.6, timing: 'before'});
close(late.ratioFinalMgL, 9); assert.equal(late.reportable, false);
assert.ok(Math.abs(early.ratioFinalMgL - 15) < 0.05); assert.equal(early.reportable, true);
assert.equal(injectionModel({analyteResponse: 0.8}).reportable, false);
assert.equal(injectionModel({coelutionArea: 100}).reportedOriginalMgL, null);
assert.throws(() => injectionModel({recovery: 0}), RangeError);
// New preparation means a new signal; the old out-of-range record remains invalid.
const first = measurePreparation({sample: 'drink_B', aliquotMl: 5}, 1);
const saved = JSON.stringify(first);
close(first.candidateFinalMgL, 40); assert.equal(first.reportable, false);
const smaller = measurePreparation({sample: 'drink_B', aliquotMl: 2}, 2);
close(smaller.area, 644); close(smaller.reportedOriginalMgL, 400);
close(smaller.uOriginalMgL, 3.75);
assert.equal(JSON.stringify(first), saved);
assert.equal(measurePreparation({sample: 'drink_A', aliquotMl: 5, qcOK: false}).reportedOriginalMgL, null);
assert.equal(measurePreparation({sample: 'drink_C', aliquotMl: 5, resolved: false}).reportedOriginalMgL, null);
assert.equal(assessRecord({area: 604, aliquotMl: 5, finalMl: 50, qcRecovery: 95, resolved: true}).reportable, true);
assert.equal(assessRecord({area: 604, aliquotMl: 5, finalMl: 50, qcRecovery: 105.1, resolved: true}).reportable, false);
assert.throws(() => measurePreparation({aliquotMl: 0}), RangeError);
console.log('PASS: atomic overlap and blank basis; Gaussian area and resolution; shared-effect ratios; immutable records and evidence gates');
