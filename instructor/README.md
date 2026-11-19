# Instructor guide for Analytical Chemistry

This is a complete first teaching draft for the planned 7.5-credit course.
Teaching content follows Harris and Lucy by topic; adoption and edition for the
new course remain unconfirmed. Programme organisation, timetabling and formal
assessment design are outside scope.

## Units and executable solutions

Each student page has chemical explanation, a worked example, runnable R,
transfer task and checks. Each deck has speaker notes. Analyses below rebuild
results and original analytical plots. Completed HTML reports are in
`reports/worked/`; render them with `Rscript scripts/render-worked-reports.R`.

| Topic | Student source | Deck source | Analysis | Worked report source |
| --- | --- | --- | --- | --- |
| From sample to answer | [Lesson](../sample-answer/exercise.qmd) | [Slides](../sample-answer/lec.qmd) | [R](../R/analyse-sample-answer.R) | [Solution](reports/sample-answer.Rmd) |
| Sampling and preparation | [Lesson](../sampling-preparation/exercise.qmd) | [Slides](../sampling-preparation/lec.qmd) | [R](../R/analyse-sampling-preparation.R) | [Solution](reports/sampling-preparation.Rmd) |
| Error and uncertainty | [Lesson](../error-uncertainty/exercise.qmd) | [Slides](../error-uncertainty/lec.qmd) | [R](../R/analyse-error-uncertainty.R) | [Solution](reports/error-uncertainty.Rmd) |
| Calibration and quality control | [Lesson](../calibration-qc/exercise.qmd) | [Slides](../calibration-qc/lec.qmd) | [R](../R/analyse-calibration-qc.R) | [Solution](reports/calibration-qc.Rmd) |
| Equilibrium and titration | [Lesson](../titration/exercise.qmd) | [Slides](../titration/lec.qmd) | [R](../R/analyse-titration.R) | [Solution](reports/titration.Rmd) |
| Electrodes and potentiometry | [Lesson](../potentiometry/exercise.qmd) | [Slides](../potentiometry/lec.qmd) | [R](../R/analyse-potentiometry.R) | [Solution](reports/potentiometry.Rmd) |
| UV and visible absorption | [Lesson](../uv-visible/exercise.qmd) | [Slides](../uv-visible/lec.qmd) | [R](../R/analyse-uv-visible.R) | [Solution](../worked-example.Rmd) |
| Matrix effects and recovery | [Lesson](../matrix-recovery/exercise.qmd) | [Slides](../matrix-recovery/lec.qmd) | [R](../R/analyse-matrix-recovery.R) | [Solution](reports/matrix-recovery.Rmd) |
| Atomic measurements | [Lesson](../atomic-methods/exercise.qmd) | [Slides](../atomic-methods/lec.qmd) | [R](../R/analyse-atomic-methods.R) | [Solution](reports/atomic-methods.Rmd) |
| Separation principles | [Lesson](../separations/exercise.qmd) | [Slides](../separations/lec.qmd) | [R](../R/analyse-separations.R) | [Solution](reports/separations.Rmd) |
| GC and HPLC | [Lesson](../gc-hplc/exercise.qmd) | [Slides](../gc-hplc/lec.qmd) | [R](../R/analyse-gc-hplc.R) | [Solution](reports/gc-hplc.Rmd) |
| Choosing and defending a result | [Lesson](../defending-results/exercise.qmd) | [Slides](../defending-results/lec.qmd) | [R](../R/analyse-defending-results.R) | [Solution](reports/defending-results.Rmd) |

## R continuity

Assume students encountered projects, CSV import, dplyr, ggplot2, grouped
summaries, SD, lm, residuals and R Markdown in introductory computing. Begin
with retrieval on a small analytical example. Keep the vocabulary consistent.
Explicit additions are keyed joins, instrument series, log relationships and
a supplied inverse-calibration helper. No new programming survey, loops,
student-written functions, machine learning or advanced multivariate methods
are required. Functions and loops in instructor generators are implementation
code, not student learning outcomes.

## Scientific review points

- Sampling: equal-mass strata are supplied; no arbitrary grabs establish a
  bulk mean. Composites do not retain spatial variation or independent replication.
- Preparation: distinguish aliquot/final/extract volumes and original mass.
  Extracted caffeine is not established total native recovery.
- Uncertainty: independent-input propagation is conditional. Shared errors do
  not shrink with more readings. Standard uncertainty is not a 95% half-width.
- Calibration: retain the intercept, inspect residuals and stated range, use
  independent checks, and distinguish inverse concentration from forward response.
  Blank 3/10-SD examples are heuristics in a separate ideal model.
- Titration: endpoint estimates equivalence; weak-acid pH differs despite equal
  stoichiometric amount. EDTA hardness uses an equivalent CaCO3 reporting basis.
- Electrodes: activity and concentration are related under stated conditions.
  The example uses a signed anion-response convention and checks later drift.
- UV/visible: the original unit's [detailed notes](uv-visible.md) explain the
  absorber, blank reference, conditional inverse uncertainty and withheld results.
- Matrix: fixed-final-volume standard addition assumes corrected background,
  equivalent native/spike response and constant matrix fraction. A late spike
  does not validate early recovery.
- Atomic: correct blank and sample on the same digest basis before returning
  to dry mass. Dissolved QC does not validate digestion recovery or speciation.
- Separation: use the supplied baseline widths, distinguish time positions
  from replicates, and do not infer purity or identity from retention alone.
- GC/HPLC: fixed internal-standard concentration is essential to this simple
  area-ratio calibration. It cannot rescue coelution or a failed QC block.
- Final case: ideal standard points do not imply zero uncertainty. Supplied
  final-concentration standard uncertainties exclude volumes and recovery.
  MS is an identity-evidence overview; the spectrum is illustrative.

## Pacing and figure review

Treat 45 minutes as a possible lecture length, with shorter decks allowed.
The user's observed 40 seconds per slide is a rough reality check, not a quota.
Use prediction questions, calculations and discussion when they develop an
idea; keep extended coding in practicals. Do not add slides to occupy time.
The audit reports actual slide and substantive-picture counts for every deck.
An automatic title is included in the denominator. No minimum slide count is
imposed. Repeated figures must support a different step or interpretation.

All diagrams and plots are original course illustrations with alt text. There
are no borrowed textbook images or invented instrument photographs. Diagrams
are schematic; spectra and chromatograms are simulated and labelled accordingly.
The generator is `scripts/generate-course-diagrams.py`. Plot generators are the
R analyses, and dataset provenance is in `data/course/README.md`.

## Readiness and remaining review

Automated checks verify the central numerical results, withholding decisions,
lesson R chunks, local links, assets, student packages and picture coverage.
Worked reports render from stored inputs. Before teaching, a subject teacher
must check the draft against the eventual syllabus and local methods, then
pilot the explanations, workload and pacing with students. The material is not
a replacement for laboratory protocols or method validation.


[Completed checks and actual deck coverage](verification.md).


[Interactive demonstrations and R transfer](demos.md) cover every topic unit.
