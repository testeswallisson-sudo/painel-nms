/* Módulo Análises — lê window.ANALISES (painel/analises_data.js, gerado por analises_dados.py). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var A = window.ANALISES || null;
  var evoMes = null, per = { v: "dia", p: "dia" }, busca = "", abcSt = { c: "", q: "", p: "dia" }, ep = { st: "", q: "", ord: "valor", lim: 200, loja: "" };
  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var N0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var N1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
  var DOW = ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"];
  var TITULOS = { resumo: "Análises · Resumo", vendas: "Análises · Vendas", produtos: "Análises · Produtos", abc: "Análises · Curva ABC", estoque: "Análises · Estoque", estqprod: "Análises · Estoque por produto", alertas: "Análises · Cancelamentos e saldos", repcurva: "Reposição lojas · Análise de curva", reppedidos: "Reposição lojas · Pedidos" };

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setHTML(id, h) { var el = typeof id === "string" ? $(id) : id; if (el && el._h !== h) { el._h = h; el.innerHTML = h; } }
  function setTxt(id, t) { var e = $(id); if (e && e.textContent !== t) e.textContent = t; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function curto(v) { return v >= 1e6 ? "R$ " + N1.format(v / 1e6) + " mi" : v >= 1000 ? "R$ " + N1.format(v / 1000) + " mil" : "R$ " + N0.format(v); }
  function hhmm(iso) { var d = new Date(String(iso).replace(" ", "T")); return isNaN(d) ? "—" : pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function vazio(cols, txt) { return '<tr><td colspan="' + cols + '">' + (txt || "Sem dados.") + "</td></tr>"; }
  function num(v, f) { return v == null ? "—" : (f || N0).format(v); }
  function brl(v) { return v == null ? "—" : BRL.format(v); }
  function barras(rows, rotulo, valor, fmt) {
    var mx = Math.max.apply(null, rows.map(function (r) { return valor(r); }).concat([1]));
    return rows.map(function (r) { return '<div class="hb__row"><span class="hb__lbl" title="' + esc(rotulo(r)) + '">' + esc(rotulo(r)) + '</span><span class="hb__bar"><i style="width:' + Math.max(1, valor(r) / mx * 100) + '%"></i></span><span class="hb__val">' + fmt(valor(r)) + "</span></div>"; }).join("");
  }
  var MARCA = "";
  function mar(c) { return (A && A.marcas && A.marcas[c]) || ""; }
  function okMarca(c) { return !MARCA || mar(c) === MARCA; }
  function tdMarca(c) { return "<td>" + esc(mar(c)) + "</td>"; }
  function marcasSel() {
    var m = {}; if (A && A.marcas) Object.keys(A.marcas).forEach(function (k) { m[A.marcas[k]] = 1; });
    var ks = Object.keys(m).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); });
    var opt = '<option value="">TODAS AS MARCAS</option>' + ks.map(function (x) { return '<option value="' + esc(x) + '">' + esc(x) + "</option>"; }).join("");
    [].forEach.call(document.querySelectorAll("select.sel-marca"), function (sel) { if (sel._o !== opt) { sel._o = opt; sel.innerHTML = opt; } sel.value = MARCA; sel.style.display = ks.length ? "" : "none"; });
  }
  function nomeProd(d, c) { return esc(d || c) + (d && c && String(d) !== String(c) ? ' <span class="kpi-mini">' + esc(c) + "</span>" : ""); }
  function tab() { return (location.hash || "#resumo").replace("#", "") || "resumo"; }

  /* ---------- gráfico do mês ---------- */
  function evolucao() {
    var DM = A.diario_meses || {}, ms = Object.keys(DM).sort().reverse(), sel = $("evoMes");
    if (!evoMes || !DM[evoMes]) evoMes = DM[A.mes] ? A.mes : (ms[0] || A.mes);
    var opt = ms.map(function (m) { var p = m.split("-"); return '<option value="' + m + '">' + MESES[+p[1] - 1] + " de " + p[0] + "</option>"; }).join("");
    if (sel && sel._o !== opt) { sel._o = opt; sel.innerHTML = opt; }
    if (sel) sel.value = evoMes;
    var atual = evoMes === A.mes, dias = DM[evoMes] || A.diario || [], ref = evoMes.split("-"), mes = +ref[1] - 1;
    setTxt("evoTitulo", "Faturamento por dia");
    if (!dias.length) { setHTML("evoChart", '<div class="empty">Sem arquivos diários neste mês ainda.</div>'); setHTML("evoStats", ""); return; }
    var pts = dias.map(function (d) { return { dia: +d.data.split("-")[2], v: d.fat, linhas: d.linhas }; });
    var xmax = Math.max(pts[pts.length - 1].dia, 2), total = pts.reduce(function (a, p) { return a + p.v; }, 0), media = total / pts.length;
    var melhor = pts.reduce(function (a, p) { return p.v > a.v ? p : a; }, pts[0]);
    var ant = pts.length > 1 ? pts[pts.length - 2] : null, varp = ant && ant.v ? (pts[pts.length - 1].v / ant.v - 1) * 100 : null;
    setHTML("evoStats", "<div>Total do mês<b>" + BRL.format(total) + "</b></div><div>Média por dia<b>" + BRL.format(media) + "</b></div><div>Melhor dia<b>" + pad(melhor.dia) + "/" + pad(mes + 1) + " · " + curto(melhor.v) + "</b></div>" + (varp != null ? "<div>Último dia vs anterior<b>" + (varp >= 0 ? "+" : "") + N1.format(varp) + "%</b></div>" : ""));
    var W = 1000, H = 300, L = 80, R = 18, T = 34, B = 36, pw = W - L - R, ph = H - T - B;
    var mx = Math.max.apply(null, pts.map(function (p) { return p.v; }).concat([1])) * 1.12, step = pw / xmax, bw = Math.min(34, step * 0.6);
    var X = function (d) { return L + (d - 0.5) * step; }, Y = function (v) { return T + ph - v / mx * ph; };
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Faturamento por dia">';
    for (var g = 0; g <= 4; g++) { var gy = Y(mx / 4 * g); s += '<line class="evo-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/><text class="evo-y" x="' + (L - 8) + '" y="' + (gy + 4) + '">' + curto(mx / 4 * g) + "</text>"; }
    var cada = xmax > 16 ? 2 : 1;
    pts.forEach(function (p, i) { s += '<rect class="evo-bar' + (atual && i === pts.length - 1 ? " hoje" : "") + '" x="' + (X(p.dia) - bw / 2) + '" y="' + Y(p.v) + '" width="' + bw + '" height="' + Math.max(1, T + ph - Y(p.v)) + '" rx="4"><title>' + pad(p.dia) + "/" + pad(mes + 1) + " · " + BRL.format(p.v) + " · " + p.linhas + " linhas</title></rect>"; });
    s += '<line class="evo-avg" x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(media) + '" y2="' + Y(media) + '"/><text class="evo-avgt" x="' + (L + 6) + '" y="' + (Y(media) - 5) + '">média ' + curto(media) + "</text>";
    s += '<polyline class="evo-line" points="' + pts.map(function (p) { return X(p.dia) + "," + Y(p.v); }).join(" ") + '"/>';
    pts.forEach(function (p, i) { s += '<circle class="evo-dot" cx="' + X(p.dia) + '" cy="' + Y(p.v) + '" r="4"/>'; if (i % cada === (pts.length - 1) % cada || p === melhor) s += '<text class="evo-t" x="' + X(p.dia) + '" y="' + (Y(p.v) - 11) + '">' + curto(p.v) + "</text>"; });
    for (var d = 1; d <= xmax; d++) if (xmax <= 16 || d % 2 === 1 || d === xmax) s += '<text class="evo-x" x="' + X(d) + '" y="' + (H - 12) + '">' + pad(d) + "</text>";
    setHTML("evoChart", s + "</svg>");
    setTxt("notaDias", "Faturamento = valor unitário líquido × quantidade, sem canceladas." + (atual ? " O último dia ainda está em andamento." : ""));
  }

  /* ---------- insights ---------- */
  function insights() {
    var L = [], D = A.dia, M = A.mes_bloco, E = A.estoque, R = A.resumo, S = R.semana, MI = R.mes_info;
    function add(n, t) { L.push('<li><span class="dot ' + n + '"></span><span>' + t + "</span></li>"); }
    function head(t) { L.push('<li class="ins-h">' + t + "</li>"); }
    function dm(iso) { var p = iso.split("-"); return p[2] + "/" + p[1]; }
    function varTxt(v, base) { return v == null ? "" : ' <b style="color:var(' + (v < -5 ? "--err,#b3261e" : "--ok,#25702f") + ')">' + (v >= 0 ? "+" : "") + N1.format(v) + "%</b> " + base; }
    head("Hoje · " + dm(A.data_ref));
    if (D && D.por_loja.length) { var t = D.por_loja[0]; add("", "<b>" + esc(t.loja) + "</b> lidera o dia com " + BRL.format(t.fat) + " (" + N1.format(t.part) + "% do faturamento)."); }
    if (!D) add("aviso", "Ainda não há vendas coletadas hoje.");
    if (R.ontem_fat != null && R.media_dias_fechados) { var v = (R.ontem_fat / R.media_dias_fechados - 1) * 100; add(v < -15 ? "aviso" : "", "Ontem fechou em " + BRL.format(R.ontem_fat) + ", " + (v >= 0 ? "+" : "") + N1.format(v) + "% em relação à média dos dias fechados."); }
    if (D && D.canc_pct > 3) add("aviso", "Cancelamentos somam " + N1.format(D.canc_pct) + "% do faturamento bruto de hoje (" + BRL.format(D.canc_valor) + ").");
    if (D && D.pico_hora) add("", "Horário de pico do dia: <b>" + pad(+D.pico_hora.h) + "h</b> (" + BRL.format(D.pico_hora.fat) + ").");
    if (D && M && M.por_loja.length && D.por_loja.length < M.por_loja.length) add("aviso", (M.por_loja.length - D.por_loja.length) + " loja(s) que venderam no mês ainda não venderam hoje.");
    if (S) {
      head("Semana · desde " + dm(S.inicio) + " (" + S.dias + " dia" + (S.dias > 1 ? "s" : "") + " com dados)");
      add("", "Faturamento da semana: <b>" + BRL.format(S.fat) + "</b> · média " + curto(S.fat / S.dias) + "/dia." + varTxt(S.var_media_pct, "na média diária vs semana anterior"));
      if (S.loja_top) add("", "<b>" + esc(S.loja_top.loja) + "</b> lidera a semana com " + BRL.format(S.loja_top.fat) + " (" + N1.format(S.loja_top.part) + "%).");
      if (S.produto_top) add("", "Produto mais vendido da semana: <b>" + esc(S.produto_top.produto) + "</b> (" + BRL.format(S.produto_top.fat) + ").");
      if (S.margem_pct != null) add("", "Margem bruta da semana: " + N1.format(S.margem_pct) + "%.");
      if (S.canc_pct > 3) add("aviso", "Cancelamentos da semana: " + N1.format(S.canc_pct) + "% do bruto (" + BRL.format(S.canc_valor) + ").");
    }
    if (MI) {
      head("Mês · " + MESES[+A.mes.split("-")[1] - 1] + " (" + MI.dias + " dia" + (MI.dias > 1 ? "s" : "") + " com dados)");
      add("", "Faturamento do mês: <b>" + BRL.format(MI.fat) + "</b>" + (R.projecao_mes != null ? " · projeção " + curto(R.projecao_mes) + "." : ".") + varTxt(MI.var_media_pct, "na média diária vs mês anterior"));
      if (MI.loja_top) add("", "<b>" + esc(MI.loja_top.loja) + "</b> lidera o mês com " + BRL.format(MI.loja_top.fat) + " (" + N1.format(MI.loja_top.part) + "%)." + (MI.loja_pior ? " Menor faturamento: " + esc(MI.loja_pior.loja) + " (" + curto(MI.loja_pior.fat) + ")." : ""));
      if (MI.produto_top) add("", "Produto mais vendido do mês: <b>" + esc(MI.produto_top.produto) + "</b> (" + BRL.format(MI.produto_top.fat) + ").");
      if (MI.margem_pct != null) add("", "Margem bruta do mês: " + N1.format(MI.margem_pct) + "%.");
      if (MI.pico_hora) add("", "Horário de pico do mês: <b>" + pad(+MI.pico_hora.h) + "h</b>.");
      if (MI.canc_pct > 3) add("aviso", "Cancelamentos do mês: " + N1.format(MI.canc_pct) + "% do bruto (" + BRL.format(MI.canc_valor) + ").");
    }
    if (E) {
      head("Estoque");
      var cr = E.lojas.filter(function (l) { return l.cobertura != null && l.cobertura < 7; });
      if (cr.length) add("erro", "Cobertura abaixo de 7 dias em <b>" + cr.length + " loja(s)</b>: " + cr.slice(0, 4).map(function (l) { return esc(l.loja) + " (" + N1.format(l.cobertura) + "d)"; }).join(", ") + ".");
      if (E.geral.rupturas) add("aviso", "<b>" + N0.format(E.geral.rupturas) + " produtos</b> venderam na janela e estão sem saldo (ruptura).");
      if (E.geral.parado_valor && E.geral.valor) add("aviso", "Estoque parado (sem venda na janela) = " + BRL.format(E.geral.parado_valor) + ", " + N1.format(E.geral.parado_valor / E.geral.valor * 100) + "% do valor em estoque.");
      if (E.geral.neg_linhas) add("aviso", N0.format(E.geral.neg_linhas) + " linhas de estoque com saldo negativo — revisar no Linx.");
      if (E.match_pct != null && E.match_pct < 50) add("erro", "Só " + N0.format(E.match_pct) + "% dos produtos vendidos casam com o estoque: a chave de produto pode estar diferente entre os relatórios.");
    }
    setHTML("insights", L.join("") || '<li><span class="dot"></span><span>Sem alertas.</span></li>');
  }

  /* ---------- seções ---------- */
  function resumo() {
    var D = A.dia, M = A.mes_bloco, E = A.estoque, R = A.resumo;
    evolucao();                               // define evoMes (mês escolhido no filtro do gráfico)
    var MI = (A.meses_info || {})[evoMes], passado = !!MI && evoMes !== A.mes, nm = evoMes ? MESES[+evoMes.split("-")[1] - 1] : "";
    function dm(iso) { var p = iso.split("-"); return p[2] + "/" + p[1]; }
    if (passado) {
      setTxt("rTFatDia", "Último dia coletado (" + dm(MI.ultimo_dia.data) + ")"); setTxt("rFatDia", curto(MI.ultimo_dia.fat)); setTxt("rFatDiaD", MI.ultimo_dia.linhas + " linhas · " + MI.ultimo_dia.lojas + " lojas");
      setTxt("rTFatMes", "Faturamento de " + nm); setTxt("rFatMes", curto(MI.fat)); setTxt("rFatMesD", MI.dias + " de " + MI.dias_no_mes + " dias com dados");
      setTxt("rTProj", "Melhor dia do mês"); setTxt("rProj", curto(MI.melhor_dia.fat)); setTxt("rProjD", dm(MI.melhor_dia.data));
      setTxt("rTMedia", "Média por dia"); setTxt("rMedia", curto(MI.media_dia)); setTxt("rMediaD", MI.margem_pct != null ? "margem bruta " + N1.format(MI.margem_pct) + "%" : "");
      setTxt("rTCanc", "Cancelado no mês"); setTxt("rCanc", curto(MI.canc_valor)); setTxt("rCancD", MI.canc_linhas + " linhas · " + N1.format(MI.canc_pct) + "% do bruto");
    } else {
      setTxt("rTFatDia", "Faturamento do dia"); setTxt("rFatDia", D ? curto(D.fat) : "—"); setTxt("rFatDiaD", D ? D.linhas + " linhas · " + D.lojas + " lojas" : "sem vendas hoje");
      setTxt("rTFatMes", "Faturamento do mês"); setTxt("rFatMes", M ? curto(M.fat) : "—"); setTxt("rFatMesD", M ? R.dias_com_dados + " de " + R.dias_no_mes + " dias" : "");
      setTxt("rTProj", "Projeção do mês"); setTxt("rProj", R.projecao_mes != null ? curto(R.projecao_mes) : "—"); setTxt("rProjD", "estimativa: média × dias do mês");
      setTxt("rTMedia", "Média por dia"); setTxt("rMedia", R.media_dia != null ? curto(R.media_dia) : "—"); setTxt("rMediaD", R.media_dias_fechados != null ? "dias fechados: " + curto(R.media_dias_fechados) : "");
      setTxt("rTCanc", "Cancelado no dia"); setTxt("rCanc", D ? curto(D.canc_valor) : "—"); setTxt("rCancD", D ? D.canc_linhas + " linhas · " + N1.format(D.canc_pct) + "% do bruto" : "");
    }
    setTxt("rEstVal", E && E.geral.valor != null ? curto(E.geral.valor) : "—"); setTxt("rEstValD", E ? (E.geral.base_valor || "sem coluna de custo") : "sem estoque");
    setTxt("rEstUn", E ? N0.format(E.geral.saldo) : "—"); setTxt("rEstUnD", E ? N0.format(E.geral.skus) + " linhas · " + E.geral.lojas + " lojas" : "");
    setTxt("rNeg", E ? N0.format(E.geral.neg_linhas) : "—"); setTxt("rNegD", E ? N0.format(E.geral.neg_unid) + " un. · " + curto(E.geral.neg_valor) : "");
    insights();                               // "O que chama atenção" não depende do mês escolhido
    if (passado) {
      setTxt("rTLojas", "Faturamento por loja — " + nm);
      setHTML("rLojas", MI.por_loja.length ? barras(MI.por_loja.slice(0, 12), function (l) { return l.loja; }, function (l) { return l.fat; }, curto) : '<div class="empty">Sem vendas neste mês.</div>');
      setHTML("rDow", barras(MI.dow.filter(function (d) { return d.media != null; }), function (d) { return DOW[d.dow]; }, function (d) { return d.media; }, curto) || '<div class="empty">Sem histórico.</div>');
      setTxt("rDowNota", "Média dos dias de " + nm + " por dia da semana.");
    } else {
      setTxt("rTLojas", "Faturamento por loja — hoje");
      setHTML("rLojas", D && D.por_loja.length ? barras(D.por_loja.slice(0, 12), function (l) { return l.loja; }, function (l) { return l.fat; }, curto) : '<div class="empty">Sem vendas hoje.</div>');
      setHTML("rDow", barras(A.dow.filter(function (d) { return d.media != null; }), function (d) { return DOW[d.dow]; }, function (d) { return d.media; }, curto) || '<div class="empty">Sem histórico.</div>');
      setTxt("rDowNota", "Só dias já fechados do mês (o dia corrente fica de fora).");
    }
  }

  function vendas() {
    var B = per.v === "dia" ? A.dia : A.mes_bloco, nome = per.v === "dia" ? "hoje (" + A.data_ref.split("-").reverse().join("/") + ")" : MESES[+A.mes.split("-")[1] - 1] + " — " + A.resumo.dias_com_dados + " dia(s) com dados";
    setTxt("vSub", "Período: " + nome + " · faturamento = valor unitário líquido × quantidade, sem canceladas");
    if (!B) { ["vFat", "vItens", "vPm", "vLojas"].forEach(function (i) { setTxt(i, "—"); }); setHTML("vTabLojas", vazio(10, "Sem vendas neste período.")); setHTML("vFootLojas", ""); ["vMg", "vCusto", "vPico", "vTabP"].forEach(function (i) { setTxt(i, "—"); }); setHTML("vHoras", ""); setHTML("vTabelas", vazio(4)); ["vTipos", "vForn", "vVend"].forEach(function (i) { setHTML(i, vazio(3)); }); return; }
    setTxt("vFat", BRL.format(B.fat)); setTxt("vFatD", B.linhas + " linhas");
    setTxt("vItens", N0.format(B.itens)); setTxt("vItensD", B.produtos + " produtos diferentes");
    setTxt("vPm", BRL.format(B.preco_medio)); setTxt("vPmD", "faturamento ÷ itens");
    setTxt("vLojas", String(B.lojas)); setTxt("vLojasD", "com venda no período");
    vExtra(B);
    var mx = Math.max.apply(null, B.por_loja.map(function (l) { return l.fat; }).concat([1]));
    setHTML("vTabLojas", B.por_loja.map(function (l) { return "<tr><td>" + esc(l.loja) + "</td><td>" + esc(l.portal) + '</td><td class="r">' + N0.format(l.linhas) + '</td><td class="r">' + N1.format(l.itens) + '</td><td class="r">' + BRL.format(l.preco_medio) + '</td><td class="r">' + (l.canc_valor ? BRL.format(l.canc_valor) : "—") + '</td><td class="r">' + (l.margem_pct == null ? "—" : N1.format(l.margem_pct) + "%") + '</td><td class="r">' + N1.format(l.part) + '%</td><td class="r">' + BRL.format(l.fat) + '<span class="bar-cell" style="width:' + Math.round(l.fat / mx * 70) + 'px"></span></td></tr>'; }).join(""));
    setHTML("vFootLojas", '<tr><td>Total (' + B.lojas + ' lojas)</td><td></td><td class="r">' + N0.format(B.linhas) + '</td><td class="r">' + N1.format(B.itens) + '</td><td class="r">' + BRL.format(B.preco_medio) + '</td><td class="r">' + BRL.format(B.canc_valor) + '</td><td class="r">' + (B.margem_pct == null ? "—" : N1.format(B.margem_pct) + "%") + '</td><td class="r">100%</td><td class="r">' + BRL.format(B.fat) + "</td></tr>");
    setHTML("vTipos", B.tipos.map(function (t) { return '<tr><td title="' + esc(t.natureza) + '">' + esc(t.natureza) + '</td><td class="r">' + N1.format(t.part) + '%</td><td class="r">' + BRL.format(t.fat) + "</td></tr>"; }).join("") || vazio(3, "Coluna de natureza não encontrada."));
    setHTML("vForn", B.fornecedores.map(function (t) { return '<tr><td title="' + esc(t.nome) + '">' + esc(t.nome) + '</td><td class="r">' + N1.format(t.part) + '%</td><td class="r">' + BRL.format(t.fat) + "</td></tr>"; }).join("") || vazio(3, "Coluna de fornecedor não encontrada."));
    setHTML("vVend", B.vendedores.map(function (t) { return '<tr><td title="' + esc(t.nome) + '">' + esc(t.nome) + '</td><td class="r">' + N0.format(t.linhas) + '</td><td class="r">' + BRL.format(t.fat) + "</td></tr>"; }).join("") || vazio(3, "Coluna de vendedor não encontrada."));
  }

  function vExtra(B) {
    var tc = B.margem != null;
    setTxt("vMg", tc ? BRL.format(B.margem) : "—"); setTxt("vMgD", tc ? N1.format(B.margem_pct) + "% do faturamento" : "coluna Custo Médio não encontrada");
    setTxt("vCusto", tc ? BRL.format(B.custo) : "—"); setTxt("vCustoD", tc ? "custo médio × quantidade" : "");
    var pk = B.pico_hora;
    setTxt("vPico", pk ? pad(+pk.h) + "h" : "—"); setTxt("vPicoD", pk ? BRL.format(pk.fat) + " · " + N0.format(pk.linhas) + " linhas" : "coluna Hora de Emissão não encontrada");
    var t0 = B.tabelas && B.tabelas[0];
    setTxt("vTabP", t0 ? t0.tabela : "—"); setTxt("vTabPD", t0 ? N1.format(t0.part) + "% do faturamento" : "coluna Tabela Preço não encontrada");
    setHTML("vTabelas", (B.tabelas || []).map(function (t) { return "<tr><td>" + esc(t.tabela) + '</td><td class="r">' + N0.format(t.linhas) + '</td><td class="r">' + N1.format(t.part) + '%</td><td class="r">' + BRL.format(t.fat) + "</td></tr>"; }).join("") || vazio(4, "Coluna Tabela Preço não encontrada."));
    var H = B.horas || [];
    if (!H.length) { setHTML("vHoras", '<div class="empty">Coluna Hora de Emissão não encontrada.</div>'); setTxt("vHorasNota", ""); return; }
    var W = 1000, Ht = 240, L = 70, R = 12, T = 22, Bt = 30, pw = W - L - R, ph = Ht - T - Bt, mx = Math.max.apply(null, H.map(function (x) { return x.fat; }).concat([1])) * 1.1, step = pw / 24, bw = step * 0.62;
    var s = '<svg viewBox="0 0 ' + W + " " + Ht + '" role="img" aria-label="Faturamento por hora">';
    for (var g = 0; g <= 3; g++) { var gy = T + ph - ph / 3 * g; s += '<line class="evo-grid" x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '"/><text class="evo-y" x="' + (L - 8) + '" y="' + (gy + 4) + '">' + curto(mx / 3 * g) + "</text>"; }
    H.forEach(function (x) { var y = T + ph - x.fat / mx * ph, cx = L + (x.h + 0.5) * step; s += '<rect class="evo-bar' + (pk && x.h === pk.h ? " hoje" : "") + '" x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + Math.max(x.fat > 0 ? 1 : 0, T + ph - y) + '"><title>' + pad(x.h) + "h · " + BRL.format(x.fat) + " · " + x.linhas + ' linhas</title></rect><text class="evo-x" x="' + cx + '" y="' + (Ht - 10) + '">' + pad(x.h) + "</text>"; });
    setHTML("vHoras", s + "</svg>");
    setTxt("vHorasNota", "Soma por hora de emissão, sem canceladas. A barra destacada é o horário de pico.");
  }

  function produtos() {
    var B = per.p === "dia" ? A.dia : A.mes_bloco, q = busca.toLowerCase();
    setTxt("pSub", per.p === "dia" ? "Hoje — " + A.data_ref.split("-").reverse().join("/") : "Mês — " + A.resumo.dias_com_dados + " dia(s) com dados");
    if (!B) { setHTML("pTab", vazio(10, "Sem vendas neste período.")); setTxt("pNota", ""); return; }
    var rows = B.produtos_top.filter(function (p) { return okMarca(p.chave) && (p.produto.toLowerCase().indexOf(q) >= 0 || String(p.chave).indexOf(q) >= 0); }); if (!MARCA && !q) rows = rows.slice(0, 100); var mx = Math.max.apply(null, rows.map(function (p) { return p.fat; }).concat([1]));
    setHTML("pTab", rows.map(function (p, i) { return '<tr><td class="r">' + (i + 1) + "</td><td>" + esc(p.produto) + ' <span class="kpi-mini">' + esc(p.chave) + "</span></td>" + tdMarca(p.chave) + '<td class="r">' + N1.format(p.itens) + '</td><td class="r">' + BRL.format(p.preco_medio) + '</td><td class="r">' + p.lojas + '</td><td class="r">' + (p.margem_pct == null ? "—" : N1.format(p.margem_pct) + "%") + '</td><td class="r">' + N1.format(p.part) + '%</td><td class="r">' + BRL.format(p.fat) + '<span class="bar-cell" style="width:' + Math.round(p.fat / mx * 70) + 'px"></span></td></tr>'; }).join("") || vazio(7, "Nenhum produto."));
    setTxt("pNota", "Mostrando " + N0.format(rows.length) + " de " + N0.format(B.produtos) + " produtos vendidos no período" + (MARCA || q ? " (filtro aplicado sobre os " + N0.format(B.produtos_top.length) + " maiores)." : " (100 maiores; use a busca ou o filtro de marca para ver mais)."));
  }

  function csvBaixar(nome, cab, linhas) {
    var f = function (v) { v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var t = "\ufeff" + [cab].concat(linhas).map(function (r) { return r.map(f).join(";"); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  }
  function abcClassificar(itens, desc) {
    itens.sort(function (a, b) { return b[1] - a[1]; });
    var total = itens.reduce(function (a, x) { return a + x[1]; }, 0) || 1, acum = 0, res = { A: [0, 0], B: [0, 0], C: [0, 0] }, out = [];
    itens.forEach(function (x) { var antes = acum / total; acum += x[1]; var c = antes < 0.8 ? "A" : antes < 0.95 ? "B" : "C"; res[c][0]++; res[c][1] += x[1];
      out.push({ chave: x[0], produto: desc[x[0]] || x[0], fat: Math.round(x[1] * 100) / 100, itens: Math.round(x[2] * 100) / 100, acum: Math.round(acum / total * 1000) / 10, classe: c }); });
    return { total: total, n: itens.length, A: res.A, B: res.B, C: res.C, itens: out };
  }
  function abcDatasLista() { return (A.abc_datas || []).filter(function (d) { return d >= abcSt.de && d <= abcSt.ate; }); }
  function abcPeriodoCalc() {
    var ds = abcDatasLista(), desc = {}, ls = {}, rede = {};
    ds.forEach(function (d) { var D = window.ABCD[d]; if (!D) return; for (var k in D.p) desc[k] = D.p[k];
      for (var l in D.l) { var o = ls[l] = ls[l] || {}; for (var k2 in D.l[l]) { var v = D.l[l][k2], x = o[k2] = o[k2] || [0, 0]; x[0] += v[0]; x[1] += v[1]; } } });
    var lojas = [];
    for (var l in ls) { var it = []; for (var k in ls[l]) { var v = ls[l][k]; if (v[1] > 0) { it.push([k, v[1], v[0]]); var r = rede[k] = rede[k] || [0, 0]; r[0] += v[1]; r[1] += v[0]; } }
      if (it.length) { var c = abcClassificar(it, desc); c.loja = l; lojas.push(c); } }
    lojas.sort(function (a, b) { return b.total - a.total; });
    var ri = []; for (var k3 in rede) ri.push([k3, rede[k3][0], rede[k3][1]]);
    var rc = ri.length ? abcClassificar(ri, desc) : null; if (rc) rc.loja = "TODAS AS LOJAS";
    abcSt.per = { lojas: lojas, rede: rc, dias: ds.length, chave: abcSt.de + "|" + abcSt.ate };
  }
  function abcPeriodoCarregar() {
    var ds = abcDatasLista(), falta = ds.filter(function (d) { return !(window.ABCD && window.ABCD[d]); });
    if (!falta.length) { abcPeriodoCalc(); return true; }
    if (abcSt.carregando === abcSt.de + "|" + abcSt.ate) return false;
    abcSt.carregando = abcSt.de + "|" + abcSt.ate;
    var chave = abcSt.carregando, n = falta.length;
    falta.forEach(function (d) { var sc = document.createElement("script"); sc.src = "abc_dias/" + d + ".js?t=" + encodeURIComponent(A.gerado_em);
      var fim = function () { sc.remove(); if (--n === 0) { abcSt.carregando = null; render(); } };
      sc.onload = fim; sc.onerror = fim; document.head.appendChild(sc); });
    return false;
  }
  function abcSrc() { if (abcSt.p === "per") return abcSt.per && abcSt.per.chave === abcSt.de + "|" + abcSt.ate ? abcSt.per : null; return abcSt.p === "dia" ? A.abc : (window.ABCMES && window.ABCMES.mes === A.mes ? window.ABCMES : null); }
  function abcAtual() {
    var S = abcSrc(); if (!S) return null;
    var lojas = (S.rede ? [S.rede] : []).concat(S.lojas), l = lojas[+$("abcLoja").value || 0];
    if (!l) return null;
    var q = abcSt.q.toLowerCase(), rows = [];
    l.itens.forEach(function (p, i) { if ((!abcSt.c || p.classe === abcSt.c) && okMarca(p.chave) && (!q || String(p.produto).toLowerCase().indexOf(q) >= 0 || String(p.chave || "").toLowerCase().indexOf(q) >= 0)) rows.push([i + 1, p]); });
    return { l: l, rows: rows };
  }
  function abc() {
    var S, mesNome = MESES[+A.mes.split("-")[1] - 1], dts = A.abc_datas || [];
    $("abcDatas").style.display = abcSt.p === "per" ? "inline-flex" : "none";
    if (abcSt.p === "per") {
      if (!dts.length) { setHTML("abcCards", '<div class="empty">Sem dias coletados.</div>'); setHTML("abcTab", vazio(7)); return; }
      if (!abcSt.de) { abcSt.ate = dts[dts.length - 1]; abcSt.de = dts[Math.max(0, dts.length - 7)]; }
      $("abcDe").min = $("abcAte").min = dts[0]; $("abcDe").max = $("abcAte").max = dts[dts.length - 1];
      $("abcDe").value = abcSt.de; $("abcAte").value = abcSt.ate;
      if (abcSt.de > abcSt.ate) { setHTML("abcCards", '<div class="empty">A data inicial é maior que a final.</div>'); setHTML("abcTab", vazio(7)); return; }
      if (!abcDatasLista().length) { setHTML("abcCards", '<div class="empty">Não há vendas coletadas neste intervalo.</div>'); setHTML("abcTab", vazio(7)); setTxt("abcNota", ""); return; }
      abcPeriodoCarregar();
    }
    S = abcSrc();
    var br = function (d) { return d.split("-").reverse().join("/"); };
    setTxt("abcTit", abcSt.p === "dia" ? "Curva ABC do dia" : abcSt.p === "mes" ? "Curva ABC do mês" : "Curva ABC do período");
    setTxt("abcSub", "A = produtos que somam até 80% do faturamento da loja · B = até 95% · C = o restante. Base: vendas " + (abcSt.p === "per" ? "de " + br(abcSt.de) + " a " + br(abcSt.ate) + (S ? " (" + S.dias + " dia(s) com dados)" : "") : abcSt.p === "dia" ? "de hoje (" + A.data_ref.split("-").reverse().join("/") + ")" : "de " + mesNome + (S ? " (" + S.dias + " dia(s) com dados)" : "")) + ", sem canceladas. Todos os itens são listados.");
    if (!S) {
      if (abcSt.p === "mes" && !abcSt.carregando) {
        abcSt.carregando = true;
        var sc = document.createElement("script"); sc.src = "abc_mes.js?t=" + encodeURIComponent(A.gerado_em);
        sc.onload = function () { abcSt.carregando = false; sc.remove(); render(); };
        sc.onerror = function () { abcSt.carregando = false; sc.remove(); setHTML("abcCards", '<div class="empty">Arquivo abc_mes.js não encontrado — rode abrir_analises.bat para gerá-lo.</div>'); };
        document.head.appendChild(sc);
      }
      setHTML("abcCards", '<div class="empty">Carregando…</div>'); setHTML("abcTab", vazio(7, "Carregando…")); setTxt("abcNota", ""); return;
    }
    var lojas = (S.rede ? [S.rede] : []).concat(S.lojas), sel = $("abcLoja");
    var opt = lojas.map(function (l, i) { return '<option value="' + i + '">' + esc(l.loja) + " — " + BRL.format(l.total) + "</option>"; }).join("");
    if (sel._o !== opt) { var cur = sel.value; sel._o = opt; sel.innerHTML = opt; if (cur) sel.value = cur; }
    var r = abcAtual();
    if (!r) { setHTML("abcCards", '<div class="empty">Sem vendas neste período para classificar.</div>'); setHTML("abcTab", vazio(7)); setTxt("abcNota", ""); return; }
    var l = r.l;
    setTxt("abcTitulo", l.loja + " — " + N0.format(l.n) + " produtos · " + BRL.format(l.total));
    var cl = ["A", "B", "C"];
    setHTML("abcCards", cl.map(function (c) { return '<article class="card"><span class="abc-tag abc-' + c + '">' + c + '</span><div class="kpi">' + N0.format(l[c][0]) + ' <small style="font-size:13px;color:var(--muted)">produtos · ' + N1.format(l[c][0] / l.n * 100) + '%</small></div><div class="delta">' + BRL.format(l[c][1]) + " · " + N1.format(l.total ? l[c][1] / l.total * 100 : 0) + "% do faturamento</div></article>"; }).join("") +
      '<div style="grid-column:1/-1"><div class="stackbar" title="participação no faturamento">' + cl.map(function (c) { return '<i class="' + c + '" style="width:' + (l.total ? l[c][1] / l.total * 100 : 0) + '%"></i>'; }).join("") + "</div></div>");
    var mx = l.itens.length ? l.itens[0].fat : 1;
    setHTML("abcTab", r.rows.map(function (x) { var p = x[1]; return '<tr><td class="r">' + x[0] + "</td><td>" + esc(p.produto) + "</td>" + tdMarca(p.chave) + '<td><span class="abc-tag abc-' + p.classe + '">' + p.classe + '</span></td><td class="r">' + N1.format(p.itens) + '</td><td class="r">' + N1.format(p.acum) + '%</td><td class="r">' + BRL.format(p.fat) + "</td></tr>"; }).join("") || vazio(7, "Nenhum produto neste filtro."));
    setTxt("abcNota", "Mostrando " + N0.format(r.rows.length) + " de " + N0.format(l.itens.length) + " produtos" + (abcSt.c ? " (classe " + abcSt.c + ")" : "") + ".");
  }

  /* ---------- estoque por produto ---------- */
  var ESTQ_ST = { P: "Parado", R: "Ruptura", B: "Baixa cobertura", T: "Reposição", E: "Excesso", N: "Saldo negativo", O: "Normal" };
  var epCache = {}, epLoading = {};
  function epCarregar(id, cb) {
    window.ESTQ = window.ESTQ || {};
    if (window.ESTQ[id]) { cb(window.ESTQ[id]); return; }
    if (epLoading[id]) return;
    epLoading[id] = 1;
    var sc = document.createElement("script");
    sc.src = "estoque_produtos/" + id + ".js?t=" + (A ? encodeURIComponent(A.gerado_em) : Date.now());
    sc.onload = function () { epLoading[id] = 0; sc.remove(); render(); };
    sc.onerror = function () { epLoading[id] = 0; sc.remove(); epCache[id] = "erro"; render(); };
    document.head.appendChild(sc);
  }
  function epLinhas() {
    var E = A.estoque, id = ep.loja || "rede", D = window.ESTQ && window.ESTQ[id];
    if (!D) return null;
    var q = ep.q.toLowerCase(), rows = D.rows.filter(function (r) { return (!ep.st || r[7] === ep.st) && okMarca(r[1]) && (!q || String(r[0]).toLowerCase().indexOf(q) >= 0 || String(r[1]).toLowerCase().indexOf(q) >= 0); });
    var o = ep.ord, cmp = {
      valor: function (a, b) { return b[3] - a[3]; }, saldo: function (a, b) { return b[2] - a[2]; }, vendido: function (a, b) { return b[4] - a[4]; },
      cob: function (a, b) { return (a[6] == null ? 1e9 : a[6]) - (b[6] == null ? 1e9 : b[6]); }, dsv: function (a, b) { return (b[8] == null ? 1e9 : b[8]) - (a[8] == null ? 1e9 : a[8]); }, nome: function (a, b) { return String(a[0]).localeCompare(String(b[0]), "pt-BR"); }
    }[o];
    return { D: D, all: MARCA ? D.rows.filter(function (r) { return okMarca(r[1]); }) : D.rows, rows: rows.slice().sort(cmp) };
  }
  function estqprod() {
    var E = A.estoque, sel = $("epLoja");
    if (!E) { setHTML("epAviso", '<div class="aviso-box">Estoque ainda não coletado (estoque_atual.csv).</div>'); return; }
    var opt = '<option value="">TODAS AS LOJAS (por produto)</option>' + E.lojas.map(function (l) { return '<option value="' + esc(l.arq) + '">' + esc(l.loja) + "</option>"; }).join("");
    if (sel._o !== opt) { sel._o = opt; sel.innerHTML = opt; sel.value = ep.loja; }
    var id = ep.loja || "rede", jan = E.janela ? E.janela.dias : null;
    setTxt("epSub", "Situação de cada produto cruzando o saldo atual com as vendas da janela de " + (jan || 30) + " dia(s) com dados.");
    var av = "";
    if (!E.cruzamento) av += '<div class="aviso-box">Sem cruzamento estoque × vendas' + (E.match_pct != null && E.match_pct < 50 ? " (só " + N0.format(E.match_pct) + "% dos produtos casam)" : "") + ": parados, rupturas e cobertura ficam desligados.</div>";
    else if (jan != null && jan < 7) av += '<div class="aviso-box">Só há ' + jan + " dia(s) de vendas coletados. \"Parado\" e \"cobertura\" ficam mais confiáveis conforme o histórico cresce (janela ideal: 30 dias).</div>";
    setHTML("epAviso", av);
    if (epCache[id] === "erro") { setHTML("epTab", vazio(10, "Arquivo de produtos não encontrado — rode a coleta/Atualizar para gerá-lo.")); return; }
    var r = epLinhas();
    if (!r) { setHTML("epTab", vazio(10, "Carregando…")); epCarregar(id); return; }
    var cont = { "": r.all.length }; r.all.forEach(function (x) { cont[x[7]] = (cont[x[7]] || 0) + 1; });
    var soma = function (st, i) { return r.all.reduce(function (a, x) { return a + ((!st || x[7] === st) ? x[i] : 0); }, 0); };
    var kp = [["Produtos com saldo", N0.format(r.all.filter(function (x) { return x[2] > 0; }).length), "valor " + curto(soma("", 3))],
      ["Parados (sem venda)", N0.format(cont.P || 0), "valor parado " + curto(soma("P", 3))],
      ["Rupturas", N0.format(cont.R || 0), "vendeu e está sem saldo"],
      ["Baixa cobertura (< 7 d)", N0.format(cont.B || 0), "risco de ruptura"]];
    setHTML("epKpis", kp.map(function (k) { return '<article class="card stat stat--sm"><h2 class="card__title">' + k[0] + '</h2><div class="stat__bottom"><div class="stat__num"><div class="kpi">' + k[1] + '</div><div class="delta">' + k[2] + "</div></div></div></article>"; }).join(""));
    var ordem = [["", "Todos"], ["P", "Parados"], ["R", "Rupturas"], ["B", "Baixa cobertura"], ["T", "Reposição"], ["E", "Excesso"], ["N", "Negativos"], ["O", "Normais"]];
    setHTML("epChips", ordem.filter(function (o) { return !o[0] || cont[o[0]]; }).map(function (o) { return '<button type="button" data-st="' + o[0] + '" class="' + (ep.st === o[0] ? "is-active" : "") + '">' + o[1] + " <b>" + N0.format(cont[o[0]] || 0) + "</b></button>"; }).join(""));
    setTxt("epColRede", ep.loja ? "" : "Lojas (saldo / ruptura / parado)");
    var lim = r.rows.slice(0, ep.lim), rede = !ep.loja;
    setHTML("epTab", lim.map(function (x) {
      return "<tr><td>" + nomeProd(x[0], x[1]) + "</td>" + tdMarca(x[1]) + '<td><span class="st st-' + x[7] + '">' + ESTQ_ST[x[7]] + '</span></td><td class="r">' + N0.format(x[2]) + '</td><td class="r">' + BRL.format(x[3]) + '</td><td class="r">' + N1.format(x[4]) + '</td><td class="r">' + BRL.format(x[5]) + '</td><td class="r">' + (x[6] == null ? "—" : N1.format(x[6]) + " d") + '</td><td class="r">' + (x[8] == null ? (E.cruzamento ? '<span style="color:var(--muted)">&gt; ' + (r.D.hist || 0) + " d</span>" : "—") : N0.format(x[8]) + " d") + '</td><td class="r">' + (rede ? x[9] + " / " + x[10] + " / " + x[11] : "") + "</td></tr>";
    }).join("") || vazio(10, "Nenhum produto neste filtro."));
    var nome = ep.loja ? (E.lojas.filter(function (l) { return l.arq === ep.loja; })[0] || {}).loja : "Todas as lojas";
    setTxt("epTitulo", nome + " — " + N0.format(r.rows.length) + " produto(s)");
    $("epMais").style.display = r.rows.length > ep.lim ? "" : "none";
    setTxt("epNota", "Mostrando " + N0.format(lim.length) + " de " + N0.format(r.rows.length) + ". Cobertura = saldo ÷ média diária vendida na janela. Parado = tem saldo e não vendeu; Ruptura = vendeu e está sem saldo; Excesso = cobertura > 45 dias; Normal = entre 7 e 45 dias. Reposição = cobertura de 7 a 30 dias; Normal = cobertura de 31 a 45 dias.");
  }

  function estoque() {
    var E = A.estoque;
    if (!E) { setHTML("eAviso", '<div class="aviso-box">Estoque ainda não coletado (estoque_atual.csv).</div>'); return; }
    setTxt("eSub", "Foto atual do estoque consolidado · valor = " + (E.geral.base_valor || "sem coluna de custo"));
    var av = "";
    if (!E.tem_custo) av += '<div class="aviso-box">Sem coluna de custo no arquivo: o valor do estoque não pode ser calculado (defina COL_CUSTO no .env).</div>';
    if (!E.cruzamento) av += '<div class="aviso-box">' + (E.match_pct != null && E.match_pct < 50 ? "Só " + N0.format(E.match_pct) + "% dos produtos vendidos casam com o estoque — cobertura, parados e rupturas ficam desligados até a chave de produto conferir." : "Sem vendas no mês para cruzar — cobertura, parados e rupturas aparecem quando houver vendas.") + "</div>";
    setHTML("eAviso", av);
    var G = E.geral;
    setTxt("eVal", G.valor != null ? curto(G.valor) : "—"); setTxt("eValD", BRL.format(G.valor || 0));
    setTxt("eUn", N0.format(G.saldo)); setTxt("eUnD", N0.format(G.com_saldo) + " produtos com saldo · " + N0.format(G.zerados) + " zerados");
    setTxt("ePar", G.parado_valor != null ? curto(G.parado_valor) : "—"); setTxt("eParD", G.parados != null ? N0.format(G.parados) + " produtos sem venda" : "precisa de vendas no mês");
    setTxt("eRup", G.rupturas != null ? N0.format(G.rupturas) : "—"); setTxt("eRupD", G.rupturas != null ? "linhas loja × produto" : "precisa de vendas no mês");
    setHTML("eTab", E.lojas.map(function (l) {
      var cob = l.cobertura == null ? "—" : '<span class="badge ' + (l.cobertura < 7 ? "badge--erro" : l.cobertura < 15 ? "badge--progress" : "badge--hired") + '">' + N1.format(l.cobertura) + " d</span>";
      return "<tr><td>" + esc(l.loja) + "</td><td>" + esc(l.portal) + '</td><td class="r">' + N0.format(l.skus) + '</td><td class="r">' + N0.format(l.zerados) + '</td><td class="r">' + N0.format(l.saldo) + '</td><td class="r">' + (l.parado_valor != null ? BRL.format(l.parado_valor) : "—") + '</td><td class="r">' + (l.rupturas != null ? N0.format(l.rupturas) : "—") + '</td><td class="r">' + cob + '</td><td class="r">' + BRL.format(l.valor) + "</td></tr>";
    }).join(""));
    setHTML("eFoot", '<tr><td>Total (' + G.lojas + ' lojas)</td><td></td><td class="r">' + N0.format(G.skus) + '</td><td class="r">' + N0.format(G.zerados) + '</td><td class="r">' + N0.format(G.saldo) + '</td><td class="r">' + (G.parado_valor != null ? BRL.format(G.parado_valor) : "—") + '</td><td class="r">' + (G.rupturas != null ? N0.format(G.rupturas) : "—") + '</td><td></td><td class="r">' + BRL.format(G.valor || 0) + "</td></tr>");
    setHTML("eTop", E.top_valor.filter(function (p) { return okMarca(p.chave); }).slice(0, MARCA ? 100 : 25).map(function (p) { return "<tr><td>" + nomeProd(p.produto, p.chave) + "</td>" + tdMarca(p.chave) + '<td class="r">' + p.lojas + '</td><td class="r">' + N0.format(p.saldo) + '</td><td class="r">' + BRL.format(p.valor) + "</td></tr>"; }).join("") || vazio(5));
    setHTML("ePar2", E.parados.filter(function (p) { return okMarca(p.chave); }).slice(0, MARCA ? 100 : 30).map(function (p) { return "<tr><td>" + esc(p.loja) + "</td><td>" + nomeProd(p.produto, p.chave) + "</td>" + tdMarca(p.chave) + '<td class="r">' + N0.format(p.saldo) + '</td><td class="r">' + BRL.format(p.valor) + "</td></tr>"; }).join("") || vazio(5, E.cruzamento ? "Nenhum." : "Precisa de vendas no mês."));
    setHTML("eRup2", E.rupturas.filter(function (p) { return okMarca(p.chave); }).slice(0, MARCA ? 100 : 30).map(function (p) { return "<tr><td>" + esc(p.loja) + "</td><td>" + nomeProd(p.produto, p.chave) + "</td>" + tdMarca(p.chave) + '<td class="r">' + N0.format(p.saldo) + '</td><td class="r">' + N1.format(p.vendido) + '</td><td class="r">' + BRL.format(p.fat) + "</td></tr>"; }).join("") || vazio(6, E.cruzamento ? "Nenhuma." : "Precisa de vendas no mês."));
  }

  function alertas() {
    var D = A.dia, M = A.mes_bloco, E = A.estoque, C = A.cancelamentos || {};
    setTxt("aCD", D ? BRL.format(D.canc_valor) : "—"); setTxt("aCDD", D ? D.canc_linhas + " linhas · " + N1.format(D.canc_pct) + "% do bruto" : "sem vendas hoje");
    setTxt("aCM", M ? BRL.format(M.canc_valor) : "—"); setTxt("aCMD", M ? M.canc_linhas + " linhas · " + N1.format(M.canc_pct) + "% do bruto" : "");
    setTxt("aNL", E ? N0.format(E.geral.neg_linhas) : "—"); setTxt("aNLD", E ? N0.format(E.geral.neg_unid) + " unidades" : "");
    setTxt("aNV", E ? BRL.format(E.geral.neg_valor) : "—"); setTxt("aNVD", E ? "|saldo| × custo líquido" : "");
    setHTML("aCLoja", C.mes && C.mes.por_loja.length ? C.mes.por_loja.map(function (l) { return "<tr><td>" + esc(l.loja) + '</td><td class="r">' + l.linhas + '</td><td class="r">' + BRL.format(l.valor) + "</td></tr>"; }).join("") : vazio(3, "Nenhum cancelamento."));
    var nl = E ? E.lojas.filter(function (l) { return l.neg_linhas; }).sort(function (a, b) { return b.neg_valor - a.neg_valor; }) : [];
    setHTML("aNLoja", nl.map(function (l) { return "<tr><td>" + esc(l.loja) + '</td><td class="r">' + N0.format(l.neg_linhas) + '</td><td class="r">' + N0.format(l.neg_unid) + '</td><td class="r">' + BRL.format(l.neg_valor) + "</td></tr>"; }).join("") || vazio(4, "Nenhum saldo negativo."));
    setHTML("aCLista", C.dia && C.dia.lista.length ? C.dia.lista.filter(function (c) { return okMarca(c.chave); }).map(function (c) { return "<tr><td>" + esc(c.loja) + "</td><td>" + esc(c.produto) + "</td>" + tdMarca(c.chave) + '<td class="r">' + N1.format(c.qtd) + '</td><td class="r">' + BRL.format(c.valor) + "</td></tr>"; }).join("") : vazio(5, "Nenhum cancelamento hoje."));
    setHTML("aNLista", E && E.negativos.length ? E.negativos.filter(function (c) { return okMarca(c.chave); }).slice(0, MARCA ? 100 : 40).map(function (c) { return "<tr><td>" + esc(c.loja) + "</td><td>" + esc(c.produto) + "</td>" + tdMarca(c.chave) + '<td class="r">' + N0.format(c.saldo) + '</td><td class="r">' + BRL.format(c.valor) + "</td></tr>"; }).join("") : vazio(4, "Nenhum saldo negativo."));
  }

  function render() {
    var t = tab();
    setTxt("titulo", TITULOS[t] || "Análises");
    Object.keys(TITULOS).forEach(function (k) { var s = $("s-" + k); if (s) s.style.display = k === t ? "flex" : "none"; });
    if (!A) { setTxt("sinalTxt", "aguardando dados…"); $("sinal").className = "signal"; $("s-" + t).insertAdjacentHTML("afterbegin", ""); return; }
    var idade = Date.now() - new Date(A.gerado_em).getTime();
    $("sinal").className = "signal " + (idade > 3 * 3600e3 ? "is-stale" : "is-live");
    setTxt("sinalTxt", "gerado " + hhmm(A.gerado_em)); marcasSel();
    ({ resumo: resumo, vendas: vendas, produtos: produtos, abc: abc, estoque: estoque, estqprod: estqprod, alertas: alertas, repcurva: function () { RepUI.curva(A); }, reppedidos: function () { RepUI.pedidos(A); } }[t] || resumo)();
  }

  function carregar() {
    var s = document.createElement("script");
    s.src = "analises_data.js?t=" + Date.now();
    s.onload = function () { if (window.ANALISES && A && window.ANALISES.gerado_em !== A.gerado_em) { window.ESTQ = {}; epCache = {}; window.ABCMES = null; window.ABCD = {}; abcSt.per = null; } A = window.ANALISES || A; s.remove(); render(); };
    s.onerror = function () { s.remove(); render(); };
    document.head.appendChild(s);
  }
  $("btnAtualizar").addEventListener("click", carregar);
  $("vPeriodo").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (!b) return; per.v = b.getAttribute("data-p"); [].forEach.call($("vPeriodo").children, function (x) { x.classList.toggle("is-active", x === b); }); render(); });
  $("pPeriodo").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (!b) return; per.p = b.getAttribute("data-p"); [].forEach.call($("pPeriodo").children, function (x) { x.classList.toggle("is-active", x === b); }); render(); });
  $("pBusca").addEventListener("input", function (e) { busca = e.target.value; render(); });
  $("evoMes").addEventListener("change", function (e) { evoMes = e.target.value; render(); });
  $("abcPeriodo").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (!b) return; abcSt.p = b.getAttribute("data-p"); [].forEach.call($("abcPeriodo").children, function (x) { x.classList.toggle("is-active", x === b); }); render(); });
  [].forEach.call(document.querySelectorAll("select.sel-marca"), function (sel) { sel.addEventListener("change", function (e) { MARCA = e.target.value; ep.lim = 200; render(); }); });
  $("abcLoja").addEventListener("change", render);
  $("abcDe").addEventListener("change", function (e) { if (e.target.value) { abcSt.de = e.target.value; render(); } });
  $("abcAte").addEventListener("change", function (e) { if (e.target.value) { abcSt.ate = e.target.value; render(); } });
  $("abcBusca").addEventListener("input", function (e) { abcSt.q = e.target.value; render(); });
  $("abcClasse").addEventListener("click", function (e) { var b = e.target.closest("button[data-c]"); if (!b) return; abcSt.c = b.getAttribute("data-c"); [].forEach.call($("abcClasse").children, function (x) { x.classList.toggle("is-active", x === b); }); render(); });
  $("abcCsv").addEventListener("click", function () { var r = A && abcAtual(); if (!r) return; csvBaixar("curva_abc_" + (abcSt.p === "dia" ? A.data_ref : abcSt.p === "per" ? abcSt.de + "_a_" + abcSt.ate : A.mes) + ".csv", ["#", "Produto", "Classe", "Itens", "Acumulado %", "Faturamento"], r.rows.map(function (x) { return [x[0], x[1].produto, x[1].classe, x[1].itens, x[1].acum, x[1].fat]; })); });
  $("epLoja").addEventListener("change", function (e) { ep.loja = e.target.value; ep.lim = 200; render(); });
  $("epBusca").addEventListener("input", function (e) { ep.q = e.target.value; ep.lim = 200; render(); });
  $("epOrd").addEventListener("change", function (e) { ep.ord = e.target.value; render(); });
  $("epChips").addEventListener("click", function (e) { var b = e.target.closest("button[data-st]"); if (!b) return; ep.st = b.getAttribute("data-st"); ep.lim = 200; render(); });
  $("epMais").addEventListener("click", function () { ep.lim += 200; render(); });
  $("epCsv").addEventListener("click", function () { var r = A && epLinhas(); if (!r) return; csvBaixar("estoque_produto_" + (ep.loja || "rede") + ".csv", ["Produto", "Código", "Marca", "Situação", "Saldo", "Valor", "Vendido", "Faturamento", "Cobertura (dias)", "Dias sem vendas"], r.rows.map(function (x) { return [x[0], x[1], mar(x[1]), ESTQ_ST[x[7]], x[2], x[3], x[4], x[5], x[6], x[8] == null ? "> " + (r.D.hist || 0) : x[8]]; })); });
  if (window.RepUI) RepUI.init(render);
  window.addEventListener("hashchange", function () { render(); $("conteudo").parentElement.scrollTop = 0; });
  render(); carregar(); setInterval(carregar, 30000);
})();
