# Analytical Chemistry

A complete first teaching draft for the **planned 7.5 ECTS Analytical Chemistry
course** in the 2027 Life Science curriculum. Twelve student units follow the
chemical sequence in [contentplan.md](contentplan.md). R maintains the preceding
computing skills and adds ID matching, logarithmic relationships, instrument
series and derived-result uncertainty when the chemistry needs them.

## Open the material

- Course home: `docs/index.html`.
- Published course: https://henriksson-lab.github.io/course_analyticalchem/
- Student lessons: `docs/lessons/`; illustrated decks: `docs/slides/`.
- Interactive experiments: `docs/demos/index.html`, one per topic with CSV export.
- Full student project: `downloads/analyticalchem-project.zip`.
- R report templates: `course-report.Rmd` and the detailed UV/visible `report.Rmd`.
- Completed reports: `reports/worked/` and `reports/worked-example.html`.
- Instructor guidance: [instructor/README.md](instructor/README.md).

Use `quarto preview --no-browser` to serve the site locally with its interactive
navigation. Slide decks use S for speaker notes. More than half of each deck
contains substantive diagrams or analytical plots. There is no slide-count
quota or artificial expansion to fill 45 minutes.

## Rebuild and verify

Requires Quarto, Python 3 (standard library only) and R packages readr, dplyr,
ggplot2, rmarkdown and knitr. No additional R modelling ecosystem is required.
Run from the project root:

    Rscript scripts/generate-data.R
    Rscript scripts/generate-course-data.R
    python3 scripts/generate-course-diagrams.py
    Rscript scripts/check-analysis.R
    Rscript scripts/check-course.R
    python3 scripts/check-lesson-code.py
    python3 scripts/package-student.py
    Rscript scripts/render-worked-reports.R
    Rscript -e 'rmarkdown::render("report.Rmd", output_dir="reports")'
    Rscript -e 'rmarkdown::render("worked-example.Rmd", output_dir="reports")'
    quarto render
    python3 scripts/check-material.py

Interactive demos use no external frontend dependencies. Rebuild their HTML
shells with `python3 scripts/build-demo-pages.py` before Quarto when needed.
Verify the pure numerical models and copied resources with
`python3 scripts/check-demos.py` (requires Node for verification only).
[Demo teaching guide](instructor/demos.md) explains the experiments and R transfer.

If Quarto cannot write its normal cache in a restricted environment, use
`XDG_CACHE_HOME=/tmp/analyticalchem-cache quarto render` for that command.

Generators replace only the simulated inputs or original figures they own.
The checks execute the analyses and regenerate their CSV results and plots.
Student archives exclude instructor solutions.

## GitHub Pages

GitHub Pages publishes the committed `docs/` directory from `main`. After
changing the course, render with `quarto render`, commit the updated sources
and `docs/`, and push to `main`. GitHub then publishes the updated site.
The root `.nojekyll` file is copied into `docs/` by Quarto so GitHub serves
the generated HTML and assets directly.

The draft needs subject-teacher review against the planned syllabus, actual
practical protocols and a student pilot. Simulated datasets, idealised diagrams
and conditional uncertainty budgets are identified explicitly.
