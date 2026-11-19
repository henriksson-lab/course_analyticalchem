/** Reviewed analytical model. Pure calculations; units and assumptions are defined in the exercise. */
import * as D from "../lib/math";
export interface ConcentrationOptions { concentration?: number; aliquotMl?: number; dilutionFactor?: number; }

  export function concentrationModel({concentration = 20, aliquotMl = 250, dilutionFactor = 2}: ConcentrationOptions = {}) {
    if (!([concentration, aliquotMl, dilutionFactor].every(Number.isFinite) && concentration >= 0 && aliquotMl > 0 && dilutionFactor >= 1)) throw new RangeError('Use nonnegative concentration, positive aliquot volume, and dilution factor at least one.');
    const massMg = concentration * aliquotMl / 1000;
    const finalMl = aliquotMl * dilutionFactor;
    return {concentration, aliquotMl, dilutionFactor, massMg, finalMl,
      finalConcentration: concentration / dilutionFactor,
      curve: Array.from({length: 91}, (_, i) => {const factor = 1 + i / 10; return [factor, concentration / factor] as const;}),
      rows: [
        {stage: 'original_aliquot', concentration_mg_l: concentration, volume_ml: aliquotMl, analyte_mg: massMg},
        {stage: 'final_dilution', concentration_mg_l: concentration / dilutionFactor, volume_ml: finalMl, analyte_mg: massMg}
      ]};
  }
