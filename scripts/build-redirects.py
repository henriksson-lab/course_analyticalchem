"""Preserve existing published bookmarks after the quantbio-scaffold migration."""
from pathlib import Path
import html,json,shutil
root=Path(__file__).resolve().parents[1]
# Authoring previews are local, even if the editor was used since the last render.
shutil.rmtree(root/'docs/editor-sandbox',ignore_errors=True)
units=json.loads((root/'course.json').read_text())
def redirect(relative,target):
 p=root/'docs'/relative;p.parent.mkdir(parents=True,exist_ok=True)
 url=html.escape(target,quote=True)
 p.write_text(f'<!doctype html><html lang="en"><meta charset="utf-8"><meta name="robots" content="noindex"><title>Course page moved</title><meta http-equiv="refresh" content="0;url={url}"><p><a href="{url}">Continue to the course material</a>.</p></html>\n')
for u in units:
 slug=u['slug']
 for folder,page in [('lessons','exercise'),('slides','lec'),('demos','exercise')]:
  redirect(f'{folder}/{slug}.html',f'../{slug}/{page}.html'+('#explore' if folder=='demos' else ''))
redirect('demos/index.html','../index.html#topics')
print('Generated legacy bookmark redirects.')
