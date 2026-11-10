(() => {
  'use strict';
  const JA_CAUSE = {
    Se00: '全死因', Se01: '結核', Se02: '悪性新生物（がん全体）', Se03: '食道がん', Se04: '胃がん',
    Se05: '結腸がん', Se06: '直腸S状結腸移行部・直腸がん', Se07: '肝がん', Se08: '胆嚢・胆道がん',
    Se09: '膵がん', Se10: '肺がん', Se11: '乳がん', Se12: '子宮がん', Se13: '白血病', Se14: '糖尿病',
    Se15: '高血圧性疾患', Se16: '心疾患（高血圧性を除く）', Se17: '急性心筋梗塞', Se18: 'その他の虚血性心疾患',
    Se19: '不整脈・伝導障害', Se20: '心不全', Se21: '脳血管疾患', Se22: 'くも膜下出血', Se23: '脳内出血',
    Se24: '脳梗塞', Se25: '大動脈瘤・解離', Se26: '肺炎', Se27: '慢性閉塞性肺疾患（COPD）', Se28: '喘息',
    Se29: '肝疾患', Se30: '腎不全', Se31: '老衰', Se32: '不慮の事故', Se33: '交通事故', Se34: '自殺',
  };
  const T = {
    ja: {
      title: '死因別死亡の地図', sub: 'BMJ Public Health 2026 補足図S1〜S35', cause: '死因', sex: '性別',
      metric: '指標', search: '市区町村を探す', prev: '← 前の死因', next: '次の死因 →',
      sexes: { Total: '全体', Male: '男性', Female: '女性' },
      metrics: { smr: '標準化死亡比（EB推定）', rij: 'へき地度で説明できない部分', bym2: 'ADI・へき地度を考慮した残り' },
      explain: {
        smr: '全国の年齢別死亡率から見込まれる死亡数を100としたときの、実際の死亡数の比です。人口の少ない町村の値のぶれを抑えるため、経験ベイズ法で平滑化しています。',
        rij: '標準化死亡比のうち、へき地度との直線的な関係では説明できない部分です。1より大きいと、へき地度から見込まれるより死亡が多い地域です。',
        bym2: '論文の主モデル（へき地度とADIを入れたBYM2空間モデル）で説明しきれなかった市区町村ごとの効果です。1より大きいと、モデルの見込みより死亡が多い地域です。',
      },
      fig: 'S', na: 'データなし', below: '未満', above: '以上', toLight: 'ライト', toDark: 'ダーク', themeAria: (d) => d ? 'ライト表示に切り替え' : 'ダーク表示に切り替え', zoom: 'ホイールやピンチで拡大、ドラッグで移動、ダブルクリックで戻ります。',
      note: '値は補足図と同じ色の範囲を12段階に区切った区分で示しています（正確な数値は載せていません）。色の範囲は補足図と同じく、すべての死因と性別をまとめた分布の3〜97%（標準化死亡比）または4〜96%（残差）です。北海道と沖縄県は位置をずらして表示しています。市区町村単位の生態学的研究で、個人のリスクや因果関係を示すものではありません。',
      cite: '出典：Koda M, Harada N, Nomura S, Tsugawa Y. Association of municipal rurality and area deprivation with cause-specific mortality in Japan: a nationwide ecological study. BMJ Public Health 2026;4:e004913. <a href="https://doi.org/10.1136/bmjph-2026-004913">doi:10.1136/bmjph-2026-004913</a>',
      notFound: '見つかりませんでした',
    },
    en: {
      title: 'Cause-specific mortality maps', sub: 'BMJ Public Health 2026, online supplemental figures S1–S35', cause: 'Cause of death', sex: 'Sex',
      metric: 'Metric', search: 'Find a municipality', prev: '← Previous cause', next: 'Next cause →',
      sexes: { Total: 'Total', Male: 'Male', Female: 'Female' },
      metrics: { smr: 'EB-smoothed SMR', rij: 'RIJ residual RR', bym2: 'Adjusted BYM2 residual RR' },
      explain: {
        smr: 'Observed deaths relative to the number expected from national age-specific rates (100 = expected). Empirical Bayes smoothing reduces noise in small municipalities.',
        rij: 'The part of the SMR not explained by a log-linear relationship with rurality (RIJ). Above 1 means more deaths than rurality alone would predict.',
        bym2: 'Municipal effect left after the main BYM2 spatial model including RIJ and ADI. Above 1 means more deaths than the model predicts.',
      },
      fig: 'Figure S', na: 'No data', below: 'below', above: 'or above', toLight: 'Light', toDark: 'Dark', themeAria: (d) => d ? 'Switch to light theme' : 'Switch to dark theme', zoom: 'Scroll or pinch to zoom, drag to pan, double-click to reset.',
      note: 'Values are shown as 12 colour classes over the same range as the supplemental figures; exact values are not published. Colour limits, as in the figures, are the 3rd–97th (SMR) or 4th–96th (residuals) percentiles pooled across all causes and sexes. Hokkaido and Okinawa are shifted. This is a municipality-level ecological study and does not show individual risk or causation.',
      cite: 'Source: Koda M, Harada N, Nomura S, Tsugawa Y. Association of municipal rurality and area deprivation with cause-specific mortality in Japan: a nationwide ecological study. BMJ Public Health 2026;4:e004913. <a href="https://doi.org/10.1136/bmjph-2026-004913">doi:10.1136/bmjph-2026-004913</a>',
      notFound: 'Not found',
    },
  };
  const PALETTE = ['#3B9AB2', '#78B7C5', '#EBCC2A', '#E1AF00', '#F21A00'];
  const $ = (id) => document.getElementById(id);
  const state = { lang: 'ja', cause: 'Se00', sex: 'Total', metric: 'smr', hl: null };
  let meta, values, topo, features, colors, pathGen, gMap, svg, zoom, idx;

  try { const l = localStorage.getItem('lang'); if (l === 'en' || l === 'ja') state.lang = l; } catch (e) {}
  if (/[?&]lang=en/.test(location.search)) state.lang = 'en';
  readHash();

  function readHash() {
    const [c, s, m] = location.hash.replace('#', '').split('/');
    if (/^Se\d\d$/.test(c || '')) state.cause = c;
    if (['Total', 'Male', 'Female'].includes(s)) state.sex = s;
    if (['smr', 'rij', 'bym2'].includes(m)) state.metric = m;
  }
  function writeHash() { history.replaceState(null, '', `#${state.cause}/${state.sex}/${state.metric}`); }
  const t = () => T[state.lang];
  const causeName = (code) => state.lang === 'ja' ? JA_CAUSE[code] : meta.causes.find((c) => c.code_se === code).cause_en;

  Promise.all([
    fetch('data/meta.json').then((r) => r.json()),
    fetch('data/values.json').then((r) => r.json()),
    fetch('data/map.topojson').then((r) => r.json()),
  ]).then(([m, v, tp]) => {
    meta = m; values = v; topo = tp;
    const nb = meta.nbins + 2;
    colors = d3.range(nb).map((i) => d3.interpolateRgbBasis(PALETTE)(i / (nb - 1)));
    features = topojson.feature(topo, topo.objects.muni).features;
    idx = new Map(meta.codes.map((c, i) => [c, i]));
    buildMap();
    buildControls();
    render();
  });

  function buildMap() {
    const W = 760, H = 760;
    const box = { type: 'MultiPoint', coordinates: [[127.7, 26.8], [142.9, 42.0], [127.7, 42.0], [142.9, 26.8]] };
    const proj = d3.geoMercator().fitSize([W, H], box);
    pathGen = d3.geoPath(proj);
    svg = d3.select('#map').append('svg').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img');
    gMap = svg.append('g');
    gMap.selectAll('path.muni').data(features).join('path').attr('class', 'muni').attr('d', pathGen)
      .on('pointermove', onMove).on('pointerleave', () => { $('tip').hidden = true; })
      .on('click', (ev, d) => { state.hl = state.hl === d.properties.code5 ? null : d.properties.code5; drawHl(); onMove(ev, d); });
    gMap.append('path').attr('class', 'pref').attr('d', pathGen(topojson.mesh(topo, topo.objects.pref, (a, b) => a !== b)));
    const line = (pts) => pathGen({ type: 'LineString', coordinates: pts });
    gMap.append('path').attr('class', 'sep').attr('d', line([[129, 37], [135, 37], [139, 41.5]]));
    gMap.append('path').attr('class', 'sep').attr('d', line([[132, 27], [135, 31.5], [142, 31.5]]));
    gMap.append('path').attr('class', 'hl');
    zoom = d3.zoom().scaleExtent([1, 40]).translateExtent([[0, 0], [W, H]])
      .on('zoom', (ev) => {
        gMap.attr('transform', ev.transform);
      });
    svg.call(zoom).on('dblclick.zoom', null).on('dblclick', () => { state.hl = null; drawHl(); svg.transition().duration(400).call(zoom.transform, d3.zoomIdentity); });
  }

  function classLabel(k) {
    const lim = meta.limits[state.metric], n = meta.nbins, w = (lim[1] - lim[0]) / n;
    const fmt = state.metric === 'smr' ? d3.format('.0f') : d3.format('.2f');
    if (k < 0) return t().na;
    if (k === 0) return `${fmt(lim[0])} ${t().below}`;
    if (k === n + 1) return `${fmt(lim[1])} ${t().above}`;
    return `${fmt(lim[0] + (k - 1) * w)}–${fmt(lim[0] + k * w)}`;
  }

  function onMove(ev, d) {
    const k = current()[idx.get(d.properties.code5)];
    const tip = $('tip'), wrap = document.querySelector('.mapwrap').getBoundingClientRect();
    tip.innerHTML = `<b>${d.properties.pref} ${d.properties.city}</b>${t().metrics[state.metric]}: ${classLabel(k)}`;
    tip.hidden = false;
    let x = ev.clientX - wrap.left + 14, y = ev.clientY - wrap.top + 14;
    if (x + 240 > wrap.width) x -= 260;
    tip.style.left = `${x}px`; tip.style.top = `${y}px`;
  }

  const current = () => values[`${state.cause}_${state.sex}`][state.metric];

  function buildControls() {
    $('lang').onclick = () => { state.lang = state.lang === 'ja' ? 'en' : 'ja'; try { localStorage.setItem('lang', state.lang); } catch (e) {} render(); };
    $('cause').onchange = (e) => { state.cause = e.target.value; render(); };
    $('theme').onclick = () => {
      const next = isDark() ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      try { localStorage.setItem('theme', next); } catch (e) {}
      drawTheme();
    };
    try { matchMedia('(prefers-color-scheme: dark)').addEventListener('change', drawTheme); } catch (e) {}
    const step = (dir) => { const i = meta.causes.findIndex((c) => c.code_se === state.cause); state.cause = meta.causes[(i + dir + meta.causes.length) % meta.causes.length].code_se; render(); };
    $('prev').onclick = () => step(-1); $('next').onclick = () => step(1);
    $('search').onchange = (e) => {
      const q = e.target.value.trim(); if (!q) { state.hl = null; drawHl(); return; }
      const f = features.find((x) => `${x.properties.pref} ${x.properties.city}` === q) || features.find((x) => x.properties.city === q || `${x.properties.pref}${x.properties.city}`.includes(q.replace(/\s/g, '')));
      if (!f) { e.target.setCustomValidity(t().notFound); e.target.reportValidity(); return; }
      e.target.setCustomValidity('');
      state.hl = f.properties.code5; drawHl();
      const [[x0, y0], [x1, y1]] = pathGen.bounds(f), W = 760, H = 760;
      const k = Math.min(30, 0.25 / Math.max((x1 - x0) / W, (y1 - y0) / H));
      svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity.translate(W / 2, H / 2).scale(k).translate(-(x0 + x1) / 2, -(y0 + y1) / 2));
    };
    $('munis').innerHTML = features.map((f) => `<option value="${f.properties.pref} ${f.properties.city}">`).join('');
  }

  function drawHl() {
    const f = features.find((x) => x.properties.code5 === state.hl);
    gMap.select('.hl').attr('d', f ? pathGen(f) : null);
    svg.classed('has-hl', !!f);
    gMap.selectAll('path.muni').classed('is-hl', (d) => !!f && d.properties.code5 === state.hl);
  }

  function isDark() {
    const th = document.documentElement.dataset.theme;
    if (th === 'light' || th === 'dark') return th === 'dark';
    return matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function drawTheme() {
    const L = t(), d = isDark();
    $('theme').textContent = d ? `☀ ${L.toLight}` : `☾ ${L.toDark}`;
    $('theme').setAttribute('aria-label', L.themeAria(d));
  }

  function seg(el, items, key) {
    el.innerHTML = '';
    Object.entries(items).forEach(([k, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = label;
      b.setAttribute('aria-pressed', String(state[key] === k));
      b.onclick = () => { state[key] = k; render(); };
      el.appendChild(b);
    });
  }

  function render() {
    const L = t();
    document.documentElement.lang = state.lang;
    document.title = L.title;
    document.querySelectorAll('[data-t]').forEach((el) => { const v = L[el.dataset.t]; if (typeof v === 'string') { if (el.dataset.t === 'cite') el.innerHTML = v; else el.textContent = v; } });
    $('lang').textContent = state.lang === 'ja' ? 'EN' : '日本語';
    drawTheme();
    $('cause').innerHTML = meta.causes.map((c, i) => `<option value="${c.code_se}"${c.code_se === state.cause ? ' selected' : ''}>${L.fig}${i + 1}. ${causeName(c.code_se)}</option>`).join('');
    seg($('sex'), L.sexes, 'sex');
    seg($('metric'), L.metrics, 'metric');
    $('explain').textContent = L.explain[state.metric];
    const fi = meta.causes.findIndex((c) => c.code_se === state.cause) + 1;
    $('heading').textContent = `${L.fig}${fi}. ${causeName(state.cause)} — ${L.sexes[state.sex]} / ${L.metrics[state.metric]}`;
    $('note').textContent = `${L.note} ${L.zoom}`;
    const v = current();
    gMap.selectAll('path.muni').attr('fill', (d) => { const k = v[idx.get(d.properties.code5)]; return k == null || k < 0 ? 'var(--na)' : colors[k]; });
    svg.attr('aria-label', $('heading').textContent);
    drawLegend();
    writeHash();
  }

  function drawLegend() {
    const n = meta.nbins, lim = meta.limits[state.metric];
    const fmt = state.metric === 'smr' ? d3.format('.0f') : d3.format('.2f');
    const ticks = [];
    for (let i = 0; i <= n; i += 2) ticks.push({ pos: (i + 1) / (n + 2) * 100, v: lim[0] + i * (lim[1] - lim[0]) / n });
    $('legend').innerHTML = `<div class="bar">${colors.map((c) => `<span style="background:${c}"></span>`).join('')}</div>`
      + `<div class="ticks">${ticks.map((x) => `<span style="left:${x.pos}%">${fmt(x.v)}</span>`).join('')}</div>`
      + `<span class="na"><i></i>${t().na}</span>`;
  }

  window.addEventListener('hashchange', () => { readHash(); render(); });
})();
