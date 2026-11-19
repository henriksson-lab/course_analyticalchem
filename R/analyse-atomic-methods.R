source("R/course-tools.R")
standards<-course_read("atomic-standards")
fit<-lm(emission_counts~copper_mg_l,standards)
a<-unname(coef(fit)[1]);b<-unname(coef(fit)[2])
digests<-course_read("atomic-digests")
blank_final<-(digests$emission_counts[digests$sample_id=="method_blank"]-a)/b
qc<-course_read("atomic-qc") |> mutate(estimated_mg_l=(emission_counts-a)/b,
 recovery_percent=100*estimated_mg_l/reference_mg_l,
 qc_pass=recovery_percent>=recovery_lower & recovery_percent<=recovery_upper)
results<-digests |> mutate(measured_mg_l=(emission_counts-a)/b,
 in_range=measured_mg_l>=0 & measured_mg_l<=2,
 digest_blank_corrected_mg_l=measured_mg_l*further_dilution-blank_final,
 copper_mg_kg=if_else(sample_id!="method_blank" & in_range & all(qc$qc_pass),
 digest_blank_corrected_mg_l* (digest_ml/1000) / (dry_mass_g/1000), NA_real_))
lines<-course_read("atomic-lines")
result_tables<-list(results=results,qc=qc)
plots<-list(calibration=ggplot(standards,aes(copper_mg_l,emission_counts))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=a,slope=b)+labs(x="Copper in measured solution (mg/L)",y="Emission counts (arbitrary units)")+course_theme(),
 lines=ggplot(lines,aes(wavelength_nm,counts,colour=trace))+geom_line(linewidth=.8)+
 labs(x="Wavelength (nm)",y="Intensity (arbitrary units)",colour=NULL,
 subtitle="Illustrative close lines; not reference identification spectra")+course_theme(),
 results=ggplot(results |> filter(sample_id!="method_blank"),aes(sample_id,copper_mg_kg))+
 geom_point(size=4,colour="#087b85")+labs(x="Supplied dry plant sample",y="Copper (mg/kg dry mass)")+course_theme(),
 qc=ggplot(qc,aes(check_id,recovery_percent))+geom_hline(yintercept=c(95,105),linetype=2)+
 geom_point(size=4,colour="#087b85")+coord_cartesian(ylim=c(90,110))+
 labs(x="Independent check",y="Recovery (%)",subtitle="Exercise acceptance: 95–105%")+course_theme())
export_unit("atomic-methods",result_tables,plots)
