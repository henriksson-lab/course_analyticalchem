# Instructor-supplied helper, restricted to an unweighted straight-line model.
# Delta-method standard uncertainty of concentration inferred from m readings.
# See instructor/uv-visible.md for derivation, assumptions and checks.
inverse_calibration <- function(fit, readings) {
  stopifnot(inherits(fit, "lm"), length(coef(fit)) == 2L,
            length(readings) > 0L, all(is.finite(readings)),
            is.null(fit$weights))
  x <- model.frame(fit)[[2]]
  n <- length(x)
  m <- length(readings)
  a <- unname(coef(fit)[1])
  b <- unname(coef(fit)[2])
  stopifnot(n > 2L, is.finite(b), b > 0, sum((x - mean(x))^2) > 0)
  x_hat <- (mean(readings) - a) / b
  u <- sigma(fit) / abs(b) * sqrt(
    1/m + 1/n + (x_hat - mean(x))^2 / sum((x - mean(x))^2))
  half_width <- qt(0.975, df.residual(fit)) * u
  data.frame(final_mg_l = x_hat, u_cal_mg_l = u,
             lower_95_mg_l = x_hat - half_width,
             upper_95_mg_l = x_hat + half_width)
}
