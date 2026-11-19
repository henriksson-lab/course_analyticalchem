"""Optional browser QA. Requires local Chrome and Python websocket-client.
Serves only the built docs locally, owns its temporary Chrome profile and server.
"""
from pathlib import Path
import subprocess,tempfile,threading,http.server,functools,time,json,urllib.request,base64,csv,io
import websocket
root=Path(__file__).resolve().parents[1]
class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self,*args):pass
server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(root/'docs')))
threading.Thread(target=server.serve_forever,daemon=True).start()
profile=tempfile.mkdtemp(prefix='analyticalchem-demo-browser-')
artifacts=Path(tempfile.mkdtemp(prefix='analyticalchem-demo-check-'))
proc=subprocess.Popen(['google-chrome','--headless','--no-sandbox','--no-zygote','--disable-gpu',
    '--disable-dev-shm-usage','--disable-background-networking','--no-first-run','--no-default-browser-check',
    '--no-proxy-server','--remote-debugging-port=0','--remote-allow-origins=*','--user-data-dir='+profile,'about:blank'],
    stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
ws=None
errors=[]
try:
    for _ in range(120):
        active=Path(profile)/'DevToolsActivePort'
        if active.exists():break
        time.sleep(.05)
    port=active.read_text().splitlines()[0]
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}))
    targets=json.load(opener.open('http://127.0.0.1:'+port+'/json/list'))
    ws=websocket.create_connection(targets[0]['webSocketDebuggerUrl'],timeout=25,http_no_proxy=['127.0.0.1','localhost'])
    sequence=0
    def call(method,params=None):
        global sequence
        sequence+=1;current=sequence
        ws.send(json.dumps(dict(id=current,method=method,params=params or {})))
        while True:
            message=json.loads(ws.recv())
            if message.get('method')=='Runtime.exceptionThrown':errors.append(message['params']['exceptionDetails'])
            if message.get('id')==current:
                if 'error' in message:raise RuntimeError(message['error'])
                return message.get('result',{})
    def evaluate(code):
        result=call('Runtime.evaluate',dict(expression=code,returnByValue=True,awaitPromise=True))
        if 'exceptionDetails' in result:raise RuntimeError(result['exceptionDetails'])
        return result.get('result',{}).get('value')
    def navigate(path,selector='.qb-demo svg'):
        call('Page.navigate',dict(url=f'http://127.0.0.1:{server.server_port}/'+path))
        for _ in range(160):
            if evaluate("document.readyState==='complete' && !!document.querySelector("+json.dumps(selector)+")"):break
            time.sleep(.05)
        else:raise RuntimeError('Page did not initialise: '+path+' '+str(errors))
    def screenshot(name):
        data=call('Page.captureScreenshot',dict(format='png',captureBeyondViewport=False))['data']
        (artifacts/(name+'.png')).write_bytes(base64.b64decode(data))
    def export_csv():
        return evaluate('''(async()=>{const blobs=[];const names=[];
          const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;
          URL.createObjectURL=function(blob){blobs.push(blob);return original.call(this,blob)};
          HTMLAnchorElement.prototype.click=function(){if(this.download){names.push(this.download);return;}click.call(this)};
          document.querySelector('[data-action="export"]').click();
          const text=blobs.length?await blobs.at(-1).text():'';
          URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;
          return {name:names.at(-1),text};})()''')
    call('Page.enable');call('Runtime.enable')
    call('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1000,deviceScaleFactor=1,mobile=False))
    import sys
    units=json.loads((root/'course.json').read_text())
    if len(sys.argv)>1:units=[u for u in units if u['slug'] in sys.argv[1:]]
    results=[]
    for unit in units:
        slug=unit['slug'];navigate(slug+'/exercise.html#explore')
        initial=evaluate("document.querySelector('.qb-readout').textContent")
        assert initial.strip(),slug
        count=evaluate("document.querySelectorAll('.qb-demo input, .qb-demo select').length")
        for i in range(count):
            evaluate('''(()=>{const e=document.querySelectorAll('.qb-demo input,.qb-demo select')['''+str(i)+'''];if(e.disabled)return;
              if(e.type==='range'){e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));}
              else if(e.type==='checkbox'){e.checked=!e.checked;e.dispatchEvent(new Event('change',{bubbles:true}));}
              else if(e.tagName==='SELECT'){e.selectedIndex=e.options.length-1;e.dispatchEvent(new Event('change',{bubbles:true}));}
            })()''')
        evaluate("document.querySelector('[data-action=reset]').click()")
        reset=evaluate("document.querySelector('.qb-readout').textContent")
        assert initial==reset,(slug,'Reset did not restore readout',initial,reset)
        exported=export_csv();assert exported['text'].strip(),slug
        records=list(csv.DictReader(io.StringIO(exported['text'])));assert records,slug
        (artifacts/(slug+'.csv')).write_text(exported['text'])
        if slug=='defending-results':
            evaluate("(()=>{const e=document.querySelector('[data-param=planned-aliquot]');e.value='2';e.dispatchEvent(new Event('change',{bubbles:true}));})()")
            planned=list(csv.DictReader(io.StringIO(export_csv()['text'])))
            assert planned==records,'Planning must not rewrite recorded signal or dilution'
            evaluate("document.querySelector('[data-action=measure-new]').click()")
            measured=list(csv.DictReader(io.StringIO(export_csv()['text'])))
            assert len(measured)==2 and measured[0]==records[0]
            assert measured[1]['aliquot_ml']=='2' and measured[1]['reportable']=='true'
            evaluate("(()=>{const e=document.querySelector('[data-param=planned-qc]');e.value='fail';e.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('[data-action=measure-new]').click();})()")
            failed=list(csv.DictReader(io.StringIO(export_csv()['text'])))
            assert len(failed)==3 and failed[2]['reportable']=='false' and failed[2]['reported_original_mg_l']==''
            evaluate("document.querySelector('[data-action=reset]').click()")
        # SVG supports keyboard inspection and pointer operation without global IDs.
        inspect=evaluate('''(()=>{const s=document.querySelector('.qb-demo svg');s.focus();s.dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}));return document.querySelector('.ac-inspect')?.textContent;})()''')
        assert inspect and 'Point at' not in inspect,(slug,inspect)
        screenshot(slug+'-desktop')
        call('Emulation.setDeviceMetricsOverride',dict(width=390,height=844,deviceScaleFactor=1,mobile=True))
        time.sleep(.1)
        dimensions=evaluate('({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,inner:innerWidth,demo:document.querySelector(".qb-demo").getBoundingClientRect().width})')
        assert dimensions['width']==390 and dimensions['scrollWidth']<=392 and dimensions['inner']<=392,(slug,dimensions)
        evaluate("document.querySelector('.qb-demo').scrollIntoView({block:'start'});scrollBy(0,-140)")
        screenshot(slug+'-mobile')
        call('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1000,deviceScaleFactor=1,mobile=False))
        results.append(dict(slug=slug,controls=count,csv_rows=len(records),mobile=dimensions))
        print('PASS:',slug,'embedded controls/reset/export/keyboard/mobile',flush=True)
        # Quizzes retain quantbio's collapsible hint and answer setup.
        navigate(slug+'/quiz.html','.callout')
        collapsed=evaluate("document.querySelectorAll('.callout-collapse.collapse:not(.show)').length")
        assert collapsed>=4,(slug,collapsed)
        evaluate("document.querySelector('.callout [data-bs-toggle=collapse]').click()")
        time.sleep(.4)
        assert evaluate("document.querySelector('.callout-collapse').classList.contains('show')")
        navigate(slug+'/lec.html','.reveal.ready')
        theme=evaluate("({font:getComputedStyle(document.querySelector('.reveal')).fontSize,width:Reveal.getConfig().width,height:Reveal.getConfig().height})")
        assert theme==dict(font='24px',width=1280,height=720),(slug,theme)
        n=evaluate('Reveal.getTotalSlides()')
        for i in range(n):
            evaluate(f'Reveal.slide({i})');time.sleep(.015)
            bad=evaluate('''(()=>{const s=document.querySelector('.slides>section.present');if(!s)return [];return [...s.children].filter(e=>!e.classList.contains('notes')&&getComputedStyle(e).display!=='none'&&e.offsetTop+e.offsetHeight>725).map(e=>({tag:e.tagName,bottom:e.offsetTop+e.offsetHeight,text:e.textContent.slice(0,70)}));})()''')
            assert not bad,(slug,i,bad)
        evaluate('Reveal.slide(2)');screenshot(slug+'-lecture')
    # Same and different bundles on one page must mount independently.
    slugs=[u['slug'] for u in units[:2]]
    if len(slugs)==1:slugs*=2
    page=root/'docs'/'demo-instance-check.html'
    page.write_text('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="demos/dist/demo.css">'+''.join(f'<div data-demo="{s}"></div>' for s in [slugs[0],slugs[0],slugs[1]])+''.join(f'<script src="demos/dist/{s}.js"></script>' for s in set(slugs)))
    try:
        navigate(page.name)
        assert evaluate("document.querySelectorAll('.qb-demo').length")==3
        before=evaluate("[...document.querySelectorAll('.qb-readout')].map(e=>e.textContent)")
        evaluate("(()=>{const host=document.querySelector('.qb-demo'),e=host.querySelector('input[type=range]')||host.querySelector('select');if(e.tagName==='SELECT'){e.selectedIndex=e.options.length-1;e.dispatchEvent(new Event('change',{bubbles:true}));host.querySelector('[data-action=measure-new]')?.click();}else{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}));}})()")
        after=evaluate("[...document.querySelectorAll('.qb-readout')].map(e=>e.textContent)")
        assert before[0]!=after[0] and before[1:]==after[1:],(before,after)
        assert evaluate("new Set([...document.querySelectorAll('[id]')].map(e=>e.id)).size===document.querySelectorAll('[id]').length")
    finally:page.unlink(missing_ok=True)
    assert not errors,errors
    (artifacts/'audit.json').write_text(json.dumps(dict(results=results,multiple_instances=True,script_errors=errors),indent=2))
    print('PASS: independent repeated and different demos; no browser exceptions',flush=True)
    print('Browser artifacts:',artifacts,flush=True)
finally:
    if ws:
        try:call('Browser.close')
        except Exception:pass
        ws.close()
    proc.terminate()
    try:proc.wait(timeout=4)
    except subprocess.TimeoutExpired:proc.kill()
    server.shutdown();server.server_close()
