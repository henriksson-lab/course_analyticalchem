"""Check actual quantbio TypeScript ports and their embedded public resources."""
from pathlib import Path
import subprocess,json
root=Path(__file__).resolve().parents[1]
subprocess.run(['make','typecheck','demos'],cwd=root,check=True)
for test in ['core','foundations','chemical','instruments']:
 name='test-demo-core.cjs' if test=='core' else f'test-demos-{test}.cjs'
 subprocess.run(['node','scripts/'+name],cwd=root,check=True)
for u in json.loads((root/'course.json').read_text()):
 slug=u['slug'];source=(root/slug/'exercise.qmd').read_text()
 assert '{#explore}' in source and f'data-demo="{slug}"' in source,slug
 for name in [f'{slug}.js','demo.css']:
  p=root/'demos/dist'/name;q=root/'docs/demos/dist'/name
  assert p.read_bytes()==q.read_bytes(),(p,q)
 assert 'ChemDemo' not in (root/'demos/src'/slug/'main.ts').read_text(),slug
 print('PASS: embedded demo',slug)
