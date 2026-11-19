# Generated plots for this topic. Run Rscript <topic>/make-figs.R from project root.
script_arg <- grep("^--file=", commandArgs(), value=TRUE)
here <- if (length(script_arg)) normalizePath(dirname(sub("^--file=", "", script_arg[1]))) else normalizePath(".")
root <- normalizePath(file.path(here, ".."))
setwd(root)
source("R/course-tools.R")
measurements <- course_read("precision")
summary_precision <- measurements |> group_by(method) |> summarise(n=n(),mean_mg_l=mean(measured_mg_l),
 sd_mg_l=sd(measured_mg_l),u_mean_mg_l=sd_mg_l/sqrt(n),bias_mg_l=mean_mg_l-first(reference_mg_l),.groups="drop")
c_final <- 100*5/50
budget <- data.frame(source=c("Stock concentration","Aliquot volume","Final volume"),
 u_contribution_mg_l=c(c_final*.4/100,c_final*.006/5,c_final*.03/50))
u_combined <- sqrt(sum(budget$u_contribution_mg_l^2))
repeat_curve <- data.frame(n=1:100) |> mutate(random_u=.2/sqrt(n),combined_u=sqrt(random_u^2+.1^2))
result_tables <- list(summary=summary_precision,budget=budget,
 combined=data.frame(concentration_mg_l=c_final,standard_uncertainty_mg_l=u_combined))
plots <- list(bias=ggplot(measurements,aes(measured_mg_l,method))+geom_vline(xintercept=10,linetype=2)+
 geom_point(size=3,colour="#087b85")+labs(x="Measured concentration (mg/L)",y="Method",
 subtitle="Reference=10.00 mg/L; repeated measurements of the same material")+course_theme(),
 spread=ggplot(summary_precision,aes(method,sd_mg_l))+geom_col(fill="#087b85",width=.55)+
 labs(x="Method",y="Sample SD (mg/L)",subtitle="Spread among readings is not bias")+course_theme(),
 budget=ggplot(budget,aes(u_contribution_mg_l,source))+geom_col(fill="#087b85",width=.55)+
 labs(x="Standard uncertainty contribution (mg/L)",y=NULL)+course_theme(),
 averaging=ggplot(repeat_curve,aes(n,combined_u))+geom_line(colour="#c35420",linewidth=1)+
 geom_line(aes(y=random_u),colour="#087b85",linetype=2,linewidth=1)+geom_hline(yintercept=.1,linetype=3)+
 labs(x="Independent readings of one prepared solution",y="Standard uncertainty (mg/L)",
 subtitle="Solid: random + shared component; dashed: reading component only")+course_theme())

ggsave(file.path(here, "fig01-bias-precision.svg"), plot=plots$bias, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig02-reading-spread.svg"), plot=plots$spread, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig04-averaging-floor.svg"), plot=plots$averaging, device=grDevices::svg, width=9, height=4.8)
ggsave(file.path(here, "fig06-dilution-budget.svg"), plot=plots$budget, device=grDevices::svg, width=9, height=4.8)
