/* Menu lateral compartilhado entre as páginas (módulos: Robô e Análises). */
(function () {
  var page = document.body.getAttribute("data-page") || "";
  var ico = {
    painel: '<svg class="ico" viewBox="0 0 24 24"><rect x="4" y="4" width="6.5" height="6.5" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2" fill="currentColor" stroke="none"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.2" fill="currentColor" stroke="none"/></svg>',
    check: '<svg class="ico" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    chart: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 4v16h16"/><path d="M8.5 16v-4M12.5 16V8M16.5 16v-6"/></svg>',
    box: '<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/></svg>',
    tag: '<svg class="ico" viewBox="0 0 24 24"><path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.3" fill="currentColor" stroke="none"/></svg>',
    abc: '<svg class="ico" viewBox="0 0 24 24"><path d="M4 20V9M10 20V4M16 20v-8M21 20H3"/></svg>',
    warn: '<svg class="ico" viewBox="0 0 24 24"><path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.3v.1"/></svg>',
    eye: '<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/></svg>'
  };
  var grupos = [
    { titulo: "Módulo · Robô", itens: [
      { id: "robo-painel", href: "index.html", icone: "painel", txt: "Painel do robô" },
      { id: "robo-dados", href: "dashboard.html", icone: "check", txt: "Conferência da coleta" }] },
    { titulo: "Módulo · Análises", itens: [
      { id: "an-resumo", href: "analises.html#resumo", icone: "painel", txt: "Resumo" },
      { id: "an-vendas", href: "analises.html#vendas", icone: "chart", txt: "Vendas" },
      { id: "an-produtos", href: "analises.html#produtos", icone: "tag", txt: "Produtos" },
      { id: "an-abc", href: "analises.html#abc", icone: "abc", txt: "Curva ABC" },
      { id: "an-estoque", href: "analises.html#estoque", icone: "box", txt: "Estoque" },
      { id: "an-estqprod", href: "analises.html#estqprod", icone: "box", txt: "Estoque por produto" },
      { id: "an-outras", href: "analises.html#outras", icone: "tag", txt: "Outras operações" },
      { id: "an-alertas", href: "analises.html#alertas", icone: "warn", txt: "Cancelamentos e saldos" }] },
    { titulo: "Módulo · Encarte e promoções", itens: [
      { id: "an-promocampanhas", href: "analises.html#promocampanhas", icone: "tag", txt: "Campanhas e faturamento" },
      { id: "an-promotop", href: "analises.html#promotop", icone: "chart", txt: "Produtos, marcas e lojas" },
      { id: "an-promoproximo", href: "analises.html#promoproximo", icone: "abc", txt: "Próximo encarte" }] },
    { titulo: "Módulo · Reposição lojas", itens: [
      { id: "an-repcurva", href: "analises.html#repcurva", icone: "abc", txt: "Análise de curva" },
      { id: "an-repredist", href: "analises.html#repredist", icone: "box", txt: "Redistribuição de parados" },
      { id: "an-reppedidos", href: "analises.html#reppedidos", icone: "tag", txt: "Pedidos" }] }
  ];
  var KEY = "nav_grupos_v1", estado = {};
  try { estado = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { }
  function aberto(g) { return g.titulo in estado ? !!estado[g.titulo] : g.itens.some(ativo); }
  function ativo(it) {
    if (page === "analises") return it.id === "an-" + (location.hash.replace("#", "") || "resumo");
    return it.id === page;
  }
  function montar() {
    var h = '<div class="brand"><svg class="brand__mark" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="13" cy="13" r="11.5"/><circle cx="13" cy="9.3" r="2.4" fill="currentColor" stroke="none"/><path d="M7.5 19.5 13 13l5.5 6.5M9.5 14.5h7" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="brand__name">Robô Linx</span></div>';
    grupos.forEach(function (g) {
      var ab = aberto(g);
      h += '<div class="nav-group' + (ab ? "" : " is-closed") + '"><button type="button" class="nav__title nav__toggle" data-g="' + g.titulo + '" aria-expanded="' + ab + '"><span>' + g.titulo + '</span><svg class="chev" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg></button><ul class="nav">' + g.itens.map(function (it) {
        return '<li><a class="sub' + (ativo(it) ? " is-active" : "") + '" href="' + it.href + '">' + ico[it.icone] + "<span>" + it.txt + "</span></a></li>";
      }).join("") + "</ul></div>";
    });
    if (page === "robo-painel") {
      h += '<div class="nav-group"><span class="nav__title">Pré-visualizar</span><ul class="nav">' + ["vendas", "estoque", "descansando"].map(function (m) {
        return '<li><a class="sub" href="?demo=' + m + '">' + ico.eye + "<span>Modo " + m + "</span></a></li>";
      }).join("") + "</ul></div>";
    }
    h += '<div class="user" style="margin-top:auto"><span class="avatar avatar--mascot"><img src="mascote/descansando_cafe.png" alt=""></span><div><div class="user__name">Robô Linx</div><div class="user__role">Relatórios do Linx Microvix</div></div></div>';
    var el = document.getElementById("sidebar");
    if (el) el.innerHTML = h;
  }
  montar();
  var side = document.getElementById("sidebar");
  if (side) side.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-g]"); if (!b) return;
    var g = b.getAttribute("data-g"), grp = b.parentNode, fechar = !grp.classList.contains("is-closed");
    grp.classList.toggle("is-closed", fechar); b.setAttribute("aria-expanded", String(!fechar));
    estado[g] = !fechar; try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch (x) { }
  });
  window.addEventListener("hashchange", montar);

  /* ---------- celular: menu em gaveta ---------- */
  (function () {
    var tb = document.querySelector(".topbar"), sb = document.getElementById("sidebar");
    if (!tb || !sb) return;
    var btn = document.createElement("button");
    btn.type = "button"; btn.className = "menu-btn"; btn.setAttribute("aria-label", "Abrir menu");
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
    tb.insertBefore(btn, tb.firstChild);
    var bd = document.createElement("div"); bd.className = "side-backdrop"; document.body.appendChild(bd);
    function abrir(v) { document.body.classList.toggle("menu-aberto", v); }
    btn.addEventListener("click", function () { abrir(!document.body.classList.contains("menu-aberto")); });
    bd.addEventListener("click", function () { abrir(false); });
    sb.addEventListener("click", function (e) { if (e.target.closest("a[href]")) abrir(false); });
    window.addEventListener("hashchange", function () { abrir(false); });
  })();
})();
