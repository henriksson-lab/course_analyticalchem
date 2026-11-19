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
    def navigate(slug):
        call('Page.navigate',dict(url=f'http://127.0.0.1:{server.server_port}/demos/{slug}.html'))
        for _ in range(120):
            if evaluate("document.readyState==='complete' && !!document.querySelector('#controls') && !!document.querySelector('svg')"):break
            time.sleep(.05)
        else:raise RuntimeError('Demo did not initialise: '+slug+' '+str(errors))
    def screenshot(name):
        data=call('Page.captureScreenshot',dict(format='png',captureBeyondViewport=False))['data']
        (artifacts/(name+'.png')).write_bytes(base64.b64decode(data))
    def export_csv():
        return evaluate('''(async()=>{window.__csvBlobs=[];window.__csvNames=[];
          const original=URL.createObjectURL,click=HTMLAnchorElement.prototype.click;
          URL.createObjectURL=function(blob){window.__csvBlobs.push(blob);return original.call(this,blob)};
          HTMLAnchorElement.prototype.click=function(){if(this.download){window.__csvNames.push(this.download);return;}click.call(this)};
          document.querySelector('#export').click();
          const text=window.__csvBlobs.length?await window.__csvBlobs.at(-1).text():'';
          URL.createObjectURL=original;HTMLAnchorElement.prototype.click=click;
          return {name:window.__csvNames.at(-1),text};})()''')
    call('Page.enable');call('Runtime.enable')
    call('Emulation.setDeviceMetricsOverride',dict(width=1440,height=1000,deviceScaleFactor=1,mobile=False))
    results=[]
    for unit in json.loads((root/'course.json').read_text()):
        slug=unit['slug'];navigate(slug)
        found=evaluate('''(async()=>{const failures=[];const form=document.querySelector('#controls');
          const baseline=document.querySelector('.demo-content').innerText;
          const reset=async()=>{document.querySelector('#reset').click();await Promise.resolve()};
          const fields=[...form.querySelectorAll('input,select')];
          for(const input of fields){
            const label=input.labels?.length?input.labels[0].innerText:'';
            if(!label.trim())failures.push(input.id+': missing label');
            const values=input.tagName==='SELECT'?[...input.options].map(x=>x.value):
               input.type==='checkbox'?[true,false]:[input.min,input.max].filter(v=>v!=='');
            for(const value of values){await reset();
              if(input.disabled)continue;
              if(input.type==='checkbox')input.checked=value;else input.value=value;
              input.dispatchEvent(new Event('input',{bubbles:true}));
              input.dispatchEvent(new Event('change',{bubbles:true}));
              await Promise.resolve();
              const content=document.querySelector('.demo-content').innerText;
              if(/\\bNaN\\b|\\bInfinity\\b/.test(content))failures.push(input.id+': nonfinite readout at '+value);
              if(!document.querySelector('svg[role="img"]'))failures.push(input.id+': missing accessible chart');
              if(input.tagName==='SELECT'){
                for(const child of form.querySelectorAll('input[type=range],input[type=number]')){
                  if(child.disabled)continue;const old=child.value;
                  for(const edge of [child.min,child.max].filter(v=>v!=='')){
                    child.value=edge;child.dispatchEvent(new Event('input',{bubbles:true}));
                    const readout=document.querySelector('.demo-content').innerText;
                    if(/\\bNaN\\b|\\bInfinity\\b/.test(readout))failures.push(child.id+': nonfinite readout in '+input.id+'='+value);
                  }
                  child.value=old;child.dispatchEvent(new Event('input',{bubbles:true}));
                }
              }
            }
          }
          await reset();
          if(document.querySelector('.demo-content').innerText!==baseline)failures.push('reset did not restore default result');
          const chart=document.querySelector('svg');chart.focus();
          chart.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));
          const inspection=document.querySelector('.plot-inspector').innerText;
          if(inspection.startsWith('Inspect:'))failures.push('keyboard inspection did not update');
          return {fields:fields.length,failures};})()''')
        assert not found['failures'],(slug,found['failures'])
        exported=export_csv();assert exported['name'].endswith('.csv'),slug
        rows=list(csv.DictReader(io.StringIO(exported['text'])));assert rows,(slug,'empty export')
        (artifacts/(slug+'.csv')).write_text(exported['text'])
        assert not errors,(slug,errors)
        results.append(dict(slug=slug,controls=found['fields'],exported_rows=len(rows)))
        print(f'PASS desktop controls/reset/keyboard/CSV: {slug} ({found["fields"]} inputs; {len(rows)} rows)',flush=True)
        if slug in ['titration','separations','matrix-recovery','defending-results']:screenshot(slug+'-desktop')
    # A new plan is not a new measurement. Check the actual browser history and CSV.
    navigate('defending-results')
    history=evaluate('''(()=>{const rows=()=>[...document.querySelectorAll('#history-rows tr')].map(r=>r.innerText);
      const before=rows();const input=document.querySelector('#planned-aliquot');input.value='2';
      input.dispatchEvent(new Event('input',{bubbles:true}));const planned=rows();
      document.querySelector('#measure-new').click();const measured=rows();
      document.querySelector('#planned-qc').value='fail';
      document.querySelector('#planned-qc').dispatchEvent(new Event('input',{bubbles:true}));
      document.querySelector('#measure-new').click();
      return {before,planned,measured,failed:rows()};})()''')
    assert history['before']==history['planned'],history
    assert len(history['measured'])==2 and '400' in history['measured'][1],history
    records=list(csv.DictReader(io.StringIO(export_csv()['text'])))
    assert records[0]['reportable']=='false' and not records[0]['reported_original_mg_l'],records
    assert records[1]['reported_original_mg_l']=='400',records
    assert records[2]['reportable']=='false' and not records[2]['reported_original_mg_l'],records
    print('PASS: planning preserves old signals; new preparation/QC failures export correct reporting decisions',flush=True)
    # Sampling counts of zero mean no evidence; export must not fabricate a zero result.
    navigate('sampling-preparation')
    empty=evaluate('''(()=>{for(const id of ['top','middle','bottom']){let e=document.getElementById(id);e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}));}
      return {disabled:document.querySelector('#export').disabled,text:document.querySelector('#interpretation').innerText};})()''')
    assert empty['disabled'] and 'No material' in empty['text'],empty
    call('Emulation.setDeviceMetricsOverride',dict(width=390,height=844,deviceScaleFactor=1,mobile=True))
    for unit in json.loads((root/'course.json').read_text()):
        slug=unit['slug'];navigate(slug)
        layout=evaluate('({width:innerWidth,scrollWidth:document.documentElement.scrollWidth})')
        assert layout['scrollWidth']<=layout['width']+2,(slug,layout)
        # Inspect one change after load at mobile width as well.
        evaluate("document.querySelector('input[type=range]')?.dispatchEvent(new Event('input',{bubbles:true}))")
        jumped=evaluate("(()=>{document.querySelector('.control-panel .mobile-jump').click();return location.hash})()")
        assert jumped=='#experiment-results',(slug,jumped)
        returned=evaluate("(()=>{document.querySelector('.demo-content .mobile-jump').click();return location.hash})()")
        assert returned=='#controls-title',(slug,returned)
        if slug in ['sample-answer','separations','defending-results']:screenshot(slug+'-mobile')
    assert not errors,errors
    (artifacts/'audit.json').write_text(json.dumps(dict(results=results,history_check=history,mobile_width=390,script_errors=errors),indent=2))
    print('PASS: all twelve mobile demos fit 390 pixels; no uncaught browser errors',flush=True)
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
