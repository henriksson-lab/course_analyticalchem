# Run from the project root; each report starts in a fresh R environment.
root <- normalizePath(".")
paths <- list.files("instructor/reports", pattern="[.]Rmd$", full.names=TRUE)
dir.create("reports/worked",recursive=TRUE,showWarnings=FALSE)
for (path in paths) {
  rmarkdown::render(path, output_dir=file.path(root,"reports/worked"),
    knit_root_dir=root,envir=new.env(parent=globalenv()),quiet=TRUE)
  cat("Rendered",basename(path),"\n")
}
