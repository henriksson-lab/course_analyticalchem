# Run with Rscript from this topic directory or from the course root.
args <- commandArgs(trailingOnly=FALSE)
script <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(script)) setwd(dirname(normalizePath(script[1])))
suppressPackageStartupMessages({library(readr);library(dplyr);library(ggplot2)})
standards <- read_csv("../data/course/case-standards.csv",show_col_types=FALSE)
fit <- lm(area~caffeine_mg_l,standards);a<-unname(coef(fit)[1]);b<-unname(coef(fit)[2])
qc <- read_csv("../data/course/case-qc.csv",show_col_types=FALSE) |>
 mutate(estimate=(area-a)/b,recovery=100*estimate/reference_mg_l,pass=recovery>=acceptance_low&recovery<=acceptance_high)
results <- read_csv("../data/course/case-samples.csv",show_col_types=FALSE) |>
 mutate(estimate=(area-a)/b,reportable=estimate>=0&estimate<=30&resolved&qc_pass&all(qc$pass),
 concentration=if_else(reportable,estimate*final_ml/aliquot_ml,NA_real_),
 uncertainty=if_else(reportable,u_final_concentration_mg_l*final_ml/aliquot_ml,NA_real_))
comparison <- read_csv("../data/course/method-comparison.csv",show_col_types=FALSE)
differences <- bind_rows(transmute(comparison,reference_mg_l,difference=hplc_mg_l-reference_mg_l,method="HPLC"),
 transmute(comparison,reference_mg_l,difference=nonspecific_uv_mg_l-reference_mg_l,method="Unseparated UV"))
spectrum <- read_csv("../data/course/mass-spectrum.csv",show_col_types=FALSE)
chrom <- read_csv("../data/course/chromatograms.csv",show_col_types=FALSE)
style <- theme_minimal(base_size=15)+theme(legend.position="bottom")
p1 <- ggplot(standards,aes(caffeine_mg_l,area))+geom_point(size=3,colour="#087b85")+geom_abline(intercept=a,slope=b)+
 labs(x="Caffeine in final solution (mg/L)",y="Peak area (arbitrary units)")+style
p2 <- ggplot(filter(chrom,run%in%c("resolved","overlap")),aes(time_min,response,colour=run))+geom_line(linewidth=.9)+
 labs(x="Time (min)",y="Detector response",colour=NULL,subtitle="Known unresolved contribution prevents simple analyte-specific integration")+style
p3 <- ggplot(filter(results,reportable),aes(preparation_id,concentration))+geom_point(size=4,colour="#087b85")+
 geom_errorbar(aes(ymin=concentration-uncertainty,ymax=concentration+uncertainty),width=.12)+
 labs(x="Reportable preparation",y="Caffeine in supplied drink (mg/L)",subtitle="Bars: supplied final-concentration standard uncertainty scaled by dilution only")+style
p4 <- ggplot(differences,aes(reference_mg_l,difference,colour=method))+geom_hline(yintercept=0,linetype=2)+geom_point(size=3)+geom_line()+
 labs(x="Reference result (mg/L)",y="Method minus reference (mg/L)",colour=NULL,subtitle="Association alone is not agreement")+style
p5 <- ggplot(spectrum,aes(mz,relative_intensity))+geom_segment(aes(xend=mz,yend=0),colour="#087b85",linewidth=1)+
 labs(x="m/z (conventional mass-spectrometry scale)",y="Relative intensity (%)",subtitle="Illustrative ions only; not an authentic caffeine reference spectrum")+style
# Explicit output names let the slide editor lock generated figures.
ggsave("fig03-calibration.svg",p1,device=grDevices::svg,width=9,height=4.8)
ggsave("fig04-coelution.svg",p2,device=grDevices::svg,width=9,height=4.8)
ggsave("fig05-results.svg",p3,device=grDevices::svg,width=9,height=4.8)
ggsave("fig06-differences.svg",p4,device=grDevices::svg,width=9,height=4.8)
ggsave("fig08-spectrum.svg",p5,device=grDevices::svg,width=9,height=4.8)
