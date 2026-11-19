source("R/course-tools.R")
water <- course_read("water")
summary_water <- water |> group_by(location) |>
 summarise(n_samples=n(),mean_mg_l=mean(chloride_mg_l),sd_mg_l=sd(chloride_mg_l),.groups="drop")
water <- water |> mutate(chloride_g_l=chloride_mg_l/1000,chloride_mg=chloride_mg_l*collected_l)
result_tables <- list(water=water,summary=summary_water)
plots <- list(observations=ggplot(water,aes(location,chloride_mg_l,label=sample_id))+
 geom_point(size=3,colour="#087b85",position=position_jitter(width=.08,height=0,seed=7))+
 labs(x="Sampling location",y="Chloride (mg/L)",subtitle="One independently collected water sample per point")+course_theme(),
 amount=ggplot(water,aes(sample_id,chloride_mg))+geom_col(fill="#087b85")+
 labs(x="Collected sample",y="Chloride amount in 0.250 L (mg)")+course_theme())
export_unit("sample-answer",result_tables,plots)
