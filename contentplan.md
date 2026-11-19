# Analytical Chemistry content plan

Working proposal for the planned **7.5 ECTS Analytical Chemistry course in the
2027 Life Science curriculum**. Build the teaching around analytical chemistry:
the analytical question, sampling, measurement, calibration, uncertainty, and
choice of method. Use R throughout to maintain skills from introductory computing
and add a small number of useful capabilities when the chemistry needs them.

This plan concerns teaching content, student pages, exercises, and illustrated
slides. Timetabling, staffing, examination arrangements, and programme
organisation are outside its scope. Topic units below are content units, not
scheduled lectures or teaching days.

## Teaching draft in the quantbio scaffold

All twelve topic units below have topic-local lectures, practice quizzes, exercises, illustrated slide decks,
worked calculations, transfer problems, and local interactive demos with CSV
exports. [The topic overview](index.qmd#topics) maps them to the chemical topics;
[instructor guidance](instructor/demos.md) describes their use and model limits. Start at [the course index](index.qmd).
The [course R project](downloads/analyticalchem-project.zip) contains the student
report templates, raw simulated data and supplied uncertainty helper.
[Instructor notes](instructor/README.md) link the executable analyses, completed
reports, scientific assumptions and review points.

The content is a teaching draft for the planned course, not an approved syllabus.
It still needs subject-teacher review against the eventual syllabus and actual
laboratory methods, and a student pilot. Organisation remains outside scope.

## Course and textbook basis

The programme repository identifies the target as a year 2, 7.5-credit course
with placeholder code 5KExxx. Its course-specific syllabus and reading list are
not yet established in the available material. The linked programme syllabus
could not be retrieved during this lookup; the target and credit value follow
the supplied [programme research](../molbiol_program/PROGRAMME.md) and
[planned-course dossier](../molbiol_program/courses/chemistry-2027-analytical-chemistry.md).

Use **Harris and Lucy, Quantitative Chemical Analysis**, as the working textbook
family. Umeå lists the tenth edition (2020, ISBN 9781319324506) for the separate
15-credit 5KE207 course and the ninth edition for 5KE081. Neither establishes
the new course's reading list. [5KE207 syllabus and literature](https://www.umu.se/en/education/syllabus/5ke207/)
and [5KE081 syllabus and literature](https://www.umu.se/en/education/syllabus/5ke081/).

The publisher now presents an eleventh edition, ©2026. Its structure retains
measurement, uncertainty, calibration, equilibria, electrochemistry,
spectroscopy, and chromatography, and places sampling and preparation in
chapter 13. That is a useful content model for the planned course; it does not
require students to buy that edition. Use topic names in student reading guides
and add edition-specific sections when the book is settled.
[Publisher contents](https://www.macmillanlearning.com/college/us/product/Quantitative-Chemical-Analysis/p/131948770X).

Follow that broad subject progression, selecting material for 7.5 credits.
Introduce sampling and preparation at the start and revisit them with each
method. The whole textbook is a reference, not the proposed reading load.

## What students should be able to do

Proposed content outcomes, pending the planned course syllabus:

1. Define the analyte, matrix, measurand, required units, and analytical question.
2. Explain how sampling, preparation, contamination, and chemical equilibria
   affect the reported result.
3. Prepare and interpret standards, blanks, independent sample preparations,
   and quality-control measurements.
4. Fit and inspect a calibration, estimate an unknown concentration with the
   correct preparation factors, and explain its uncertainty and limitations.
5. Explain the principles of titration, potentiometry, molecular and atomic
   spectroscopy, and chromatography at a useful introductory level.
6. Choose between plausible methods using selectivity, working range,
   uncertainty, matrix compatibility, and sample requirements.
7. Produce a reproducible R report connecting raw observations to a defensible
   chemical conclusion.

Depth should come from following measurements all the way to a result, rather
than accumulating instrument names. Detailed derivations and specialist
instrument variants can remain in optional reference material.

## Starting point in R

The preceding [introductory computing course](/home/mahogny/github/course/introcomputing/contentplan.md)
already introduces projects, relative paths, CSV import, data checks, grouped
summaries, plots, SD and uncertainty in a mean, guided comparisons, straight-line
fits, residuals, inverse concentration estimates, dilution factors, and R
Markdown reports. In particular, its
[calibration lesson](/home/mahogny/github/course/introcomputing/week4/19-calibration.qmd)
explicitly stops short of full uncertainty for an unknown concentration.

Treat these as previously encountered skills that need retrieval and practice.
Start with a short analytical dataset and a familiar report template; provide
an optional refresher for students who need it. Do not repeat a general computing
course before starting chemistry.

Retain base R for calculations, `readr`, `dplyr`, `ggplot2`, `stats::lm`, and
`.Rmd` reports. Keep one main syntax. New computing should concentrate on:

- **Matching tables by identifiers:** attach preparation volumes and dilution
  factors to measurements without relying on row order.
- **Reading instrument series:** recognise that spectrum or chromatogram rows
  are measurement positions within a run, not independent sample replicates.
- **Working with logarithmic relationships:** use `log10()` for chemically
  motivated electrode relationships and interpret the transformed axis.
- **Quantifying uncertainty in derived results:** start with transparent
  propagation calculations and use a supplied simulation to show the effects.

Use new plotting layers as needed, with a reference card. Student-written
functions, loops, general simulation programming, and new package ecosystems
are not core requirements.

## Proposed content sequence

The chapter references below are to the publisher's **eleventh-edition**
contents, as a planning crosswalk. They identify selected topics, not whole
chapters assigned for reading. Actual section selections should follow the
adopted edition.

| Unit | Chemistry and central question | R practice and student result | Main pictures and plots | Book topics |
| --- | --- | --- | --- | --- |
| 1. From sample to answer | What exactly are we measuring? Analyte, matrix, measurand, qualitative versus quantitative questions, concentration units, and the analytical workflow. | Reopen a familiar project, inspect a supplied table, plot measurements, and state the result's units. | A real sample beside its extract; annotated workflow from question to conclusion. | 0–2 |
| 2. Sampling and preparation | Does the aliquot represent the material? Heterogeneity, independent samples, preservation, contamination, dissolution, extraction, filtration, and dilution. | Calculate preparation factors; match a measurement table to preparation records by sample ID. Save a traceable concentration table. | Sampling hierarchy; volumetric flask and pipette; extraction phases; mass and volume flow diagram. | 1–2, 13 |
| 3. Error and uncertainty | How reliable is the number? Bias, precision, SD, uncertainty in a mean, reference values, significant figures, and uncertainty from mass and volume. | Reuse grouped summaries and individual-point plots; propagate uncertainty through a simple dilution. Compare independent preparations with repeated instrument readings. | Several distributions with different bias and spread; nested replicate diagram; uncertainty contributions. | 3–4 |
| 4. Calibration and quality control | What makes a calibration usable? Standards, blanks, slope, intercept, residuals, working range, independent checks, and sensitivity. Introduce detection and quantification limits as procedure-dependent performance characteristics. | Revisit `lm()` and residuals on a chemically specified dataset. Estimate unknowns, flag unsupported results, and inspect a supplied uncertainty calculation. | Standards photo; calibration with residual panel; curved response; blank and low-level signals. | 5 |
| 5. Equilibrium and titration | Why does a titration give a concentration? Stoichiometry, equilibrium, endpoint versus equivalence point, indicators, acid–base curves, and EDTA complexation. Refresh only the equilibrium chemistry needed. | Plot volume against pH; use a supplied endpoint estimate and stoichiometry to calculate concentration. Compare endpoint choices. | Burette and flask; annotated titration curve; indicator transition; metal–EDTA concept diagram. | Selected 6–12 |
| 6. Electrodes and potentiometry | How does a potential report chemical composition? Reference and indicator electrodes, pH calibration, the Nernst relationship, activity versus concentration, and interference. | Plot potential against log concentration using a supplied model; estimate an unknown and interpret slope and drift. | Electrode cross-section; complete cell; membrane selectivity; calibration at two measurement times. | Selected 14–15 |
| 7. UV and visible absorption | Why does light attenuation tell us concentration? Absorption, transmittance, Beer–Lambert behaviour, wavelength selection, blanking, and departures from linearity. | Import a long-format spectral series, plot traces, choose a justified measurement wavelength, and reuse calibration to report concentration. | Cuvette photo; light path; molecular absorption concept; spectra and saturation example. | Selected 18–20 |
| 8. Matrix effects and recovery | Why can a good calibration give a wrong sample result? Matrix effects, spike recovery, external standards, and standard addition. | Reuse straight-line fits to compare an external calibration with a guided standard-addition example. Account for added volumes and report the assumption behind the extrapolation. | Matrix suppressing a signal; spike workflow; calibration slopes; extrapolated intercept with uncertainty. | 5, selected applications in 19 |
| 9. Atomic measurements | How can we measure an element in a complex sample? Absorption versus emission, atomisation, flame/graphite-furnace/ICP principles, interferences, and preparation. | Apply the established workflow to a supplied elemental-results table: blanks, preparation factors, QC, and concentration reporting. No new programming topic. | Instrument photo paired with signal-path schematic; atomic transitions; emission lines; digestion-to-result workflow. | Selected 21 |
| 10. Separation principles | How do we distinguish substances in a mixture? Partitioning, retention, selectivity, band broadening, resolution, and the difference between identity evidence and quantity. | Plot chromatograms and calculate retention and resolution from supplied peak summaries. Explain coelution. | Molecules partitioning between phases; bands moving down a column; resolved and overlapping peaks. | Selected 23 |
| 11. GC and HPLC | Which separation suits this sample? Volatility and thermal stability versus solution compatibility, stationary/mobile phases, elution conditions, and detector response. | Compare runs, use supplied integrated peak areas, and calculate concentrations with external calibration or a guided internal-standard ratio. | GC and HPLC photos and annotated schematics; chromatograms under contrasting conditions; peak-area ratio plot. | Selected 24–25 |
| 12. Choosing and defending a result | Which method and result should we trust? Integrate selectivity, range, preparation, uncertainty, recovery, and independent QC. Include a short mass-spectrometry overview where it clarifies identification and coupled detectors. | Render a complete report from raw data in a fresh session; explain method choice and a problematic QC result; compare with a reference material or independent method. | Annotated method comparison; full sample-to-report chain; example spectrum linked to a separated peak. | Integration; selected 22 |

Units 3–4 introduce foundations that return in every method. Units 8 and 12
are explicit integration points, not invitations to postpone matrix effects or
method choice until the end.

## Depth appropriate to the planned course

Give the fullest worked examples to **calibration and uncertainty, one titration,
potentiometry, UV/visible absorption, and chromatographic quantification**.
Teach atomic methods through a focused elemental-analysis example. Explain
GC and HPLC through their shared separation principles before their differences.

Keep mass spectrometry to an identification/detector overview unless the planned
syllabus gives it greater weight. Briefly distinguish current-, charge-, and
potential-based electrochemical measurements, but reserve detailed voltammetry,
polarography, coulometry, and amperometry for extensions. Also defer exhaustive
equilibrium treatment, capillary electrophoresis, advanced detector design,
multivariate analysis, and method-development optimisation.

Core student calculations should include concentration and amount, dilution and
extraction factors, stoichiometry, calibration inversion, uncertainty for a
simple derived quantity, Nernst-style logarithmic interpretation, recovery,
retention/resolution, and calibrated peak-area interpretation. Do not require
the same mathematical depth for every instrument family.

For calibration uncertainty, distinguish a fitted mean response, a future
response, and the concentration inferred from a measured response. An interval
from ordinary forward `predict()` is not automatically an interval for the
unknown concentration. Supply and explain a checked inverse-calibration
calculation with its assumptions. Weighted fitting and uncertainty in standard
concentrations belong in optional material unless the main dataset requires
them; choose core datasets compatible with the taught model.

## Recurring analytical examples

Use a few chemically coherent examples so students learn the measurement rather
than repeatedly decoding new contexts.

| Example | Main uses | What makes it a useful teaching case |
| --- | --- | --- |
| Water samples | Sampling, EDTA hardness, electrodes, and elemental measurements | Different measurands in the same matrix; reporting hardness differs from reporting a particular dissolved metal. |
| A specified coloured assay | Dilution, UV/visible spectra, calibration, and recovery | The reaction, absorbing species, preparation, concentration basis, and units must be supplied. It develops the earlier generic absorbance exercise into real chemistry. |
| Caffeine in beverages | Sample preparation, HPLC, external/internal standards, and method choice | Naturally raises matrix, extraction, dilution, identification, and quantification questions. |

Use the water context across several methods, but provide separate datasets and
chemical questions. Do not imply that unrelated methods measure the same thing
or that one protocol applies to every analyte. Use a separate prepared standard-
addition case where its assumptions are transparent.

Every dataset needs sample and preparation IDs, units, a data dictionary,
experimental context, and a clear distinction between independent samples,
independent preparations, and repeated readings. Spectrum/chromatogram data also
need run IDs and measurement axes. Keep raw signals, preparation records, and
derived results distinguishable. Record provenance; label simulated teaching
data as simulated and identify any deliberately introduced faults.

Include realistic problems: one dilution outside range, a failed QC sample,
matrix suppression, and partially overlapping peaks. Give students an action
to justify, such as remeasurement, further dilution, altered separation, or
withholding a quantitative claim. Do not make deleting an awkward point the
default solution.

## Visual requirements for slides and pages

**More than half of each deck must contain substantive pictures.** Count a
photograph, explanatory drawing, apparatus schematic, spectrum, chromatogram,
or analytical plot. Decorative icons, equations, tables and code alone do not
count. Audit both individual decks and the whole course.

Each slide must justify its place through chemical explanation, evidence, a
worked step or a useful question. Decks may be shorter than 45 minutes. The
user's approximate 40 seconds per slide is a rough diagnostic of likely delivery
time, not a slide-count target. Do not expand a deck to fill a duration. Longer
R practicals remain separate from lecture delivery.

For each method, explain where the sample goes, what interacts with it and what
the detector measures, then connect that apparatus to the kind of data produced.
Use a real photograph when it adds equipment-recognition value and a schematic
when it makes the mechanism clearer. The implemented draft uses original
concept illustrations and plots; it makes no claim to show real instrument
photographs.

A deck should develop the analytical question, chemical principle, apparatus,
response model, observed data, worked calculation, diagnostics, failure cases
and interpretation. These are teaching needs, not a required number of slides.
Repeat a figure only when returning to it develops a different interpretation
or calculation; a repeated picture is not an excuse for a redundant slide.
Every figure needs readable labels, units and useful alt text. Keep colour
conventions consistent and meaningful without relying on colour alone.

Create plots from the same data and calculations supplied to students. Make
original vector diagrams for chemical principles and instrument paths; use
traceable photographs with a recorded source and reuse permission. Textbook
figures guide explanations, but availability in a book is not permission to
republish them on open course pages. Review all scientific diagrams for chemical
accuracy and avoid generated imagery for instrument details presented as factual.

## Student page and exercise pattern

Each topic page should contain:

- A concrete analytical question and a short statement of what students will
  learn to explain or calculate.
- Illustrated chemical explanation, including the relevant equilibrium or
  measurement relationship and its assumptions.
- A fully worked example connecting sample preparation, raw measurement,
  calculation, and interpretation.
- A small R task using familiar commands, with any new command explained where
  it becomes necessary.
- A transfer problem with fewer prompts, hints, and numerical or graphical
  checks that allow students to diagnose mistakes.
- A required saved result and a brief written chemical interpretation.
- Retrieval questions about principle, units, assumptions, and failure modes,
  with selected reading by textbook topic.

Keep extended code in exercises and the report template. Lecture slides should
show enough code to connect a command with a chemical result. Require students
to predict or explain a result before running code often enough that copying
the workflow cannot substitute for understanding it.

Early exercises may provide complete code with one chemical choice to make.
Middle exercises provide partial code and ask students to select a range,
correction, or diagnostic. The final exercise supplies documented raw data and
a familiar report structure, leaving students to justify the analytical route.

## Development and review

The original sequence has now been implemented: a complete UV/visible example;
measurement foundations; titration and electrodes; elemental measurements and
separations; matrix effects; and a final independent reporting case. Each unit
has its own executable analysis and data definitions.

Review chemical assumptions, units, sample and preparation identities, response
models, uncertainty limitations and withholding decisions before adopting a unit
for teaching. Numerical checks cover the main mass balances and decisions;
lesson code and worked reports are rendered from saved inputs. Visual and link
checks cover the site and each deck. Subject-teacher review and a classroom
pilot should establish whether examples, explanation and pacing suit the actual
students and laboratory methods.
