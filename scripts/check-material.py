"""Audit scaffold, visual coverage, public links and student archive boundaries."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit,unquote
from zipfile import ZipFile
import re,json,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
units=json.loads((root/'course.json').read_text())
for u in units:
 slug=u['slug'];folder=root/slug
 for name in ['lec','exercise','quiz']:
  p=folder/(name+'.qmd');s=p.read_text()
  assert not any(ord(c)<32 and c not in '\t\n\r' for c in s),p
  assert (root/'docs'/slug/(name+'.html')).exists(),p
  for target in re.findall(r'!\[.*?\]\(([^)]*)\)',s):assert (p.parent/target).exists(),(p,target)
 s=(folder/'lec.qmd').read_text();slides=re.split(r'^## ',s,flags=re.M)[1:]
 visual=sum(bool(re.search(r'!\[.*?\]\([^)]*\)',slide)) for slide in slides)
 assert visual/(len(slides)+1)>.5,(slug,visual,len(slides)+1)
 assert all('::: notes' in slide or '::: {.notes}' in slide for slide in slides),slug
 for expected in ['../theme.scss','1280','720','c/t','katex']:assert expected in s,(slug,expected)
 s=(folder/'exercise.qmd').read_text()
 for section in ['Goal','Background','By hand','Explore','In R','Hints','Solutions','Where this leads']:assert re.search(r'^## '+section,s,re.M),(slug,section)
 for task in ['B1','E1','R1']:assert task in s,(slug,task)
 q=(folder/'quiz.qmd').read_text();assert len(re.findall(r'^(?:## |\*\*)Q\d',q,re.M))>=4,slug
 assert 'collapse="true"' in q and ('Answer' in q),slug
 print(f'PASS: {slug}: {len(slides)+1} slides, {visual} visual; exercise and quiz scaffold')
for u in units:
 for path in (root/u['slug']).glob('*.svg'):ET.parse(path)
class Links(HTMLParser):
 def handle_starttag(self,tag,attrs):
  attrs=dict(attrs)
  if tag=='img':assert attrs.get('alt','').strip(),('Missing alt',self.path)
  for key in ('href','src','data-src'):
   value=attrs.get(key,'');parts=urlsplit(value)
   if not value or parts.scheme or parts.netloc or not parts.path or parts.path.startswith('/'):continue
   target=self.path.parent/unquote(parts.path)
   assert target.exists(),(self.path,value)
for path in (root/'docs').rglob('*.html'):
 parser=Links();parser.path=path;parser.feed(path.read_text())
for forbidden in ['instructor','tools','canvas-quiz','editor-sandbox','demos/src','demos/modules']:
 assert not (root/'docs'/forbidden).exists(),('private or source tooling published',forbidden)
assert not (root/'docs/demos/demo-core.js').exists()
assert not list((root/'docs').rglob('*.ts'))
assert {p.relative_to(root/'docs').as_posix() for p in (root/'docs').rglob('*.Rmd')} <= {'report.Rmd','course-report.Rmd'}
assert (root/'docs/.nojekyll').exists()
for name in ['analyticalchem-project','uv-visible-project']:
 with ZipFile(root/'downloads'/(name+'.zip')) as archive:
  entries=archive.namelist();assert any(p.endswith('analyticalchem.Rproj') for p in entries)
  assert not any('/instructor/' in p or '/private/' in p or 'worked-example' in p for p in entries)
print('PASS: rendered image alt text, local links, private exclusions and student archives')
