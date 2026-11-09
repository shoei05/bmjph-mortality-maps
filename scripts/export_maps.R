#!/usr/bin/env Rscript
# Export S1-S35 map values for the web app, following
# analysis/scripts/create_online_supplemental_figures.R.
# RIJ scores are NOT exported. Values are exported as colour classes only.
suppressPackageStartupMessages({
  library(dplyr); library(readr); library(stringr); library(purrr); library(sf); library(jsonlite)
})
args <- commandArgs(trailingOnly = TRUE)
root <- args[[1]]; out <- args[[2]]
dir.create(out, recursive = TRUE, showWarnings = FALSE)

src <- readLines(file.path(root, "analysis/scripts/create_online_supplemental_figures.R"))
# reuse helper definitions (lines up to read_geometry/load/compute/aggregate) by sourcing selected functions
grab <- function(name) {
  s <- grep(paste0("^", name, " <- "), src)
  e <- s; depth <- 0; started <- FALSE
  for (i in s:length(src)) {
    depth <- depth + str_count(src[i], "[\\{\\(]") - str_count(src[i], "[\\}\\)]")
    if (str_detect(src[i], "[\\{\\(]")) started <- TRUE
    if (started && depth <= 0) { e <- i; break }
  }
  eval(parse(text = src[s:e]), envir = globalenv())
}
for (f in c("normalize_code5", "recode_nakagawa", "display_code", "weighted_mean_or_na", "cause_lookup",
            "sex_lookup", "shift_prefecture", "find_pref_col", "load_bym_residual",
            "compute_rij_residuals", "make_metric_limits")) grab(f)
# Same as the paper's aggregate_for_display, but weights use each original row's e
# (in the paper's version e is summed first, so merged cities 14150/33100/43100 became NA).
aggregate_for_display <- function(df) {
  df |>
    mutate(display_code5 = display_code(code5)) |>
    group_by(code_se, cause_en, sex_en, model_suffix, display_code5) |>
    summarise(
      code5 = display_code5[[1]],
      smr_eb = weighted_mean_or_na(smr_eb, pmax(e, 0)),
      rij_residual_rr = weighted_mean_or_na(rij_residual_rr, pmax(e, 0)),
      bym2_residual_rr = weighted_mean_or_na(bym2_residual_rr, pmax(e, 0)),
      e = sum(e, na.rm = TRUE),
      .groups = "drop"
    )
}

model_dir <- file.path(root, "analysis/output/model_results_bym2_corrected")
dat <- read_csv(file.path(root, "analysis/output/preprocessed/data2_corrected_deaths.csv"), show_col_types = FALSE) |>
  mutate(code5 = recode_nakagawa(normalize_code5(code5)), sex_en = factor(sex_en, levels = sex_lookup$sex_en)) |>
  left_join(cause_lookup, by = "code_se") |>
  left_join(sex_lookup, by = "sex_en") |>
  filter(!is.na(cause_en), !is.na(model_suffix))

nb <- readRDS(file.path(root, "analysis/spatial_neighbors.rds"))
adjacency_order <- recode_nakagawa(normalize_code5(nb$code5))
bym <- map_dfr(cause_lookup$code_se, function(code) map_dfr(sex_lookup$model_suffix, function(s) load_bym_residual(code, s, adjacency_order))) |>
  left_join(sex_lookup, by = "model_suffix") |>
  select(code_se, sex_en, code5, bym2_residual_rr)

dat_fig <- dat |>
  left_join(bym, by = c("code_se", "sex_en", "code5")) |>
  group_by(code_se, sex_en) |>
  group_modify(~ compute_rij_residuals(.x)) |>
  ungroup() |>
  aggregate_for_display()

limits <- list(
  smr = make_metric_limits(dat_fig$smr_eb, fallback = c(70, 130), probs = c(0.03, 0.97)),
  rij = make_metric_limits(dat_fig$rij_residual_rr, fallback = c(0.75, 1.35), probs = c(0.04, 0.96)),
  bym2 = make_metric_limits(dat_fig$bym2_residual_rr, fallback = c(0.75, 1.35), probs = c(0.04, 0.96))
)
# use the colour limits of the published figures (QA file, 2026-05-17 run)
limits <- list(smr = c(60.70671, 149.39866), rij = c(0.6998803, 1.4685350), bym2 = c(0.7094157, 1.4583900))
print(limits)

sf_use_s2(FALSE)
# geometry (same shift as the paper's figures)
# The paper's geom_2018s_plot.geojson lacks 113 small municipalities, so use
# MLIT N03 administrative boundaries (2021-01-01, via smartnews-smri/japan-topography).
muni <- st_read(args[[3]], quiet = TRUE) |> filter(!is.na(CODE5), CODE5 != "") |>
  mutate(code5 = display_code(recode_nakagawa(normalize_code5(CODE5)))) |>
  select(code5, pref, city)
# union only the wards of the three merged cities; keep other shapes as they are
merged <- muni |> filter(duplicated(code5) | duplicated(code5, fromLast = TRUE)) |>
  st_make_valid() |> group_by(code5) |> summarise(pref = first(pref), city = first(city), .groups = "drop")
muni <- bind_rows(muni |> filter(!code5 %in% merged$code5), merged) |> arrange(code5)
pref <- st_read(file.path(root, "data/geojson/pref_poly_2018s.geojson"), quiet = TRUE)
pc <- find_pref_col(pref)
muni <- muni |> shift_prefecture("pref", "沖縄県", c(10.5, 3)) |> shift_prefecture("pref", "北海道", c(-10.5, -4))
pref <- pref |> shift_prefecture(pc, "沖縄県", c(10.5, 3)) |> shift_prefecture(pc, "北海道", c(-10.5, -4))
# display names for merged codes
muni <- muni |> mutate(city = case_when(code5 == "14150" ~ "相模原市", code5 == "33100" ~ "岡山市",
                                         code5 == "43100" ~ "熊本市", TRUE ~ city))
st_write(muni |> select(code5, pref, city), file.path(out, "muni.geojson"), quiet = TRUE)
st_write(pref |> select(pref = all_of(pc)), file.path(out, "pref.geojson"), quiet = TRUE)

# classes: 10 equal-width classes between the paper's limits, plus below / above
NB <- 10
cls <- function(x, lim) {
  k <- floor((x - lim[1]) / diff(lim) * NB) + 1
  k[x < lim[1]] <- 0; k[x >= lim[2]] <- NB + 1
  k[!is.finite(x)] <- -1
  as.integer(k)
}
codes <- muni$code5
vals <- list()
for (cd in cause_lookup$code_se) for (sx in sex_lookup$sex_en) {
  d <- dat_fig |> filter(code_se == cd, sex_en == sx)
  m <- match(codes, d$code5)
  vals[[paste(cd, sx, sep = "_")]] <- list(
    smr = cls(d$smr_eb[m], limits$smr),
    rij = cls(d$rij_residual_rr[m], limits$rij),
    bym2 = cls(d$bym2_residual_rr[m], limits$bym2)
  )
}
meta <- list(
  codes = codes, nbins = NB,
  limits = lapply(limits, function(l) round(l, 3)),
  causes = cause_lookup, sexes = sex_lookup$sex_en
)
write_json(meta, file.path(out, "meta.json"), auto_unbox = TRUE, digits = NA)
write_json(vals, file.path(out, "values.json"), auto_unbox = FALSE)
cat("municipalities:", length(codes), " missing in data:", sum(!codes %in% dat_fig$code5), "\n")
cat("data codes missing geometry:", paste(setdiff(unique(dat_fig$code5), codes), collapse = ";"), "\n")
