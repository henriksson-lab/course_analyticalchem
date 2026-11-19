# Quantbio scaffold provenance

Source: `../quantbio-3MB00A`, commit `b28e27e`. This course uses its actual page and demo system.

| File | Quantbio SHA-256 | Adaptation |
| --- | --- | --- |
| `theme.scss` | `4a070a7e1ea9861ce1a61da9611011bb8f2a2371ae141b8366baed2fdb2dd894` | Copied unchanged |
| `demos/src/lib/ui.ts` | `f1c1eda4618272a9ac3a1678f8bb7af48a70017dd170f94995ba18a5e9672a6d` | Copied unchanged |
| `demos/demo.css` | `57f8a99a9af7597c9974db7aa704d4089ba94c34185e28d3d9aff71ccaa364f0` | Original components retained; chemistry plot/readout extensions appended |
| `demos/build.sh` | `c6d8f494d097f84e2fc2a62d50fc147e91e1886cb2171ad5c5d29a18ee79bf71` | Copied unchanged |
| `demos/tsconfig.json` | `f37369513d02bac811a09a2ddcd8d6471983d3b5a38a0152daf71af0d73f5d64` | Copied unchanged |
| `styles.css` | `6a0ce8c1898e59cff6aff3dff6ce1777fd6b8a7fbe1b34539a0deb37b8fd4b4b` | Exercise selector, three chemistry sidebar groups and scrolling for long equations on phones |
| `Makefile` | `4099900f6b1912f6d27585620991de9a86c394da0cf1b8e68a5634e8305d7252` | Chemistry figure paths and migration redirects |
| `tools/slide-editor/server.mjs` | `25af5f6c5331831d24082c693ede66911ee43070915dd6fb0ea8ff93add52ba4` | Copied unchanged |
| `tools/slide-editor/editor.js` | `83e6c57219beb68ff252163beeaf537513ea3578ea3d888f89b80815bd3ea8fa` | Copied unchanged |
| `canvas-quiz/build.py` | `1ea55945923b59a3acda2c15f2d3dd3240a1f6043c07574f4eb9c40a5f04099e` | Copied unchanged |

The package manifest and lockfile retain quantbio's esbuild/TypeScript dependencies with this project's name. The twelve topic folders follow its `lec.qmd`, `exercise.qmd`, `quiz.qmd` convention. Lectures use its simple theme, 24px root, 1280×720 frame, c/t numbering, notes and KaTeX. Exercises use Goal, Background, By hand, Explore, In R, Hints, Solutions and Where this leads. Practice quizzes have separate collapsible hints and explained answers.

`demos/src/lib/chemistry.ts` adds shared chemistry plotting, CSV export and scoped controls using quantbio's unchanged `ui.ts`; the numerical helpers are in `math.ts`. Every experiment is a TypeScript entry bundled into `demos/dist/`, mounted through quantbio's `autoMount` onto an exercise-local `data-demo` container. Numerical models were preserved and checked while interfaces were rewritten. Legacy standalone URLs redirect to the corresponding topic pages.

The editor is local authoring tooling. `editor-sandbox/` contains chemistry practice sources and is excluded from the normal public build. Unit-local `.R` files name the SVGs they generate, allowing the editor to distinguish them from hand-editable diagrams.

Canvas export tooling is retained without quantbio question banks. `canvas-quiz/private/` is ignored and excluded from site rendering. Public topic quizzes are formative practice; no graded scheme or Canvas upload is configured. See `canvas-quiz/README.md`.

The sandbox has a nested default Quarto project so explicit editor renders reach `docs/editor-sandbox/` despite exclusion from the public project. `make edit-slides` prepares it first. Clean before publication removes these local practice outputs.
