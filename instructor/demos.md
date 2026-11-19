# Interactive demonstrations

Each topic exercise has an **Explore** section containing its relevant browser
experiment. Open `<topic>/exercise.qmd#explore` in the source or
`docs/<topic>/exercise.html#explore` in the built course; sidebar demo links lead
to that section. The lecture links to the same experiment. Topics follow the
chemical sequence and are not assumed to be individual scheduled days. Use a
model when prediction, controlled change and interpretation add more than a
static example.

The interface uses quantbio's `.qb-demo` components inside the exercise page.
It has no separate application shell or primary standalone demo index. Models
run in the browser with labelled native controls and responsive SVG plots, with
no R server, account, external chart service or network request needed by the
model. Their mathematical truths are specified teaching cases, not authentic
instrument traces or validated laboratory methods.

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

## Embedded interface and authoring

- `demos/src/<topic>/math.ts` contains the typed numerical model where separate
  mathematics is useful. Pure calculations remain independent of DOM state.
- `demos/src/<topic>/main.ts` mounts through quantbio's `autoMount()` from
  `demos/src/lib/ui.ts`. Each instance owns its controls, state and rendering;
  changing one mounted instance must not change another.
- `demos/src/lib/chemistry.ts` supplies course-specific layout, plot inspection
  and CSV helpers built on the shared quantbio UI. The interface uses labelled
  `.qb-slider`, `.qb-check`, `.qb-panel` and `.qb-readout` components rather
  than the retired custom `ChemDemo` page runtime.
- `demos/build.sh` bundles each `main.ts` into `demos/dist/<topic>.js` as an IIFE
  and copies the shared `demo.css`. The exercise loads those local resources:

```html
<link rel="stylesheet" href="../demos/dist/demo.css">
<div data-demo="titration"></div>
<script src="../demos/dist/titration.js"></script>
```

The module selects its matching `data-demo` host. Every demo exposes a
`data-action="reset"` control that restores both model state and visible control
values for that host. `data-action="export"` downloads the current data or
parameter sweep. The final reporting case additionally exposes
`data-action="measure-new"`: changing its planned sample/aliquot or evidence
conditions leaves existing preparation records unchanged until that action.

Inputs have `data-param` keys, scoped to their host. For example, the fluoride
activity slider is `[data-demo="potentiometry"] [data-param="activity"]` and
the UV cell path is `[data-demo="uv-visible"] [data-param="path"]`. Tests and
teaching scripts should scope selectors to the intended host rather than depend
on global element IDs. The visible label and value describe units; a parameter
key is an implementation identifier, not an analytical quantity by itself.

Plots expose their axes and model description to assistive technology. Focus a
plot and use left/right arrows, Home or End to inspect numerical values; pointer
and touch inspection use the same plotted data. Read the chemical interpretation
alongside the plot rather than relying on colour or curve shape alone.

## Build and verification

Run named targets from the project root; quantbio's default `make` also stages
files, so it is not the appropriate command for a verification pass without staging files.

```sh
make typecheck
make demos
make render
python3 scripts/check-demos.py
python3 scripts/check-demo-browser.py
```

`check-demos.py` runs strict TypeScript/model checks, verifies every exercise's
Explore embed and checks that the published bundles match the built source.
`check-demo-browser.py` serves the built site locally and exercises controls,
reset, chart keyboard inspection, CSV content, mobile layout and independently
mounted instances. It requires local Chrome and Python websocket-client as QA
dependencies; students need neither. Run it after a current site render.

The browser checker prints its temporary artifact directory. Reproduce the
exported model calculations through the course's existing R packages with:

```sh
Rscript scripts/check-demo-r-transfer.R <browser-artifact-directory>
```

The R check imports all twelve CSVs and independently reconstructs selected
mass balances, line fits, integration and withheld-value handling. It checks the
recorded default scenarios; it does not validate every possible control setting
or establish performance of a real analytical method. Retain focused boundary
and scientific regression tests when changing a model. In particular, keep the
monotonic saturation calibration, explicit sampling-count validation, native-loss
versus late-spike distinction, and immutable preparation-history cases covered.
