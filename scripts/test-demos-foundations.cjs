'use strict';
const assert = require('node:assert/strict');
const {concentrationModel} = require('../demos/modules/sample-answer.js');
const {samplingModel, extractionModel, validateGrabCounts} = require('../demos/modules/sampling-preparation.js');
const {uncertaintyModel} = require('../demos/modules/error-uncertainty.js');
const {calibrationModel} = require('../demos/modules/calibration-qc.js');
const near = (actual, expected, tolerance = 1e-10) => assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

// Amount must be conserved by an ideal dilution, while portion size and dilution
// are distinct interventions on the reported quantities.
const a = concentrationModel({concentration: 20, aliquotMl: 250, dilutionFactor: 2});
near(a.massMg, 5); near(a.finalMl, 500); near(a.finalConcentration, 10);
for (const row of a.rows) near(row.concentration_mg_l * row.volume_ml / 1000, 5);
const twice = concentrationModel({concentration: 20, aliquotMl: 500, dilutionFactor: 2});
near(twice.massMg, 10); near(twice.finalConcentration, a.finalConcentration);
assert.throws(() => concentrationModel({dilutionFactor: 0.5}), RangeError);
near(concentrationModel({concentration: 0}).massMg, 0);

// Inappropriate allocation changes the population quantity targeted by the naive
// average; extra top-only samples cannot estimate absent strata.
assert.deepEqual(validateGrabCounts(['0', '3', '20']).counts, [0, 3, 20]);
for (const raw of ['', ' ', '-1', '21', '2.5', 'abc', NaN, Infinity]) {
  const v = validateGrabCounts([raw, '3', '3']);
  assert.equal(v.valid, false); assert.equal(v.counts, null);
  assert.ok(v.message.includes('top'));
}
const topOnly = samplingModel({counts: [20, 0, 0]});
near(topOnly.expectedNaive, 8); near(topOnly.targetMean, 47 / 3);
assert.equal(topOnly.stratifiedMean, null);
assert.equal(samplingModel({counts: [0, 0, 0]}).naiveMean, null);
const balanced = samplingModel({counts: [3, 3, 3], seed: 17});
near(balanced.naiveMean, balanced.stratifiedMean);
const unequal = samplingModel({counts: [20, 1, 1], seed: 17});
near(unequal.expectedNaive, (20 * 8 + 14 + 25) / 22);
assert.ok(Math.abs(unequal.naiveMean - unequal.stratifiedMean) > 5);
const sameTop = samplingModel({counts: [1, 0, 0], seed: 17});
near(sameTop.rows[0].iron_mg_kg, balanced.rows[0].iron_mg_kg);

// Equilibrium recovery follows an independent mass-balance calculation, using
// fixed total solvent split into fresh portions.
near(extractionModel({extractions: 1}).recovery, 9 * 10 / (20 + 9 * 10));
near(extractionModel({extractions: 2}).recovery, 1 - (20 / 65) ** 2);
assert.ok(extractionModel({extractions: 2}).recovery > extractionModel({extractions: 1}).recovery);
assert.throws(() => extractionModel({extractions: 0}), RangeError);

// Averaging changes independent reading noise but not a shared component or a
// known uncorrected bias. The bias is not folded into a random uncertainty.
const one = uncertaintyModel({n: 1, readingSd: 0.2, sharedU: 0.1});
const hundred = uncertaintyModel({n: 100, readingSd: 0.2, sharedU: 0.1});
near(one.combinedU, Math.sqrt(0.05));
near(hundred.combinedU, Math.sqrt(0.2 ** 2 / 100 + 0.1 ** 2));
near(one.sharedOffset, hundred.sharedOffset); near(one.values[0], hundred.values[0]);
const unbiased = uncertaintyModel({n: 100, readingSd: 0.2, sharedU: 0.1, bias: 0});
near(unbiased.combinedU, hundred.combinedU);
const corrected = uncertaintyModel({n: 100, readingSd: 0.2, sharedU: 0.1, corrected: true});
near(hundred.mean - corrected.mean, 0.3);
const sharedOnly = uncertaintyModel({n: 100, readingSd: 0, sharedU: 0.1});
near(sharedOnly.combinedU, 0.1); near(sharedOnly.observedSd, 0);
assert.equal(one.observedSd, null);

// Exact linear standards give the analytic inverse. Reporting still needs a
// residual decision, range support and independent later QC.
const exact = calibrationModel({noise: 0, review: 'accepted'});
near(exact.fit.a, 0.01); near(exact.fit.b, 0.2); near(exact.fit.r2, 1);
near(exact.candidateFinal, 2.5); near(exact.candidateOriginal, 5);
near(exact.qcRecovery, 100); assert.ok(exact.reportable);
assert.equal(calibrationModel({noise: 0}).reportable, false); // Review pending.
const out = calibrationModel({noise: 0, review: 'accepted', originalConcentration: 20, dilutionFactor: 2});
assert.equal(out.inRange, false); assert.equal(out.reportable, false);
const diluted = calibrationModel({noise: 0, review: 'accepted', originalConcentration: 20, dilutionFactor: 10});
assert.ok(diluted.reportable); near(diluted.candidateOriginal, 20);
const drift = calibrationModel({noise: 0, review: 'accepted', driftPercent: -20});
near(drift.qcRecovery, 80); assert.equal(drift.qcPass, false); assert.equal(drift.reportable, false);
assert.equal(calibrationModel({noise: 0, review: 'rejected'}).reportable, false);
const curved = calibrationModel({noise: 0, curvature: 0.005, review: 'accepted'});
assert.ok(curved.fit.r2 > 0.99); // A high R² can coexist with patterned residuals.
assert.ok(Math.abs(curved.fit.residuals[0]) > 0.001);
assert.ok(curved.rows.every(row => row.saturation_coefficient_l_mg === 0.005));
// A high true unknown must not fold back into the apparent response range.
// The former quadratic toy curve did so for this reachable configuration.
const highUnknown = calibrationModel({maxStandard: 1, curvature: 0.01, noise: 0,
  originalConcentration: 19, dilutionFactor: 1, review: 'accepted'});
assert.equal(highUnknown.inRange, false);
assert.equal(highUnknown.reportable, false);
assert.ok(highUnknown.meanResponse > highUnknown.fit.a + highUnknown.fit.b);
// For every positive curvature available in the controls, the generating
// response is monotonic throughout the selectable unknown concentrations.
for (const q of [0, 0.005, 0.01, 0.015]) {
  let previous = -Infinity;
  for (let c = 0; c <= 20; c += 0.5) {
    const m = calibrationModel({maxStandard: 1, curvature: q, noise: 0,
      originalConcentration: c, dilutionFactor: 1, review: 'accepted'});
    assert.ok(m.meanResponse > previous); previous = m.meanResponse;
  }
}
console.log('PASS: foundation demos: mass conservation, sampling target, extraction recovery, shared uncertainty, calibration decisions');
