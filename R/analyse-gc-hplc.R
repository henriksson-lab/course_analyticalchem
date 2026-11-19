source("R/course-tools.R")
standards<-course_read("hplc-standards") |> mutate(area_ratio=caffeine_area/internal_standard_area)
fit_external<-lm(caffeine_area~caffeine_mg_l,standards)
fit_ratio<-lm(area_ratio~caffeine_mg_l,standards)
injections<-course_read("hplc-injections") |> mutate(area_ratio=caffeine_area/internal_standard_area,
 final_external_mg_l=(caffeine_area-coef(fit_external)[1])/coef(fit_external)[2],
 final_ratio_mg_l=(area_ratio-coef(fit_ratio)[1])/coef(fit_ratio)[2],
 in_range=final_ratio_mg_l>=0 & final_ratio_mg_l<=40,
 reportable=resolved & qc_pass & in_range,
 original_mg_l=if_else(reportable,final_ratio_mg_l*dilution_factor,NA_real_))
gradient<-course_read("hplc-gradient")
comparison<-bind_rows(injections |> filter(preparation_id=="D1") |> transmute(injection_id,
 method="External area",final_mg_l=final_external_mg_l),
 injections |> filter(preparation_id=="D1") |> transmute(injection_id,method="Area ratio",final_mg_l=final_ratio_mg_l))
result_tables<-list(standards=standards,injections=injections)
plots<-list(external=ggplot(standards,aes(caffeine_mg_l,caffeine_area))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=coef(fit_external)[1],slope=coef(fit_external)[2])+
 labs(x="Caffeine in final solution (mg/L)",y="Integrated caffeine peak area (arbitrary units)")+course_theme(),
 ratio=ggplot(standards,aes(caffeine_mg_l,area_ratio))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=coef(fit_ratio)[1],slope=coef(fit_ratio)[2])+
 labs(x="Caffeine in final solution (mg/L)",y="Caffeine / internal-standard area",subtitle="Internal-standard concentration fixed at 10 mg/L")+course_theme(),
 injections=ggplot(comparison,aes(injection_id,final_mg_l,colour=method,group=method))+
 geom_point(size=3)+geom_line()+labs(x="Repeated injection of preparation D1",y="Estimated final caffeine (mg/L)",colour=NULL)+course_theme(),
 gradient=ggplot(gradient,aes(time_min,organic_percent))+geom_line(colour="#087b85",linewidth=1)+
 labs(x="Time (min)",y="Organic modifier (%)",subtitle="Illustrative reversed-phase HPLC program including re-equilibration")+course_theme())
export_unit("gc-hplc",result_tables,plots)
