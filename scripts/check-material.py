"""Audit every deck, source figure, generated local link, dictionary and student archive."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
from zipfile import ZipFile
import re,json,xml.etree.ElementTree as ET,hashlib
root=Path(__file__).resolve().parents[1]
units=json.loads((root/'course.json').read_text())
counts=[]
for u in units:
    source=(root/f"slides/{u['slug']}.qmd").read_text()
    slides=re.split(r'^## ',source,flags=re.M)[1:]
    visual=sum(bool(re.search(r'!\[.+?\]\([^)]*\)',s)) for s in slides)
    total=len(slides)+1
    assert visual/total>.5,(u['slug'],visual,total)
    assert all('::: {.notes}' in s for s in slides),u['slug']
    counts.append((u['slug'],total,visual))
    assert (root/f"lessons/{u['slug']}.qmd").exists()
for path in list((root/'slides').glob('*.qmd'))+list((root/'lessons').glob('*.qmd'))+list((root/'reference').glob('*.qmd'))+[root/'index.qmd']:
    source=path.read_text()
    assert not any(ord(c)<32 and c not in '\t\n\r' for c in source),path
    for alt,target in re.findall(r'!\[(.*?)\]\(([^)]*)\)',source):
        assert alt.strip(),path
        assert (path.parent/target).exists(),(path,target)
for path in (root/'assets').rglob('*.svg'):ET.parse(path)
class Links(HTMLParser):
    def handle_starttag(self,tag,attrs):
        if tag == 'img':
            assert dict(attrs).get('alt', '').strip(), ('Missing rendered image alt text', self.path)
        for key,value in attrs:
            if key in ('href','src','data-src') and value:
                parts=urlsplit(value)
                if parts.scheme or parts.netloc or not parts.path or parts.path.startswith('/'):continue
                target=self.base/unquote(parts.path)
                assert target.exists(),(self.path,value)
for path in (root/'docs').rglob('*.html'):
    parser=Links();parser.base=path.parent;parser.path=path;parser.feed(path.read_text())
# The reports regenerate figures. Check that the site carries the final versions.
for path in (root/'assets').rglob('*.svg'):
    target=root/'docs'/path.relative_to(root)
    if target.exists():assert hashlib.sha256(path.read_bytes()).digest()==hashlib.sha256(target.read_bytes()).digest(),target
for name in ['uv-visible-project','analyticalchem-project']:
    with ZipFile(root/f'downloads/{name}.zip') as z:
        names=z.namelist()
        assert f'{name}/report.Rmd' in names
        assert not any('worked-example' in n or 'concentrations.csv' in n or 'analyse-' in n for n in names)
        if name=='analyticalchem-project':
            assert f'{name}/course-report.Rmd' in names
            for path in (root/'data').rglob('*.csv'):assert f'{name}/{path.relative_to(root)}' in names
            for path in (root/'data').rglob('*'):
                if path.is_file():assert z.read(f'{name}/{path.relative_to(root)}')==path.read_bytes(),path
readme=(root/'data/course/README.md').read_text()
for path in (root/'data/course').glob('*.csv'):assert f'`{path.name}`' in readme,path
for slug,total,visual in counts:print(f'{slug}: {total} slides; {visual} substantive visual slides ({100*visual/total:.1f}%)')
print(f'PASS: {len(counts)} decks, figures and alt text, local links, dictionaries and student packages')
