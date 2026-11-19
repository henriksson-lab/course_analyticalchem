source("R/course-tools.R")
additions <- course_read("standard-addition")
external <- course_read("external-matrix")
fit_sa <- lm(blank_corrected_signal~spike_mg_l_final,additions)
fit_ext <- lm(blank_corrected_signal~c_mg_l,external)
a_sa<-unname(coef(fit_sa)[1]);b_sa<-unname(coef(fit_sa)[2])
x_intercept <- -a_sa/b_sa
original_mg_l <- -x_intercept*25/10
spikes<-course_read("spike-recovery")
spike_recovery_percent <- 100*diff(spikes$externally_estimated_mg_l_final)/diff(spikes$added_mg_l_final)
external_estimate <- (additions$blank_corrected_signal[1]-coef(fit_ext)[1])/coef(fit_ext)[2]*25/10
# Extrapolated line is displayed only for this fixed-volume standard-addition model.
line <- data.frame(spike_mg_l_final=seq(-2.3,2.2,length.out=100)) |>
 mutate(blank_corrected_signal=a_sa+b_sa*spike_mg_l_final)
slopes <- data.frame(calibration=c("External, simple solvent","Standard addition, sample matrix"),
 sensitivity=c(unname(coef(fit_ext)[2]),b_sa))
result_tables <- list(additions=additions,answers=data.frame(original_mg_l=original_mg_l,
 x_intercept_mg_l_final=x_intercept,external_estimate_mg_l=unname(external_estimate),
 spike_recovery_percent=spike_recovery_percent),slopes=slopes)
plots <- list(additions=ggplot(additions,aes(spike_mg_l_final,blank_corrected_signal))+
 geom_point(size=3,colour="#087b85")+geom_abline(intercept=a_sa,slope=b_sa)+
 labs(x="Added analyte in final flask (mg/L)",y="Blank-corrected signal",
 subtitle="Equal sample aliquots; all flasks made to the same total volume")+course_theme(),
 intercept=ggplot(line,aes(spike_mg_l_final,blank_corrected_signal))+geom_line(colour="#087b85")+
 geom_point(data=additions,size=3)+geom_hline(yintercept=0,linetype=2)+
 geom_vline(xintercept=x_intercept,linetype=2,colour="#c35420")+
 labs(x="Added analyte in final flask (mg/L)",y="Blank-corrected signal",
 subtitle="Negative intercept estimates native analyte under the stated additive model")+course_theme(),
 slopes=ggplot(slopes,aes(sensitivity,calibration))+geom_col(fill="#087b85",width=.5)+
 labs(x="Sensitivity (signal units per mg/L)",y=NULL,subtitle="The sample matrix suppresses sensitivity")+course_theme(),
 recovery=ggplot(spikes,aes(preparation_id,externally_estimated_mg_l_final))+geom_col(fill="#087b85",width=.5)+
 labs(x="Equal-final-volume preparation",y="External-calibration estimate (mg/L)",
 subtitle="Adding 1.00 mg/L increases the estimate by only 0.75 mg/L")+course_theme())
export_unit("matrix-recovery",result_tables,plots)
