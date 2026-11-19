"""Local sandbox round trips against quantbio's unchanged slide editor server."""
from pathlib import Path
import subprocess,os,time,json,urllib.request,urllib.error,socket,xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
with socket.socket() as s:s.bind(('127.0.0.1',0));port=s.getsockname()[1]
token='local-sandbox-check'
env=dict(os.environ,SLIDE_EDIT_TOKEN=token,XDG_CACHE_HOME='/tmp/analyticalchem-cache')
proc=subprocess.Popen(['node','tools/slide-editor/server.mjs','--host','127.0.0.1','--port',str(port)],cwd=root,env=env,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
base=f'http://127.0.0.1:{port}'
opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
def request(route,payload=None):
 req=urllib.request.Request(base+route,data=json.dumps(payload).encode() if payload is not None else None,headers={'Cookie':'se_token='+token,'Content-Type':'application/json'})
 with opener.open(req) as res:
  text=res.read().decode();return json.loads(text) if res.headers.get_content_type()=='application/json' else text
def wait_render():
 for _ in range(400):
  status=request('/__editor/render-status')
  if status.get('state')!='running':assert status.get('state')!='error',status;return
  time.sleep(.05)
 raise RuntimeError('Editor render timed out')
backups={}
try:
 for _ in range(100):
  try:request('/__editor/page?url=/editor-sandbox/lec.html');break
  except (urllib.error.URLError,ConnectionError):time.sleep(.05)
 assert 'editor.js' in request('/editor-sandbox/lec.html')
 assert 'editor.js' not in (root/'docs/editor-sandbox/lec.html').read_text()
 for name in ['lec','exercise','quiz']:
  rel=f'editor-sandbox/{name}.qmd';p=root/rel;old=p.read_text();backups[p]=old
  assert request('/__editor/page?url=/editor-sandbox/'+name+'.html')['source']==rel
  src=request('/__editor/source?path='+rel)
  assert src['text']==old,src
  changed=old+'\n<!-- editor round-trip marker -->\n'
  assert request('/__editor/source',dict(path=rel,old=old,new=changed))['ok']
  assert p.read_text()==changed
  wait_render()
  assert request('/__editor/source',dict(path=rel,old=changed,new=old))['ok'];wait_render()
 info=request('/__editor/svg-info?path=editor-sandbox/fig01-complex.svg');assert info['editable'],info
 locked=request('/__editor/svg-info?path=editor-sandbox/fig02-calibration.svg');assert not locked['editable'],locked
 rel='editor-sandbox/fig01-complex.svg';p=root/rel;backups[p]=p.read_text();label=info['labels'][0]
 assert request('/__editor/svg-text',dict(path=rel,index=0,old=label,new=label+' test'))['ok']
 assert label+' test' in p.read_text()
 assert request('/__editor/svg-text',dict(path=rel,index=0,old=label+' test',new=label))['ok']
 print('PASS: local editor injection, lecture/exercise/quiz source round trips, SVG label edits and R-generated locks')
finally:
 for p,old in backups.items():p.write_text(old)
 proc.terminate();proc.wait(timeout=5)
