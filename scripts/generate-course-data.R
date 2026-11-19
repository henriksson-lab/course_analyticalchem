# Deterministic simulated teaching data. Run from project root.
# These are not environmental observations, validated protocols or reference spectra.
set.seed(202711)
write_data <- function(name, x) write.csv(x, file.path("data/course", paste0(name,".csv")), row.names=FALSE)
write_data("water", data.frame(sample_id=paste0("W",1:8), location=rep(c("inlet","outlet"),each=4),
 collected_l=0.25, chloride_mg_l=c(18,20,19,21,12,13,11,14)))
write_data("sampling", expand.grid(position=c("top","middle","bottom"), grab=1:4) |>
 transform(iron_mg_kg=c(8.1,14.1,25.2,7.9,13.8,24.8,8.2,14.2,25.1,7.8,13.9,24.9)))
write_data("extractions",data.frame(preparation_id=c("T1a","T1b","T2a"),sample_id=c("T1","T1","T2"),
 mass_g=c(.5,.5,.4),extract_ml=25,aliquot_ml=2,final_ml=10,
 final_caffeine_mg_l=c(1.92,1.96,2.4)))
write_data("precision",data.frame(method=rep(c("A","B","C"),each=5),
 repeat_id=rep(1:5,3),reference_mg_l=10,
 measured_mg_l=c(9.98,10.01,10,9.99,10.02,10.48,10.51,10.5,10.49,10.52,9.6,10.4,9.8,10.2,10)))
write_data("blank-signals",data.frame(blank_id=paste0("B",1:12),
 signal=c(.009,.011,.010,.012,.008,.010,.011,.009,.010,.012,.008,.010)))
write_data("nonlinear-calibration", data.frame(c_mg_l=rep(0:8,each=2),
 response=rep(.01+.2*(0:8)-.009*(0:8)^2,each=2)+rnorm(18,0,.002)))
# Exact ideal strong-acid/strong-base equilibrium via charge balance, Kw=1e-14.
v <- sort(unique(c(seq(0,40,by=1),seq(23,27,by=.25))))
q <- (.1*.025-.1*v/1000)/(.025+v/1000)
h <- ifelse(q>=0,(q+sqrt(q^2+4e-14))/2,2e-14/(sqrt(q^2+4e-14)-q))
write_data("acid-titration", data.frame(volume_ml=v,ph=-log10(h)))
write_data("edta",data.frame(preparation_id=c("H1a","H1b","H2a"),sample_id=c("H1","H1","H2"),
 sample_ml=50,initial_burette_ml=c(.1,.2,.1),final_burette_ml=c(6.3,6.45,9.7),
 blank_ml=.05,edta_mol_l=.01))
write_data("electrode-standards",data.frame(standard_id=paste0("F",1:5),
 fluoride_mol_l=10^seq(-5,-3,by=.5),potential_mv=c(198.0,168.7,138.9,109.4,79.9)))
write_data("electrode-checks",data.frame(block=c("early","late"),check_fluoride_mol_l=1e-4,
 potential_mv=c(139.1,145.0),allowed_abs_error_mv=2))
# Standard addition: equal 10 mL sample aliquots; all made to 25 mL.
# Matrix sensitivity=.15 versus external=.20 response per mg/L; sample=5 mg/L original.
added <- c(0,.5,1,1.5,2)
write_data("standard-addition",data.frame(flask_id=paste0("SA",1:5),sample_ml=10,final_ml=25,
 spike_mg_l_final=added,blank_corrected_signal=.15*(2+added)+c(.001,-.001,0,.001,-.001)))
write_data("external-matrix",data.frame(c_mg_l=0:4,blank_corrected_signal=.2*(0:4)+c(0,.001,-.001,.001,-.001)))
write_data("spike-recovery",data.frame(preparation_id=c("unspiked","spiked"),
 final_volume_ml=25,sample_volume_ml=10,added_mg_l_final=c(0,1),
 externally_estimated_mg_l_final=c(1.5,2.25)))
write_data("atomic-standards",data.frame(copper_mg_l=c(0,.1,.25,.5,1,2),
 emission_counts=c(8,109,257,509,1007,2009)))
write_data("atomic-digests",data.frame(preparation_id=c("A1","A2","PB"),sample_id=c("leaf1","leaf2","method_blank"),
 dry_mass_g=c(.25,.2,NA),digest_ml=50,further_dilution=c(2,2,1),
 emission_counts=c(410,610,10)))
write_data("atomic-qc",data.frame(check_id=c("check1","check2"),reference_mg_l=c(.5,.5),
 emission_counts=c(510,512),recovery_lower=95,recovery_upper=105))
wl <- seq(324.65,324.85,by=.0005)
write_data("atomic-lines",data.frame(wavelength_nm=rep(wl,2),trace=rep(c("target_only","target_plus_interferent"),each=length(wl)),
 counts=c(10+1000*exp(-.5*((wl-324.754)/.005)^2),
 10+1000*exp(-.5*((wl-324.754)/.005)^2)+650*exp(-.5*((wl-324.772)/.004)^2))))
peaks <- data.frame(run=rep(c("resolved","overlap","broad"),each=2),compound=rep(c("A","B"),3),
 t0_min=1,t_r_min=c(3,4,3,3.3,3,4),baseline_width_min=c(.4,.5,.4,.5,1,1.2),
 area=c(100,150,100,150,100,150))
write_data("peak-summary",peaks)
t <- seq(0,7,by=.01)
chrom <- do.call(rbind,lapply(unique(peaks$run),function(run) {
 p<-peaks[peaks$run==run,];sig<-p$baseline_width_min/4
 response<-5+p$area[1]/(sig[1]*sqrt(2*pi))*exp(-.5*((t-p$t_r_min[1])/sig[1])^2)+
 p$area[2]/(sig[2]*sqrt(2*pi))*exp(-.5*((t-p$t_r_min[2])/sig[2])^2)
 data.frame(run=run,time_min=t,response=response)
}))
write_data("chromatograms",chrom)
write_data("hplc-standards",data.frame(caffeine_mg_l=c(0,5,10,20,40),
 caffeine_area=c(3,253,503,1003,2003),internal_standard_area=500,
 internal_standard_mg_l=10))
write_data("hplc-injections",data.frame(injection_id=c("I1","I2","I3","I4"),
 preparation_id=c("D1","D1","D2","D3"),caffeine_area=c(753,603,1003,1503),
 internal_standard_area=c(500,400,500,500),internal_standard_mg_l=10,
 resolved=c(TRUE,TRUE,FALSE,TRUE),qc_pass=c(TRUE,TRUE,TRUE,FALSE),dilution_factor=10))
write_data("hplc-gradient",data.frame(time_min=c(0,2,6,8,9,12),organic_percent=c(10,10,70,70,10,10)))
# Final case: independent new calibration, raw responses and preparation metadata.
write_data("case-standards",data.frame(caffeine_mg_l=c(0,5,10,20,30),
 area=c(4,204,404,804,1204)))
write_data("case-samples",data.frame(preparation_id=c("C1","C2","C3","C4"),
 sample_id=c("drink_A","drink_B","drink_B","drink_C"),aliquot_ml=c(5,5,2,5),final_ml=50,
 area=c(604,1604,644,484),resolved=c(TRUE,TRUE,TRUE,FALSE),qc_pass=TRUE,
 u_final_concentration_mg_l=c(.15,.4,.16,.12)))
write_data("case-qc",data.frame(reference_mg_l=15,area=608,acceptance_low=95,acceptance_high=105))
write_data("method-comparison",data.frame(sample_id=c("M1","M2","M3","M4","M5","M6"),
 reference_mg_l=c(50,80,100,150,200,250),hplc_mg_l=c(51,81,101,152,202,253),
 nonspecific_uv_mg_l=c(63,98,120,179,237,295)))
write_data("mass-spectrum",data.frame(mz=c(55,82,109,138,195),relative_intensity=c(12,25,35,100,78)))
cat("Generated",length(list.files("data/course",pattern="csv$")),"simulated datasets\n")
