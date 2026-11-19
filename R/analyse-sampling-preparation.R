source("R/course-tools.R")
sampling <- course_read("sampling")
extracts <- course_read("extractions") |> mutate(extract_mg_l=final_caffeine_mg_l*final_ml/aliquot_ml,
 extracted_mg=extract_mg_l*extract_ml/1000,caffeine_mg_g=extracted_mg/mass_g)
sampling_summary <- sampling |> group_by(position) |> summarise(mean_mg_kg=mean(iron_mg_kg),.groups="drop")
# Equal stratum masses are supplied in this exercise.
equal_mass_mean <- mean(sampling_summary$mean_mg_kg)
extraction <- data.frame(strategy=c("One 10 mL extraction","Two 5 mL extractions"),
 fraction_recovered=c(1-20/(20+9*10),1-(20/(20+9*5))^2))
result_tables <- list(extracts=extracts,sampling=sampling_summary,extraction=extraction)
plots <- list(heterogeneity=ggplot(sampling,aes(factor(position,levels=c("top","middle","bottom")),iron_mg_kg))+
 geom_point(size=3,colour="#087b85",position=position_jitter(width=.06,height=0,seed=8))+
 geom_hline(yintercept=equal_mass_mean,linetype=2)+labs(x="Position in equal-mass strata",y="Iron (mg/kg)",
 subtitle="Dashed line: equal-mass overall mean; top-only grabs are biased")+course_theme(),
 caffeine=ggplot(extracts,aes(preparation_id,caffeine_mg_g))+geom_point(size=4,colour="#c35420")+
 labs(x="Independent preparation",y="Extracted caffeine (mg/g of supplied material)")+course_theme(),
 recovery=ggplot(extraction,aes(strategy,100*fraction_recovered))+geom_col(fill="#087b85",width=.5)+
 coord_cartesian(ylim=c(0,100))+labs(x=NULL,y="Ideal recovery (%)",subtitle="D=9; 20 mL aqueous phase; 10 mL total extracting solvent")+course_theme())
export_unit("sampling-preparation",result_tables,plots)
