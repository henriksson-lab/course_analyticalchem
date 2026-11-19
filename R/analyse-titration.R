source("R/course-tools.R")
curve <- course_read("acid-titration")
slopes <- data.frame(midpoint_ml=(head(curve$volume_ml,-1)+tail(curve$volume_ml,-1))/2,
 ph_per_ml=diff(curve$ph)/diff(curve$volume_ml))
endpoint_ml <- 25.00 # Supplied endpoint estimate; slope plot is an exploratory check.
acid_mol_l <- .1000*endpoint_ml/25.00
hardness <- course_read("edta") |> mutate(delivered_ml=final_burette_ml-initial_burette_ml,
 corrected_ml=delivered_ml-blank_ml,moles_metal=edta_mol_l*corrected_ml/1000,
 hardness_mg_l_CaCO3=moles_metal*100.09*1000/(sample_ml/1000))
# Additional weak-acid model, pKa=4.76, same initial amount and titrant.
weak_ph <- vapply(curve$volume_ml,function(v) {
 total=.025+v/1000;Ct=.0025/total;Na=.1*v/1000/total;Ka=10^(-4.76)
 logH<-uniroot(function(logH) {H<-10^logH;H+Na-1e-14/H-Ct*Ka/(Ka+H)},c(-14,0),tol=1e-10)$root
 -logH
},numeric(1))
comparison <- bind_rows(data.frame(volume_ml=curve$volume_ml,ph=curve$ph,acid="Strong acid"),
 data.frame(volume_ml=curve$volume_ml,ph=weak_ph,acid="Weak acid, pKa=4.76"))
result_tables <- list(hardness=hardness,acid=data.frame(endpoint_ml=endpoint_ml,acid_mol_l=acid_mol_l),slopes=slopes)
plots <- list(curve=ggplot(curve,aes(volume_ml,ph))+geom_line(colour="#087b85",linewidth=1)+
 geom_vline(xintercept=25,linetype=2)+labs(x="0.1000 mol/L base added (mL)",y="pH",subtitle="25.00 mL of ideal 0.1000 mol/L strong acid, 25 °C")+course_theme(),
 derivative=ggplot(slopes,aes(midpoint_ml,ph_per_ml))+geom_line(colour="#087b85")+
 labs(x="Midpoint of addition interval (mL)",y="Finite-difference slope (pH per mL)")+course_theme(),
 comparison=ggplot(comparison,aes(volume_ml,ph,colour=acid))+geom_line(linewidth=1)+
 geom_vline(xintercept=25,linetype=2)+labs(x="Base added (mL)",y="pH",colour=NULL,
 subtitle="Same equivalence volume; different pH and indicator requirements")+course_theme(),
 hardness=ggplot(hardness,aes(preparation_id,hardness_mg_l_CaCO3))+geom_point(size=4,colour="#087b85")+
 labs(x="Preparation",y="Hardness (mg/L as CaCO₃)",subtitle="Operational Ca/Mg EDTA result under the stated assumptions")+course_theme())
export_unit("titration",result_tables,plots)
