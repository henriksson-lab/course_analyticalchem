"""Generate static demo shells; module behaviour remains in reviewed JavaScript."""
from pathlib import Path
import json,html
root=Path(__file__).resolve().parents[1]
units=json.loads((root/'course.json').read_text())
for unit in units:
 slug=unit['slug']; title=html.escape(unit['title'])
 (root/f'demos/{slug}.html').write_text(f'''<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{title} · Analytical Chemistry demo</title>
<link rel="stylesheet" href="demo.css"></head>
<body>
<nav class="demo-nav" aria-label="Course navigation"><a href="../index.html">Analytical Chemistry</a><a href="index.html">All demos</a><a href="../lessons/{slug}.html">Topic notes</a></nav>
<main id="demo"><h1>{title}</h1><p>Loading the local interactive experiment…</p></main>
<noscript><p>Enable JavaScript to use the controls. The <a href="../lessons/{slug}.html">topic notes</a> contain the worked explanation and static figures.</p></noscript>
<script src="demo-core.js"></script><script src="modules/{slug}.js"></script>
</body></html>
''')
print(f'Generated {len(units)} standalone demo pages')
