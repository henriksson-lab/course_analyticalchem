# Run with Rscript potentiometry/make-figs.R from the project root, or locally.
# The explicit output filenames below let the slide editor protect generated plots.
make_figs <- function() {
  project <- if (file.exists("R/analyse-potentiometry.R")) normalizePath(".") else normalizePath("..")
  unit_dir <- file.path(project, "potentiometry")
  previous <- setwd(project)
  on.exit(setwd(previous))
  code <- readLines("R/analyse-potentiometry.R", warn = FALSE)
  # Compute the reviewed plots without exporting to the legacy shared asset tree.
  code <- code[!grepl("export_unit(", code, fixed = TRUE)]
  eval(parse(text = code), envir = environment())
  ggplot2::ggsave(file.path(unit_dir, "fig03-calibration.svg"), plots$calibration, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig05-linear_axis.svg"), plots$linear_axis, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig06-drift.svg"), plots$drift, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig04-ph.svg"), plots$ph, device = grDevices::svg, width = 9, height = 4.8)
}
make_figs()
