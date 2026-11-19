# Analytical Chemistry R project

Extract the ZIP and open analyticalchem.Rproj in RStudio. Keep your editable
report at the project root. Missing packages can be installed once:

    install.packages(c("readr","dplyr","ggplot2","knitr","rmarkdown"))

For the whole-course project, use course-report.Rmd. It renders immediately
with a small import example; add your chosen lesson's calculations, figures and
chemical explanations. For the iron UV/visible example, report.Rmd provides a
more detailed runnable template. Restart R and render from the console:

    rmarkdown::render("course-report.Rmd", output_dir="reports")

or, for the UV/visible template:

    rmarkdown::render("report.Rmd", output_dir="reports")

Follow each lesson on the course website. Read data/course/README.md for the
whole-course dictionary, and data/README.md for the original UV/visible scenario.
All data are simulated. Keep original inputs unchanged and save derived CSVs
in output/. R/inverse-calibration.R is a supplied helper, not a function-writing
task. The student ZIP excludes instructor analyses and solved reports.
