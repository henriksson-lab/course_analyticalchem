# Run from the project root; also sourced by the worked report.
library(readr)
library(dplyr)
library(ggplot2)
source("R/inverse-calibration.R")
standards <- read_csv("data/standards.csv", show_col_types=FALSE)
readings <- read_csv("data/readings.csv", show_col_types=FALSE)
preparations <- read_csv("data/preparations.csv", show_col_types=FALSE)
qc <- read_csv("data/qc.csv", show_col_types=FALSE)
spectra <- read_csv("data/spectra.csv", show_col_types=FALSE)
stopifnot(!anyDuplicated(preparations$preparation_id),
          all(readings$preparation_id %in% preparations$preparation_id))
fit <- lm(absorbance ~ standard_mg_l, data=standards)
a <- unname(coef(fit)[1]); b <- unname(coef(fit)[2])
standards <- standards |> mutate(residual=residuals(fit))
# Range is defined by the fitted responses at the stated concentration limits.
response_limits <- predict(fit, newdata=data.frame(standard_mg_l=c(0,4)))
qc_summary <- qc |> group_by(block) |>
  summarise(mean_absorbance=mean(absorbance), reference_mg_l=first(reference_mg_l),
            .groups="drop") |>
  mutate(estimated_mg_l=(mean_absorbance-a)/b,
         recovery_percent=100*estimated_mg_l/reference_mg_l,
         qc_pass=recovery_percent>=95 & recovery_percent<=105)
summary_readings <- readings |> group_by(preparation_id) |>
  summarise(m=n(), mean_absorbance=mean(absorbance), sd_absorbance=sd(absorbance),
            all_readings_in_range=all(absorbance>=response_limits[1] &
                                      absorbance<=response_limits[2]), .groups="drop")
# Calculate uncertainty separately for each preparation: do not treat aliquots
# sharing a calibration as independent calibrations or population samples.
uncertainty <- bind_rows(lapply(split(readings, readings$preparation_id), function(d) {
  ans <- inverse_calibration(fit, d$absorbance)
  ans$preparation_id <- d$preparation_id[1]
  ans
}))
results <- summary_readings |> left_join(preparations, by="preparation_id") |>
  left_join(qc_summary |> select(block, qc_pass), by="block") |>
  left_join(uncertainty, by="preparation_id") |>
  mutate(dilution_factor=final_ml/aliquot_ml,
         status=case_when(!qc_pass ~ "withhold: QC failed",
                          !all_readings_in_range ~ "remeasure: outside range",
                          TRUE ~ "reportable under stated assumptions"),
         reportable=qc_pass & all_readings_in_range,
         # Guard results before exporting: unsupported inverse values are not results.
         final_mg_l=if_else(reportable, final_mg_l, NA_real_),
         u_cal_mg_l=if_else(reportable, u_cal_mg_l, NA_real_),
         lower_95_mg_l=if_else(reportable, lower_95_mg_l, NA_real_),
         upper_95_mg_l=if_else(reportable, upper_95_mg_l, NA_real_),
         original_mg_l=final_mg_l*dilution_factor,
         u_original_mg_l=sqrt((dilution_factor*u_cal_mg_l)^2 +
           (original_mg_l*u_final_ml/final_ml)^2 +
           (original_mg_l*u_aliquot_ml/aliquot_ml)^2))
dir.create("output", showWarnings=FALSE)
write_csv(results, "output/concentrations.csv", na="NA")
write_csv(qc_summary, "output/qc-summary.csv")
calibration_plot <- ggplot(standards, aes(standard_mg_l,absorbance)) +
  geom_abline(intercept=a,slope=b,colour="#087b85",linewidth=0.8) +
  geom_point(size=2.5,colour="#123e52") +
  labs(x="Iron in final solution (mg Fe/L)",y="Absorbance at 510 nm",
       subtitle="Simulated standards; line fitted with an intercept") + theme_minimal(base_size=15)
residual_plot <- ggplot(standards,aes(standard_mg_l,residual)) +
  geom_hline(yintercept=0,linetype=2,colour="#65717a") + geom_point(size=2.5,colour="#087b85") +
  labs(x="Iron in final solution (mg Fe/L)",y="Observed minus fitted absorbance",
       subtitle="Small residuals do not validate the sample matrix") + theme_minimal(base_size=15)
spectrum_plot <- ggplot(spectra,aes(wavelength_nm,absorbance,colour=trace)) +
  geom_line(linewidth=1) + geom_vline(xintercept=510,linetype=2,colour="#65717a") +
  scale_colour_manual(values=c(iron_standard="#c35420",reagent_blank="#087b85"),
     labels=c(iron_standard="Iron standard",reagent_blank="Reagent blank")) +
  labs(x="Wavelength (nm)",y="Absorbance",colour=NULL,
       subtitle="Simulated spectral shape; not a reference spectrum") +
  theme_minimal(base_size=15) + theme(legend.position="bottom")
qc_plot <- ggplot(qc_summary,aes(block,recovery_percent)) +
  annotate("rect",xmin=-Inf,xmax=Inf,ymin=95,ymax=105,fill="#087b85",alpha=0.12) +
  geom_hline(yintercept=100,linetype=2) + geom_point(size=4,colour="#c35420") +
  scale_y_continuous(limits=c(75,110)) +
  labs(x="Measurement block",y="QC recovery (%)",
       subtitle="Teaching acceptance window: 95–105%; independent check material") + theme_minimal(base_size=15)
range_plot <- calibration_plot +
  geom_point(data=results,aes(x=(mean_absorbance-a)/b,y=mean_absorbance),
             inherit.aes=FALSE,shape=4,size=3,colour="#c35420") +
  geom_text(data=results,aes(x=(mean_absorbance-a)/b,y=mean_absorbance,label=preparation_id),
            inherit.aes=FALSE,nudge_y=0.035,size=4) +
  labs(subtitle="Crosses locate measured signals; P03 requires a new dilution")
uncertainty_parts <- data.frame(component=c("Calibration and readings","Final volume","Aliquot volume"),
 u_mg_l=c(results$u_cal_mg_l[results$preparation_id=="P01"]*5,
          results$original_mg_l[results$preparation_id=="P01"]*0.03/50,
          results$original_mg_l[results$preparation_id=="P01"]*0.012/10))
uncertainty_plot <- ggplot(uncertainty_parts,aes(u_mg_l,reorder(component,u_mg_l))) +
  geom_col(fill="#087b85",width=0.55) +
  labs(x="Standard uncertainty contribution (mg Fe/L in original water)",y=NULL,
       subtitle="P01: illustrative budget; recovery bias and sampling are excluded") + theme_minimal(base_size=14)
for (name in c("calibration","residual","spectrum","qc","range","uncertainty")) {
  ggsave(file.path("assets",paste0(name,".svg")),get(paste0(name,"_plot")),
         device=grDevices::svg,width=8.8,height=4.6)
}
print(coef(fit))
print(results |> select(preparation_id,sample_id,original_mg_l,u_original_mg_l,status))
print(qc_summary)
