'use strict';
const assert = require('node:assert/strict');
const titration = require('../demos/modules/titration.js');
const electrode = require('../demos/modules/potentiometry.js');
const uv = require('../demos/modules/uv-visible.js');
const matrix = require('../demos/modules/matrix-recovery.js');
function close(actual, expected, tolerance = 1e-9) { assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`); }
// Strong-acid charge balance must stay finite on either side and at equivalence.
close(titration.phAt(25), 7, 1e-8);
assert.ok(titration.phAt(24.9999) < 7);
assert.ok(titration.phAt(25.0001) > 7);
for (const acidType of ['strong', 'weak']) {
  for (const baseMolL of [.05, .1, .2]) {
    const m = titration.calculate({ acidType, baseMolL });
    close(m.equivalenceMl * baseMolL, 2.5);
    assert.ok(m.curve.every((p, i, a) => Number.isFinite(p.ph) && (i === 0 || p.ph > a[i - 1].ph)));
  }
}
const weak = titration.calculate({ acidType: 'weak', pKa: 4.76, endpointPh: 7 });
assert.ok(weak.equivalencePh > 8 && weak.equivalencePh < 10);
assert.ok(weak.endpointMl < weak.equivalenceMl);
close(titration.calculate({ acidType: 'strong', endpointPh: 7 }).estimatedAcid, .1, 1e-10);
// Activity mismatch can bias sample while its independent check still passes.
const matched = electrode.calculate({ logC: -4 });
close(matched.candidateC, 1e-4);
const mismatch = electrode.calculate({ logC: -4, activityRatio: .5 });
close(mismatch.candidateC, .5e-4);
assert.equal(mismatch.qcPass, true);
assert.equal(mismatch.checksPass, true);
assert.equal(mismatch.reportable, false); // A passing check does not establish known matrix transfer.
assert.equal(mismatch.reportedC, null);
const acceptedSmallDrift = electrode.calculate({ logC: -4, driftMv: 1 });
assert.equal(acceptedSmallDrift.checksPass, true);
assert.ok(Math.abs(acceptedSmallDrift.candidateC - acceptedSmallDrift.trueC) > 1e-6);
const drift = electrode.calculate({ logC: -4, driftMv: 6 });
assert.equal(drift.qcPass, false);
assert.equal(drift.reportedC, null);
close(electrode.calculate({ logC: -4, activityRatio: .5, matched: true }).candidateC, 1e-4);
close(electrode.calculate({ logC: -4, driftMv: -59.16 * Math.log10(2) }).candidateC, 2e-4);
// Stray-free response follows Beer-Lambert and transmission remains exponential.
close(uv.absorbance(2), 2 * uv.absorbance(1));
close(uv.absorbance(1, 2), uv.absorbance(2, 1));
close(uv.calculate({ concentrationMgL: 2.4 }).candidateMgL, 2.4);
assert.ok(uv.absorbance(12, 1, 510, .02) < uv.absorbance(12));
const floor = -Math.log10(.02 / 1.02);
assert.ok(uv.absorbance(100, 1, 510, .02) <= floor + 1e-12);
assert.equal(uv.calculate({ concentrationMgL: 8 }).reportable, false);
const changedCell = uv.calculate({ concentrationMgL: 2, pathCm: 2, recalibrate: false });
assert.equal(changedCell.conditionsMatch, false);
assert.equal(changedCell.reportedMgL, null);
close(uv.calculate({ concentrationMgL: 2, pathCm: 2, recalibrate: true }).candidateMgL, 2);
assert.ok(uv.calculate({ strayFraction: .02, pathCm: 2 }).maxResidual > .005);
// Standard addition removes slope suppression, not earlier loss or additive signal.
const suppression = matrix.calculate();
close(suppression.standardAdditionMgL, 5);
close(suppression.externalMgL, 3.75);
close(suppression.spikeRecoveryPercent, 75);
close(suppression.xIntercept, -2);
const loss = matrix.calculate({ sensitivityRatio: 1, recoveryFraction: .5 });
close(loss.spikeRecoveryPercent, 100);
close(loss.standardAdditionMgL, 2.5);
const interferent = matrix.calculate({ additiveSignal: .12 });
close(interferent.standardAdditionMgL, 7);
close(matrix.calculate({ additiveSignal: .12, correctBackground: true }).standardAdditionMgL, 5);
close(matrix.calculate({ recoveryFraction: .5, additiveSignal: .12, correctBackground: true }).standardAdditionMgL, 2.5);
assert.equal(matrix.calculate({ originalMgL: 0 }).saBiasPercent, null);
console.log('PASS: chemical demos — charge balance and endpoint bias, activity/QC distinction, Beer-Lambert and stray light, standard-addition limitations');
