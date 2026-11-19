# UV and visible absorption instructor notes

This is the first developed unit for the planned 7.5-credit course. The full
proposed sequence remains in `contentplan.md`. The course website and slides
are built locally with Quarto; student reports use R Markdown, as in
introcomputing. No hosting or publication is configured.

## Files and expected results

- `uv-visible/exercise.qmd`: explanation, code, guided practical and transfer task.
- `uv-visible/lec.qmd`: illustrated presentation with speaker notes.
- `report.Rmd`: runnable student template with interpretation prompts.
- `worked-example.Rmd`: completed report, rendered into `reports/`.
- `data/README.md`: concentration basis, simulated-data provenance and dictionary.
- `R/analyse-uv-visible.R`: full analysis, CSV exports and regenerated figures.
- `R/inverse-calibration.R`: instructor-supplied uncertainty helper.
- `scripts/generate-data.R`: deterministic simulated-data generator.
- `scripts/check-analysis.R`: independent numerical and analytical checks.

The line is A=0.003873883+0.198799368c. Expected original concentrations:
P01=11.990635, P02=12.098700, P04=26.998884 mg Fe/L. P03 has an out-of-range
response; P05 is in failed later block B. Their concentration and uncertainty
fields must be NA. The transfer answer is 49.8148 mg Fe/L.

A's independent QC recovers 99.647%; B's recovers 85.176%. The 95–105% window
is an exercise rule, not a claim about a validated method. B occurs after the
accepted measurement block A and does not invalidate it retroactively.

## Chemistry and scope

The species is [Fe(phen)3]2+, where phen is 1,10-phenanthroline. Quantitative
reduction of dissolved iron and excess-ligand complex formation are assumed;
matched acidity and colour development are required. The measured result is
mg elemental Fe/L in supplied filtered, fortified water, not the original
Fe(II) fraction or particulate iron. No digestion recovery is supplied.

The analytical wavelength 510 nm is near the visible absorption maximum. The
university laboratory background uses 508 nm and describes the reduction,
complexation and blank comparison. These facts motivate the scenario, not an
adoption of its bench protocol. The simulated slope is a teaching response,
not a quoted molar absorptivity. The spectral envelope is an illustrative
Gaussian, not experimental identification evidence.

Source: [Buffalo State laboratory background](https://staff.buffalostate.edu/nazareay/che301/l9.pdf).

## Inverse-calibration uncertainty

For n calibration observations, m new readings, fitted intercept a and slope b,
residual SD s, calibration mean xbar and Sxx=sum((x-xbar)^2), the helper uses

    xhat = (mean(y_new) - a) / b
    u(xhat) = s / |b| * sqrt(1/m + 1/n + (xhat-xbar)^2/Sxx)

This is the first-order approximation obtained by propagating the independent
new mean response variance s²/m and the full intercept/slope covariance matrix
through the inverse function. The covariance must not be discarded. It assumes
independent normal errors, constant variance, a correct straight-line model,
known calibration concentrations, equal reading variance in standards and
unknowns, and a well-determined slope far from zero. It is not a general inverse-
calibration routine for weighted, uncertain-x, or nonlinear data.

The helper's approximate 95% interval uses t with n−2 degrees of freedom.
It is explicitly an approximation, not exact inversion of the prediction band.
[NIST's discussion](https://www.itl.nist.gov/div898/handbook/pmd/section5/pmd521.htm)
describes inverse estimates and numerical inversion of prediction limits.
`check-analysis.R` checks the standard uncertainty independently against
finite-difference propagation through `vcov(fit)`, and compares this well-
determined example's interval with numerical prediction-band inversion.

P01 final concentration=2.3981269, u=0.00450904, approximate 95% interval
2.3885682–2.4076857 mg Fe/L. This interval excludes preparation volumes.
The independent-volume model gives original u=0.0276962 mg Fe/L. The latter
is a standard uncertainty, not a 95% half-width. Do not apply the same t factor
to a combined budget without discussing the additional components and their
uncertainty distributions/degrees of freedom.

Sampling, recovery, standard preparation, matrix bias, path length effects and
unmodelled between-preparation variance are omitted. P01 and P02 differ by
about 0.108 mg Fe/L; their difference is a useful reminder that this small budget
is not a validated estimate of all preparation variability. Do not claim that
their conditional individual intervals demonstrate preparation agreement.
Students are not asked to derive a pooled W1 estimate or its uncertainty.

## Teaching and differentiation

Retrieve the old calibration workflow first. Ask students to predict the units,
the effect of a dilution, and the effect of incomplete reduction before running
code. Explain the new ID join using the reversed preparation-table order.
Provide the helper as supplied analysis code rather than teaching function
writing or general numerical methods.

A shorter route can use P01, P03/P04, and the QC comparison, leaving the helper
as a guided demonstration. More confident students can compare the repeated-
reading SD with the calibration-based response SD, discuss sample-specific
matrix bias despite passing QC, or inspect prediction-band inversion in the
check script. Keep those extensions separate from the required workflow.

Common problems: reversing regression; multiplying by the wrong dilution;
using added solvent volume instead of total volume; subtracting the blank twice;
reporting mg complex/L instead of mg Fe/L; row-order matching; replacing withheld
results by zero; confusing u with a 95% half-width; treating scans as independent
samples; assuming passing QC establishes sample recovery.

## Visual review

Seventeen content slides plus the automatic title slide give 18 slides. Twelve
content slides carry substantive analytical figures or explanatory diagrams:
12/18 = 66.7% overall (12/17 = 70.6% excluding the title). Code and tables are not
counted as pictures. The separate visual audit script checks that count against
the slide source. All images have descriptive alt text; equations and captions
remain native text. This first unit uses original concept illustrations and
plots. Actual instrument photography can be added when a traceable local image
is available; none is represented as a photograph here.

The paired apparatus and light-path diagram explains the measurement; the
complex diagram represents stoichiometry, not geometry. Review at projected
size, including the range plot labels and standard uncertainty budget. Static
plots and diagrams are vector SVG files.
