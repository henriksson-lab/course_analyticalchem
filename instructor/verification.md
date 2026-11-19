# Teaching draft verification

The planned-course draft contains twelve student units and twelve illustrated
decks. This record describes the implemented material, not approval of the
planned syllabus or validation of real laboratory methods.

## Checks completed

- All twelve student lessons' executable R chunks ran in separate fresh Rscript
  processes; dependency-installation examples were excluded from execution.
- Scientific numerical checks passed for concentration/amount conversions,
  extraction mass balance, independent uncertainty propagation, titration
  equilibrium, logarithmic electrode inversion and drift withholding, standard
  addition, elemental blank correction, chromatographic resolution and integrated
  area, internal-standard ratios and final reporting decisions.
- The original inverse-calibration helper passed independent finite-difference
  covariance propagation and a numerical prediction-band inversion comparison.
- Eleven additional worked reports rendered, alongside the earlier UV/visible
  report. Both student report templates rendered from the extracted full student
  archive in a fresh R process.
- Quarto built the course index, reference pages, twelve lessons and twelve decks.
  Local links, figure files, rendered image alt attributes, archive contents and
  dataset dictionary coverage passed automated checks.
- A local Chrome audit traversed every slide at 1440 by 1000 pixels and found
  no content bounds outside the viewport. Representative home, lesson, equation,
  plot and calculation views were visually inspected. A 390-pixel-wide lesson
  had no horizontal page overflow. Duplicated slide captions were removed while
  retaining explicit image alt descriptions.

## Actual picture coverage

Automatic title slides are included. Tables, equations and code alone do not
count. Counts reflect the content, not a slide quota or a promise of lecture
duration. Reused figures develop different interpretations or calculations.

| Deck | Total slides | Substantive visual slides | Visual share |
| --- | ---: | ---: | ---: |
| From sample to answer | 21 | 14 | 66.7% |
| Sampling and preparation | 25 | 21 | 84.0% |
| Error and uncertainty | 25 | 16 | 64.0% |
| Calibration and quality control | 26 | 20 | 76.9% |
| Equilibrium and titration | 25 | 21 | 84.0% |
| Electrodes and potentiometry | 25 | 19 | 76.0% |
| UV and visible absorption | 18 | 12 | 66.7% |
| Matrix effects and recovery | 24 | 21 | 87.5% |
| Atomic measurements | 24 | 22 | 91.7% |
| Separation principles | 25 | 21 | 84.0% |
| GC and HPLC | 26 | 22 | 84.6% |
| Choosing and defending a result | 25 | 23 | 92.0% |

Total: 232 visual slides out of 289 (80.3%). Every deck exceeds 50%.

## Review before teaching

A chemistry teacher still needs to review the examples against the eventual
planned-course syllabus, local laboratory methods and intended depth. Pilot
explanations, practical workload and lecture pacing with students. Conditional
uncertainty budgets and simulated data are not complete real-method validation.
No bench protocols, programme scheduling or formal assessment scheme have been
created by this draft.


## Interactive demo verification

Twelve local browser demos now accompany the topic units. Three parallel workers
implemented the foundations, chemical-measurement and instrument/separation
groups, followed by independent review of another group's model equations and
reporting logic. A monotonic saturation model replaced a quadratic calibration
that could fold back at high concentration; an explicit regression and
monotonicity check cover that case. Sampling-count inputs now reject incomplete,
fractional or out-of-range values instead of silently changing them.

Node tests pass for the shared helpers and all three module groups. They cover
mass conservation, equal-mass sampling, extraction, common uncertainty,
calibration diagnostics, charge balance and endpoints, activity/QC distinctions,
stray light, standard addition, line overlap and blank basis, conserved Gaussian
areas, internal-standard assumptions and immutable preparation records.

Local Chrome tests exercised controls and their bounded settings, mode-dependent
controls, reset, keyboard plot inspection and generated CSV filenames/content in
all twelve demos. Specific scenarios verified empty sampling disables export,
planned dilution changes preserve the old signal, a new measurement can support
a valid result, and failed QC exports a withheld result rather than zero.
All twelve demos fit a 390-pixel mobile viewport with no horizontal page overflow
or uncaught script errors. Representative desktop and mobile views were visually
inspected. CSV payloads were captured in the browser; no external data service
is involved.

Demos remain specified teaching models. Their displayed exercise checks,
noise-free curves and visible simulation truths do not establish real method
validation or a full uncertainty statement. See [the demo teaching guide](demos.md)
for the intended predictions and R follow-up.


All twelve browser-generated CSV files also imported without parsing problems
in R. Independent R calculations reproduced mass conservation, the shared
uncertainty model, calibration fits, electrode and UV slopes, standard addition,
digest-basis correction, integrated area, internal-standard ratios and missing
reported values for withheld records. The demos' CSV handoff therefore uses
the same R packages as the course.
