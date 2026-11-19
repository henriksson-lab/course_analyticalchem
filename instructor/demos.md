# Interactive demonstrations

There is one browser experiment for each topic unit, linked from its student
page and deck. This maps coverage to the agreed chemical sequence; it does not
assume that a topic is one scheduled day. Use a demo when prediction, a controlled
change and interpretation add more than another static example.

The demos run locally with native HTML controls and SVG plots. They need no R
server, external chart library, account or network connection after the built
pages are available. `docs/demos/index.html` is the entry point. Their numerical
models are deliberately specified teaching cases, not instrument emulators or
validated methods.

## Teaching purpose and R transfer

| Topic | Useful experiment | Reasoning to elicit | Export into R |
| --- | --- | --- | --- |
| Sample to answer | Change aliquot volume separately from dilution factor | Concentration and analyte amount are different quantities; name the measured stage | Verify mass balance at both stages using concentration × volume |
| Sampling/preparation | Allocate grabs to equal-mass strata; compare one extraction with fresh successive portions | A precise top-only design misses the bulk target; equal total solvent does not imply equal recovery | Compare all-grab versus stratum-weighted means; reproduce the extraction fraction |
| Error/uncertainty | Add readings of one preparation while keeping its common offset | Independent noise averages down; shared effects and uncorrected bias remain | Compare observed reading SD, SD/sqrt(n), and the supplied model uncertainty; do not call them interchangeable |
| Calibration/QC | Change range, monotonic saturation, noise and later sensitivity; explicitly review residuals | A high R² or passing check cannot establish a correct model; a candidate estimate is not automatically reportable | Filter `role == "standard"` before fitting; inspect residuals and preserve later unknown/check roles |
| Titration | Compare strong and weak acid at fixed amount, then change titrant concentration and endpoint pH | Equivalence amount follows stoichiometry; observed endpoint depends on its rule | Plot the exported curve; use actual volume spacing in finite differences; rows belong to one modelled titration |
| Potentiometry | Contrast sample-specific activity mismatch with shared potential drift | A matrix-matched reference check can pass while another sample remains biased | Plot voltage versus log concentration; keep calibration curves separate from the unknown record |
| UV/visible | Change path/wavelength with or without recalibration, then add stray light | Beer–Lambert linearity and exponential transmission differ; a straight line does not remove curvature | Fit the standard rows, inspect residuals and compare the sample's candidate with the reported result |
| Matrix/recovery | Separate sensitivity suppression, native loss before spiking and additive interference | Standard addition can correct a shared slope effect but not restore lost native analyte or identify an additive interferent | Fit final-flask additions; calculate negative intercept and 25/10 correction; compare raw/corrected signal |
| Atomic methods | Move a neighbouring line and change the undiluted method blank | Sample-specific overlap is not removed by the method blank; correct on a common digest basis | Plot wavelength profiles and reconstruct the apparent dry-mass calculation; it remains diagnostic |
| Separations | Change spacing, band width and relative component area | Total component area can remain fixed while integration contamination increases; resolution alone is not purity | Integrate the baseline-subtracted traces, compare fixed-window and complete component areas |
| GC/HPLC | Change injection amount, internal-standard addition timing, extraction loss and differential response | A ratio cancels selected shared multiplicative effects, not every bias | Reproduce external and ratio candidates; retain withheld flags; a constant offset can leave a small residual bias |
| Defending a result | Plan a new aliquot, then explicitly measure it; separately test QC failure and coelution | Changing a plan cannot rewrite an old signal; reportability requires appropriate evidence | Audit history by preparation ID, with candidate and reported values in separate columns |

## Suggested use

Ask for a direction and a chemical reason before moving a control. Change one
condition first; then combine failures only after students can explain the
separate effects. A model truth is visible because the instructor controls a
simulation. An actual unknown does not disclose its true concentration,
component contributions or common offset.

Export the current CSV and reproduce one relationship in the familiar course
project. Read its header and role columns before fitting. Time and wavelength
positions, modelled curves and parameter sweeps are not independent samples.
Blank reported fields represent withheld estimates rather than zero analyte.
Retain reasons and preparation history in the report.

Several demos use noise-free equations to make the mechanism visible. Do not
infer perfect analytical precision, detection limits or complete uncertainty
from those exact curves. Simulated gates use explicitly supplied exercise rules.
Real matrix equivalence, recovery, selectivity and uncertainty require evidence.

## Implementation and checks

- `demos/modules/*.js` owns each model and its interface; pure functions are
  exported for numerical checks in Node.
- `demos/demo-core.js` supplies a shared responsive plot, labelled controls,
  deterministic sampling, simple line fitting and CSV generation.
- `scripts/build-demo-pages.py` regenerates the twelve local HTML shells.
- `scripts/test-demo-core.cjs` and the three `test-demos-*.cjs` groups check model
  equations, boundaries, withholding and immutable preparation records.
- `scripts/check-demo-browser.py` optionally exercises controls, reset, chart
  keyboard inspection, CSV content and mobile layout. It requires local Chrome
  and Python websocket-client; these are QA dependencies, not demo dependencies.

Three parallel workers built the module groups. Independent read-only review
of another group's models found a quadratic toy calibration could fold back at
high concentration; it was replaced with a monotonic saturating model and a
regression test. The review also corrected a recovered-concentration label and
made invalid sampling counts explicit instead of silently clamping them.


Browser CSV exports can also be checked through the existing R packages with
`Rscript scripts/check-demo-r-transfer.R <browser-artifact-directory>`. This
imports every exported file, checks parsing, and independently reconstructs
selected mass balances, model fits, integration and withheld-result handling.
