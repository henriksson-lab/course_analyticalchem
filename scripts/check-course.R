# Independent numerical and decision checks across the new course units.
run <- function(slug) {e<-new.env();sys.source(paste0("R/analyse-",slug,".R"),envir=e);e}
e<-run("sample-answer");stopifnot(all(e$summary_water$mean_mg_l==c(19.5,12.5)),
 all(e$water$chloride_mg==e$water$chloride_mg_l*.25))
e<-run("sampling-preparation");stopifnot(max(abs(e$extracts$caffeine_mg_g-c(.48,.49,.75)))<1e-10,
 abs(e$equal_mass_mean-47/3)<1e-10,all(diff(e$extraction$fraction_recovered)>0))
e<-run("error-uncertainty");stopifnot(abs(e$u_combined-sqrt(.04^2+.012^2+.006^2))<1e-12,
 abs(e$summary_precision$bias_mg_l[e$summary_precision$method=="B"]-.5)<1e-12)
e<-run("calibration-qc");stopifnot(abs(e$unknown$final_mg_l-2.3981269193)<1e-8,
 e$limits$indicative_detection_mg_l<e$limits$indicative_quantification_mg_l)
e<-run("titration");stopifnot(abs(e$curve$ph[e$curve$volume_ml==25]-7)<1e-10,
 abs(e$hardness$hardness_mg_l_CaCO3[1]-123.1107)<1e-8,
 e$weak_ph[e$curve$volume_ml==25]>7)
e<-run("potentiometry");stopifnot(abs(e$b+59.1)<1e-8,e$checks$check_pass[1],
 !e$checks$check_pass[2],is.na(e$unknown$fluoride_mol_l[2]),
 abs(e$unknown$fluoride_mol_l[1]-2e-4)<1e-7)
e<-run("matrix-recovery");stopifnot(abs(e$original_mg_l-5.020053476)<1e-8,
 e$spike_recovery_percent==75,unname(e$external_estimate)<e$original_mg_l)
e<-run("atomic-methods");stopifnot(all(e$qc$qc_pass),
 abs(e$results$copper_mg_kg[1]-160.35871296)<1e-7,
 is.na(e$results$copper_mg_kg[3]))
e<-run("separations");stopifnot(abs(e$resolution$resolution[e$resolution$run=="resolved"]-20/9)<1e-12,
 abs(e$resolution$resolution[e$resolution$run=="overlap"]-2/3)<1e-12)
# Independently integrate supplied curves above baseline to verify areas survive broadening.
for(run_name in unique(e$chrom$run)) {
 d<-e$chrom[e$chrom$run==run_name,]; y<-d$response-5
 area<-sum(diff(d$time_min)*(head(y,-1)+tail(y,-1))/2)
 stopifnot(abs(area-250)<.01)
}
e<-run("gc-hplc");stopifnot(all(e$injections$reportable==c(TRUE,TRUE,FALSE,FALSE)),
 max(abs(e$injections$final_ratio_mg_l[1:2]-15))<.02,
 is.na(e$injections$original_mg_l[3]))
e<-run("defending-results");stopifnot(all(e$qc$pass),
 all(e$results$reportable==c(TRUE,FALSE,TRUE,FALSE)),
 max(abs(e$results$original_mg_l[c(1,3)]-c(150,400)))<1e-8,
 all(is.na(e$results$original_mg_l[c(2,4)])))
cat("PASS: mass balances, uncertainty, equilibrium, logs, matrix effects, blanks, resolution, integration and reporting guards\n")
