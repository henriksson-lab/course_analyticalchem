(function () {
  'use strict';
  const D = typeof window !== 'undefined' ? window.ChemDemo : require('../demo-core.js');
  function sensitivity(wavelengthNm) { return 0.1988 * Math.exp(-0.5 * ((wavelengthNm - 510) / 37) ** 2); }
  function absorbance(concentrationMgL, pathCm = 1, wavelengthNm = 510, strayFraction = 0) {
    const ideal = sensitivity(wavelengthNm) * pathCm * concentrationMgL;
    const transmission = (10 ** (-ideal) + strayFraction) / (1 + strayFraction);
    return -Math.log10(transmission);
  }
  function calculate({ concentrationMgL = 2.4, pathCm = 1, wavelengthNm = 510, strayFraction = 0, recalibrate = true } = {}) {
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
  if (typeof module !== 'undefined' && module.exports) module.exports = { sensitivity, absorbance, calculate };
  if (typeof document === 'undefined') return;
  D.init({ title: 'UV/visible: when absorption stops looking linear',
    intro: 'Change iron concentration, cell path and wavelength in an illustrative coloured-complex model. Then introduce stray light and inspect the calibration residuals rather than trusting the line alone.',
    predict: 'Doubling concentration doubles ideal absorbance. Does that halve transmission? What changes if a small amount of stray light reaches the detector?',
    controls: `<label for="concentration">Known final iron concentration (mg Fe/L) <output id="concentration-value"></output><input id="concentration" type="range" min="0" max="12" step="0.1" value="2.4"></label>
      <label for="path">Cell path (cm) <output id="path-value"></output><input id="path" type="range" min="0.5" max="2" step="0.1" value="1"></label>
      <label for="wavelength">Selected wavelength (nm) <output id="wavelength-value"></output><input id="wavelength" type="range" min="450" max="600" step="5" value="510"></label>
      <label for="stray">Stray-light fraction relative to reference light <output id="stray-value"></output><input id="stray" type="range" min="0" max="0.02" step="0.001" value="0"></label>
      <label for="recalibrate"><input id="recalibrate" type="checkbox" checked> Recalibrate for selected cell path and wavelength</label>`,
    body: '<div id="chart"></div><div id="readout" aria-live="polite"></div><p id="interpretation"></p><h2>Inspect the standards</h2><div id="residual-chart"></div>',
    notes: 'Simulated noise-free response, not an authentic iron-complex spectrum or validated instrument model. Sensitivity follows an illustrative Gaussian centred at 510 nm with 37 nm width, matching the conceptual spectral envelope in the course. Ideal A = k(λ)lc. Stray light is modelled as T = (10⁻ᴬ + s)/(1 + s), where s is an unabsorbed intensity fraction added to both reference and sample. Standards span 0–4 mg Fe/L. A maximum absolute standard residual of 0.005 absorbance is a supplied exercise check, not a universal linearity criterion. No scattering, chemical-equilibrium changes, random noise or uncertainty interval is simulated. The ideal spectra and cell are not proof of selectivity or recovery in real samples.' });
  let latest;
  function render() {
    const concentrationMgL = +D.byId('concentration').value; const pathCm = +D.byId('path').value;
    const wavelengthNm = +D.byId('wavelength').value; const strayFraction = +D.byId('stray').value;
    const recalibrate = D.byId('recalibrate').checked;
    D.byId('concentration-value').textContent = concentrationMgL.toFixed(2);
    D.byId('path-value').textContent = pathCm.toFixed(2);
    D.byId('wavelength-value').textContent = wavelengthNm.toFixed(0);
    D.byId('stray-value').textContent = strayFraction.toFixed(3);
    latest = calculate({ concentrationMgL, pathCm, wavelengthNm, strayFraction, recalibrate });
    const xmax = Math.max(12, Math.max(0, latest.candidateMgL) * 1.05);
    const linePoints = [[0, latest.fit.a], [xmax, latest.fit.a + latest.fit.b * xmax]];
    const ymax = Math.max(1, ...latest.curve.map(r => r.absorbance), ...linePoints.map(r => r[1])) * 1.05;
    D.plot('chart', { xLabel: 'Final iron concentration (mg Fe/L)', yLabel: 'Absorbance',
      xDomain: [0, xmax], yDomain: [0, ymax],
      series: [{ label: 'Actual response under selected sample conditions', color: D.colors.orange, type: 'line', points: latest.curve.map(r => [r.concentration_mg_l, r.absorbance]) },
        { label: 'Applied straight-line calibration', color: D.colors.teal, type: 'line', dash: true, points: linePoints },
        { label: 'Prepared calibration standards', color: D.colors.teal, type: 'points', points: latest.standards.map(r => [r.concentration_mg_l, r.absorbance]) },
        { label: 'Known sample input', color: D.colors.purple, type: 'points', points: [[concentrationMgL, latest.sampleAbsorbance]] }],
      vertical: [{ x: 4, label: 'Highest prepared standard', color: D.colors.gray }],
      description: 'A linear calibration is compared with the simulated sample response; stray light can make the response bend below a straight line.' });
    const rlim = Math.max(.006, latest.maxResidual * 1.3);
    D.plot('residual-chart', { xLabel: 'Prepared standard concentration (mg Fe/L)', yLabel: 'Residual absorbance',
      xDomain: [0, 4], yDomain: [-rlim, rlim],
      series: [{ label: 'Observed minus fitted standard', color: D.colors.orange, type: 'points', points: latest.residuals.map(r => [r.concentration_mg_l, r.residual_absorbance]) }],
      horizontal: [{ y: 0, label: 'Zero', color: D.colors.gray }], description: 'The standard residuals expose curvature even when an overall fitted line looks convincing.' });
    const reasons = [];
    if (!latest.conditionsMatch) reasons.push('cell/wavelength does not match the applied calibration');
    if (!latest.linearCheckPass) reasons.push('standard residual exceeds the exercise 0.005 absorbance check');
    if (!latest.inRange) reasons.push('inverse estimate is outside 0–4 mg Fe/L');
    D.byId('readout').innerHTML = `<p><strong>Ideal absorbance:</strong> ${latest.idealAbsorbance.toFixed(4)} · <strong>Observed absorbance:</strong> ${latest.sampleAbsorbance.toFixed(4)} · <strong>Observed transmission:</strong> ${(100 * latest.transmittedFraction).toFixed(2)}%</p>
      <p><strong>Candidate inverse estimate:</strong> ${latest.candidateMgL.toFixed(3)} mg Fe/L final · <strong>Maximum standard residual:</strong> ${latest.maxResidual.toFixed(5)}</p>
      <p><strong>${reasons.length ? 'Withhold under this exercise: ' + reasons.join('; ') + '.' : 'Passes the stated range, matching and residual checks; full method validation is not established.'}</strong></p>`;
    D.byId('interpretation').textContent = strayFraction > 0 ?
      'Stray light imposes a transmission floor. At higher concentration the observed absorbance bends below ideal Beer–Lambert response. Recalibrating a straight line does not make this nonlinear response truly linear; inspect the residuals and required range.' :
      'At fixed cell and wavelength this ideal response is linear in concentration, while transmission is exponential. Changing wavelength changes sensitivity in this illustrative envelope. The noise-free simulation cannot establish precision, detection limits or selectivity.';
  }
  D.bind(render);
  D.byId('export').addEventListener('click', () => D.csv('uv-visible-demo.csv', latest.standards.concat([{
    record_type: 'unknown', concentration_mg_l: +D.byId('concentration').value, absorbance: latest.sampleAbsorbance,
    path_cm: +D.byId('path').value, wavelength_nm: +D.byId('wavelength').value,
    stray_fraction: +D.byId('stray').value, candidate_mg_l: latest.candidateMgL,
    passes_exercise_checks: latest.reportable, reported_mg_l: latest.reportedMgL === null ? '' : latest.reportedMgL
  }])));
}());
