"""Package runnable student templates and input data, excluding worked solutions."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
root=Path(__file__).resolve().parents[1]
common=[root/p for p in ["analyticalchem.Rproj","report.Rmd","README-student.md",
 "R/inverse-calibration.R","output/README.txt","reports/README.txt"]]
for name,files in [
 ("uv-visible-project",common+[p for p in (root/"data").glob("*") if p.is_file()]),
 ("analyticalchem-project",common+[root/"course-report.Rmd"]+
   [p for p in (root/"data").rglob("*") if p.is_file()])]:
 with ZipFile(root/f"downloads/{name}.zip","w",ZIP_DEFLATED) as z:
  for path in files:z.write(path,Path(name)/path.relative_to(root))
 print(f"Packaged {len(files)} files in {name}.zip")
