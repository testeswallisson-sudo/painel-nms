/* Painel do Robô Linx — lê window.ROBO (painel/estado.js, escrito pelo robô). */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  var DEMO = params.get("demo");
  var filtro = "todos";
  var ROBO = window.ROBO || null;

  var IMG = {
    vendas: "mascote/vendas.png",
    estoque: "mascote/estoque.png",
    cafe: "mascote/descansando_cafe.png",
    soneca: "mascote/descansando_soneca.png"
  };

  /* ---------- utilidades ---------- */
  function setHTML(el, html) { if (el && el._h !== html) { el._h = html; el.innerHTML = html; } }
  function setTxt(el, t) { if (el && el.textContent !== t) el.textContent = t; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function hhmm(d) { return pad(d.getHours()) + ":" + pad(d.getMinutes()); }
  function fmtN(n) { return n == null ? "—" : Number(n).toLocaleString("pt-BR"); }
  function dur(ms) {
    var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
    return h ? h + "h " + pad(m) + "min" : m ? m + "min " + pad(x) + "s" : x + "s";
  }
  function quando(iso) {
    if (!iso) return "—";
    var d = new Date(iso); if (isNaN(d)) return esc(iso);
    var hoje = new Date(), ontem = new Date(Date.now() - 864e5);
    var dia = d.toDateString() === hoje.toDateString() ? "hoje" : d.toDateString() === ontem.toDateString() ? "ontem" : pad(d.getDate()) + "/" + pad(d.getMonth() + 1);
    return dia + " " + hhmm(d);
  }

  /* ---------- demo ---------- */
  function demo(modo) {
    var agora = new Date(), iso = function (min) { return new Date(agora.getTime() + min * 60000).toISOString(); };
    var h = agora.getHours();
    var ag = []; for (var i = 6; i <= 22; i += 2) ag.push(pad(i) + ":00"); ag.push("23:50");
    var st = function (a, b) { return [{ portal: "mv107", vendas: a, estoque: b }, { portal: "mv449", vendas: a === "ok" ? "ok" : "pendente", estoque: "pendente" }, { portal: "mv491", vendas: "pendente", estoque: "pendente" }]; };
    var base = {
      estado: modo, intervalo_horas: 2, agenda: ag, janela: [6, 23], atualizado_em: iso(0),
      inicio_rodada: modo === "descansando" ? null : iso(-3), fim_rodada: modo === "descansando" ? iso(-45) : null,
      ultima_rodada_ok: iso(-125),
      consolidado: { vendas: { linhas: 1839, quando: iso(-125) }, estoque: { linhas: 5210, quando: iso(-118) } },
      portais: [
        { portal: "mv107", vendas: { status: "ok", linhas: 812, quando: iso(-125) }, estoque: { status: "ok", linhas: 2100, quando: iso(-120) } },
        { portal: "mv449", vendas: { status: "ok", linhas: 640, quando: iso(-124) }, estoque: { status: "ok", linhas: 1650, quando: iso(-119) } },
        { portal: "mv491", vendas: { status: "erro", linhas: null, quando: iso(-123) }, estoque: { status: "ok", linhas: 1460, quando: iso(-118) } }
      ],
      historico: [
        { quando: iso(-118), tipo: "estoque", portal: "mv491", ok: true, linhas: 1460, detalhe: "exportado e consolidado" },
        { quando: iso(-119), tipo: "estoque", portal: "mv449", ok: true, linhas: 1650, detalhe: "exportado e consolidado" },
        { quando: iso(-120), tipo: "estoque", portal: "mv107", ok: true, linhas: 2100, detalhe: "exportado e consolidado" },
        { quando: iso(-123), tipo: "vendas", portal: "mv491", ok: false, linhas: null, detalhe: "Senha incorreta — portal ignorado" },
        { quando: iso(-124), tipo: "vendas", portal: "mv449", ok: true, linhas: 640, detalhe: "exportado" },
        { quando: iso(-125), tipo: "vendas", portal: "mv107", ok: true, linhas: 812, detalhe: "exportado" }
      ]
    };
    if (modo === "vendas") { base.portal = "mv449"; base.etapa = "Filtrando o relatório"; base.rodada = st("ok", "pendente"); base.rodada[1].vendas = "rodando"; }
    if (modo === "estoque") { base.portal = "mv107"; base.etapa = "Exportando CSV"; base.rodada = st("ok", "rodando"); base.rodada[1].vendas = "ok"; base.rodada[2].vendas = "ok"; }
    if (modo === "descansando") { base.rodada = st("ok", "ok"); base.rodada[1].vendas = "ok"; base.rodada[1].estoque = "ok"; base.rodada[2].vendas = "ok"; base.rodada[2].estoque = "ok"; base.ultima_rodada_ok = iso(-45); }
    return base;
  }

  /* ---------- próximo horário ---------- */
  function proximoSlot(R, agora) {
    var ag = (R.agenda || []).slice();
    var hoje = new Date(agora); hoje.setSeconds(0, 0);
    var slots = ag.map(function (s) { var p = s.split(":"), d = new Date(hoje); d.setHours(+p[0], +p[1], 0, 0); return d; });
    var prox = null, ant = null;
    slots.forEach(function (d) { if (d > agora && !prox) prox = d; if (d <= agora) ant = d; });
    if (!prox && slots.length) { prox = new Date(slots[0]); prox.setDate(prox.getDate() + 1); }
    return { prox: prox, ant: ant, slots: slots };
  }

  /* ---------- render ---------- */
  var MAP = { pendente: "", rodando: "is-rodando", ok: "is-ok", erro: "is-erro" };
  function chips(rodada, tipo) {
    return (rodada || []).map(function (p) {
      var s = p[tipo] || "pendente";
      return '<span class="chip ' + (MAP[s] || "") + '"><i></i>' + esc(p.portal) + "</span>";
    }).join("");
  }

  function render() {
    var R = DEMO ? demo(DEMO) : ROBO;
    var agora = new Date();
    var sinal = $("sinal");
    if (!R) {
      setTxt($("sinalTxt"), "aguardando dados…"); sinal.className = "signal";
      return;
    }
    var atual = new Date(R.atualizado_em || 0);
    var idade = agora - atual;
    var ativo = R.estado === "vendas" || R.estado === "estoque";
    var stale = !DEMO && ativo && idade > 10 * 60000;
    sinal.className = "signal" + (DEMO ? " signal--demo" : stale ? " is-stale" : " is-live");
    setTxt($("sinalTxt"), DEMO ? "pré-visualização (dados fictícios)" : stale ? "sem sinal há " + dur(idade) : "atualizado " + hhmm(atual));

    var np = proximoSlot(R, agora);
    var minAte = np.prox ? (np.prox - agora) / 60000 : 0;

    /* mascote + hero */
    var hero = $("hero"), img;
    hero.className = "card hero is-" + (R.estado || "descansando");
    if (R.estado === "vendas") img = IMG.vendas;
    else if (R.estado === "estoque") img = IMG.estoque;
    else img = minAte > 30 ? IMG.soneca : IMG.cafe;
    var m = $("mascote"); if (m.getAttribute("src") !== img) m.setAttribute("src", img);
    var av = document.querySelector(".avatar--mascot img");
    if (av && av.getAttribute("src") !== img) av.setAttribute("src", img);

    var pill = { vendas: "Analisando vendas", estoque: "Analisando estoque", descansando: "Descansando" }[R.estado] || "Sem dados";
    setTxt($("pillTxt"), pill);

    var tit, sub;
    if (R.estado === "vendas") {
      tit = "Analisando vendas";
      sub = "Portal <b>" + esc(R.portal || "—") + "</b>" + (R.etapa ? " · " + esc(R.etapa) : "") + ". Rodada iniciada às <b>" + (R.inicio_rodada ? hhmm(new Date(R.inicio_rodada)) : "—") + "</b>.";
    } else if (R.estado === "estoque") {
      tit = "Analisando estoque";
      sub = "Portal <b>" + esc(R.portal || "—") + "</b>" + (R.etapa ? " · " + esc(R.etapa) : "") + ". Rodada iniciada às <b>" + (R.inicio_rodada ? hhmm(new Date(R.inicio_rodada)) : "—") + "</b>.";
    } else {
      tit = "Descansando";
      sub = R.ultima_rodada_ok ? "Última rodada concluída " + quando(R.ultima_rodada_ok).replace(/^(\S+) (\S+)$/, "<b>$1 às $2</b>") + "." : "Ainda não concluiu nenhuma rodada.";
      if (np.prox) sub += " Volta a trabalhar às <b>" + hhmm(np.prox) + "</b>.";
    }
    setTxt($("heroTitulo"), tit); setHTML($("heroSub"), sub);

    /* alertas */
    var msgs = [], erro = false;
    if (stale) { msgs.push("O robô diz que está trabalhando, mas não dá sinal há " + dur(idade) + ". Confira se o computador está ligado e se a tarefa agendada rodou."); erro = true; }
    if (!DEMO && R.estado === "descansando" && np.ant && (!R.fim_rodada || new Date(R.fim_rodada) < np.ant) && agora - np.ant > 15 * 60000 && R.janela && agora.getHours() >= R.janela[0]) {
      msgs.push("A rodada das " + hhmm(np.ant) + " não aconteceu."); erro = true;
    }
    var falhas = (R.rodada || []).filter(function (p) { return p.vendas === "erro" || p.estoque === "erro"; }).map(function (p) { return p.portal; });
    if (falhas.length) msgs.push("Houve falha em: " + falhas.join(", ") + ". Veja o detalhe no histórico."), erro = erro || false;
    var al = $("alerta");
    if (msgs.length) { al.hidden = false; al.className = "alert" + (erro ? " alert--erro" : ""); setHTML(al, msgs.map(esc).join("<br>")); } else al.hidden = true;

    /* etapas */
    setHTML($("passos"),
      '<div class="steps__row"><span class="steps__lbl">Vendas</span><div class="steps__chips">' + chips(R.rodada, "vendas") + "</div></div>" +
      '<div class="steps__row"><span class="steps__lbl">Estoque</span><div class="steps__chips">' + chips(R.rodada, "estoque") + "</div></div>");

    /* próxima atualização */
    if (ativo) {
      setTxt($("contagem"), "Em andamento");
      setHTML($("quando"), "Depois desta rodada, a próxima é às <b>" + (np.prox ? hhmm(np.prox) : "—") + "</b>");
      $("barra").style.width = "100%";
      setTxt($("notaProx"), "Rodando há " + (R.inicio_rodada ? dur(agora - new Date(R.inicio_rodada)) : "—"));
    } else if (np.prox) {
      setTxt($("contagem"), "em " + dur(np.prox - agora));
      var amanha = np.prox.toDateString() !== agora.toDateString();
      setHTML($("quando"), "Próxima rodada " + (amanha ? "amanhã " : "hoje ") + "às <b>" + hhmm(np.prox) + "</b>");
      var ini = np.ant || new Date(np.prox.getTime() - (R.intervalo_horas || 2) * 3600000);
      var pct = Math.min(100, Math.max(0, (agora - ini) / (np.prox - ini) * 100));
      $("barra").style.width = pct.toFixed(1) + "%";
      setTxt($("notaProx"), "A cada " + (R.intervalo_horas || 2) + "h, das " + pad((R.janela || [6, 23])[0]) + ":00 às " + pad((R.janela || [6, 23])[1]) + ":00");
    } else { setTxt($("contagem"), "—"); setHTML($("quando"), "&nbsp;"); }

    setHTML($("agenda"), '<span class="agenda__lbl">Horários do dia</span>' + np.slots.map(function (d) {
      var c = "slot" + (d <= agora ? " is-past" : "") + (np.prox && d.getTime() === np.prox.getTime() && !ativo ? " is-next" : "");
      return '<span class="' + c + '">' + hhmm(d) + "</span>";
    }).join(""));

    /* KPIs */
    var c = R.consolidado || {};
    setTxt($("kVendas"), c.vendas ? fmtN(c.vendas.linhas) : "—");
    setTxt($("dVendas"), c.vendas ? "linhas · " + quando(c.vendas.quando) : "sem registro");
    setTxt($("kEstoque"), c.estoque ? fmtN(c.estoque.linhas) : "—");
    setTxt($("dEstoque"), c.estoque ? "linhas · " + quando(c.estoque.quando) : "sem registro");
    var ps = R.portais || [], okc = 0;
    ps.forEach(function (p) { if (p.vendas && p.vendas.status === "ok" && p.estoque && p.estoque.status === "ok") okc++; });
    setTxt($("kPortais"), ps.length ? okc + "/" + ps.length : "—");
    setTxt($("dPortais"), ps.length ? "portais 100% ok" : "sem registro");
    setHTML($("listaPortais"), ps.map(function (p) {
      var v = p.vendas ? p.vendas.status : "", e = p.estoque ? p.estoque.status : "";
      var t = v === "ok" && e === "ok" ? "is-ok" : v === "erro" || e === "erro" ? "is-erro" : "is-aviso";
      var txt = t === "is-ok" ? "ok" : t === "is-erro" ? "falha" : "parcial";
      return '<div class="prow"><b>' + esc(p.portal) + '</b><span class="tag ' + t + '">' + txt + "</span></div>";
    }).join(""));
    bars("bVendas", ps, "vendas"); bars("bEstoque", ps, "estoque");

    /* histórico */
    var hist = (R.historico || []).filter(function (h) { return filtro === "todos" || h.tipo === filtro; });
    setHTML($("corpo"), hist.map(function (h) {
      var b = h.ok ? '<span class="badge badge--hired">Sucesso</span>' : '<span class="badge badge--erro">Falha</span>';
      return "<tr><td>" + quando(h.quando) + "</td><td>" + (h.tipo === "vendas" ? "Vendas" : "Estoque") + "</td><td>" + esc(h.portal) + "</td><td>" + b + '</td><td class="num">' + fmtN(h.linhas) + '</td><td class="det">' + esc(h.detalhe || "") + "</td></tr>";
    }).join(""));
    $("vazio").hidden = hist.length > 0;
  }

  function bars(id, ps, tipo) {
    var vals = ps.map(function (p) { return (p[tipo] && p[tipo].linhas) || 0; });
    var mx = Math.max.apply(null, vals.concat([1]));
    setHTML($(id), vals.map(function (v, i) { return '<i class="' + (v ? "is-active" : "") + '" style="height:' + Math.max(4, Math.round(v / mx * 92)) + 'px" title="' + esc(ps[i].portal) + '"></i>'; }).join(""));
  }

  /* ---------- carregar estado.js ---------- */
  function carregar() {
    if (DEMO) { render(); return; }
    var s = document.createElement("script");
    s.src = "estado.js?t=" + Date.now();
    s.onload = function () { ROBO = window.ROBO || ROBO; s.remove(); render(); };
    s.onerror = function () { s.remove(); render(); };
    document.head.appendChild(s);
  }

  /* ---------- eventos ---------- */
  $("btnAtualizar").addEventListener("click", carregar);
  $("filtro").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-f]"); if (!b) return;
    filtro = b.getAttribute("data-f"); marcar(); render();
  });
  function marcar() {
    document.querySelectorAll("#filtro button").forEach(function (b) { b.classList.toggle("is-active", b.getAttribute("data-f") === filtro); });
  }

  render();
  carregar();
  setInterval(carregar, 5000);
  setInterval(render, 1000);
})();
