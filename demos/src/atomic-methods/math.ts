/** Reviewed chemistry model, independent of DOM state. */
export interface AtomicOptions {distance?:number;interferenceHeight?:number;blank?:number;isolated?:boolean;subtractBlank?:boolean;}
export function atomicModel(options:AtomicOptions = {}) {
  const distance = options.distance === undefined ? 0.012 : Number(options.distance);
  const interferenceHeight = options.interferenceHeight === undefined ? 300 : Number(options.interferenceHeight);
  const blank = options.blank === undefined ? 0.010 : Number(options.blank);
  const dilution = 2;
  const nativeDigest = 0.800;
  const isolated = Boolean(options.isolated);
  const subtractBlank = options.subtractBlank !== false;
  if (!(distance > 0) || !(interferenceHeight >= 0) || !(blank >= 0)) throw new RangeError('Positive distance and nonnegative signals are required.');
  const peakSigma = 0.006;
  const concentrationMeasured = (nativeDigest + blank) / dilution;
  const targetHeight = 1000 * concentrationMeasured;
  const overlapAtTarget = isolated ? 0 : interferenceHeight * Math.exp(-0.5 * (distance / peakSigma) ** 2);
  const countsAtTarget = 8 + targetHeight + overlapAtTarget;
  const apparentMeasured = (countsAtTarget - 8) / 1000;
  const apparentDigest = apparentMeasured * dilution - (subtractBlank ? blank : 0);
  const apparentMgKg = apparentDigest * 0.050 / 0.000250;
  const truthMgKg = nativeDigest * 0.050 / 0.000250;
  const rows = [];
  for (let i = 0; i <= 200; i += 1) {
    const offset = -0.05 + i * 0.0005;
    const target = targetHeight * Math.exp(-0.5 * (offset / peakSigma) ** 2);
    const interfering = isolated ? 0 : interferenceHeight * Math.exp(-0.5 * ((offset - distance) / peakSigma) ** 2);
    rows.push({offset_nm: offset, target_plus_background_counts: 8 + target,
      interfering_counts: interfering, total_counts: 8 + target + interfering});
  }
  return {distance, interferenceHeight, blank, isolated, subtractBlank, dilution,
    nativeDigest, concentrationMeasured, countsAtTarget, overlapAtTarget, apparentMeasured,
    apparentDigest, apparentMgKg, truthMgKg, biasMgKg: apparentMgKg - truthMgKg, rows};
}
