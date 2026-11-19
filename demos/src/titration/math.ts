/** Reviewed chemistry model, independent of DOM state. */
export type AcidType = 'strong' | 'weak';
export interface TitrationOptions {acidType?:AcidType;baseMolL?:number;pKa?:number;addedMl?:number;endpointPh?:number;}
const KW = 1e-14;
export function phAt(volumeMl:number, acidType:AcidType = 'strong', baseMolL:number = 0.1, pKa:number = 4.76) {
  const initialMol = 0.1 * 0.025;
  const totalL = 0.025 + volumeMl / 1000;
  const sodium = baseMolL * volumeMl / 1000 / totalL;
  if (acidType === 'strong') {
    const excess = initialMol / totalL - sodium;
    const root = Math.hypot(excess, 2 * Math.sqrt(KW));
    const h = excess >= 0 ? (excess + root) / 2 : 2 * KW / (root - excess);
    return -Math.log10(h);
  }
  const totalAcid = initialMol / totalL;
  const ka = 10 ** (-pKa);
  let low = -16; let high = 0;
  for (let i = 0; i < 90; i += 1) {
    const mid = (low + high) / 2;
    const h = 10 ** mid;
    const balance = h + sodium - KW / h - totalAcid * ka / (ka + h);
    if (balance > 0) high = mid; else low = mid;
  }
  return -(low + high) / 2;
}
export function calculate({ acidType = 'strong', baseMolL = 0.1, pKa = 4.76, addedMl = 25, endpointPh = 7 }:TitrationOptions = {}) {
  const equivalenceMl = 2.5 / baseMolL;
  const maxMl = Math.max(2 * equivalenceMl, addedMl);
  const curve = Array.from({ length: 401 }, (_, i) => {
    const volumeMl = i * maxMl / 400;
    return { volume_ml: volumeMl, ph: phAt(volumeMl, acidType, baseMolL, pKa), acid_type: acidType,
      acid_initial_mol_l: 0.1, acid_aliquot_ml: 25, base_mol_l: baseMolL, pka: acidType === 'weak' ? pKa : '' };
  });
  let endpointMl:number|null = null;
  if (endpointPh > phAt(0, acidType, baseMolL, pKa) && endpointPh < phAt(maxMl, acidType, baseMolL, pKa)) {
    let low = 0; let high = maxMl;
    for (let i = 0; i < 70; i += 1) {
      const mid = (low + high) / 2;
      if (phAt(mid, acidType, baseMolL, pKa) < endpointPh) low = mid; else high = mid;
    }
    endpointMl = (low + high) / 2;
  }
  const estimatedAcid = endpointMl === null ? null : baseMolL * endpointMl / 25;
  return { curve, equivalenceMl, maxMl, currentPh: phAt(addedMl, acidType, baseMolL, pKa),
    equivalencePh: phAt(equivalenceMl, acidType, baseMolL, pKa), endpointMl, estimatedAcid,
    biasPercent: estimatedAcid === null ? null : 100 * (estimatedAcid / 0.1 - 1) };
}
