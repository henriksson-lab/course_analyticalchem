# Run with Rscript from this topic directory or from the course root.
args <- commandArgs(trailingOnly=FALSE)
script <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(script)) setwd(dirname(normalizePath(script[1])))
suppressPackageStartupMessages({library(readr);library(dplyr);library(ggplot2)})
standards <- read_csv("../data/course/hplc-standards.csv",show_col_types=FALSE) |>
 mutate(area_ratio=caffeine_area/internal_standard_area)
fe <- lm(caffeine_area~caffeine_mg_l,standards)
fr <- lm(area_ratio~caffeine_mg_l,standards)
injections <- read_csv("../data/course/hplc-injections.csv",show_col_types=FALSE) |>
 mutate(area_ratio=caffeine_area/internal_standard_area,
 external=(caffeine_area-coef(fe)[1])/coef(fe)[2],
 ratio=(area_ratio-coef(fr)[1])/coef(fr)[2])
comparison <- bind_rows(filter(injections,preparation_id=="D1") |> transmute(injection_id,method="External area",estimate=external),
 filter(injections,preparation_id=="D1") |> transmute(injection_id,method="Area ratio",estimate=ratio))
gradient <- read_csv("../data/course/hplc-gradient.csv",show_col_types=FALSE)
chrom <- read_csv("../data/course/chromatograms.csv",show_col_types=FALSE)
style <- theme_minimal(base_size=15)+theme(legend.position="bottom")
a <- ggplot(standards,aes(caffeine_mg_l,caffeine_area))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=coef(fe)[1],slope=coef(fe)[2])+labs(x="Caffeine in final solution (mg/L)",y="Integrated caffeine peak area (arbitrary units)")+style
b <- ggplot(standards,aes(caffeine_mg_l,area_ratio))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=coef(fr)[1],slope=coef(fr)[2])+labs(x="Caffeine in final solution (mg/L)",y="Caffeine / internal-standard area",subtitle="Internal-standard concentration fixed at 10 mg/L")+style
c <- ggplot(comparison,aes(injection_id,estimate,colour=method,group=method))+geom_point(size=3)+geom_line()+
 labs(x="Repeated injection of preparation D1",y="Estimated final caffeine (mg/L)",colour=NULL)+style
d <- ggplot(gradient,aes(time_min,organic_percent))+geom_line(colour="#087b85",linewidth=1)+
 labs(x="Time (min)",y="Organic modifier (%)",subtitle="Illustrative reversed-phase program includes return and re-equilibration")+style
e <- ggplot(filter(chrom,run%in%c("resolved","overlap")),aes(time_min,response,colour=run))+geom_line(linewidth=.9)+
 labs(x="Time (min)",y="Detector response",colour=NULL,subtitle="Coelution changes the selectivity of an integrated response")+style
# Explicit output names let the slide editor lock generated figures.
ggsave("fig04-external.svg",a,device=grDevices::svg,width=9,height=4.8)
ggsave("fig06-ratio.svg",b,device=grDevices::svg,width=9,height=4.8)
ggsave("fig07-injections.svg",c,device=grDevices::svg,width=9,height=4.8)
ggsave("fig03-gradient.svg",d,device=grDevices::svg,width=9,height=4.8)
ggsave("fig09-coelution.svg",e,device=grDevices::svg,width=9,height=4.8)
