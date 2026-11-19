# Generated plots for this topic. Run Rscript <topic>/make-figs.R from project root.
script_arg <- grep("^--file=", commandArgs(), value=TRUE)
here <- if (length(script_arg)) normalizePath(dirname(sub("^--file=", "", script_arg[1]))) else normalizePath(".")
root <- normalizePath(file.path(here, ".."))
setwd(root)
source("R/course-tools.R")
source("R/inverse-calibration.R")
standards <- read_csv("data/standards.csv",show_col_types=FALSE)
fit <- lm(absorbance~standard_mg_l,standards)
a <- unname(coef(fit)[1]);b <- unname(coef(fit)[2])
standards <- standards |> mutate(fitted=fitted(fit),residual=residuals(fit))
blanks <- course_read("blank-signals")
s_blank <- sd(blanks$signal)
# Separate ideal low-level example: response sensitivity=0.200 L/mg.
limits <- data.frame(sensitivity=.2,blank_mean=mean(blanks$signal),blank_sd=s_blank,
 indicative_detection_mg_l=3*s_blank/.2,indicative_quantification_mg_l=10*s_blank/.2)
curved <- course_read("nonlinear-calibration")
curved_fit <- lm(response~c_mg_l,curved)
curved <- curved |> mutate(fitted=fitted(curved_fit),residual=residuals(curved_fit))
unknown <- inverse_calibration(fit,c(.47922,.48041,.48223))
result_tables <- list(standards=standards,indicative_limits=limits,unknown=unknown)
plots <- list(line=ggplot(standards,aes(standard_mg_l,absorbance))+geom_point(size=2.5,colour="#087b85")+
 geom_abline(intercept=a,slope=b)+labs(x="Final iron concentration (mg Fe/L)",y="Absorbance at 510 nm")+course_theme(),
 residual=ggplot(standards,aes(standard_mg_l,residual))+geom_point(size=2.5,colour="#087b85")+
 geom_hline(yintercept=0,linetype=2)+labs(x="Final concentration (mg Fe/L)",y="Residual absorbance")+course_theme(),
 curvature=ggplot(curved,aes(c_mg_l,residual))+geom_point(size=2.5,colour="#c35420")+
 geom_hline(yintercept=0,linetype=2)+labs(x="Concentration (mg/L)",y="Residual response",
 subtitle="A straight-line model misses the deliberately curved response")+course_theme(),
 blanks=ggplot(blanks,aes(blank_id,signal))+geom_point(size=3,colour="#087b85")+
 geom_hline(yintercept=mean(blanks$signal)+3*s_blank,linetype=2,colour="#c35420")+
 labs(x="Independent method blank",y="Signal (arbitrary units)",subtitle="Dashed: mean blank + 3 SD; illustrative rule, not validation")+course_theme())

ggsave(file.path(here, "fig01-calibration.svg"), plot=plots$line, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig02-residuals.svg"), plot=plots$residual, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig03-curved-response-residuals.svg"), plot=plots$curvature, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig05-independent-blanks.svg"), plot=plots$blanks, device=grDevices::svg, width=9, height=4.8)
