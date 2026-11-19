/** Reviewed analytical model. Pure calculations; units and assumptions are defined in the exercise. */
import * as D from "../lib/math";
export interface SamplingOptions { counts?: number[]; seed?: number; }
export interface ExtractionOptions { distribution?: number; aqueousMl?: number; solventMl?: number; extractions?: number; }
export interface GrabRow { stratum: string; grab: number; iron_mg_kg: number; population_stratum_mean_mg_kg: number; stratum_mass_fraction: number; }

  export function validateGrabCounts(rawValues: readonly unknown[]) {
    const names = ['top', 'middle', 'bottom'];
    const invalid = rawValues.length !== 3 ? names : names.filter((_, i) => {
      const raw = rawValues[i];
      const value = typeof raw === 'number' ? raw : Number(raw);
      return raw === null || raw === undefined || String(raw).trim() === '' ||
        !Number.isFinite(value) || !Number.isInteger(value) || value < 0 || value > 20;
    });
    return invalid.length ? {valid: false, counts: null, invalid,
      message: `Enter a whole grab count from 0 to 20 for ${invalid.join(', ')}. No sampling result is calculated until those counts are valid.`} :
      {valid: true, counts: rawValues.map(Number), invalid: [], message: 'Whole-grab counts are used exactly as entered (0–20 per stratum).'};
  }
  export function samplingModel({counts = [3, 3, 3], seed = 47}: SamplingOptions = {}) {
    if (counts.length !== 3 || counts.some(n => !Number.isInteger(n) || n < 0 || n > 20)) throw new RangeError('Three integer grab counts from zero to twenty are required.');
    const means = [8, 14, 25], names = ['top', 'middle', 'bottom'];
    const rng = D.rng(seed);
    // Generate every possible grab first so changing allocation preserves existing observations.
    const all = means.map(mu => Array.from({length: 20}, () => mu + 0.25 * D.normal(rng)));
    const rows: GrabRow[] = [];
    const selectedMeans = means.map((_, stratum) => {
      const values = all[stratum].slice(0, counts[stratum]);
      values.forEach((value, j) => rows.push({stratum: names[stratum], grab: j + 1, iron_mg_kg: value,
        population_stratum_mean_mg_kg: means[stratum], stratum_mass_fraction: 1 / 3}));
      return values.length ? D.mean(values) : null;
    });
    const observed = rows.map(r => r.iron_mg_kg);
    const naiveMean = observed.length ? D.mean(observed) : null;
    const expectedNaive = observed.length ? counts.reduce((s, n, i) => s + n * means[i], 0) / observed.length : null;
    const stratifiedMean = selectedMeans.every(v => v !== null) ? D.mean(selectedMeans as number[]) : null;
    return {counts, seed, means, names, selectedMeans, rows, naiveMean, expectedNaive, stratifiedMean,
      targetMean: D.mean(means), points: rows.map(r => [names.indexOf(r.stratum) + 1, r.iron_mg_kg] as const)};
  }
  export function extractionModel({distribution = 9, aqueousMl = 20, solventMl = 10, extractions = 2}: ExtractionOptions = {}) {
    if (!([distribution, aqueousMl, solventMl, extractions].every(Number.isFinite) && distribution > 0 && aqueousMl > 0 && solventMl > 0 && Number.isInteger(extractions) && extractions >= 1)) throw new RangeError('Positive distribution and volumes, and a positive integer extraction count, are required.');
    const fraction = (n: number) => 1 - Math.pow(aqueousMl / (aqueousMl + distribution * solventMl / n), n);
    return {distribution, aqueousMl, solventMl, extractions, recovery: fraction(extractions),
      rows: Array.from({length: 8}, (_, j) => ({number_of_extractions: j + 1, aqueous_ml: aqueousMl,
        total_solvent_ml: solventMl, distribution_ratio: distribution, recovered_fraction: fraction(j + 1)}))};
  }
