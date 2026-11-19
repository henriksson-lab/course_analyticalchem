import * as D from '../lib/math';
  export function sensitivity(wavelengthNm:number) { return 0.1988 * Math.exp(-0.5 * ((wavelengthNm - 510) / 37) ** 2); }
  export function absorbance(concentrationMgL:number, pathCm = 1, wavelengthNm = 510, strayFraction = 0) {
    const ideal = sensitivity(wavelengthNm) * pathCm * concentrationMgL;
    const transmission = (10 ** (-ideal) + strayFraction) / (1 + strayFraction);
    return -Math.log10(transmission);
  }
  export function calculate({ concentrationMgL = 2.4, pathCm = 1, wavelengthNm = 510, strayFraction = 0, recalibrate = true } = {}) {
    const calPath = recalibrate ? pathCm : 1;
    const calWavelength = recalibrate ? wavelengthNm : 510;
    const standards = [0, .5, 1, 2, 3, 4].map(c => ({ concentration_mg_l: c,
      absorbance: absorbance(c, calPath, calWavelength, strayFraction), path_cm: calPath,
      wavelength_nm: calWavelength, stray_fraction: strayFraction, record_type: 'standard' }));
    const fit = D.linearFit(standards.map(r => r.concentration_mg_l), standards.map(r => r.absorbance));
    const sampleAbsorbance = absorbance(concentrationMgL, pathCm, wavelengthNm, strayFraction);
    const candidateRaw = (sampleAbsorbance - fit.a) / fit.b;
    const candidateMgL = Math.abs(candidateRaw) < 1e-12 ? 0 : candidateRaw;
    const residuals = standards.map(r => ({ concentration_mg_l: r.concentration_mg_l,
      residual_absorbance: r.absorbance - fit.a - fit.b * r.concentration_mg_l }));
    const maxResidual = Math.max(...residuals.map(r => Math.abs(r.residual_absorbance)));
    const linearCheckPass = maxResidual <= .005;
    const conditionsMatch = recalibrate || (pathCm === 1 && wavelengthNm === 510);
    const inRange = candidateMgL >= -1e-12 && candidateMgL <= 4 + 1e-12;
    const reportable = inRange && linearCheckPass && conditionsMatch;
    const curve = Array.from({ length: 121 }, (_, i) => ({ concentration_mg_l: i / 10,
      absorbance: absorbance(i / 10, pathCm, wavelengthNm, strayFraction) }));
    return { standards, fit, sampleAbsorbance, candidateMgL, residuals, maxResidual, linearCheckPass,
      conditionsMatch, inRange, reportable, reportedMgL: reportable ? candidateMgL : null,
      idealAbsorbance: sensitivity(wavelengthNm) * pathCm * concentrationMgL,
      transmittedFraction: 10 ** (-sampleAbsorbance), curve };
  }
