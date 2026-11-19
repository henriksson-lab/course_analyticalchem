# Analytical Chemistry

Teaching draft for the planned 7.5 ECTS Analytical Chemistry course in the 2027 Life Science curriculum. Chemistry determines the sequence; R retrieves introductory computing skills and adds useful steps when the measurement needs them. Programme organisation and formal assessment design are outside scope.

Published course: https://henriksson-lab.github.io/course_analyticalchem/

Each of the twelve topic folders contains `lec.qmd`, `exercise.qmd`, `quiz.qmd` and local figures. Sidebar demo links open the exercise's Explore section. Lectures use the actual quantbio theme and speaker notes; exercises and quizzes follow its task, hint and explained-solution conventions. More than half of each lecture contains substantive diagrams or analytical plots. There is no slide-count quota. See [contentplan.md](contentplan.md), [rebuildplan.md](rebuildplan.md) and [scaffold.md](scaffold.md).

## Build and check

Requires Quarto, Python 3, Node/npm and R with readr, dplyr, ggplot2, rmarkdown and knitr. Install frontend build dependencies once with `npm ci`. Run from project root:

```sh
make typecheck
make figs
Rscript scripts/check-analysis.R
Rscript scripts/check-course.R
python scripts/check-lesson-code.py
python scripts/package-student.py
make render
python scripts/check-material.py
python scripts/check-demos.py
python scripts/check-demo-browser.py
```

Browser QA requires local Google Chrome and Python websocket-client. It records temporary screenshots, model CSV exports and an audit, then closes its local server and Chrome profile. Use its printed artifact directory with `Rscript scripts/check-demo-r-transfer.R <directory>` to reproduce browser exports in R.

`make render` builds TypeScript demos and the Quarto site into `docs/`, then adds redirects for old lesson/slide/demo URLs. For a clean rebuild, `make clean` first removes generated output and Quarto cache. In restricted environments use `XDG_CACHE_HOME=/tmp/analyticalchem-cache make render`. Quantbio's default `make` also stages files; use named targets to control staging.

`make edit-slides` starts quantbio's local source/SVG editor. Render the excluded chemistry sandbox explicitly with `quarto render editor-sandbox/lec.qmd` (and its exercise/quiz) before using the printed sandbox URL. The editor recognizes generated figures through unit-local `.R` recipes. Neither editor injection nor sandbox pages are published by the normal course build.

## Student and teacher material

The student project ZIP contains raw simulated data, project settings, report templates and the inverse-calibration helper. Open the R project and keep reports at its root. Worked teacher analyses remain under `R/`, `instructor/` and `reports/`; they are excluded from the website. Public practice quizzes include explained answers. Optional Canvas export tooling is under `canvas-quiz/`, with private banks ignored and excluded; no graded assessment or upload is configured.

GitHub Pages publishes committed `docs/` from `main`. Render and validate, then commit sources and generated output together and push. `.nojekyll` preserves Quarto's generated assets. The material still needs subject-teacher review against the final planned syllabus, practical protocols and a student pilot; simulated examples do not establish method validation.

For local slide/text/SVG authoring use `make edit-slides`. It first renders the isolated chemistry sandbox, then starts quantbio's editor. `make editor-sandbox` also prepares the three practice pages for `python scripts/check-slide-editor.py`. Sandbox outputs are excluded from the public build; run `make clean` before the publication render after an editor test.
