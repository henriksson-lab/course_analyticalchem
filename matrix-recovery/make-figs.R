# Run with Rscript matrix-recovery/make-figs.R from the project root, or locally.
# The explicit output filenames below let the slide editor protect generated plots.
make_figs <- function() {
  project <- if (file.exists("R/analyse-matrix-recovery.R")) normalizePath(".") else normalizePath("..")
  unit_dir <- file.path(project, "matrix-recovery")
  previous <- setwd(project)
  on.exit(setwd(previous))
  code <- readLines("R/analyse-matrix-recovery.R", warn = FALSE)
  # Compute the reviewed plots without exporting to the legacy shared asset tree.
  code <- code[!grepl("export_unit(", code, fixed = TRUE)]
  eval(parse(text = code), envir = environment())
  ggplot2::ggsave(file.path(unit_dir, "fig05-additions.svg"), plots$additions, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig06-intercept.svg"), plots$intercept, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig01-slopes.svg"), plots$slopes, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig02-recovery.svg"), plots$recovery, device = grDevices::svg, width = 9, height = 4.8)
}
make_figs()
