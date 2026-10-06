/* Módulo Reposição · Lojas — Análise de curva + Pedidos.
   Lê painel/reposicao/lN.js (gerado por analises_dados.py). Os pedidos ficam no navegador (localStorage) e expiram em 48 h. */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var N0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  var N1 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1 });
  var MES = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  var EXP_MS = 48 * 3600e3;
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function setHTML(id, h) { var el = $(id); if (el && el._h !== h) { el._h = h; el.innerHTML = h; } }
  function setTxt(id, t) { var e = $(id); if (e && e.textContent !== t) e.textContent = t; }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dt(iso) { return iso ? iso.split("-").reverse().join("/") : "—"; }
  function quando(ms) { var d = new Date(ms); return pad(d.getDate()) + "/" + pad(d.getMonth() + 1) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function csvBaixar(nome, cab, linhas) {
    var f = function (v) { v = v == null ? "" : String(v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; };
    var t = "﻿" + [cab].concat(linhas).map(function (r) { return r.map(f).join(";"); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = nome; document.body.appendChild(a); a.click(); a.remove();
  }

  /* ---------- armazenamento (parâmetros e pedidos) ---------- */
  var mem = {};
  function lerLS(k, pad_) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : pad_; } catch (e) { return mem[k] !== undefined ? mem[k] : pad_; } }
  function gravarLS(k, v) { mem[k] = v; try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { } }
  var P = lerLS("nms_repo_params", null) || { dias: 30, lead: 7, base: "30" };
  var R = { loja: "", marca: "", q: "", visao: "lp", so: true, ord: "sug", lim: 200, exp: {} };
  var PD = { f: "ativos", q: "", loja: "", ok: "" };

  var ped = lerLS("nms_pedidos_v1", []);
  function salvarPed() { gravarLS("nms_pedidos_v1", ped); }
  function ativo(p) { return Date.now() - p.t < EXP_MS; }
  function qtdPedida() { var m = {}; ped.forEach(function (p) { if (ativo(p)) { var c = p.loja + "|" + p.k; m[c] = (m[c] || 0) + p.qtd; } }); return m; }
  function novoId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function pedir(loja, k, desc, qtd) { qtd = Math.round(+qtd); if (!(qtd > 0)) return false; ped.push({ id: novoId(), t: Date.now(), loja: loja, k: String(k), desc: desc || String(k), qtd: qtd }); salvarPed(); return true; }

  /* ---------- carga dos arquivos por loja ---------- */
  var A = null, carga = { stamp: null, falta: 0, erro: false };
  function lojasIdx() { return (A && A.estoque && A.estoque.lojas || []).filter(function (l) { return l.arq; }); }
  function carregar(cb) {
    var ls = lojasIdx(), stamp = A.gerado_em;
    if (carga.stamp !== stamp) { window.REPO = {}; carga = { stamp: stamp, falta: 0, erro: false, rodando: false }; }
    var falta = ls.filter(function (l) { return !(window.REPO && window.REPO[l.arq]); });
    if (!falta.length) return true;
    if (carga.rodando || carga.erro) return false;
    carga.rodando = true; carga.falta = falta.length;
    falta.forEach(function (l) {
      var sc = document.createElement("script"); sc.src = "reposicao/" + l.arq + ".js?t=" + encodeURIComponent(stamp);
      var fim = function (ok) { sc.remove(); if (!ok) carga.erro = true; if (--carga.falta === 0) { carga.rodando = false; cb(); } };
      sc.onload = function () { fim(true); }; sc.onerror = function () { fim(false); };
      document.head.appendChild(sc);
    });
    return false;
  }

  /* ---------- cálculo ---------- */
  function linhas() {
    var pm = qtdPedida(), out = [];
    Object.keys(window.REPO).forEach(function (arq) {
      var D = window.REPO[arq], d3 = Math.max(1, D.dias3), d30 = Math.max(1, D.dias30);
      D.rows.forEach(function (r) {
        var dem = P.base === "3m" ? (r[3] + r[4] + r[5]) / d3 : P.base === "dia" ? r[9] : P.base === "sem" ? r[10] / Math.max(1, D.dias_sem) : r[8] / d30;
        var pedq = pm[D.loja + "|" + r[0]] || 0, saldo = r[2];
        var alvo = dem * (P.dias + P.lead), sug = dem > 0 ? Math.max(0, Math.ceil(alvo - (Math.max(saldo, 0) + pedq) - 1e-9)) : 0;
        out.push({ k: r[0], desc: r[1], loja: D.loja, saldo: saldo, marca: r[11] || "", m: [r[3], r[4], r[5]], dsv: r[6], ult: r[7], dem: dem, ped: pedq, sug: sug, cob: dem > 0 && saldo > 0 ? saldo / dem : null });
      });
    });
    return out;
  }
  var ORD = {
    sug: function (a, b) { return b.sug - a.sug || b.m[2] - a.m[2]; },
    mes: function (a, b) { return b.m[2] - a.m[2]; },
    dsv: function (a, b) { return (b.dsv == null ? 1e9 : b.dsv) - (a.dsv == null ? 1e9 : a.dsv); },
    nome: function (a, b) { return String(a.desc).localeCompare(String(b.desc), "pt-BR"); }
  };
  function cabMeses() {
    var D = window.REPO[Object.keys(window.REPO)[0]]; if (!D) return ["Mês -2", "Mês -1", "Mês atual"];
    return D.meses.map(function (m, i) { return MES[+m.split("-")[1] - 1] + "/" + m.slice(2, 4) + ""; });
  }
  function celPedir(o) {
    return '<td class="r nw"><input class="num-in" type="number" min="1" step="1" value="' + (o.sug || "") + '" data-in="' + esc(o.loja + "|" + o.k) + '" placeholder="qtd"> <button class="btn-mini" type="button" data-pedir="' + esc(o.loja) + "|" + esc(o.k) + '" data-d="' + esc(o.desc) + '">Pedir</button></td>';
  }
  function trLoja(o, comLoja) {
    return "<tr><td>" + esc(o.k) + "</td><td>" + esc(o.desc) + "</td><td>" + esc(o.marca) + "</td>" + (comLoja ? "<td>" + esc(o.loja) + "</td>" : "") +
      '<td class="r">' + N0.format(o.saldo) + '</td><td class="r">' + N0.format(o.m[0]) + '</td><td class="r">' + N0.format(o.m[1]) + '</td><td class="r">' + N0.format(o.m[2]) + '</td><td class="r">' + (o.dsv == null ? "—" : N0.format(o.dsv) + " d") +
      '</td><td class="r">' + (o.cob == null ? "—" : N1.format(o.cob) + " d") + '</td><td class="r">' + (o.ped ? '<span class="st st-E">' + N0.format(o.ped) + "</span>" : "—") + '</td><td class="r">' + (o.sug ? "<b>" + N0.format(o.sug) + "</b>" : "—") + '</td><td class="r">' + dt(o.ult) + "</td>" + celPedir(o) + "</tr>";
  }

  function curva(a) {
    A = a;
    if (!A.estoque || !lojasIdx().length) { setHTML("rcAviso", '<div class="aviso-box">Estoque ainda não coletado — rode o robô e o <b>abrir_analises.bat</b>.</div>'); return; }
    var sel = $("rcLoja"), opt = '<option value="">TODAS AS LOJAS</option>' + lojasIdx().map(function (l) { return '<option value="' + esc(l.loja) + '">' + esc(l.loja) + "</option>"; }).join("");
    if (sel._o !== opt) { sel._o = opt; sel.innerHTML = opt; sel.value = R.loja; }
    $("rcDias").value = P.dias; $("rcLead").value = P.lead; $("rcBase").value = P.base;
    if (!carregar(function () { App.render(); })) {
      setHTML("rcAviso", carga.erro ? '<div class="aviso-box">Arquivos de reposição não encontrados — rode <b>abrir_analises.bat</b> para gerá-los.</div>' : "");
      setHTML("rcTab", '<tr><td colspan="14">' + (carga.erro ? "Sem dados." : "Carregando…") + "</td></tr>"); return;
    }
    setHTML("rcAviso", "");
    var todas = linhas(), q = R.q.toLowerCase();
    var marcas = {}; todas.forEach(function (o) { if (o.marca) marcas[o.marca] = 1; });
    var mo = '<option value="">TODAS AS MARCAS</option>' + Object.keys(marcas).sort(function (a, b) { return a.localeCompare(b, "pt-BR"); }).map(function (m) { return '<option value="' + esc(m) + '">' + esc(m) + "</option>"; }).join("");
    var sm = $("rcMarca"); if (sm._o !== mo) { sm._o = mo; sm.innerHTML = mo; sm.value = R.marca; }
    sm.style.display = Object.keys(marcas).length ? "" : "none";
    var base = todas.filter(function (o) { return (!R.loja || o.loja === R.loja) && (!R.marca || o.marca === R.marca) && (!q || o.desc.toLowerCase().indexOf(q) >= 0 || o.k.toLowerCase().indexOf(q) >= 0); });
    var precisa = base.filter(function (o) { return o.sug > 0; });
    var prods = {}; precisa.forEach(function (o) { prods[o.k] = 1; });
    var unPed = 0; base.forEach(function (o) { unPed += o.ped; });
    var kp = [["Linhas loja × produto a repor", N0.format(precisa.length), "com sugestão maior que zero"], ["Produtos distintos", N0.format(Object.keys(prods).length), "precisam repor em alguma loja"],
      ["Unidades sugeridas", N0.format(precisa.reduce(function (s, o) { return s + o.sug; }, 0)), "já descontado saldo e pedidos"], ["Unidades em pedidos ativos", N0.format(unPed), "pedidos com menos de 48 h"]];
    setHTML("rcKpis", kp.map(function (k) { return '<article class="card stat stat--sm"><h2 class="card__title">' + k[0] + '</h2><div class="stat__bottom"><div class="stat__num"><div class="kpi">' + k[1] + '</div><div class="delta">' + k[2] + "</div></div></div></article>"; }).join(""));
    var mc = cabMeses(), h;
    if (R.visao === "lp") {
      var rows = (R.so ? precisa : base).slice().sort(ORD[R.ord]), lim = rows.slice(0, R.lim), com = !R.loja;
      h = '<tr><th>Cód.</th><th>Descrição</th><th>Marca</th>' + (com ? "<th>Loja</th>" : "") + '<th class="r">Saldo em loja</th><th class="r">' + mc[0] + '</th><th class="r">' + mc[1] + '</th><th class="r">' + mc[2] + '</th><th class="r">Dias sem vendas</th><th class="r">Cobertura</th><th class="r">Em pedido</th><th class="r">Sugestão de reposição</th><th class="r">Última venda</th><th class="r">Pedido</th></tr>';
      setHTML("rcHead", h);
      setHTML("rcTab", lim.map(function (o) { return trLoja(o, com); }).join("") || '<tr><td colspan="14">Nenhum produto neste filtro.</td></tr>');
      setTxt("rcTitulo", (R.loja || "Todas as lojas") + " — " + N0.format(rows.length) + " linha(s)");
      $("rcMais").style.display = rows.length > lim.length ? "" : "none";
      setTxt("rcNota", "Mostrando " + N0.format(lim.length) + " de " + N0.format(rows.length) + ".");
      $("rcCsv")._rows = rows;
    } else {
      var g = {};
      base.forEach(function (o) { var x = g[o.k] = g[o.k] || { k: o.k, desc: o.desc, saldo: 0, m: [0, 0, 0], dsv: null, ult: "", ped: 0, sug: 0, dem: 0, sp: 0, marca: o.marca, lojas: [] }; x.saldo += o.saldo; x.dem += o.dem; x.sp += Math.max(o.saldo, 0); for (var i = 0; i < 3; i++) x.m[i] += o.m[i];
        if (o.dsv != null && (x.dsv == null || o.dsv < x.dsv)) { x.dsv = o.dsv; } if (o.ult > x.ult) x.ult = o.ult; x.ped += o.ped; x.sug += o.sug; x.lojas.push(o); });
      var arr = Object.keys(g).map(function (k) { g[k].nlojas = g[k].lojas.filter(function (o) { return o.sug > 0; }).length; return g[k]; });
      if (R.so) arr = arr.filter(function (x) { return x.sug > 0; });
      arr.sort(ORD[R.ord]);
      var lim2 = arr.slice(0, R.lim);
      setHTML("rcHead", '<tr><th></th><th>Cód.</th><th>Descrição</th><th>Marca</th><th class="r">Saldo (rede)</th><th class="r">' + mc[0] + '</th><th class="r">' + mc[1] + '</th><th class="r">' + mc[2] + '</th><th class="r">Dias sem vendas</th><th class="r">Cobertura</th><th class="r">Em pedido</th><th class="r">Sugestão total</th><th class="r">Lojas que precisam</th><th class="r">Última venda</th></tr>');
      setHTML("rcTab", lim2.map(function (x) {
        var aberto = R.exp[x.k], s = '<tr class="lnk" data-exp="' + esc(x.k) + '"><td>' + (aberto ? "▾" : "▸") + "</td><td>" + esc(x.k) + "</td><td>" + esc(x.desc) + "</td><td>" + esc(x.marca) + '</td><td class="r">' + N0.format(x.saldo) + '</td><td class="r">' + N0.format(x.m[0]) + '</td><td class="r">' + N0.format(x.m[1]) + '</td><td class="r">' + N0.format(x.m[2]) + '</td><td class="r">' + (x.dsv == null ? "—" : N0.format(x.dsv) + " d") + '</td><td class="r">' + (x.dem > 0 && x.sp > 0 ? N1.format(x.sp / x.dem) + " d" : "—") + '</td><td class="r">' + (x.ped ? N0.format(x.ped) : "—") + '</td><td class="r">' + (x.sug ? "<b>" + N0.format(x.sug) + "</b>" : "—") + '</td><td class="r">' + x.nlojas + " de " + x.lojas.length + '</td><td class="r">' + dt(x.ult) + "</td></tr>";
        if (aberto) {
          s += '<tr class="subtab"><td></td><td colspan="13"><table class="table table--data"><thead><tr><th>Loja</th><th class="r">Saldo</th><th class="r">' + mc[0] + '</th><th class="r">' + mc[1] + '</th><th class="r">' + mc[2] + '</th><th class="r">Dias s/ vendas</th><th class="r">Cobertura</th><th class="r">Em pedido</th><th class="r">Sugestão</th><th class="r">Última venda</th><th class="r">Pedido</th></tr></thead><tbody>' +
            x.lojas.slice().sort(function (a, b) { return b.sug - a.sug; }).filter(function (o) { return !R.so || o.sug > 0; }).map(function (o) {
              return "<tr><td>" + esc(o.loja) + '</td><td class="r">' + N0.format(o.saldo) + '</td><td class="r">' + N0.format(o.m[0]) + '</td><td class="r">' + N0.format(o.m[1]) + '</td><td class="r">' + N0.format(o.m[2]) + '</td><td class="r">' + (o.dsv == null ? "—" : N0.format(o.dsv) + " d") + '</td><td class="r">' + (o.cob == null ? "—" : N1.format(o.cob) + " d") + '</td><td class="r">' + (o.ped ? N0.format(o.ped) : "—") + '</td><td class="r">' + (o.sug ? "<b>" + N0.format(o.sug) + "</b>" : "—") + '</td><td class="r">' + dt(o.ult) + "</td>" + celPedir(o) + "</tr>";
            }).join("") + "</tbody></table></td></tr>";
        }
        return s;
      }).join("") || '<tr><td colspan="14">Nenhum produto neste filtro.</td></tr>');
      setTxt("rcTitulo", "Por produto (rede) — " + N0.format(arr.length) + " produto(s) · clique na linha para ver as lojas");
      $("rcMais").style.display = arr.length > lim2.length ? "" : "none";
      setTxt("rcNota", "Mostrando " + N0.format(lim2.length) + " de " + N0.format(arr.length) + ".");
      $("rcCsv")._rows = null; $("rcCsv")._arr = arr;
    }
    setTxt("rcFormula", "Sugestão = demanda diária × (dias de reposição + lead time) − saldo em loja − quantidade em pedidos ativos (arredondada para cima). Demanda diária = " + ({ "3m": "vendas dos 3 meses ÷ dias com dados", dia: "vendas do dia atual", sem: "vendas da semana atual (segunda até hoje) ÷ dias decorridos" }[P.base] || "vendas dos últimos 30 dias ÷ dias com dados") + ". Hoje: " + P.dias + " + " + P.lead + " = " + (P.dias + P.lead) + " dias de cobertura.");
    document.querySelectorAll("#rcLoja,#rcBase").forEach(function () { });
    [].forEach.call($("rcVisao").children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-v") === R.visao); });
    [].forEach.call($("rcSo").children, function (b) { b.classList.toggle("is-active", (b.getAttribute("data-s") === "1") === R.so); });
  }

  /* ---------- pedidos ---------- */
  function restante(p) { var ms = p.t + EXP_MS - Date.now(); if (ms <= 0) return null; var h = Math.floor(ms / 3600e3), m = Math.floor(ms % 3600e3 / 60e3); return h + "h " + pad(m) + "min"; }
  function pedidos(a) {
    A = a;
    var lj = lojasIdx().map(function (l) { return l.loja; });
    var opt = '<option value="">Todas as lojas</option>' + lj.map(function (l) { return '<option value="' + esc(l) + '">' + esc(l) + "</option>"; }).join("");
    var s1 = $("pdLoja"); if (s1._o !== opt) { s1._o = opt; s1.innerHTML = opt; s1.value = PD.loja; }
    var optN = lj.map(function (l) { return '<option value="' + esc(l) + '">' + esc(l) + "</option>"; }).join("");
    var s2 = $("pdNovaLoja"); if (s2._o !== optN) { s2._o = optN; s2.innerHTML = optN; }
    var q = PD.q.toLowerCase();
    var base = ped.filter(function (p) { return (!PD.loja || p.loja === PD.loja) && (!q || p.desc.toLowerCase().indexOf(q) >= 0 || p.k.toLowerCase().indexOf(q) >= 0); });
    var ativos = base.filter(ativo), exp = base.filter(function (p) { return !ativo(p); });
    var lista = (PD.f === "ativos" ? ativos : PD.f === "exp" ? exp : base).slice().sort(function (x, y) { return y.t - x.t; });
    var un = ativos.reduce(function (s, p) { return s + p.qtd; }, 0), lojas = {}; ativos.forEach(function (p) { lojas[p.loja] = 1; });
    var breve = ativos.filter(function (p) { return p.t + EXP_MS - Date.now() < 6 * 3600e3; }).length;
    var kp = [["Pedidos ativos", N0.format(ativos.length), "itens com menos de 48 h"], ["Unidades em pedido", N0.format(un), N0.format(Object.keys(lojas).length) + " loja(s)"], ["Expiram em menos de 6 h", N0.format(breve), "atenção ao prazo"], ["Expirados", N0.format(exp.length), "não entram mais no cálculo"]];
    setHTML("pdKpis", kp.map(function (k) { return '<article class="card stat stat--sm"><h2 class="card__title">' + k[0] + '</h2><div class="stat__bottom"><div class="stat__num"><div class="kpi">' + k[1] + '</div><div class="delta">' + k[2] + "</div></div></div></article>"; }).join(""));
    setHTML("pdTab", lista.map(function (p) {
      var r = restante(p);
      return '<tr class="' + (r ? "" : "is-exp") + '"><td>' + quando(p.t) + '</td><td>' + (r ? '<span class="st ' + (p.t + EXP_MS - Date.now() < 6 * 3600e3 ? "st-B" : "st-O") + '">' + r + "</span>" : '<span class="st st-N">Expirado</span>') + "</td><td>" + esc(p.loja) + "</td><td>" + esc(p.k) + "</td><td>" + esc(p.desc) +
        '</td><td class="r"><input class="num-in" type="number" min="1" step="1" value="' + p.qtd + '" data-edit="' + esc(p.id) + '"></td><td class="r"><button class="btn-mini" type="button" data-del="' + esc(p.id) + '">Excluir</button></td></tr>';
    }).join("") || '<tr><td colspan="7">Nenhum pedido neste filtro.</td></tr>');
    [].forEach.call($("pdFiltro").children, function (b) { b.classList.toggle("is-active", b.getAttribute("data-f") === PD.f); });
    setTxt("pdMsg", PD.ok);
  }

  /* ---------- eventos ---------- */
  var App = { render: function () { } };
  function ligar() {
    var rep = function () { App.render(); };
    $("rcLoja").addEventListener("change", function (e) { R.loja = e.target.value; R.lim = 200; rep(); });
    $("rcBusca").addEventListener("input", function (e) { R.q = e.target.value; R.lim = 200; rep(); });
    $("rcMarca").addEventListener("change", function (e) { R.marca = e.target.value; R.lim = 200; rep(); });
    $("rcOrd").addEventListener("change", function (e) { R.ord = e.target.value; rep(); });
    $("rcVisao").addEventListener("click", function (e) { var b = e.target.closest("button[data-v]"); if (!b) return; R.visao = b.getAttribute("data-v"); R.lim = 200; rep(); });
    $("rcSo").addEventListener("click", function (e) { var b = e.target.closest("button[data-s]"); if (!b) return; R.so = b.getAttribute("data-s") === "1"; R.lim = 200; rep(); });
    $("rcMais").addEventListener("click", function () { R.lim += 200; rep(); });
    var par = function () { var d = parseFloat($("rcDias").value), l = parseFloat($("rcLead").value); P.dias = d >= 0 ? d : 0; P.lead = l >= 0 ? l : 0; P.base = $("rcBase").value; gravarLS("nms_repo_params", P); rep(); };
    ["rcDias", "rcLead"].forEach(function (id) { $(id).addEventListener("change", par); });
    $("rcBase").addEventListener("change", par);
    $("rcTab").addEventListener("click", function (e) {
      var b = e.target.closest("button[data-pedir]");
      if (b) { var ch = b.getAttribute("data-pedir"), i = ch.indexOf("|"), loja = ch.slice(0, i), k = ch.slice(i + 1), inp = b.parentNode.querySelector("input"); if (pedir(loja, k, b.getAttribute("data-d"), inp.value)) rep(); else inp.focus(); return; }
      if (e.target.closest("input")) return;
      var tr = e.target.closest("tr[data-exp]"); if (tr) { var k2 = tr.getAttribute("data-exp"); R.exp[k2] = !R.exp[k2]; rep(); }
    });
    $("rcCsv").addEventListener("click", function () {
      var mc = cabMeses(), bt = $("rcCsv");
      if (R.visao === "lp" && bt._rows) csvBaixar("reposicao_curva.csv", ["Cód.", "Descrição", "Loja", "Marca", "Saldo em loja", mc[0], mc[1], mc[2], "Dias sem vendas", "Cobertura (dias)", "Em pedido", "Sugestão de reposição", "Última venda"], bt._rows.map(function (o) { return [o.k, o.desc, o.loja, o.marca, o.saldo, o.m[0], o.m[1], o.m[2], o.dsv == null ? "" : o.dsv, o.cob == null ? "" : Math.round(o.cob * 10) / 10, o.ped, o.sug, o.ult]; }));
      else if (bt._arr) csvBaixar("reposicao_por_produto.csv", ["Cód.", "Descrição", "Saldo (rede)", mc[0], mc[1], mc[2], "Dias sem vendas", "Em pedido", "Sugestão total", "Lojas que precisam", "Última venda"], bt._arr.map(function (x) { return [x.k, x.desc, x.saldo, x.m[0], x.m[1], x.m[2], x.dsv == null ? "" : x.dsv, x.ped, x.sug, x.nlojas, x.ult]; }));
    });
    /* pedidos */
    $("pdFiltro").addEventListener("click", function (e) { var b = e.target.closest("button[data-f]"); if (!b) return; PD.f = b.getAttribute("data-f"); rep(); });
    $("pdLoja").addEventListener("change", function (e) { PD.loja = e.target.value; rep(); });
    $("pdBusca").addEventListener("input", function (e) { PD.q = e.target.value; rep(); });
    $("pdTab").addEventListener("click", function (e) { var b = e.target.closest("button[data-del]"); if (!b) return; var id = b.getAttribute("data-del"); ped = ped.filter(function (p) { return p.id !== id; }); salvarPed(); PD.ok = "Pedido excluído."; rep(); });
    $("pdTab").addEventListener("change", function (e) { var id = e.target.getAttribute("data-edit"); if (!id) return; var v = Math.round(+e.target.value); ped.forEach(function (p) { if (p.id === id && v > 0) p.qtd = v; }); salvarPed(); rep(); });
    $("pdLimpar").addEventListener("click", function () { var n = ped.length; ped = ped.filter(ativo); salvarPed(); PD.ok = (n - ped.length) + " pedido(s) expirado(s) removido(s)."; rep(); });
    $("pdTudo").addEventListener("click", function () { var b = $("pdTudo"); if (!b._c) { b._c = 1; b.textContent = "Confirmar: excluir TODOS"; setTimeout(function () { b._c = 0; b.textContent = "Excluir todos"; }, 4000); return; } b._c = 0; b.textContent = "Excluir todos"; ped = []; salvarPed(); PD.ok = "Todos os pedidos foram excluídos."; rep(); });
    $("pdNovo").addEventListener("click", function () {
      var loja = $("pdNovaLoja").value, k = $("pdNovoCod").value.trim(), q = $("pdNovaQtd").value, desc = k;
      Object.keys(window.REPO || {}).forEach(function (a) { var D = window.REPO[a]; if (D.loja === loja) D.rows.some(function (r) { if (r[0] === k) { desc = r[1]; return true; } }); });
      if (!loja || !k || !(+q > 0)) { PD.ok = "Informe loja, código e quantidade."; rep(); return; }
      pedir(loja, k, desc, q); $("pdNovoCod").value = ""; $("pdNovaQtd").value = ""; PD.ok = "Pedido adicionado (vale por 48 h)."; rep();
    });
    $("pdCsv").addEventListener("click", function () { csvBaixar("pedidos_reposicao.csv", ["Criado em", "Expira em", "Loja", "Cód.", "Descrição", "Qtd", "Status"], ped.slice().sort(function (a, b) { return b.t - a.t; }).map(function (p) { return [quando(p.t), quando(p.t + EXP_MS), p.loja, p.k, p.desc, p.qtd, ativo(p) ? "Ativo" : "Expirado"]; })); });
    $("pdBackup").addEventListener("click", function () { var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([JSON.stringify(ped)], { type: "application/json" })); a.download = "pedidos_backup.json"; document.body.appendChild(a); a.click(); a.remove(); });
    $("pdRestore").addEventListener("change", function (e) {
      var f = e.target.files[0]; if (!f) return; var rd = new FileReader();
      rd.onload = function () { try { var arr = JSON.parse(rd.result), ids = {}; ped.forEach(function (p) { ids[p.id] = 1; }); arr.forEach(function (p) { if (p && p.id && p.k && p.qtd > 0 && !ids[p.id]) ped.push(p); }); salvarPed(); PD.ok = "Backup importado."; } catch (x) { PD.ok = "Arquivo inválido."; } e.target.value = ""; rep(); };
      rd.readAsText(f);
    });
    window.addEventListener("storage", function (e) { if (e.key === "nms_pedidos_v1") { ped = lerLS("nms_pedidos_v1", []); rep(); } });
    setInterval(function () { var t = (location.hash || "").replace("#", ""); if (t === "reppedidos" || t === "repcurva") rep(); }, 60000);
  }
  window.RepUI = { curva: curva, pedidos: pedidos, init: function (renderFn) { App.render = renderFn; ligar(); } };
})();
