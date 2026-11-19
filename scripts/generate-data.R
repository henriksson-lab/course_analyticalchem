# Run from the project root. All data are simulated; seed fixes the example.
set.seed(207)
standards <- expand.grid(standard_mg_l = c(0, 0.5, 1, 2, 3, 4), replicate = 1:3)
standards <- standards[order(standards$standard_mg_l, standards$replicate), ]
standards$standard_id <- sprintf("S%02d", seq_len(nrow(standards)))
standards$absorbance <- round(0.006 + 0.198 * standards$standard_mg_l +
                              rnorm(nrow(standards), 0, 0.002), 5)
write.csv(standards, "data/standards.csv", row.names = FALSE)
preparations <- data.frame(
  preparation_id = c("P01", "P02", "P03", "P04", "P05"),
  sample_id = c("W1", "W1", "W2", "W2", "W3"),
  block = c("A", "A", "A", "A", "B"),
  aliquot_ml = c(10, 10, 10, 5, 10), final_ml = 50,
  u_aliquot_ml = c(0.012, 0.012, 0.012, 0.008, 0.012),
  u_final_ml = 0.03,
  note = c("first preparation", "independent preparation of W1",
           "initial out-of-range preparation", "new preparation of W2",
           "later measurement block"))
write.csv(preparations, "data/preparations.csv", row.names = FALSE)
final_true <- c(2.4, 2.412, 5.4, 2.7, 1.8)
readings <- data.frame(preparation_id = rep(preparations$preparation_id, each=3),
                       reading_id = rep(1:3, 5),
                       absorbance = round(0.006 + 0.198 * rep(final_true, each=3) *
                         rep(c(1,1,1,1,0.85), each=3) + rnorm(15,0,0.002),5))
# Deliberately reverse preparation order: row-order matching must fail visibly.
write.csv(preparations[5:1, ], "data/preparations.csv", row.names = FALSE)
write.csv(readings, "data/readings.csv", row.names = FALSE)
qc <- data.frame(block=rep(c("A","B"), each=3), reading_id=rep(1:3,2),
                 reference_mg_l=2,
                 absorbance=round(0.006+0.198*rep(c(2,1.7),each=3)+rnorm(6,0,0.002),5))
write.csv(qc, "data/qc.csv", row.names=FALSE)
wavelength <- seq(400,700,by=5)
spectra <- expand.grid(wavelength_nm=wavelength, trace=c("reagent_blank","iron_standard"))
spectra$absorbance <- round(ifelse(spectra$trace=="iron_standard",
                 0.006+0.396*exp(-0.5*((spectra$wavelength_nm-510)/37)^2),0.006)+
                 rnorm(nrow(spectra),0,0.0008),5)
write.csv(spectra, "data/spectra.csv", row.names=FALSE)
