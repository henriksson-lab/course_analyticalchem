# Verify browser-exported CSVs using the course's existing R vocabulary.
# Usage: Rscript scripts/check-demo-r-transfer.R /tmp/analyticalchem-demo-check-...
suppressPackageStartupMessages({library(readr);library(dplyr)})
args <- commandArgs(trailingOnly=TRUE)
stopifnot(length(args)==1,dir.exists(args[1]))
read_demo <- function(slug) {
  x <- read_csv(file.path(args[1],paste0(slug,".csv")),show_col_types=FALSE)
  stopifnot(nrow(x)>0,nrow(problems(x))==0)
  x
}
slugs<-c("sample-answer","sampling-preparation","error-uncertainty","calibration-qc",
 "titration","potentiometry","uv-visible","matrix-recovery","atomic-methods",
 "separations","gc-hplc","defending-results")
data<-setNames(lapply(slugs,read_demo),slugs)
x<-data[["sample-answer"]]
stopifnot(max(abs(x$analyte_mg-x$concentration_mg_l*x$volume_ml/1000))<1e-10)
x<-data[["error-uncertainty"]]
expected<-sqrt(x$reading_sd_model_mg_l^2/x$n_readings+x$shared_standard_uncertainty_mg_l^2)
stopifnot(max(abs(expected-x$mean_standard_uncertainty_model_mg_l))<1e-12)
x<-data[["calibration-qc"]] |> filter(role=="standard")
fit<-lm(response~known_final_mg_l,x)
stopifnot(coef(fit)[2]>0,length(residuals(fit))==18)
x<-data[["titration"]]
stopifnot(abs(x$ph[which.min(abs(x$volume_ml-25))]-7)<1e-7)
x<-data[["potentiometry"]] |> filter(!is.na(calibration_mv))
fit<-lm(calibration_mv~log10_c_mol_l,x)
stopifnot(abs(coef(fit)[2]+59.16)<1e-9)
x<-data[["uv-visible"]] |> filter(record_type=="standard")
fit<-lm(absorbance~concentration_mg_l,x)
stopifnot(abs(coef(fit)[2]-.1988)<1e-10)
x<-data[["matrix-recovery"]]
fit<-lm(fitted_signal~added_mg_l_final,x)
original<-unname(coef(fit)[1]/coef(fit)[2])*x$final_ml[1]/x$sample_ml[1]
stopifnot(abs(original-5)<1e-10)
x<-data[["atomic-methods"]]
i<-which.min(abs(x$offset_nm))
digest<-((x$total_counts[i]-8)/1000)*2-x$method_blank_digest_mg_l[i]
stopifnot(abs(digest*.05/.00025-x$diagnostic_apparent_original_mg_kg[i])<1e-9)
x<-data[["separations"]]
area<-sum(diff(x$time_min)*(head(x$combined_above_baseline,-1)+tail(x$combined_above_baseline,-1))/2)
stopifnot(abs(area-250)<.01)
x<-data[["gc-hplc"]]
ratio_original<-(x$area_ratio-.006)/.1*10
stopifnot(max(abs(ratio_original-x$candidate_ratio_original_mg_l))<1e-9)
x<-data[["defending-results"]]
stopifnot(!x$reportable[1],is.na(x$reported_original_mg_l[1]),
 abs(x$candidate_original_mg_l[1]-400)<1e-9)
cat("PASS: all twelve browser CSV exports import cleanly in R; mass balances, fits, integration and withheld values reproduce\n")
