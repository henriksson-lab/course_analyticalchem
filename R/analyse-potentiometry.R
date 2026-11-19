source("R/course-tools.R")
standards <- course_read("electrode-standards") |> mutate(log_c=log10(fluoride_mol_l))
fit <- lm(potential_mv~log_c,standards)
a<-unname(coef(fit)[1]);b<-unname(coef(fit)[2])
checks<-course_read("electrode-checks") |> mutate(expected_mv=a+b*log10(check_fluoride_mol_l),
 error_mv=potential_mv-expected_mv,check_pass=abs(error_mv)<=allowed_abs_error_mv)
unknown<-data.frame(block=c("early","late"),potential_mv=c(121.2,127.2)) |>
 left_join(checks |> select(block,check_pass),by="block") |>
 mutate(fluoride_mol_l=if_else(check_pass,10^((potential_mv-a)/b),NA_real_))
ph <- data.frame(ph=seq(2,12,length.out=101)) |> mutate(potential_mv=414.16-59.16*ph)
result_tables<-list(coefficients=data.frame(intercept_mv=a,slope_mv_per_decade=b),checks=checks,unknown=unknown)
plots<-list(calibration=ggplot(standards,aes(log_c,potential_mv))+geom_point(size=3,colour="#087b85")+
 geom_abline(intercept=a,slope=b)+labs(x="log₁₀[c / (1 mol/L)]",y="Electrode potential (mV)",
 subtitle="Fluoride ISE, 25 °C; matched ionic-strength conditions assumed")+course_theme(),
 linear_axis=ggplot(standards,aes(fluoride_mol_l,potential_mv))+geom_point(size=3,colour="#087b85")+
 geom_line()+labs(x="Fluoride concentration (mol/L)",y="Electrode potential (mV)",subtitle="The same measurements on an untransformed concentration axis")+course_theme(),
 drift=ggplot(checks,aes(block,error_mv))+geom_hline(yintercept=c(-2,2),linetype=2)+geom_point(size=4,colour="#c35420")+
 labs(x="Measurement block",y="Check error (mV)",subtitle="Exercise tolerance: ±2 mV; late-block result withheld")+course_theme(),
 ph=ggplot(ph,aes(ph,potential_mv))+geom_line(colour="#087b85",linewidth=1)+
 labs(x="pH = −log₁₀ a(H⁺)",y="Illustrative potential (mV)",subtitle="Ideal response at 25 °C; intercept depends on the cell")+course_theme())
export_unit("potentiometry",result_tables,plots)
