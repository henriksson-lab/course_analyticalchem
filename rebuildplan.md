# Analytical Chemistry rebuild using the quantbio scaffold

Rebuild the course on the actual scaffold in
[`quantbio-3MB00A`](../quantbio-3MB00A/), inspected at commit `b28e27e`.
Quantbio supplies the styling, lecture format, exercise structure, embedded-demo
system, quiz structure and authoring tools. Analytical chemistry supplies the
subject sequence; introcomputing supplies the students' prior R knowledge.

The current site does not meet this requirement. Its separate `lessons/` and
`slides/` trees, standalone demo pages, custom demo runtime and missing topic
quizzes need replacement. Existing numerical checks establish some calculation
correctness; they do not establish scaffold conformity or teaching readiness.

This plan is implemented by the quantbio-scaffold rebuild; file provenance is recorded in [scaffold.md](scaffold.md). Programme organisation and formal assessment design remain
outside scope.

## Scaffold to adopt

| Component | Quantbio reference | Required result here |
| --- | --- | --- |
| Website and navigation | [`_quarto.yml`](../quantbio-3MB00A/_quarto.yml), [`styles.css`](../quantbio-3MB00A/styles.css) | The same page styling and nested topic entries for lecture, quiz, exercise and embedded demo anchors. Adapt course labels and grouping without inventing a timetable. Retain filename conventions on which sidebar styling depends. |
| Lectures | [`theme.scss`](../quantbio-3MB00A/theme.scss), [`least-squares/lec.qmd`](../quantbio-3MB00A/least-squares/lec.qmd) | `topic/lec.qmd`; the shared simple/SCSS theme, 1280 × 720 frame, 24px root text, `c/t` numbering, KaTeX, navigation/menu settings, deliberate figure sizing and substantial speaker notes. |
| Exercises | [`least-squares/exercise.qmd`](../quantbio-3MB00A/least-squares/exercise.qmd), [`crossval/exercise.qmd`](../quantbio-3MB00A/crossval/exercise.qmd) | `topic/exercise.qmd` with Goal, Background, By hand, Explore where relevant, In R, numbered tasks, collapsible linked hints, worked solutions and a short Where this leads section. |
| Demos | [`demos/src/lib/ui.ts`](../quantbio-3MB00A/demos/src/lib/ui.ts), [`demos/demo.css`](../quantbio-3MB00A/demos/demo.css), [`demos/build.sh`](../quantbio-3MB00A/demos/build.sh) | TypeScript modules using the shared `.qb-demo` components, bundled to `demos/dist/`, mounted on `data-demo` containers inside exercises. The same component can be embedded in a lecture where useful. |
| Topic quizzes | [`least-squares/quiz.qmd`](../quantbio-3MB00A/least-squares/quiz.qmd) | Separate `topic/quiz.qmd` pages containing short questions, collapsible hints and explained answers. Questions exercise chemical understanding, small calculations and interpretation of evidence. |
| Canvas tooling | [`canvas-quiz/build.py`](../quantbio-3MB00A/canvas-quiz/build.py), [`quiz/week1.qmd`](../quantbio-3MB00A/quiz/week1.qmd), quantbio ignore/render exclusions | Preserve the public/private separation and export capability. Do not copy quantbio question banks or private answers. Public practice quizzes and private graded banks have different publication rules. No grading scheme or Canvas upload is assumed. |
| Build and editing | [`Makefile`](../quantbio-3MB00A/Makefile), package files, [`tools/slide-editor/README.md`](../quantbio-3MB00A/tools/slide-editor/README.md) | Matching demo build, typecheck, figure generation, render, preview and slide-editor workflows. Use unit-local figures and compatible generator locations so the editor recognises generated versus hand-editable SVGs. |

Quantbio's stylesheet contains positional week colours and some older exercise
selectors. Check those against the chosen analytical-chemistry sidebar rather
than copying them without checking their effect. Its default `make` also stages
files; use explicit rendering targets during development and stage deliberately.

## Target structure

```text
_quarto.yml
styles.css
theme.scss
Makefile
package.json
package-lock.json
index.qmd
dictionary.qmd
<topic>/
  lec.qmd
  exercise.qmd
  quiz.qmd
  fig*.svg
  make-figs.R                 # where figures are generated
demos/
  demo.css
  build.sh
  tsconfig.json
  src/lib/
  src/<demo>/main.ts
  src/<demo>/math.ts          # numerical model where appropriate
  dist/
tools/slide-editor/
data/
R/                           # reusable analysis helpers where still useful
canvas-quiz/build.py
canvas-quiz/private/         # ignored; excluded from site generation
docs/                        # generated GitHub Pages site
```

Topic ordering lives in the sidebar, with the same lecture/quiz/exercise/demo
relationships as quantbio. It does not depend on renaming folders to day
numbers. Keep the present chemistry sequence as a starting point, splitting or
combining topics only when the teaching argument warrants it.

## Rebuild sequence

### 1 Establish the shared foundation

Copy the relevant quantbio scaffold files and record their source revision.
Adapt course identity, navigation, resource paths, build exclusions and package
metadata. Keep common components recognisably shared; document any necessary
chemistry-specific differences. Bring across the slide editor and verify its
page, speaker-note and SVG-label editing on a local sandbox.

Keep the current implementation available through Git history. The published
course continues serving its current version while the replacement is developed
and checked locally.

### 2 Build one complete reference unit

Rebuild **UV/visible absorption** as `uv-visible/lec.qmd`, `exercise.qmd` and
`quiz.qmd`, with local figures and the TypeScript demo embedded under `#explore`.
Use quantbio's lecture/exercise/quiz pages directly as structural references.

The exercise should include a small Beer–Lambert or calibration calculation by
hand, an exploratory demo task, and R work using the supplied iron data. Provide
linked hints and a full explained solution in the quantbio format. The quiz
should independently test the absorber, concentration basis, dilution,
calibration range and interpretation of an invalid result.

Compare the complete unit side by side with quantbio in a browser: styling,
text density, figure placement, controls, exercise layout, hint behaviour, demo
embedding and quiz answers. This is the first reviewable deliverable. Establish
the reference unit before repeating the pattern across the course.

### 3 Rewrite the remaining lectures

For each chemistry topic, build a teaching progression: analytical problem,
physical or chemical principle, apparatus, measurement model, worked numbers,
data, failure cases and interpretation. Give each slide a clear purpose and
speaker notes that develop the explanation.

Reuse scientifically sound figures after reviewing labels, units, relevance
and fit. Replace generic process boxes or repeated full-size plots where a
specific apparatus view, chemical diagram, annotated calculation or focused
comparison teaches the point better. Count substantive visuals, not decorative
images. More than half of each deck must remain visual.

Use the requested approximately 45-minute duration when the topic warrants it;
shorter decks are acceptable. The observed roughly 40 seconds per slide is a
pacing check, never a reason to manufacture slides. Do not inherit a fixed slide
count from quantbio's recorded-video preferences either.

### 4 Rebuild exercises and author the missing quizzes

Convert the existing mixed lesson pages into the quantbio exercise structure.
Write enough core problems to build shared competence, with small calculations
before R and interpretation after it. Give tasks stable identifiers so hints,
solutions, quizzes and instructor notes refer to the same problem.

Retain the introcomputing R vocabulary and add only the progression needed by
the chemistry. Keep report templates and downloadable data as supporting
materials; they do not replace the exercise page and its worked solutions.
Link named R functions in hints to appropriate documentation.

Author a dedicated practice quiz for every core topic. Include conceptual
questions, manageable numerical questions and diagnostic cases. Explain why
an answer follows from the chemistry and evidence. Keep any future private
assessment answers out of both Git and `docs/` using the quantbio conventions.

### 5 Port the demos into the shared system

Review the existing numerical models individually. Preserve useful pure
calculations, regression cases, model assumptions and CSV-to-R checks. Rebuild
their interfaces with quantbio's TypeScript utilities, `.qb-demo` styling and
host-local mounting; retire the custom `ChemDemo` page shell and standalone
navigation as the main teaching interface.

Embed each useful experiment in its exercise's Explore section. Place specific
prediction/change/explanation tasks beside it, with answers or solutions using
the same exercise conventions. Sidebar demo links lead to those anchors. Support
multiple instances on one page, scoped state, keyboard/touch operation and CSV
export where it serves the R task. Do not add a demo to meet a daily quota.

### 6 Apply the reference pattern across the chemistry sequence

Work in three coherent batches after the reference unit is established:

1. Measurement question, sampling/preparation, error/uncertainty, calibration/QC.
2. Titration, potentiometry, matrix effects/recovery, atomic methods.
3. Separation principles, GC/HPLC, and choosing/defending a result.

Parallel workers can own complete topic folders and corresponding demo source
modules. One owner maintains the shared theme, sidebar, TypeScript utilities,
build system and acceptance checks. Review one worker's output against the
reference unit before expanding its batch; workers should not create alternative
page shells or UI frameworks.

### 7 Validate conformity and teaching content

Check the scaffold as well as the calculations:

- Compare representative pages and slides with quantbio at the same viewport;
  verify theme, typography, dimensions, sidebar cues and navigation behaviour.
- Verify every core topic has its lecture, exercise, quiz and intended Explore
  links. Check hints, solutions and quiz answers expand and refer to valid tasks.
- Run the TypeScript build and strict typecheck. Test embedded demos with more
  than one instance, reset, keyboard/touch controls and CSV export.
- Re-run the scientific numerical checks, execute exercise R in fresh sessions,
  and reproduce exported demo calculations in R.
- Check generated-figure provenance and slide-editor compatibility, visual
  coverage, projected figure legibility, mobile exercise layouts and local links.
- Build from a clean output directory and verify teacher-only files, private
  quiz banks, source tools and stale standalone pages are not published.

### 8 Replace the published version

Once the complete replacement passes those checks, remove the superseded
student-facing shells from the build, update documentation and create redirects
for useful existing published URLs. Keep the current GitHub Pages destination
and publish the clean rebuilt `docs/` tree. Verify live lecture, exercise,
embedded-demo, quiz and download routes.

The finished deliverable is the course in the quantbio scaffold, with chemistry
content revised for its students. A colour change or renamed folders alone does
not complete the rebuild.
