# Run with Rscript titration/make-figs.R from the project root, or locally.
# The explicit output filenames below let the slide editor protect generated plots.
make_figs <- function() {
  project <- if (file.exists("R/analyse-titration.R")) normalizePath(".") else normalizePath("..")
  unit_dir <- file.path(project, "titration")
  previous <- setwd(project)
  on.exit(setwd(previous))
  code <- readLines("R/analyse-titration.R", warn = FALSE)
  # Compute the reviewed plots without exporting to the legacy shared asset tree.
  code <- code[!grepl("export_unit(", code, fixed = TRUE)]
  eval(parse(text = code), envir = environment())
  ggplot2::ggsave(file.path(unit_dir, "fig02-curve.svg"), plots$curve, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig03-derivative.svg"), plots$derivative, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig04-comparison.svg"), plots$comparison, device = grDevices::svg, width = 9, height = 4.8)
  ggplot2::ggsave(file.path(unit_dir, "fig06-hardness.svg"), plots$hardness, device = grDevices::svg, width = 9, height = 4.8)
}
make_figs()
