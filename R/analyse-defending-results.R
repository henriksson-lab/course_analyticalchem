source("R/course-tools.R")
standards<-course_read("case-standards")
fit<-lm(area~caffeine_mg_l,standards)
a<-unname(coef(fit)[1]);b<-unname(coef(fit)[2])
qc<-course_read("case-qc") |> mutate(estimated_mg_l=(area-a)/b,
 recovery_percent=100*estimated_mg_l/reference_mg_l,
 pass=recovery_percent>=acceptance_low & recovery_percent<=acceptance_high)
results<-course_read("case-samples") |> mutate(final_estimate_mg_l=(area-a)/b,
 in_range=final_estimate_mg_l>=0 & final_estimate_mg_l<=30,
 reportable=in_range & resolved & qc_pass & all(qc$pass),
 dilution_factor=final_ml/aliquot_ml,
 original_mg_l=if_else(reportable,final_estimate_mg_l*dilution_factor,NA_real_),
 u_original_mg_l=if_else(reportable,u_final_concentration_mg_l*dilution_factor,NA_real_),
 decision=case_when(!qc_pass | !all(qc$pass)~"withhold: QC",!resolved~"withhold: coelution",
 !in_range~"remeasure: outside range",TRUE~"conditional result"))
comparison<-course_read("method-comparison") |> mutate(hplc_difference=hplc_mg_l-reference_mg_l,
 uv_difference=nonspecific_uv_mg_l-reference_mg_l)
differences<-bind_rows(comparison |> transmute(reference_mg_l,difference=hplc_difference,method="HPLC"),
 comparison |> transmute(reference_mg_l,difference=uv_difference,method="Unseparated UV"))
spectrum<-course_read("mass-spectrum")
result_tables<-list(results=results,qc=qc,comparison=comparison)
plots<-list(calibration=ggplot(standards,aes(caffeine_mg_l,area))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=a,slope=b)+labs(x="Caffeine in final solution (mg/L)",y="Peak area (arbitrary units)")+course_theme(),
 difference=ggplot(differences,aes(reference_mg_l,difference,colour=method))+geom_hline(yintercept=0,linetype=2)+
 geom_point(size=3)+geom_line()+labs(x="Reference result (mg/L)",y="Method minus reference (mg/L)",colour=NULL,
 subtitle="Agreement needs differences, not correlation alone")+course_theme(),
 spectrum=ggplot(spectrum,aes(mz,relative_intensity))+geom_segment(aes(xend=mz,yend=0),colour="#087b85",linewidth=1)+
 labs(x="m/z (conventional mass-spectrometry scale)",y="Relative intensity (%)",
 subtitle="Illustrative ESI-style ions: 195 can represent [M+H]⁺ for caffeine; not a library spectrum")+course_theme(),
 results=ggplot(results |> filter(reportable),aes(preparation_id,original_mg_l))+
 geom_point(size=4,colour="#087b85")+
 geom_errorbar(aes(ymin=original_mg_l-u_original_mg_l,ymax=original_mg_l+u_original_mg_l),width=.12)+
 labs(x="Reportable preparation",y="Caffeine in supplied drink (mg/L)",
 subtitle="Error bars: supplied standard uncertainty of final estimate, scaled by dilution only")+course_theme())
export_unit("defending-results",result_tables,plots)
