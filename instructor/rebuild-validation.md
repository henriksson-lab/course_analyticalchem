# Quantbio rebuild validation — 19 November 2026

The planned-course teaching draft has been rebuilt as twelve topic folders with
36 lecture/exercise/quiz sources and twelve embedded TypeScript experiments.
There are 86 public practice questions, each with a hint and explained answer.
Lectures contain 275 slides including title slides; 217 have substantive visual
content. Every individual deck exceeds 50% visual coverage. These are observed
counts, not targets or estimates of teaching duration.

Verified locally:

- A clean Quarto render produces the GitHub Pages site, with redirects for old
  lesson/slide/demo URLs. Local resource links and rendered image alt text pass.
  Instructor files, editor tooling/sandbox, private Canvas banks, TypeScript
  sources and the retired demo runtime are absent from public output.
- Actual quantbio theme and UI provenance are recorded in `scaffold.md`.
  Representative pages and slides were visually compared with quantbio at the
  same viewport. Browser checks confirm 24px root type and 1280×720 lectures,
  no content below the slide frame, and working quiz collapsibles.
- Strict TypeScript checks and numerical tests use the new math.ts models via
  esbuild. Mass balances, sampling, shared uncertainty, calibration checks,
  charge balance, activity, stray light, recovery, atomic blank basis,
  resolution, integration and reporting guards pass.
- All twelve exercises' printed R code executes in separate fresh R sessions.
  Independent analytical R checks also pass, including inverse-calibration
  covariance propagation against finite differences and band inversion.
- Chrome checks all twelve embedded experiments: parameter changes, reset,
  CSV export, keyboard inspection and 390px phone layout. Repeated instances of
  one demo and different demos preserve independent state. The final case keeps
  old records immutable when a plan changes and withholds failed-QC results.
- Every browser CSV imports cleanly in R; reproduced mass balances, regressions,
  integration and missing withheld values agree with the demo outputs.
- Quantbio's local editor passes lecture/exercise/quiz source round trips,
  SVG-label edits and generated-figure locks in an isolated chemistry sandbox.
  Editor JavaScript is injected locally and absent from published HTML.

A subject-teacher teaching pass and student pilot remain appropriate. The planned
course syllabus and textbook edition are still unconfirmed; those uncertainties
are stated in the content plan rather than replaced with invented requirements.
