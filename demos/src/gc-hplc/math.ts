/** Reviewed chemistry model, ported without DOM state or numerical changes. */
export interface InjectionOptions {injectionFactor?:number|string;recovery?:number|string;timing?:'before'|'after';analyteResponse?:number|string;coelutionArea?:number|string;}
export function injectionModel(options:InjectionOptions = {}) {
  const injectionFactor = options.injectionFactor === undefined ? 0.8 : Number(options.injectionFactor);
  const recovery = options.recovery === undefined ? 1 : Number(options.recovery);
  const timing = options.timing === undefined ? 'after' : options.timing;
  const analyteResponse = options.analyteResponse === undefined ? 1 : Number(options.analyteResponse);
  const coelutionArea = options.coelutionArea === undefined ? 0 : Number(options.coelutionArea);
  if (!(injectionFactor > 0) || !(recovery > 0 && recovery <= 1) || !(analyteResponse > 0) || !(coelutionArea >= 0) || !['before', 'after'].includes(timing)) {
    throw new RangeError('Positive injection/response, recovery in (0,1], and known addition timing are required.');
  }
  const intendedFinalMgL = 15, dilutionFactor = 10;
  const standardRecovery = timing === 'before' ? recovery : 1;
  const caffeineArea = 3 + injectionFactor * (50 * intendedFinalMgL * recovery * analyteResponse + coelutionArea);
  const standardArea = 500 * injectionFactor * standardRecovery;
  const ratio = caffeineArea / standardArea;
  const externalFinalMgL = (caffeineArea - 3) / 50;
  const ratioFinalMgL = (ratio - 0.006) / 0.100;
  const inRange = ratioFinalMgL >= 0 && ratioFinalMgL <= 40;
  const compensationValid = analyteResponse === 1 && (recovery === 1 || timing === 'before');
  const reportable = inRange && coelutionArea === 0 && compensationValid;
  return {injectionFactor, recovery, timing, analyteResponse, coelutionArea,
    intendedFinalMgL, dilutionFactor, caffeineArea, standardArea, ratio,
    externalFinalMgL, ratioFinalMgL, externalOriginalMgL: externalFinalMgL * dilutionFactor,
    ratioOriginalMgL: ratioFinalMgL * dilutionFactor, truthOriginalMgL: intendedFinalMgL * dilutionFactor,
    inRange, compensationValid, reportable, reportedOriginalMgL: reportable ? ratioFinalMgL * dilutionFactor : null};
}
