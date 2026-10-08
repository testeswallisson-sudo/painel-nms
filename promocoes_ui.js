/* Módulo Encarte e promoções — lê painel/promocoes.js (gerado por promocoes_dados.py). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var N0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var N1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setHTML(id, h) { var el = $(id); if (el && el._h !== h) { el._h = h; el.innerHTML = h; } }
  function setTxt(id, t) { var e = $(id); if (e && e.textContent !== t) e.textContent = t; }
  function dt(iso) { return iso ? iso.split("-").reverse().join("/") : "—"; }
  function dm(iso) { return iso ? iso.split("-").reverse().slice(0, 2).join("/") : ""; }
  function curto(v) { return v >= 1e6 ? "R$ " + N1.format(v / 1e6) + " mi" : v >= 1000 ? "R$ " + N1.format(v / 1000) + " mil" : "R$ " + N0.format(v); }
  function vazio(c, t) { return '<tr><td colspan="' + c + '">' + (t || "Sem dados.") + "</td></tr>"; }
  function nomeProd(d, c) { return esc(d || c) + (d && c && String(d) !== String(c) ? ' <span class="kpi-mini">' + esc(c) + "</span>" : ""); }
  function kpis(id, k) { setHTML(id, k.map(function (x) { return '<article class="card stat stat--sm"><h2 class="card__title">' + x[0] + '</h2><div class="stat__bottom"><div class="stat__num"><div class="kpi"' + (x[3] ? ' style="font-size:20px"' : "") + ">" + x[1] + '</div><div class="delta">' + (x[2] || "&nbsp;") + "</div></div></div></article>"; }).join("")); }
  function varHtml(v) { return v == null ? "—" : '<span style="color:' + (v >= 0 ? "var(--hired-ink)" : "var(--danger)") + '">' + (v >= 0 ? "+" : "") + N1.format(v) + "%</span>"; }
  var STAT = { vigente: ["badge badge--hired", "Vigente"], encerrada: ["badge badge--none", "Encerrada"], futura: ["badge badge--progress", "Futura"] };

  var pc = { status: "", q: "", sel: "" }, pt = { camp: "", q: "" }, px = { foco: "A", marca: "", q: "", ord: "fat", cob: 0, semPromo: false, lim: 200 };
  var carga = { stamp: null, rodando: false, erro: false }, A = null, render = function () { };

  function carregar(a) {
    A = a;
    if (carga.stamp !== a.gerado_em) { window.PROMO = null; carga = { stamp: a.gerado_em, rodando: false, erro: false }; }
    if (window.PROMO) return true;
    if (carga.rodando || carga.erro) return false;
    carga.rodando = true;
    var sc = document.createElement("script"); sc.src = "promocoes.js?t=" + encodeURIComponent(a.gerado_em);
    sc.onload = function () { carga.rodando = false; sc.remove(); render(); };
    sc.onerror = function () { carga.rodando = false; carga.erro = true; sc.remove(); render(); };
    document.head.appendChild(sc);
    return false;
  }
  function pronto(avisoId, tabId, cols) {
    if (carregar(A)) return true;
    setHTML(avisoId, carga.erro ? '<div class="aviso-box">Arquivo promocoes.js não encontrado — rode o <b>abrir_analises.bat</b> para gerá-lo.</div>' : "");
    if (tabId) setHTML(tabId, vazio(cols, carga.erro ? "Sem dados." : "Carregando…"));
    return false;
  }
  function semCampanha() {
    return '<div class="aviso-box">Nenhuma campanha encontrada. O robô lê <b>Nome Campanha</b>, <b>Data Inicio Promocao</b> e <b>Data Termino Promocao</b> do relatório de estoque; assim que ele rodar com essas colunas, as campanhas aparecem aqui (e ficam guardadas no histórico).</div>';
  }

  /* ---------------- CAMPANHAS ---------------- */
  function barras(c) {
    var D = c.diario || []; if (!D.length) return '<div class="empty">Sem vendas no período da campanha.</div>';
    var W = 1000, H = 220, L = 70, R = 12, T = 18, B = 34, pw = W - L - R, ph = H - T - B, step = pw / D.length, bw = Math.min(46, step * 0.62);
    var mx = Math.max.apply(null, D.map(function (x) { return x[1]; }).concat([c.base_dia || 0, 1])) * 1.12;
    var s = '<svg viewBox="0 0 ' + W + " " + H + '" role="img" aria-label="Faturamento por dia da campanha" style="width:100%;height:auto">';
    for (var g = 0; g <= 3; g++) { var gy = T + ph - ph / 3 * g; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + gy + '" y2="' + gy + '" stroke="currentColor" stroke-opacity=".12"/><text x="' + (L - 8) + '" y="' + (gy + 4) + '" text-anchor="end" font-size="11" fill="currentColor" fill-opacity=".6">' + curto(mx / 1.12 * g / 3 * 1.12 / 1.12 * 1.12).replace("R$ ", "") + "</text>"; }
    D.forEach(function (x, i) { var h = x[1] / mx * ph, cx = L + step * i + step / 2; s += '<rect x="' + (cx - bw / 2) + '" y="' + (T + ph - h) + '" width="' + bw + '" height="' + h + '" rx="3" fill="var(--green-900)" fill-opacity=".85"><title>' + dt(x[0]) + " — " + BRL.format(x[1]) + "</title></rect>";
      if (D.length <= 31) s += '<text x="' + cx + '" y="' + (H - 12) + '" text-anchor="middle" font-size="11" fill="currentColor" fill-opacity=".65">' + dm(x[0]) + "</text>"; });
    if (c.base_dia) { var by = T + ph - c.base_dia / mx * ph; s += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + by + '" y2="' + by + '" stroke="var(--danger)" stroke-dasharray="6 5" stroke-width="1.6"/><text x="' + (W - R) + '" y="' + (by - 6) + '" text-anchor="end" font-size="11" fill="var(--danger)">média antes: ' + BRL.format(c.base_dia) + "/dia</text>"; }
    return s + "</svg>";
  }
  function detalhe(c) {
    var h = '<article class="card card--pad-table"><h2 class="card__title">' + esc(c.nome) + ' <span class="kpi-mini">' + dt(c.ini) + " a " + dt(c.fim) + "</span></h2>" +
      '<p class="nota" style="margin:0 0 8px">' + N0.format(c.produtos) + " produto(s) em " + N0.format(c.lojas) + " loja(s) · " + N0.format(c.sem_venda || 0) + " produto(s) da campanha sem nenhuma venda no período · " + (c.base_dias ? "comparação com os " + c.base_dias + " dia(s) com dados antes do início" : "sem dias anteriores para comparar") + ".</p>" + barras(c) + "</article>";
    h += '<article class="card card--pad-table"><h2 class="card__title">Produtos da campanha com maior faturamento</h2><div class="scroll scroll--tall"><table class="table table--data"><thead><tr><th>Produto</th><th>Marca</th><th class="r">Faturamento</th><th class="r">Qtd</th><th class="r">Lojas</th><th class="r">Variação vs. antes</th></tr></thead><tbody>' +
      (c.top.map(function (p) { return "<tr><td>" + nomeProd(p[1], p[0]) + "</td><td>" + esc(p[2]) + '</td><td class="r">' + BRL.format(p[3]) + '</td><td class="r">' + N0.format(p[4]) + '</td><td class="r">' + N0.format(p[5]) + '</td><td class="r">' + varHtml(p[6]) + "</td></tr>"; }).join("") || vazio(6, "Sem vendas.")) + "</tbody></table></div></article>";
    h += '<div class="row row--even"><article class="card card--pad-table"><h2 class="card__title">Marcas</h2><div class="scroll scroll--tall"><table class="table table--data"><thead><tr><th>Marca</th><th class="r">Produtos</th><th class="r">Faturamento</th></tr></thead><tbody>' +
      (c.marcas.map(function (m) { return "<tr><td>" + esc(m[0]) + '</td><td class="r">' + N0.format(m[3]) + '</td><td class="r">' + BRL.format(m[1]) + "</td></tr>"; }).join("") || vazio(3)) + "</tbody></table></div></article>" +
      '<article class="card card--pad-table"><h2 class="card__title">Lojas</h2><div class="scroll scroll--tall"><table class="table table--data"><thead><tr><th>Loja</th><th class="r">Qtd</th><th class="r">Faturamento</th></tr></thead><tbody>' +
      (c.lojas_top.map(function (l) { return "<tr><td>" + esc(l[0]) + '</td><td class="r">' + N0.format(l[2]) + '</td><td class="r">' + BRL.format(l[1]) + "</td></tr>"; }).join("") || vazio(3)) + "</tbody></table></div></article></div>";
    return h;
  }
  function campanhas(a) {
    A = a;
    if (!pronto("pcAviso", "pcTab", 11)) return;
    var P = window.PROMO, q = pc.q.toLowerCase();
    if (!P.campanhas.length) { setHTML("pcAviso", semCampanha()); setHTML("pcTab", vazio(11, "Sem campanhas.")); setHTML("pcKpis", ""); setHTML("pcDet", ""); return; }
    setHTML("pcAviso", "");
    var all = P.campanhas.filter(function (c) { return (!pc.status || c.status === pc.status) && (!q || c.nome.toLowerCase().indexOf(q) >= 0); });
    var vig = all.filter(function (c) { return c.status === "vigente"; }).length, fat = all.reduce(function (s, c) { return s + (c.fat || 0); }, 0);
    var comLift = all.filter(function (c) { return c.lift != null; }).sort(function (x, y) { return y.lift - x.lift; })[0];
    var top = all.filter(function (c) { return c.fat; }).sort(function (x, y) { return y.fat - x.fat; })[0];
    kpis("pcKpis", [["Campanhas", N0.format(all.length), N0.format(vig) + " vigente(s)"], ["Faturamento nas campanhas", curto(fat), BRL.format(fat) + " (campanhas sobrepostas somam duas vezes)"],
      ["Maior faturamento", top ? curto(top.fat) : "—", top ? esc(top.nome) : "", 1], ["Melhor variação vs. antes", comLift ? (comLift.lift >= 0 ? "+" : "") + N1.format(comLift.lift) + "%" : "—", comLift ? esc(comLift.nome) : ""]]);
    if (pc.sel && !all.some(function (c) { return c.id === pc.sel; })) pc.sel = "";
    setHTML("pcTab", all.map(function (c) {
      var s = STAT[c.status];
      return '<tr class="lnk' + (c.id === pc.sel ? " is-exp" : "") + '" data-c="' + esc(c.id) + '"><td>' + esc(c.nome) + "</td><td class=\"nw\">" + dt(c.ini) + (c.fim !== c.ini ? " a " + dt(c.fim) : "") + '</td><td><span class="' + s[0] + '">' + s[1] + '</span></td><td class="r">' + N0.format(c.produtos) + '</td><td class="r">' + N0.format(c.lojas) + '</td><td class="r">' + (c.fat == null ? "—" : BRL.format(c.fat)) + '</td><td class="r">' + (c.fat == null ? "—" : N0.format(c.qtd)) + '</td><td class="r">' + (c.fat_dia == null ? "—" : BRL.format(c.fat_dia)) + '</td><td class="r">' + (c.base_dia == null ? "—" : BRL.format(c.base_dia)) + '</td><td class="r">' + varHtml(c.lift) + '</td><td class="r">' + (c.part == null ? "—" : N1.format(c.part) + "%") + "</td></tr>";
    }).join("") || vazio(11, "Nenhuma campanha neste filtro."));
    var sel = P.campanhas.filter(function (c) { return c.id === pc.sel; })[0];
    setHTML("pcDet", sel ? detalhe(sel) : "");
    setTxt("pcNota", "Faturamento = vendas (só naturezas de venda) dos produtos × lojas da campanha entre o início e o término dela. Variação = faturamento/dia na campanha ÷ faturamento/dia dos mesmos produtos × lojas nos dias com dados imediatamente anteriores, menos 1. A campanha é identificada pelo relatório de estoque (Nome Campanha + datas); campanhas vistas são guardadas em promocoes_historico.json.");
  }

  /* ---------------- MAIORES FATURAMENTOS ---------------- */
  function top(a) {
    A = a;
    if (!pronto("ptAviso", "ptProd", 5)) return;
    var P = window.PROMO;
    if (!P.campanhas.length) { setHTML("ptAviso", semCampanha()); return; }
    var sel = $("ptCamp"), opt = '<option value="">TODAS AS CAMPANHAS</option>' + P.campanhas.filter(function (c) { return c.fat; }).map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.nome) + " (" + dm(c.ini) + (c.fim !== c.ini ? "–" + dm(c.fim) : "") + ")</option>"; }).join("");
    if (sel._o !== opt) { sel._o = opt; sel.innerHTML = opt; }
    sel.value = pt.camp;
    var use = P.campanhas.filter(function (c) { return c.fat && (!pt.camp || c.id === pt.camp); }), pm = {}, mm = {}, lm = {}, tot = 0, q = pt.q.toLowerCase();
    use.forEach(function (c) {
      c.top.forEach(function (p) { var x = pm[p[0]] = pm[p[0]] || { k: p[0], d: p[1], m: p[2], f: 0, q: 0 }; x.f += p[3]; x.q += p[4]; });
      c.marcas.forEach(function (m) { var x = mm[m[0]] = mm[m[0]] || { m: m[0], f: 0, n: 0 }; x.f += m[1]; x.n += m[3]; });
      c.lojas_top.forEach(function (l) { var x = lm[l[0]] = lm[l[0]] || { l: l[0], f: 0, q: 0 }; x.f += l[1]; x.q += l[2]; });
      tot += c.fat;
    });
    var byF = function (a, b) { return b.f - a.f; };
    var PR = Object.keys(pm).map(function (k) { return pm[k]; }).filter(function (x) { return !q || x.d.toLowerCase().indexOf(q) >= 0 || x.m.toLowerCase().indexOf(q) >= 0 || x.k.toLowerCase().indexOf(q) >= 0; }).sort(byF);
    var MA = Object.keys(mm).map(function (k) { return mm[k]; }).filter(function (x) { return !q || x.m.toLowerCase().indexOf(q) >= 0; }).sort(byF), LO = Object.keys(lm).map(function (k) { return lm[k]; }).sort(byF);
    setHTML("ptAviso", "");
    setTxt("ptSub", (pt.camp ? "Campanha selecionada" : "Soma de todas as campanhas com vendas") + " · cada produto mostra o faturamento dentro do período da campanha");
    kpis("ptKpis", [["Faturamento", curto(tot), BRL.format(tot)], ["Produto líder", PR[0] ? curto(PR[0].f) : "—", PR[0] ? esc(PR[0].d) : "", 1], ["Marca líder", MA[0] ? curto(MA[0].f) : "—", MA[0] ? esc(MA[0].m) : "", 1], ["Loja líder", LO[0] ? curto(LO[0].f) : "—", LO[0] ? esc(LO[0].l) : "", 1]]);
    var pr = function (v) { return tot ? N1.format(v / tot * 100) + "%" : "—"; };
    setHTML("ptProd", PR.slice(0, 200).map(function (x) { return "<tr><td>" + nomeProd(x.d, x.k) + "</td><td>" + esc(x.m) + '</td><td class="r">' + BRL.format(x.f) + '</td><td class="r">' + N0.format(x.q) + '</td><td class="r">' + pr(x.f) + "</td></tr>"; }).join("") || vazio(5));
    setHTML("ptMarca", MA.slice(0, 200).map(function (x) { return "<tr><td>" + esc(x.m) + '</td><td class="r">' + N0.format(x.n) + '</td><td class="r">' + BRL.format(x.f) + '</td><td class="r">' + pr(x.f) + "</td></tr>"; }).join("") || vazio(4));
    setHTML("ptLoja", LO.map(function (x) { return "<tr><td>" + esc(x.l) + '</td><td class="r">' + BRL.format(x.f) + '</td><td class="r">' + N0.format(x.q) + '</td><td class="r">' + pr(x.f) + "</td></tr>"; }).join("") || vazio(4));
    setTxt("ptNota", "Produtos: até 150 por campanha (os de maior faturamento). Ao somar várias campanhas, um mesmo produto/venda em duas campanhas é contado nas duas.");
  }

  /* ---------------- PRÓXIMO ENCARTE ---------------- */
  var I = { chave: 0, produto: 1, marca: 2, classe: 3, fat: 4, qtd: 5, lv: 6, saldo: 7, valor: 8, cob: 9, mg: 10, pm: 11, lp: 12, vpar: 13, lr: 14, lpromo: 15, pn: 16, pi: 17, pl: 18, ls: 19 };
  function leitura(r) {
    var cl = r[I.classe], cob = r[I.cob], t;
    if (cl === "S") t = "Sem giro: candidato a liquidação / combo";
    else if (cob != null && cob > 45) t = "Excesso (" + N0.format(cob) + " d): girar com promoção";
    else if (cl === "A") t = cob == null ? "Curva A" : cob < 15 ? "Curva A com estoque curto: repor antes de divulgar" : cob >= 30 ? "Curva A com estoque: bom destaque" : "Curva A: confira o estoque antes";
    else t = cl === "B" ? "Curva B: complemento" : "Curva C: baixo giro";
    if (r[I.lr] > 0) t += " · ruptura em " + r[I.lr] + " loja(s)";
    if (r[I.lpromo] > 0) t += " · já em promoção em " + r[I.lpromo] + " loja(s)";
    return t;
  }
  var CLS = { A: "st st-T", B: "st st-O", C: "st st-B", S: "st st-P" };
  function proximo(a) {
    A = a;
    if (!pronto("pxAviso", "pxTab", 15)) return;
    var P = window.PROMO, todas = P.candidatos, q = px.q.toLowerCase();
    setTxt("pxSub", "Candidatos a partir das vendas dos últimos " + P.dias30 + " dia(s) com dados, estoque atual da rede, margem e histórico de promoções.");
    var marcas = {}; todas.forEach(function (r) { if (r[I.marca]) marcas[r[I.marca]] = 1; });
    var mo = '<option value="">TODAS AS MARCAS</option>' + Object.keys(marcas).sort(function (x, y) { return x.localeCompare(y, "pt-BR"); }).map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + "</option>"; }).join("");
    var sm = $("pxMarca"); if (sm._o !== mo) { sm._o = mo; sm.innerHTML = mo; } sm.value = px.marca;
    $("pxFoco").value = px.foco; $("pxOrd").value = px.ord; $("pxCob").value = px.cob;
    [].forEach.call($("pxPromo").children, function (b) { b.classList.toggle("is-active", (b.getAttribute("data-v") === "1") === px.semPromo); });
    var rows = todas.filter(function (r) {
      if (px.foco === "EXC") { if (!(r[I.classe] !== "S" && r[I.cob] != null && r[I.cob] > 45)) return false; }
      else if (px.foco && r[I.classe] !== px.foco) return false;
      if (px.marca && r[I.marca] !== px.marca) return false;
      if (px.cob > 0 && r[I.classe] !== "S" && (r[I.cob] == null || r[I.cob] < px.cob)) return false;
      if (px.semPromo && r[I.lpromo] > 0) return false;
      return !q || String(r[I.produto]).toLowerCase().indexOf(q) >= 0 || String(r[I.chave]).toLowerCase().indexOf(q) >= 0;
    });
    var ordem = { fat: function (x, y) { return y[I.fat] - x[I.fat]; }, valor: function (x, y) { return y[I.valor] - x[I.valor]; }, vpar: function (x, y) { return y[I.vpar] - x[I.vpar]; },
      cob: function (x, y) { return (y[I.cob] == null ? -1 : y[I.cob]) - (x[I.cob] == null ? -1 : x[I.cob]); }, mg: function (x, y) { return (y[I.mg] == null ? -1e9 : y[I.mg]) - (x[I.mg] == null ? -1e9 : x[I.mg]); } }[px.ord];
    rows.sort(ordem);
    var sf = rows.reduce(function (s, r) { return s + r[I.fat]; }, 0), sv = rows.reduce(function (s, r) { return s + r[I.valor]; }, 0), sp = rows.reduce(function (s, r) { return s + r[I.vpar]; }, 0);
    setHTML("pxAviso", "");
    kpis("pxKpis", [["Produtos no filtro", N0.format(rows.length), "classes na rede: A " + N0.format(P.classes.A) + " · B " + N0.format(P.classes.B) + " · C " + N0.format(P.classes.C)], ["Faturamento (30 d)", curto(sf), BRL.format(sf)], ["Valor em estoque", curto(sv), "custo × saldo da rede"], ["Valor parado nas lojas", curto(sp), "estoque sem venda em 30 d, por loja"]]);
    var lim = rows.slice(0, px.lim);
    setHTML("pxTab", lim.map(function (r) {
      return "<tr><td>" + nomeProd(r[I.produto], r[I.chave]) + "</td><td>" + esc(r[I.marca]) + '</td><td><span class="' + CLS[r[I.classe]] + '">' + (r[I.classe] === "S" ? "Sem giro" : r[I.classe]) + '</span></td><td class="r">' + BRL.format(r[I.fat]) + '</td><td class="r">' + N0.format(r[I.qtd]) + '</td><td class="r">' + N0.format(r[I.lv]) + '</td><td class="r">' + N0.format(r[I.saldo]) + '</td><td class="r">' + (r[I.cob] == null ? "—" : N1.format(r[I.cob]) + " d") + '</td><td class="r">' + (r[I.mg] == null ? "—" : N1.format(r[I.mg]) + "%") + '</td><td class="r">' + (r[I.pm] == null ? "—" : BRL.format(r[I.pm])) + '</td><td class="r">' + (r[I.lp] ? N0.format(r[I.lp]) : "—") + '</td><td class="r">' + (r[I.vpar] ? BRL.format(r[I.vpar]) : "—") + '</td><td class="r">' + (r[I.lr] ? N0.format(r[I.lr]) : "—") + "</td><td>" + (r[I.pn] ? esc(r[I.pn]) + ' <span class="kpi-mini">' + dm(r[I.pi]) + "</span> " + varHtml(r[I.pl]) : '<span style="color:var(--muted)">nunca</span>') + "</td><td>" + esc(leitura(r)) + "</td></tr>";
    }).join("") || vazio(15, "Nenhum produto neste filtro."));
    setTxt("pxTitulo", ({ A: "Curva A", B: "Curva B", C: "Curva C", S: "Sem giro", EXC: "Excesso de estoque", "": "Todos os candidatos" })[px.foco] + " — " + N0.format(rows.length) + " produto(s)");
    $("pxMais").style.display = rows.length > lim.length ? "" : "none";
    setTxt("pxNota", "Mostrando " + N0.format(lim.length) + " de " + N0.format(rows.length) + ".");
    $("pxCsv")._rows = rows;
    setTxt("pxFormula", "Curva = classe do produto na rede pelo faturamento dos últimos 30 dias (A até 80%, B até 95%, C o restante). Cobertura = saldo da rede ÷ venda diária (30 d). Sem giro = há saldo e nenhuma venda em 30 dias. Lojas c/ estoque parado = lojas com saldo e sem venda do produto no período. Margem = (faturamento − custo médio) ÷ faturamento. Variação da última promoção = faturamento/dia na campanha vs. antes.");
  }

  function init(r) {
    render = r;
    $("pcStatus").addEventListener("change", function (e) { pc.status = e.target.value; render(); });
    $("pcBusca").addEventListener("input", function (e) { pc.q = e.target.value; render(); });
    $("pcTab").addEventListener("click", function (e) { var tr = e.target.closest("tr[data-c]"); if (!tr) return; var id = tr.getAttribute("data-c"); pc.sel = pc.sel === id ? "" : id; render(); });
    $("ptCamp").addEventListener("change", function (e) { pt.camp = e.target.value; render(); });
    $("ptBusca").addEventListener("input", function (e) { pt.q = e.target.value; render(); });
    $("pxFoco").addEventListener("change", function (e) { px.foco = e.target.value; px.ord = e.target.value === "S" ? "valor" : "fat"; px.lim = 200; render(); });
    $("pxMarca").addEventListener("change", function (e) { px.marca = e.target.value; px.lim = 200; render(); });
    $("pxBusca").addEventListener("input", function (e) { px.q = e.target.value; px.lim = 200; render(); });
    $("pxOrd").addEventListener("change", function (e) { px.ord = e.target.value; render(); });
    $("pxCob").addEventListener("change", function (e) { var v = parseFloat(e.target.value); px.cob = v >= 0 ? v : 0; px.lim = 200; render(); });
    $("pxPromo").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (!b) return; px.semPromo = b.getAttribute("data-v") === "1"; px.lim = 200; render(); });
    $("pxMais").addEventListener("click", function () { px.lim += 200; render(); });
    $("pxCsv").addEventListener("click", function () {
      var rows = $("pxCsv")._rows || []; if (!rows.length) return;
      var f = function (v) { v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
      var cab = ["Cód.", "Produto", "Marca", "Curva", "Faturamento 30d", "Qtd 30d", "Lojas vendendo", "Saldo rede", "Valor em estoque", "Cobertura (dias)", "Margem %", "Preço médio", "Lojas c/ estoque parado", "Valor parado", "Lojas em ruptura", "Lojas já em promoção", "Última promoção", "Início", "Variação %", "Leitura"];
      var t = "﻿" + [cab].concat(rows.map(function (r) { return [r[0], r[1], r[2], r[3] === "S" ? "Sem giro" : r[3], r[4], r[5], r[6], r[7], r[8], r[9], r[10], r[11], r[12], r[13], r[14], r[15], r[16], r[17], r[18], leitura(r)]; })).map(function (r) { return r.map(f).join(";"); }).join("\r\n");
      var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = "proximo_encarte.csv"; document.body.appendChild(a); a.click(); a.remove();
    });
  }
  window.PromoUI = { campanhas: campanhas, top: top, proximo: proximo, init: init };
})();
