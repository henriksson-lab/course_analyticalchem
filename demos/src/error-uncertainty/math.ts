/** Reviewed analytical model. Pure calculations; units and assumptions are defined in the exercise. */
import * as D from "../lib/math";
export interface UncertaintyOptions { n?: number; readingSd?: number; sharedU?: number; bias?: number; corrected?: boolean; seed?: number; }

  export function uncertaintyModel({n = 10, readingSd = 0.2, sharedU = 0.1, bias = 0.3, corrected = false, seed = 17}: UncertaintyOptions = {}) {
    if (!([n, readingSd, sharedU, bias].every(Number.isFinite) && Number.isInteger(n) && n >= 1 && n <= 100 && readingSd >= 0 && sharedU >= 0 && Number.isFinite(bias))) throw new RangeError('Invalid repeat count or uncertainty input.');
    const reference = 10, rng = D.rng(seed), sharedOffset = sharedU * D.normal(rng);
    // A single common offset is retained as more readings of this preparation are added.
    const readingErrors = Array.from({length: 100}, () => readingSd * D.normal(rng));
    const raw = readingErrors.slice(0, n).map(e => reference + bias + sharedOffset + e);
    const correction = corrected ? bias : 0;
    const values = raw.map(v => v - correction);
    const combinedU = Math.sqrt(readingSd ** 2 / n + sharedU ** 2);
    const curves = Array.from({length: 100}, (_, i) => ({n: i + 1,
      reading_u_mg_l: readingSd / Math.sqrt(i + 1),
      combined_u_mg_l: Math.sqrt(readingSd ** 2 / (i + 1) + sharedU ** 2)}));
    const rows = values.map((value, i) => ({reading_id: i + 1, reported_reading_mg_l: value,
      raw_reading_mg_l: raw[i], reference_mg_l: reference, known_bias_mg_l: bias,
      applied_correction_mg_l: correction, reading_sd_model_mg_l: readingSd,
      shared_standard_uncertainty_mg_l: sharedU, n_readings: n,
      mean_standard_uncertainty_model_mg_l: combinedU, simulation_run: seed}));
    return {n, readingSd, sharedU, bias, corrected, reference, sharedOffset, raw, values,
      rawMean: D.mean(raw), mean: D.mean(values), observedSd: n > 1 ? D.sd(values) : null,
      combinedU, readingU: readingSd / Math.sqrt(n), curves, rows};
  }
