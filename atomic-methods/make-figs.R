# Run with Rscript atomic-methods/make-figs.R from the project root, or locally.
# The explicit output filenames below let the slide editor protect generated plots.
make_figs <- function() {
  project <- if (file.exists("R/analyse-atomic-methods.R")) normalizePath(".") else normalizePath("..")
  unit_dir <- file.path(project, "atomic-methods")
  previous <- setwd(project)
  on.exit(setwd(previous))
  code <- readLines("R/analyse-atomic-methods.R", warn = FALSE)
  # Compute the reviewed plots without exporting to the legacy shared asset tree.
  code <- code[!grepl("export_unit(", code, fixed = TRUE)]
  eval(parse(text = code), envir = environment())
  ggplot2::ggsave(file.path(unit_dir, "fig06-calibration.svg"), plots$calibration, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig05-lines.svg"), plots$lines, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig10-results.svg"), plots$results, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig07-qc.svg"), plots$qc, device = grDevices::svg, width = 9, height = 4.8)
}
make_figs()
