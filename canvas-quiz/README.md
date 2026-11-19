# Optional Canvas export tooling

`build.py` is copied from quantbio (`b28e27e`). It uses Python with PyYAML. It reads local `private/questions-week*.yml` banks and writes public questions-only `quiz/weekN.qmd` plus private QTI, HTML and answer review files. No banks or graded assessment scheme are supplied for this course. The topic `quiz.qmd` pages are separate public practice with explained answers.

Keep assessment banks and every generated answer/export under ignored `canvas-quiz/private/`. The entire tooling directory and `quiz/` bank output are excluded from the website render list; if you deliberately use public questions-only exports later, review and explicitly add them. Never copy another course's private bank or add private material to `docs/`.
