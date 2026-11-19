"""Execute the actual R code printed in each new exercise, in fresh R sessions."""
from pathlib import Path
import subprocess,tempfile,re,json
root=Path(__file__).resolve().parents[1]
for unit in json.loads((root/'course.json').read_text()):
 lesson=root/unit['slug']/'exercise.qmd'
 chunks=re.findall(r'^```(?:r|\{r[^\n]*\})\s*\n(.*?)^```',lesson.read_text(),re.M|re.S)
 chunks=[c for c in chunks if 'install.packages(' not in c]
 assert chunks,lesson
 with tempfile.TemporaryDirectory(prefix='analyticalchem-code-') as tmp:
  script=Path(tmp)/'exercise.R'
  script.write_text('dir.create("output",showWarnings=FALSE)\npdf(tempfile(fileext=".pdf"))\n'+ '\n\n'.join(chunks)+'\ndev.off()\n')
  p=subprocess.run(['Rscript',str(script)],cwd=root,capture_output=True,text=True)
  if p.returncode:raise RuntimeError(f'{lesson}\n{p.stdout}\n{p.stderr}')
 print('PASS:',unit['slug'],len(chunks),'R code blocks',flush=True)
