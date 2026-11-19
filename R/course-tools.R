suppressPackageStartupMessages({library(readr); library(dplyr); library(ggplot2)})
course_read <- function(name) read_csv(file.path("data/course",paste0(name,".csv")),show_col_types=FALSE)
course_theme <- function() theme_minimal(base_size=15) + theme(legend.position="bottom",plot.title.position="plot")
export_unit <- function(slug, tables, figures) {
  dir.create(file.path("output",slug),recursive=TRUE,showWarnings=FALSE)
  for(nm in names(tables)) write_csv(tables[[nm]],file.path("output",slug,paste0(nm,".csv")),na="NA")
  for(nm in names(figures)) ggsave(file.path("assets/course",paste0(slug,"-",nm,".svg")),
    figures[[nm]],device=grDevices::svg,width=9,height=4.8)
}
