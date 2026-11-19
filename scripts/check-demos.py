"""Run dependency-free numerical tests and check demo source/build completeness."""
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit
import json,subprocess,hashlib
root=Path(__file__).resolve().parents[1]
for name in ['test-demo-core.cjs','test-demos-foundations.cjs','test-demos-chemical.cjs','test-demos-instruments.cjs']:
    subprocess.run(['node',str(root/'scripts'/name)],cwd=root,check=True)
class Scripts(HTMLParser):
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag=='script' and a.get('src'):
            assert not urlsplit(a['src']).scheme,('External demo dependency',a['src'])
            assert (self.base/a['src']).is_file(),a['src']
for unit in json.loads((root/'course.json').read_text()):
    slug=unit['slug'];module=root/f'demos/modules/{slug}.js'
    subprocess.run(['node','--check',str(module)],check=True,capture_output=True)
    for base in [root/'demos',root/'docs/demos']:
        p=base/(slug+'.html');assert p.exists(),p
        parser=Scripts();parser.base=base;parser.feed(p.read_text())
    assert f'../demos/{slug}.html' in (root/f'lessons/{slug}.qmd').read_text()
for p in (root/'demos').rglob('*'):
    if p.suffix in ['.html','.js','.css']:
        target=root/'docs'/p.relative_to(root)
        assert target.exists(),target
        assert hashlib.sha256(p.read_bytes()).digest()==hashlib.sha256(target.read_bytes()).digest(),('Stale built demo',target)
print('PASS: twelve linked demos, local scripts, syntax and current build resources')
