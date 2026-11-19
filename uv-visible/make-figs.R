# Run from uv-visible/. These named local outputs are generated, not hand-editable.
setwd("..")
source("R/analyse-uv-visible.R")
figures <- c(calibration="fig04-calibration.svg", residual="fig05-residuals.svg",
 spectrum="fig03-spectrum.svg", range="fig08-range.svg", qc="fig09-qc.svg",
 uncertainty="fig10-budget.svg")
for (name in names(figures)) stopifnot(file.copy(file.path("assets",paste0(name,".svg")),file.path("uv-visible",figures[[name]]),overwrite=TRUE))
