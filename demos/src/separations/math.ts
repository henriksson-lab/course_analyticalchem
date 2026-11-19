/** Reviewed chemistry model, ported without DOM state or numerical changes. */
export interface SeparationOptions {spacing?:number|string;widthFactor?:number|string;areaB?:number|string;}
export function gaussianArea(x:number, center:number, sigma:number, area:number):number {
  return area / (sigma * Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * ((x - center) / sigma) ** 2);
}
export function separationModel(options:SeparationOptions = {}) {
  const spacing = options.spacing === undefined ? 1 : Number(options.spacing);
  const widthFactor = options.widthFactor === undefined ? 1 : Number(options.widthFactor);
  const areaB = options.areaB === undefined ? 150 : Number(options.areaB);
  if (!(spacing > 0) || !(widthFactor > 0) || !(areaB > 0)) throw new RangeError('Spacing, width and area must be positive.');
  const areaA = 100, t0 = 1, tA = 3, tB = tA + spacing;
  const widthA = 0.4 * widthFactor, widthB = 0.5 * widthFactor;
  const sigmaA = widthA / 4, sigmaB = widthB / 4;
  const resolution = 2 * spacing / (widthA + widthB);
  const kA = (tA - t0) / t0, kB = (tB - t0) / t0;
  const windowLow = tA - widthA / 2, windowHigh = tA + widthA / 2;
  const rows = [];
  for (let i = 0; i <= 1600; i += 1) {
    const time = i * 0.005;
    const a = gaussianArea(time, tA, sigmaA, areaA);
    const b = gaussianArea(time, tB, sigmaB, areaB);
    rows.push({time_min: time, component_a: a, component_b: b, combined_above_baseline: a + b});
  }
  // Integrate a fixed definition of A's window, including the B contribution.
  let aWindow = 0, bWindow = 0;
  const step = (windowHigh - windowLow) / 1000;
  for (let i = 0; i <= 1000; i += 1) {
    const x = windowLow + i * step, w = i === 0 || i === 1000 ? 0.5 : 1;
    aWindow += w * gaussianArea(x, tA, sigmaA, areaA) * step;
    bWindow += w * gaussianArea(x, tB, sigmaB, areaB) * step;
  }
  return {spacing, widthFactor, areaA, areaB, t0, tA, tB, widthA, widthB, kA, kB,
    alpha: kB / kA, resolution, windowLow, windowHigh, aWindow, bWindow,
    combinedWindow: aWindow + bWindow,
    contaminationPercent: 100 * bWindow / (aWindow + bWindow), rows};
}
