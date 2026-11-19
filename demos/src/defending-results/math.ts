/** Reviewed chemistry model, ported without DOM state or numerical changes. */
export type SampleId='drink_A'|'drink_B'|'drink_C';
export interface EvidenceRecord {aliquotMl:number;finalMl:number;area:number;qcRecovery:number;resolved:boolean;}
export interface PreparationPlan {sample?:SampleId;aliquotMl?:number|string;qcOK?:boolean;resolved?:boolean;}
const sampleTruth = {drink_A: 150, drink_B: 400, drink_C: 120};
export function assessRecord<T extends EvidenceRecord>(record:T) {
  if (!(record.aliquotMl > 0) || !(record.finalMl > 0)) throw new RangeError('Preparation volumes must be positive.');
  const candidateFinalMgL = (record.area - 4) / 40;
  const dilutionFactor = record.finalMl / record.aliquotMl;
  const candidateOriginalMgL = candidateFinalMgL * dilutionFactor;
  const inRange = candidateFinalMgL >= 0 && candidateFinalMgL <= 30;
  const qcPass = record.qcRecovery >= 95 && record.qcRecovery <= 105;
  const reasons = [];
  if (!inRange) reasons.push('outside the 0–30 mg/L final calibration range');
  if (!qcPass) reasons.push('independent QC outside 95–105%');
  if (!record.resolved) reasons.push('known unresolved contributing peak');
  const reportable = reasons.length === 0;
  return {...record, candidateFinalMgL, dilutionFactor, candidateOriginalMgL,
    inRange, qcPass, reportable, reasons,
    reportedOriginalMgL: reportable ? candidateOriginalMgL : null,
    uOriginalMgL: reportable ? 0.15 * dilutionFactor : null};
}
export function measurePreparation(plan:PreparationPlan = {}, sequence:number = 1) {
  const sample = plan.sample || 'drink_B';
  const aliquotMl = plan.aliquotMl === undefined ? 5 : Number(plan.aliquotMl);
  const finalMl = 50;
  const qcOK = plan.qcOK !== false, resolved = plan.resolved !== false;
  if (!(sample in sampleTruth) || !(aliquotMl > 0 && aliquotMl <= finalMl)) throw new RangeError('Choose a supplied sample and a positive aliquot within the final volume.');
  const trueOriginalMgL = sampleTruth[sample];
  const instrumentFactor = qcOK ? 1 : 0.85;
  const trueFinalMgL = trueOriginalMgL * aliquotMl / finalMl;
  const interferenceArea = resolved ? 0 : 80;
  const area = 4 + instrumentFactor * (40 * trueFinalMgL + interferenceArea);
  return assessRecord({preparation: sequence, sample, aliquotMl, finalMl, area,
    resolved, qcRecovery: 100 * instrumentFactor, trueOriginalMgL,
    uFinalConcentrationMgL: 0.15});
}
