# 死因別死亡の地図（BMJ Public Health 2026 補足図S1〜S35）

Koda M, Harada N, Nomura S, Tsugawa Y. Association of municipal rurality and area deprivation with cause-specific mortality in Japan: a nationwide ecological study. *BMJ Public Health* 2026;4:e004913. [doi:10.1136/bmjph-2026-004913](https://doi.org/10.1136/bmjph-2026-004913)

論文のオンライン補足図S1〜S35（35の死因 × 全体・男性・女性 × 3つの指標）を、選んで切り替えられる地図にしました。

- 公開ページ: https://shoei05.github.io/bmjph-mortality-maps/
- 指標: 標準化死亡比（経験ベイズ推定）、へき地度（RIJ）で説明できない部分（RIJ残差の比）、ADIとRIJを入れたBYM2モデルの残差の比
- 値は補足図と同じ色の範囲を12段階に区切った区分で載せています。正確な数値とRIJの点数は載せていません。

## Cause-specific mortality maps (online supplemental figures S1–S35)

An interactive viewer for the supplemental maps of the paper above: choose a cause of death (35), sex (total, male, female) and metric (EB-smoothed SMR, RIJ residual RR, adjusted BYM2 residual RR). Values are published as 12 colour classes over the same colour range as the figures; exact values and RIJ scores are not included.

## Files

- `data/values.json`: colour class (−1 = no data, 0 = below range, 1–10, 11 = above range) per municipality, cause and sex
- `data/meta.json`: municipality codes, colour limits, cause list
- `data/map.topojson`: municipal and prefectural boundaries, with Hokkaido and Okinawa shifted as in the paper's figures
- `scripts/export_maps.R`: export script, following the paper's `create_online_supplemental_figures.R`

## Notes

- This is a municipality-level ecological study and does not show individual risk or causation.
- The three cities whose wards were analysed separately (Sagamihara, Okayama, Kumamoto) are shown as one area, with values weighted by expected deaths.
- Boundaries: 国土数値情報（行政区域データ、2021年1月1日時点、国土交通省）, simplified by [smartnews-smri/japan-topography](https://github.com/smartnews-smri/japan-topography) and further processed for this viewer.
