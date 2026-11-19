# Run with Rscript from this topic directory or from the course root.
args <- commandArgs(trailingOnly=FALSE)
script <- sub("^--file=", "", args[grepl("^--file=", args)])
if (length(script)) setwd(dirname(normalizePath(script[1])))
suppressPackageStartupMessages({library(readr); library(dplyr); library(ggplot2)})
peaks <- read_csv("../data/course/peak-summary.csv", show_col_types=FALSE)
chrom <- read_csv("../data/course/chromatograms.csv", show_col_types=FALSE)
style <- theme_minimal(base_size=15) + theme(legend.position="bottom")
resolved <- ggplot(filter(chrom,run=="resolved"),aes(time_min,response))+
 geom_line(colour="#087b85",linewidth=.9)+geom_vline(xintercept=1,linetype=2)+
 labs(x="Time (min)",y="Detector response (arbitrary units)",subtitle="Unretained marker t₀=1 min; Gaussian component areas A=100 and B=150")+style
overlap <- ggplot(filter(chrom,run%in%c("resolved","overlap")),aes(time_min,response,colour=run))+
 geom_line(linewidth=.9)+labs(x="Time (min)",y="Detector response",colour=NULL,subtitle="Same component areas; changed retention spacing")+style
broad <- ggplot(filter(chrom,run%in%c("resolved","broad")),aes(time_min,response,colour=run))+
 geom_line(linewidth=.9)+labs(x="Time (min)",y="Detector response",colour=NULL,subtitle="Unchanged retention times; broader bands")+style
u <- seq(.2,5,length.out=100)
velocity <- ggplot(data.frame(u,H=1+.8/u+.35*u),aes(u,H))+
 geom_line(colour="#087b85",linewidth=1)+labs(x="Relative mobile-phase velocity",y="Relative plate height",subtitle="Illustrative H=A+B/u+Cu; dimensionless values, not instrument settings")+style
# Explicit output names let the slide editor lock generated figures.
ggsave("fig03-resolved.svg",resolved,device=grDevices::svg,width=9,height=4.8)
ggsave("fig04-overlap.svg",overlap,device=grDevices::svg,width=9,height=4.8)
ggsave("fig05-broad.svg",broad,device=grDevices::svg,width=9,height=4.8)
ggsave("fig06-efficiency.svg",velocity,device=grDevices::svg,width=9,height=4.8)
