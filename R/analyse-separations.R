source("R/course-tools.R")
peaks<-course_read("peak-summary") |> mutate(k=(t_r_min-t0_min)/t0_min)
resolution<-peaks |> group_by(run) |> summarise(t0_min=first(t0_min),
 k_A=k[compound=="A"],k_B=k[compound=="B"],alpha=k_B/k_A,
 resolution=2*(t_r_min[compound=="B"]-t_r_min[compound=="A"])/sum(baseline_width_min),.groups="drop")
chrom<-course_read("chromatograms")
u<-seq(.2,5,length.out=100)
van_deemter<-data.frame(relative_velocity=u,relative_plate_height=1+.8/u+.35*u)
result_tables<-list(peaks=peaks,resolution=resolution)
plots<-list(resolved=ggplot(chrom |> filter(run=="resolved"),aes(time_min,response))+
 geom_line(colour="#087b85",linewidth=.9)+geom_vline(xintercept=1,linetype=2)+
 labs(x="Time (min)",y="Detector response (arbitrary units)",subtitle="Dashed: unretained marker t₀; peak areas A=100, B=150")+course_theme(),
 overlap=ggplot(chrom |> filter(run%in%c("resolved","overlap")),aes(time_min,response,colour=run))+
 geom_line(linewidth=.9)+labs(x="Time (min)",y="Detector response",colour=NULL,
 subtitle="Same component areas; changed separation can obscure quantification")+course_theme(),
 broad=ggplot(chrom |> filter(run%in%c("resolved","broad")),aes(time_min,response,colour=run))+
 geom_line(linewidth=.9)+labs(x="Time (min)",y="Detector response",colour=NULL,
 subtitle="Broader peaks can overlap even at unchanged retention times")+course_theme(),
 velocity=ggplot(van_deemter,aes(relative_velocity,relative_plate_height))+
 geom_line(colour="#087b85",linewidth=1)+labs(x="Relative mobile-phase velocity",y="Relative plate height",
 subtitle="Illustrative H=A+B/u+Cu model; values are dimensionless")+course_theme())
export_unit("separations",result_tables,plots)
