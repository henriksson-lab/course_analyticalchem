# Numerical checks for the central analytical decisions and uncertainty helper.
source("R/analyse-uv-visible.R")
stopifnot(abs(a - 0.003873883) < 1e-8,
          abs(b - 0.198799368) < 1e-8,
          identical(results$preparation_id, c("P01","P02","P03","P04","P05")),
          identical(results$reportable, c(TRUE,TRUE,FALSE,TRUE,FALSE)),
          all(is.na(results$original_mg_l[!results$reportable])),
          abs(results$original_mg_l[results$preparation_id=="P04"]-26.9988844)<1e-6,
          all(qc_summary$qc_pass == c(TRUE,FALSE)))
# Independent propagation through coefficient covariance using finite differences.
y <- readings$absorbance[readings$preparation_id=="P01"]
parameters <- c(a,b,mean(y))
f <- function(p) (p[3]-p[1])/p[2]
h <- 1e-6
gradient <- vapply(1:3,function(j) {
  hi <- lo <- parameters; hi[j] <- hi[j]+h; lo[j] <- lo[j]-h
  (f(hi)-f(lo))/(2*h)
}, numeric(1))
V <- matrix(0,3,3); V[1:2,1:2] <- vcov(fit)
V[3,3] <- sigma(fit)^2/length(y)
u_independent <- sqrt(drop(t(gradient) %*% V %*% gradient))
ans <- inverse_calibration(fit,y)
stopifnot(abs(u_independent-ans$u_cal_mg_l)<1e-10)
# Numerically invert prediction-band limits for the mean of m new responses.
# This checks that the reported approximation is appropriate for this example.
x <- standards$standard_mg_l
band <- function(z) qt(.975,df.residual(fit))*sigma(fit)*sqrt(
  1/length(y)+1/length(x)+(z-mean(x))^2/sum((x-mean(x))^2))
lo <- uniroot(function(z) a+b*z+band(z)-mean(y), c(0,4),tol=1e-12)$root
hi <- uniroot(function(z) a+b*z-band(z)-mean(y), c(0,4),tol=1e-12)$root
stopifnot(max(abs(c(lo,hi)-c(ans$lower_95_mg_l,ans$upper_95_mg_l)))<1e-4)
# Matching by ID must survive a changed preparation-table order.
shuffled <- summary_readings |> left_join(preparations[rev(seq_len(nrow(preparations))),],
                                         by="preparation_id")
stopifnot(identical(shuffled$aliquot_ml,results$aliquot_ml),
          abs((.4-a)/b*25-49.81481079)<1e-5)
cat("PASS: reporting guards, dilution factors, ID joins and inverse uncertainty\n")
cat(sprintf("P01 approximate interval %.7f–%.7f; band inversion %.7f–%.7f\n",
            ans$lower_95_mg_l,ans$upper_95_mg_l,lo,hi))
