"""Execute every lesson's executable R chunks in separate fresh Rscript processes."""
from pathlib import Path
import subprocess,tempfile,re
root=Path(__file__).resolve().parents[1]
for lesson in sorted((root/'lessons').glob('*.qmd')):
 chunks=re.findall(r'^```\{r[^\n]*\}\n(.*?)^```',lesson.read_text(),re.M|re.S)
 chunks=[c for c in chunks if 'install.packages(' not in c]
 with tempfile.TemporaryDirectory(prefix='analyticalchem-code-') as tmp:
  script=Path(tmp)/'lesson.R'
  script.write_text('pdf(tempfile(fileext=".pdf"))\n'+ '\n\n'.join(chunks)+'\ndev.off()\n')
  p=subprocess.run(['Rscript',str(script)],cwd=root,capture_output=True,text=True)
  if p.returncode:raise RuntimeError(f'{lesson.name}\n{p.stdout}\n{p.stderr}')
 print('PASS:',lesson.name)
