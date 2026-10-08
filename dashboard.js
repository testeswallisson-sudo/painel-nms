/* Dashboard de dados coletados — lê window.DADOS (painel/dados.js, gerado por dados_painel.py). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var D = window.DADOS || null, fPortal = "todos", busca = "";
  var BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  var N0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var N1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });

  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setHTML(el, h) { if (el && el._h !== h) { el._h = h; el.innerHTML = h; } }
  function setTxt(id, t) { var e = $(id); if (e && e.textContent !== t) e.textContent = t; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(iso) { var d = new Date(String(iso).replace(" ", "T")); return isNaN(d) ? "—" : pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function compacto(v) { return v >= 1e6 ? "R$ " + N1.format(v / 1e6) + " mi" : BRL.format(v); }

  function render() {
    if (!D) { setTxt("sinalTxt", "aguardando dados…"); $("sinal").className = "signal"; setHTML($("checks"), '<div class="empty">Rode o robô uma vez (ou <code>python dados_painel.py</code>) para gerar os números.</div>'); return; }
    var V = D.vendas, E = D.estoque;
    var idade = Date.now() - new Date(D.gerado_em).getTime();
    $("sinal").className = "signal " + (idade > 3 * 3600e3 ? "is-stale" : "is-live");
    setTxt("sinalTxt", "gerado " + hhmm(D.gerado_em));

    /* KPIs */
    setTxt("kFat", V ? compacto(V.totais.faturamento) : "—");
    setTxt("dFat", V ? V.totais.linhas + " linhas · " + V.totais.canceladas + " canceladas fora" : "sem vendas");
    setTxt("kItens", V ? N0.format(V.totais.itens) : "—");
    setTxt("dItens", V && V.cols.qtd ? "coluna " + V.cols.qtd : "coluna de quantidade não achada");
    setTxt("kSaldo", E ? N0.format(E.totais.saldo) : "—");
    setTxt("dSaldo", E ? (E.totais.valor != null ? BRL.format(E.totais.valor) + " a custo líquido · " : "") + E.totais.lojas + " lojas" : "sem estoque");
    var totLojas = E ? E.totais.lojas : (V ? V.totais.lojas : 0);
    setTxt("kLojas", V ? V.totais.lojas + " / " + totLojas : "—");
    setTxt("dLojas", V && E ? (totLojas - V.totais.lojas > 0 ? (totLojas - V.totais.lojas) + " ainda sem venda" : "todas com venda") : "");

    /* conferência */
    var ck = D.conferencias || [], ok = ck.filter(function (c) { return c.nivel === "ok"; }).length, er = ck.filter(function (c) { return c.nivel === "erro"; }).length;
    setTxt("kSaude", ok + " / " + ck.length);
    setTxt("dSaude", er ? er + " erro(s) para olhar" : "nenhum erro" + (ck.length - ok ? " · " + (ck.length - ok) + " aviso(s)" : ""));
    var ordem = { erro: 0, aviso: 1, ok: 2 };
    setHTML($("checks"), ck.slice().sort(function (a, b) { return ordem[a.nivel] - ordem[b.nivel]; }).map(function (c) {
      return '<div class="ck ck--' + c.nivel + '"><span class="ck__dot">' + (c.nivel === "ok" ? "✓" : "!") + '</span><div><div class="ck__t">' + esc(c.titulo) + "</div>" + (c.detalhe ? '<div class="ck__d">' + esc(c.detalhe) + "</div>" : "") + "</div></div>";
    }).join(""));

    /* portais */
    var ps = {}; [V, E].forEach(function (b, i) { if (b) Object.keys(b.portal).forEach(function (p) { (ps[p] = ps[p] || {})[i ? "e" : "v"] = b.portal[p]; }); });
    setHTML($("portais"), Object.keys(ps).sort().map(function (p) {
      var v = ps[p].v, e = ps[p].e;
      return "<tr><td><b>" + esc(p) + '</b></td><td class="r">' + (v ? N0.format(v.linhas) : "—") + '</td><td class="r">' + (e ? N0.format(e.linhas) : "—") + "</td><td>" + (e && e.extracao ? hhmm(e.extracao) : v && v.extracao ? hhmm(v.extracao) : "—") + "</td></tr>";
    }).join("") || '<tr><td colspan="4">—</td></tr>');

    /* faturamento por loja */
    var portaisV = V ? Object.keys(V.portal).sort() : [];
    setHTML($("fPortal"), ["todos"].concat(portaisV).map(function (p) { return '<button type="button" data-p="' + esc(p) + '" class="' + (p === fPortal ? "is-active" : "") + '">' + (p === "todos" ? "Todos" : esc(p)) + "</button>"; }).join(""));
    if (V) {
      var q = busca.toLowerCase();
      var rows = V.loja.filter(function (l) { return (fPortal === "todos" || l.portal === fPortal) && l.loja.toLowerCase().indexOf(q) >= 0; });
      var mxl = Math.max.apply(null, rows.map(function (l) { return l.faturamento; }).concat([1]));
      setHTML($("tVendas"), rows.map(function (l) {
        return "<tr><td>" + esc(l.loja) + "</td><td>" + esc(l.portal) + '</td><td class="r">' + N0.format(l.linhas) + '</td><td class="r">' + N1.format(l.itens) + '</td><td class="r">' + (l.produtos == null ? "—" : N0.format(l.produtos)) + '</td><td class="r">' + l.canceladas + '</td><td class="r">' + BRL.format(l.faturamento) + '<span class="bar-cell" style="width:' + Math.round(l.faturamento / mxl * 70) + 'px"></span></td></tr>';
      }).join("") || '<tr><td colspan="7">Nenhuma loja.</td></tr>');
      var s = rows.reduce(function (a, l) { a.l += l.linhas; a.i += l.itens; a.c += l.canceladas; a.f += l.faturamento; return a; }, { l: 0, i: 0, c: 0, f: 0 });
      setHTML($("fVendas"), "<tr><td>Total (" + rows.length + " lojas)</td><td></td><td class=\"r\">" + N0.format(s.l) + '</td><td class="r">' + N1.format(s.i) + '</td><td></td><td class="r">' + s.c + '</td><td class="r">' + BRL.format(s.f) + "</td></tr>");
    } else { setHTML($("tVendas"), '<tr><td colspan="7">Sem dados de vendas.</td></tr>'); setHTML($("fVendas"), ""); }

    /* estoque por loja */
    if (E) {
      var temValor = E.totais.valor != null;
      setTxt("thValor", temValor ? "Valor (custo)" : "");
      setHTML($("tEstoque"), E.loja.map(function (l) {
        return "<tr><td>" + esc(l.loja) + "</td><td>" + esc(l.portal) + '</td><td class="r">' + N0.format(l.linhas) + '</td><td class="r">' + N0.format(l.com_saldo) + '</td><td class="r">' + N0.format(l.zerados) + '</td><td class="r">' + (l.negativos ? '<span class="badge badge--erro">' + l.negativos + "</span>" : "0") + '</td><td class="r">' + N0.format(l.saldo) + '</td><td class="r">' + (temValor && l.valor != null ? BRL.format(l.valor) : "") + "</td></tr>";
      }).join(""));
      var t = E.totais;
      setHTML($("fEstoque"), "<tr><td>Total (" + t.lojas + ' lojas)</td><td></td><td class="r">' + N0.format(t.linhas) + '</td><td class="r">' + N0.format(t.com_saldo) + '</td><td class="r">' + N0.format(t.zerados) + '</td><td class="r">' + N0.format(t.negativos) + '</td><td class="r">' + N0.format(t.saldo) + '</td><td class="r">' + (temValor ? BRL.format(t.valor) : "") + "</td></tr>");
    } else { setHTML($("tEstoque"), '<tr><td colspan="8">Sem dados de estoque.</td></tr>'); setHTML($("fEstoque"), ""); }

    /* naturezas */
    setHTML($("tNat"), V && V.naturezas.length ? V.naturezas.map(function (n) { return "<tr" + (n.venda === false ? ' style="color:var(--muted)"' : "") + "><td>" + esc(n.natureza) + (n.venda === false ? ' <span class="kpi-mini">fora do faturamento</span>' : "") + '</td><td class="r">' + N0.format(n.linhas) + '</td><td class="r">' + BRL.format(n.faturamento) + "</td></tr>"; }).join("") : '<tr><td colspan="3">—</td></tr>');

    /* canceladas e negativos */
    var canc = V && V.canceladas || [], negs = E && E.negativos || [];
    setTxt("notaCanc", V ? V.totais.canceladas + " linhas canceladas (fora do faturamento)" + (canc.length < V.totais.canceladas ? " — mostrando as " + canc.length + " de maior valor" : "") + ". Lista completa: " + D.pasta_saida + "\\vendas_canceladas.csv" : "");
    setHTML($("tCanc"), canc.map(function (c) { return "<tr><td>" + esc(c.loja) + "</td><td>" + esc(c.produto || c.sku) + '</td><td class="r">' + N1.format(c.qtd) + '</td><td class="r">' + BRL.format(c.valor) + "</td></tr>"; }).join("") || '<tr><td colspan="4">Nenhuma linha cancelada.</td></tr>');
    setTxt("notaNeg", E ? E.totais.negativos + " linhas com saldo negativo" + (negs.length < E.totais.negativos ? " — mostrando os " + negs.length + " mais negativos" : "") + ". Lista completa por loja e produto: " + D.pasta_saida + "\\estoque_negativos.csv" : "");
    setHTML($("tNeg"), negs.map(function (c) { return "<tr><td>" + esc(c.loja) + "</td><td>" + esc(c.produto || c.sku) + '</td><td class="r">' + N0.format(c.saldo) + "</td></tr>"; }).join("") || '<tr><td colspan="3">Nenhum saldo negativo.</td></tr>');
    setTxt("notaIgn", D.lojas_ignoradas && D.lojas_ignoradas.length ? "Lojas ignoradas nos números: " + D.lojas_ignoradas.join(" · ") : "");

    /* colunas */
    function bloco(titulo, B, rot) {
      if (!B) return "";
      var usadas = {}; Object.keys(rot).forEach(function (k) { if (B.cols[k]) usadas[B.cols[k]] = rot[k]; });
      return "<p><b>" + titulo + "</b></p><p>" + Object.keys(rot).map(function (k) { return rot[k] + ": " + (B.cols[k] ? "<code class=\"usada\">" + esc(B.cols[k]) + "</code>" : "<code>não achada</code>"); }).join(" · ") + "</p><p>Todas as colunas do arquivo: " + B.todas_colunas.map(function (c) { return "<code" + (usadas[c] ? ' class="usada"' : "") + ">" + esc(c) + "</code>"; }).join(" ") + "</p>";
    }
    setHTML($("colunas"), bloco("Vendas", V, { loja: "loja", valor: "faturamento", qtd: "quantidade", data: "data", sku: "produto" }) + bloco("Estoque", E, { loja: "loja", saldo: "saldo", custo: "custo", sku: "produto" }));
  }

  function curto(v) { return v >= 1e6 ? "R$ " + N1.format(v / 1e6) + " mi" : v >= 1000 ? "R$ " + N1.format(v / 1000) + " mil" : "R$ " + N0.format(v); }
  var MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];


  function carregar() {
    var s = document.createElement("script");
    s.src = "dados.js?t=" + Date.now();
    s.onload = function () { D = window.DADOS || D; s.remove(); render(); };
    s.onerror = function () { s.remove(); render(); };
    document.head.appendChild(s);
  }
  $("btnAtualizar").addEventListener("click", carregar);
  $("busca").addEventListener("input", function (e) { busca = e.target.value; render(); });
  $("fPortal").addEventListener("click", function (e) { var b = e.target.closest("button[data-p]"); if (b) { fPortal = b.getAttribute("data-p"); render(); } });
  render(); carregar(); setInterval(carregar, 30000);
})();
