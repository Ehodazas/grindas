(function () {
  "use strict";
  var cfg = window.GRINDAS_CONFIG;
  var P = window.Paving;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) document.documentElement.classList.add("reduce-motion");

  /* ---------- Verslo duomenys iš konfigūracijos ---------- */
  var biz = cfg.business;
  document.querySelectorAll("[data-biz]").forEach(function (n) {
    var k = n.getAttribute("data-biz");
    if (k === "phone") { n.textContent = biz.phone; n.setAttribute("href", biz.phoneHref); }
    else if (k === "email") { n.textContent = biz.email; n.setAttribute("href", "mailto:" + biz.email); }
    else n.textContent = biz[k];
  });
  var areaList = document.getElementById("areaList");
  if (areaList) biz.serviceAreas.forEach(function (a) {
    var li = document.createElement("li"); li.textContent = a; areaList.appendChild(li);
  });

  /* ---------- Navigacija ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("nav");
  function setNav(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    document.body.classList.toggle("nav-open", open);
  }
  toggle.addEventListener("click", function () { setNav(toggle.getAttribute("aria-expanded") !== "true"); });
  nav.addEventListener("click", function (e) { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) { setNav(false); toggle.focus(); }
  });

  /* ---------- HERO planas su klojimo animacija ---------- */
  function drawHero() {
    var svg = document.getElementById("heroPlan");
    if (!svg) return;
    var defs = P.el("defs", {}, svg);
    defs.appendChild(P.fromConfig("hp-drive", "betonines", "grafitas", "eglute"));
    defs.appendChild(P.fromConfig("hp-terr", "ploksciu", "sviesi", "tiesi"));
    defs.appendChild(P.fromConfig("hp-path", "ploksciu", "smelio", "perrisimas"));
    var hatch = P.el("pattern", { id: "hp-hatch", patternUnits: "userSpaceOnUse", width: 0.35, height: 0.35, patternTransform: "rotate(45)" }, defs);
    P.el("line", { x1: 0, y1: 0, x2: 0, y2: 0.35, "class": "hatch-line" }, hatch);
    var lawn = P.el("pattern", { id: "hp-lawn", patternUnits: "userSpaceOnUse", width: 0.6, height: 0.6 }, defs);
    P.el("rect", { width: 0.6, height: 0.6, "class": "lawn-bg" }, lawn);
    P.el("path", { d: "M.1 .2h.08M.4 .45h.08M.32 .1h.06", "class": "lawn-mark" }, lawn);

    P.el("rect", { x: 0, y: 0, width: 16, height: 11, fill: "url(#hp-lawn)" }, svg);
    P.el("rect", { x: 0, y: 0, width: 16, height: 11, "class": "plot-line" }, svg);

    var areas = [
      { id: "drive", x: 8.8, y: 4.6, w: 4, h: 6.4, fill: "hp-drive", origin: [10.8, 11] },
      { id: "terr", x: 0.8, y: 5.4, w: 5.6, h: 3, fill: "hp-terr", origin: [3.6, 5.4] },
      { id: "path", x: 7.0, y: 5.4, w: 1.2, h: 5.6, fill: "hp-path", origin: [7.6, 11] }
    ];
    var gPave = P.el("g", { "class": "hero-pave" }, svg);
    areas.forEach(function (a) {
      var cp = P.el("clipPath", { id: "hc-" + a.id }, defs);
      P.el("rect", { x: a.x, y: a.y, width: a.w, height: a.h }, cp);
      var g = P.el("g", { "clip-path": "url(#hc-" + a.id + ")" }, gPave);
      var step = a.w < 2 ? 1.2 : 1;
      for (var y = a.y; y < a.y + a.h - 0.001; y += step) {
        for (var x = a.x; x < a.x + a.w - 0.001; x += step) {
          var cx = x + step / 2, cy = y + step / 2;
          var dist = Math.hypot(cx - a.origin[0], cy - a.origin[1]);
          var r = P.el("rect", { x: x, y: y, width: step + 0.02, height: step + 0.02, fill: "url(#" + a.fill + ")", "class": "cell" }, g);
          r.style.setProperty("--d", (Math.min(dist * 0.075, 0.85)).toFixed(3) + "s");
        }
      }
      P.el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, "class": "curb" }, svg);
    });

    // pastatai
    P.el("rect", { x: 0.8, y: 0.6, width: 8, height: 4.8, fill: "url(#hp-hatch)", "class": "bld" }, svg);
    P.el("rect", { x: 8.8, y: 0.6, width: 4, height: 4, fill: "url(#hp-hatch)", "class": "bld" }, svg);
    var t1 = P.el("text", { x: 4.8, y: 3.15, "class": "plan-label", "text-anchor": "middle" }, svg); t1.textContent = "Namas";
    var t2 = P.el("text", { x: 10.8, y: 2.75, "class": "plan-label", "text-anchor": "middle" }, svg); t2.textContent = "Garažas";
    // latakas prie garažo
    P.el("line", { x1: 8.9, y1: 4.85, x2: 12.7, y2: 4.85, "class": "channel" }, svg);
    // medžiai
    [[2.6, 9.6, 1.1], [14.7, 7.4, 1.3], [14.9, 2.2, 0.9]].forEach(function (t) {
      P.el("circle", { cx: t[0], cy: t[1], r: t[2], "class": "tree" }, svg);
      P.el("circle", { cx: t[0], cy: t[1], r: 0.08, "class": "tree-core" }, svg);
    });
    // vartai
    P.el("line", { x1: 8.8, y1: 11, x2: 12.8, y2: 11, "class": "gate" }, svg);

    var gd = P.el("g", { "class": "hero-dims" }, svg);
    P.dimension(gd, 8.8, 11.65, 12.8, 11.65, "4,00 m", { fontSize: 0.34, tick: 0.22 });
    P.dimension(gd, 13.45, 4.6, 13.45, 11, "6,40 m", { fontSize: 0.34, tick: 0.22 });
    P.dimension(gd, 0.8, 9.05, 6.4, 9.05, "5,60 m", { fontSize: 0.34, tick: 0.22 });
    P.dimension(gd, 7.0, 11.65, 8.2, 11.65, "1,20", { fontSize: 0.3, tick: 0.2 });

    // Animacija paleidžiama vieną kartą, kai planas matomas (mobiliajame jis po tekstu)
    var fig = svg.closest(".hero-plan");
    if (reduceMotion || !("IntersectionObserver" in window)) { fig.classList.add("is-laid"); return; }
    var io = new IntersectionObserver(function (ents) {
      if (ents[0].isIntersecting) { fig.classList.add("is-laid"); io.disconnect(); }
    }, { threshold: 0.35 });
    io.observe(fig);
  }
  drawHero();

  /* ---------- Pjūvis ---------- */
  var layers = {
    pavers: {
      title: "Trinkelės",
      y: [92, 132],
      text: [
        ["Kam reikalingos", "Priima apkrovą nuo žingsnių ar ratų ir paskirsto ją į apačią. Smėliu užpildytos siūlės leidžia trinkelėms dirbti kartu, o ne kiekvienai atskirai."],
        ["Į ką atsižvelgiame", "Storį renkamės pagal apkrovą: takui užtenka plonesnių, įvažiavimui reikia storesnių. Eglutė geriau atlaiko sukančius ratus nei tiesios eilės."],
        ["Kodėl tai svarbu", "Net brangiausios trinkelės neišlaikys, jei apačioje silpnas pagrindas. Trinkelė yra tik viršutinė sistemos dalis."]
      ]
    },
    bedding: {
      title: "Pastelės sluoksnis",
      y: [132, 160],
      text: [
        ["Kam reikalingas", "Plonas atsijų ar smėlio sluoksnis, ant kurio trinkelės išlyginamos į vieną aukštį ir įsispaudžia vibruojant."],
        ["Į ką atsižvelgiame", "Sluoksnis turi būti vienodo storio. Juo nelyginamos duobės: nelygumai taisomi pagrinde."],
        ["Kodėl tai svarbu", "Kur pastelė per stora, danga ilgainiui įdumba. Tai viena dažniausių priežasčių, kodėl kieme atsiranda balos."]
      ]
    },
    aggregate: {
      title: "Skaldos pagrindas",
      y: [160, 250],
      text: [
        ["Kam reikalingas", "Pagrindinė laikanti dalis. Skalda pilama sluoksniais ir kiekvienas sluoksnis tankinamas vibroplokšte."],
        ["Į ką atsižvelgiame", "Storį lemia apkrova ir gruntas: įvažiavimui jis gerokai storesnis nei takui. Jau šiame sluoksnyje formuojamas nuolydis vandeniui nubėgti."],
        ["Kodėl tai svarbu", "Prastai sutankinta skalda slūgsta po pirmų žiemų, o trinkelės pradeda klibėti ir formuojasi provėžos."]
      ]
    },
    soil: {
      title: "Paruoštas gruntas",
      y: [250, 340],
      text: [
        ["Kam reikalingas", "Nukasus augalinį sluoksnį, likęs gruntas išlyginamas ir sutankinamas. Ant jo remiasi visa konstrukcija."],
        ["Į ką atsižvelgiame", "Molingas gruntas prastai praleidžia vandenį ir žiemą kilnojasi nuo šalčio, todėl gali reikėti geotekstilės ar drenažo. Durpingą ar supiltą gruntą dažnai tenka keisti."],
        ["Kodėl tai svarbu", "Grunto sąlygų iš nuotraukos neįvertinsi. Todėl pagrindo storį nustatome tik apžiūrėję vietą."]
      ]
    }
  };

  function drawXsecPavers() {
    var g = document.getElementById("xsPavers");
    if (!g) return;
    var x = 40, i = 0, cols = ["#55585a", "#4c4f51", "#5d6062"];
    while (x < 600) {
      var w = Math.min(54, 600 - x);
      P.el("rect", { x: x + 1.5, y: 92, width: w - 3, height: 40, rx: 1.5, fill: cols[i % 3] }, g);
      P.el("rect", { x: x + w - 1.5, y: 96, width: 3, height: 36, fill: "#c9bb98" }, g);
      x += w; i++;
    }
  }
  drawXsecPavers();

  var xsSvg = document.getElementById("xsecSvg");
  var tabs = Array.prototype.slice.call(document.querySelectorAll(".xsec-tabs [role=tab]"));
  var info = document.getElementById("xsecInfo");
  var bracket;
  if (xsSvg) {
    bracket = P.el("g", { "class": "xs-bracket" }, xsSvg);
    P.el("path", { d: "", "class": "xs-bracket-line" }, bracket);
  }

  function selectLayer(key, focus) {
    var L = layers[key];
    tabs.forEach(function (t) {
      var on = t.getAttribute("data-layer") === key;
      t.setAttribute("aria-selected", on ? "true" : "false");
      t.tabIndex = on ? 0 : -1;
      if (on) { info.setAttribute("aria-labelledby", t.id); if (focus) t.focus(); }
    });
    xsSvg.querySelectorAll(".xs-layer").forEach(function (g) {
      g.classList.toggle("is-active", g.getAttribute("data-layer") === key);
    });
    xsSvg.classList.add("has-selection");
    bracket.firstChild.setAttribute("d", "M34 " + (L.y[0] + 2) + "h-6v" + (L.y[1] - L.y[0] - 4) + "h6");
    var html = '<h3 class="h3">' + L.title + "</h3><dl>";
    L.text.forEach(function (r) { html += "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; });
    info.innerHTML = html + "</dl>";
    info.classList.remove("swap"); void info.offsetWidth; info.classList.add("swap");
  }

  if (xsSvg) {
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { selectLayer(t.getAttribute("data-layer")); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") n = (i + 1) % tabs.length;
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === "Home") n = 0;
        if (e.key === "End") n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectLayer(tabs[n].getAttribute("data-layer"), true); }
      });
    });
    xsSvg.querySelectorAll(".xs-layer").forEach(function (g) {
      g.addEventListener("click", function () { selectLayer(g.getAttribute("data-layer")); });
    });
    selectLayer("pavers");

    var xsFig = xsSvg.closest(".xsec-figure");
    function playXsec() {
      if (reduceMotion) return;
      xsFig.classList.remove("is-building"); void xsFig.offsetWidth; xsFig.classList.add("is-building");
    }
    document.getElementById("xsecReplay").addEventListener("click", playXsec);
    if ("IntersectionObserver" in window && !reduceMotion) {
      xsFig.classList.add("pre-build");
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) { xsFig.classList.remove("pre-build"); playXsec(); io.disconnect(); }
        });
      }, { threshold: 0.45 });
      io.observe(xsFig);
    }
    if (reduceMotion) document.getElementById("xsecReplay").hidden = true;
  }

  /* ---------- Prieš / po iliustracija ---------- */
  function drawBeforeAfter() {
    var before = document.getElementById("baBefore");
    var after = document.getElementById("baAfter");
    if (!before) return;

    function common(svg, prefix) {
      var defs = P.el("defs", {}, svg);
      var hatch = P.el("pattern", { id: prefix + "-hatch", patternUnits: "userSpaceOnUse", width: 0.3, height: 0.3, patternTransform: "rotate(45)" }, defs);
      P.el("line", { x1: 0, y1: 0, x2: 0, y2: 0.3, "class": "hatch-line" }, hatch);
      return defs;
    }
    function house(svg, prefix) {
      P.el("rect", { x: -0.5, y: -0.5, width: 17, height: 3.4, fill: "url(#" + prefix + "-hatch)", "class": "bld" }, svg);
      P.el("rect", { x: 5.6, y: 2.7, width: 4.8, height: 0.2, "class": "garage-door" }, svg);
      var t = P.el("text", { x: 8, y: 1.6, "class": "plan-label", "text-anchor": "middle" }, svg); t.textContent = "Garažas";
      var t2 = P.el("text", { x: 2.2, y: 1.6, "class": "plan-label", "text-anchor": "middle" }, svg); t2.textContent = "Namas";
    }

    // PRIEŠ
    var d1 = common(before, "bb");
    var lawnB = P.el("pattern", { id: "bb-lawn", patternUnits: "userSpaceOnUse", width: 0.7, height: 0.7 }, d1);
    P.el("rect", { width: 0.7, height: 0.7, fill: "#7b8160" }, lawnB);
    P.el("path", { d: "M.1 .2h.1M.45 .5h.1", stroke: "#6c7254", "stroke-width": 0.03 }, lawnB);
    var grav = P.el("pattern", { id: "bb-grav", patternUnits: "userSpaceOnUse", width: 0.5, height: 0.5 }, d1);
    P.el("rect", { width: 0.5, height: 0.5, fill: "#a59c8b" }, grav);
    [[.08, .1, .05], [.3, .22, .04], [.18, .4, .06], [.42, .42, .035], [.4, .05, .03]].forEach(function (c) {
      P.el("circle", { cx: c[0], cy: c[1], r: c[2], fill: "#8c8373" }, grav);
    });
    P.el("rect", { x: -1, y: -1, width: 18, height: 12, fill: "url(#bb-lawn)" }, before);
    // išmindžiotos dėmės
    [[3.2, 7.8, 1.3, 0.7], [13.4, 5.6, 1.1, 0.8], [1.5, 4.6, 0.9, 0.5]].forEach(function (e) {
      P.el("ellipse", { cx: e[0], cy: e[1], rx: e[2], ry: e[3], fill: "#8f7c62", opacity: 0.75 }, before);
    });
    P.el("path", { d: "M4.9 2.9 C5 5 4.6 7.5 4.2 10.5 L11.6 10.5 C11.3 7.5 11 5 11.1 2.9Z", fill: "url(#bb-grav)" }, before);
    P.el("path", { d: "M6.3 3.2 C6.2 5.5 6 8 5.8 10.5", stroke: "#7d6f5c", "stroke-width": 0.45, fill: "none", "stroke-linecap": "round", opacity: 0.8 }, before);
    P.el("path", { d: "M9.6 3.2 C9.6 5.5 9.7 8 9.9 10.5", stroke: "#7d6f5c", "stroke-width": 0.45, fill: "none", "stroke-linecap": "round", opacity: 0.8 }, before);
    P.el("ellipse", { cx: 7.6, cy: 3.6, rx: 1.6, ry: 0.5, fill: "#7f8e96", opacity: 0.85 }, before);
    P.el("ellipse", { cx: 9.8, cy: 6.4, rx: 0.6, ry: 0.3, fill: "#7f8e96", opacity: 0.8 }, before);
    // seni sutrūkinėję takeliai
    [[1.6, 3.4], [1.9, 4.6], [1.5, 5.9], [1.8, 7.3], [1.6, 8.7]].forEach(function (s, i) {
      P.el("rect", { x: s[0], y: s[1], width: 0.8, height: 0.6, fill: "#a9a69e", transform: "rotate(" + (i % 2 ? 8 : -6) + " " + (s[0] + .4) + " " + (s[1] + .3) + ")" }, before);
    });
    house(before, "bb");

    // PO
    var d2 = common(after, "ba");
    d2.appendChild(P.fromConfig("ba-drive", "betonines", "grafitas", "eglute"));
    d2.appendChild(P.fromConfig("ba-path", "ploksciu", "sviesi", "perrisimas"));
    var lawnA = P.el("pattern", { id: "ba-lawn", patternUnits: "userSpaceOnUse", width: 0.6, height: 0.6 }, d2);
    P.el("rect", { width: 0.6, height: 0.6, fill: "#7d8a5d" }, lawnA);
    P.el("path", { d: "M.1 .2h.08M.4 .45h.08", stroke: "#6e7b50", "stroke-width": 0.025 }, lawnA);
    P.el("rect", { x: -1, y: -1, width: 18, height: 12, fill: "url(#ba-lawn)" }, after);
    P.el("rect", { x: 4.8, y: 2.9, width: 6.4, height: 8, fill: "url(#ba-drive)" }, after);
    P.el("rect", { x: 4.8, y: 2.9, width: 6.4, height: 8, "class": "curb" }, after);
    P.el("rect", { x: 1.4, y: 2.9, width: 1.2, height: 8, fill: "url(#ba-path)" }, after);
    P.el("rect", { x: 1.4, y: 2.9, width: 1.2, height: 8, "class": "curb curb-thin" }, after);
    P.el("line", { x1: 4.95, y1: 3.15, x2: 11.05, y2: 3.15, "class": "channel" }, after);
    house(after, "ba");
  }
  drawBeforeAfter();

  (function slider() {
    var stage = document.getElementById("baStage");
    if (!stage) return;
    var range = document.getElementById("baRange");
    var clip = document.getElementById("baClip");
    var handle = document.getElementById("baHandle");
    function set(v) {
      v = Math.max(0, Math.min(100, v));
      clip.style.clipPath = "inset(0 0 0 " + v + "%)";
      handle.style.left = v + "%";
      range.value = Math.round(v);
      range.setAttribute("aria-valuetext", "Rodoma " + Math.round(100 - v) + " % vaizdo „po“");
    }
    range.addEventListener("input", function () { set(parseFloat(range.value)); });
    var dragging = false;
    function fromEvent(e) {
      var r = stage.getBoundingClientRect();
      return ((e.clientX - r.left) / r.width) * 100;
    }
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true;
      stage.setPointerCapture(e.pointerId);
      stage.classList.add("is-dragging");
      set(fromEvent(e));
    });
    stage.addEventListener("pointermove", function (e) { if (dragging) set(fromEvent(e)); });
    function end() { dragging = false; stage.classList.remove("is-dragging"); }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    set(50);
  })();

  /* ---------- Projektų galerija (demonstraciniai) ---------- */
  var projects = [
    {
      title: "Įvažiavimas ir aikštelė dviem automobiliams",
      place: "Kauno r.",
      type: "Įvažiavimas",
      area: "apie 85 m²",
      materials: "Betoninės trinkelės, grafitas, eglutė; kelio borteliai; linijinis latakas",
      text: "Žvyruotas įvažiavimas iškastas, įrengtas naujas skaldos pagrindas. Prie garažo vartų sumontuotas latakas, nes vanduo bėgo į vidų.",
      view: [13, 11],
      house: [[0, 0, 13, 2.5]],
      areas: [{ x: 1.5, y: 2.5, w: 10, h: 8.5, m: "betonines", c: "grafitas", p: "eglute" }],
      dims: [[1.5, 11.6, 11.5, 11.6, "10,0 m"], [12.1, 2.5, 12.1, 11, "8,5 m"]]
    },
    {
      title: "Terasa ir takas prie namo",
      place: "Vilniaus r.",
      type: "Kiemas ir terasa",
      area: "apie 38 m²",
      materials: "Didelio formato plokštės 60 × 40 cm, šviesiai pilkos; vejos borteliai",
      text: "Terasa prie svetainės durų ir takas iki ūkinio pastato. Plokštės klotos tiesiomis eilėmis, siūlės sulygiuotos su namo langais.",
      view: [14, 10],
      house: [[0, 0, 14, 3]],
      areas: [
        { x: 1, y: 3, w: 8, h: 4, m: "ploksciu", c: "sviesi", p: "tiesi" },
        { x: 9, y: 5.8, w: 5, h: 1.2, m: "ploksciu", c: "sviesi", p: "tiesi" }
      ],
      dims: [[1, 7.6, 9, 7.6, "8,0 m"], [0.45, 3, 0.45, 7, "4,0 m"]]
    },
    {
      title: "Takas per sodą",
      place: "Trakai",
      type: "Pėsčiųjų takas",
      area: "apie 23 m²",
      materials: "Klinkerio trinkelės, raudona, su perrišimu; vejos borteliai",
      text: "Takas nuo namo durų iki sodo vartelių. Kraštas atremtas į vejos bortelius, kad žolė neužaugtų ant tako.",
      view: [15, 11],
      house: [[0, 0, 6, 2]],
      areas: [
        { x: 2, y: 2, w: 1.2, h: 8, m: "klinkeris", c: "raudona", p: "perrisimas" },
        { x: 3.2, y: 8.8, w: 10.8, h: 1.2, m: "klinkeris", c: "raudona", p: "perrisimas" }
      ],
      trees: [[8, 4.5, 1.4], [12.2, 3.6, 1.1], [5.3, 6.2, 0.8]],
      dims: [[3.2, 10.55, 14, 10.55, "10,8 m"], [1.45, 2, 1.45, 10, "8,0 m"]]
    },
    {
      title: "Įdubusio kiemo perklojimas",
      place: "Kaunas",
      type: "Remontas ir perklojimas",
      area: "apie 110 m²",
      materials: "Esamos betoninės trinkelės, pilkos; dalis pakeista naujomis",
      text: "Per kelerius metus įdubusi dalis išardyta, pagrindas papildytas ir sutankintas, trinkelės sudėtos atgal. Suskilusios pakeistos naujomis.",
      view: [14, 12],
      house: [[0, 0, 14, 2]],
      areas: [{ x: 1, y: 2, w: 12, h: 9, m: "betonines", c: "pilka", p: "perrisimas" }],
      repair: [6.4, 4, 5, 4.2],
      dims: [[1, 11.55, 13, 11.55, "12,0 m"], [13.45, 2, 13.45, 11, "9,0 m"]]
    }
  ];

  function drawProjectPlan(svg, pr, idx) {
    var defs = P.el("defs", {}, svg);
    var hatch = P.el("pattern", { id: "pj-h" + idx, patternUnits: "userSpaceOnUse", width: 0.35, height: 0.35, patternTransform: "rotate(45)" }, defs);
    P.el("line", { x1: 0, y1: 0, x2: 0, y2: 0.35, "class": "hatch-line" }, hatch);
    P.el("rect", { x: -1, y: -1, width: pr.view[0] + 2, height: pr.view[1] + 2, "class": "lawn-flat" }, svg);
    pr.house.forEach(function (h) {
      P.el("rect", { x: h[0], y: h[1], width: h[2], height: h[3], fill: "url(#pj-h" + idx + ")", "class": "bld" }, svg);
    });
    pr.areas.forEach(function (a, j) {
      var id = "pj-p" + idx + "-" + j;
      defs.appendChild(P.fromConfig(id, a.m, a.c, a.p));
      P.el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, fill: "url(#" + id + ")" }, svg);
      P.el("rect", { x: a.x, y: a.y, width: a.w, height: a.h, "class": "curb curb-thin" }, svg);
    });
    (pr.trees || []).forEach(function (t) {
      P.el("circle", { cx: t[0], cy: t[1], r: t[2], "class": "tree" }, svg);
    });
    if (pr.repair) {
      var r = pr.repair;
      P.el("rect", { x: r[0], y: r[1], width: r[2], height: r[3], "class": "repair-zone" }, svg);
      var t = P.el("text", { x: r[0] + r[2] / 2, y: r[1] + r[3] / 2, "class": "repair-label", "text-anchor": "middle", "dominant-baseline": "middle" }, svg);
      t.textContent = "perklota zona";
    }
    var gd = P.el("g", { "class": "hero-dims" }, svg);
    pr.dims.forEach(function (d) { P.dimension(gd, d[0], d[1], d[2], d[3], d[4], { fontSize: 0.46, tick: 0.28 }); });
  }

  var list = document.getElementById("projects");
  if (list) projects.forEach(function (pr, i) {
    var li = document.createElement("li");
    li.className = "project project-" + (i + 1);
    li.innerHTML =
      '<figure class="project-plan"><svg viewBox="-0.6 -0.6 ' + (pr.view[0] + 1.2) + " " + (pr.view[1] + 1.6) + '" role="img" aria-label="Plano schema: ' + pr.title + '"></svg></figure>' +
      '<div class="project-text">' +
      '<p class="project-flag">Demonstracinis pavyzdys</p>' +
      '<h3 class="h3"></h3>' +
      '<dl class="project-meta">' +
      "<div><dt>Vieta</dt><dd></dd></div><div><dt>Darbai</dt><dd></dd></div><div><dt>Plotas</dt><dd></dd></div><div class=\"pm-wide\"><dt>Medžiagos</dt><dd></dd></div>" +
      "</dl><p class=\"project-desc\"></p></div>";
    li.querySelector(".h3").textContent = pr.title;
    var dds = li.querySelectorAll("dd");
    dds[0].textContent = pr.place; dds[1].textContent = pr.type; dds[2].textContent = pr.area; dds[3].textContent = pr.materials;
    li.querySelector(".project-desc").textContent = pr.text;
    list.appendChild(li);
    drawProjectPlan(li.querySelector("svg"), pr, i);
  });

  /* ---------- Užklausos forma ---------- */
  var qf = document.getElementById("quoteForm");
  var plannerData = null;
  var modeEl = document.getElementById("formMode");
  var demoMode = !cfg.form.endpoint;
  modeEl.textContent = demoMode
    ? "Demo režimas: forma patikrina duomenis, bet užklausos niekur nesiunčia. Prijungti tikrą siuntimą galima config.js faile."
    : "";
  modeEl.hidden = !demoMode;

  var useToType = { takas: "takas", kiemas: "kiemas", terasa: "terasa", ivaziavimas: "ivaziavimas" };

  document.addEventListener("grindas:quote", function (e) {
    plannerData = e.detail;
    var box = document.getElementById("plannerSummary");
    var dl = document.getElementById("plannerSummaryList");
    dl.innerHTML = "";
    plannerData.rows.forEach(function (r) {
      var div = document.createElement("div");
      var dt = document.createElement("dt"); dt.textContent = r[0];
      var dd = document.createElement("dd"); dd.textContent = r[1];
      div.appendChild(dt); div.appendChild(dd); dl.appendChild(div);
    });
    box.hidden = false;
    qf.elements.type.value = useToType[plannerData.use] || "";
    qf.elements.area.value = String(plannerData.area).replace(".", ",");
    clearErr("type"); clearErr("area");
    document.getElementById("kontaktai").scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    setTimeout(function () { qf.elements.name.focus({ preventScroll: true }); }, reduceMotion ? 0 : 500);
    box.classList.remove("flash"); void box.offsetWidth; box.classList.add("flash");
  });

  document.getElementById("clearPlanner").addEventListener("click", function () {
    plannerData = null;
    document.getElementById("plannerSummary").hidden = true;
    qf.elements.name.focus();
  });

  function setErr(name, msg) {
    var el = document.getElementById("qerr-" + name);
    if (el) el.textContent = msg;
    var input = qf.elements[name];
    if (input) input.setAttribute("aria-invalid", msg ? "true" : "false");
  }
  function clearErr(name) { setErr(name, ""); }

  function validateQuote() {
    var f = qf.elements, ok = true, first = null;
    function check(name, cond, msg) {
      if (!cond) { setErr(name, msg); ok = false; if (!first) first = f[name]; }
      else clearErr(name);
    }
    var name = f.name.value.trim();
    check("name", name.length >= 2, "Įrašykite vardą.");
    var c = f.contact.value.trim();
    var isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c);
    var digits = c.replace(/[\s()-]/g, "");
    var isPhone = /^(\+370|8|\+\d{2,3})\d{7,10}$/.test(digits);
    check("contact", isEmail || isPhone, c ? "Įrašykite telefoną (pvz. +370 612 34567) arba el. pašto adresą." : "Nurodykite, kaip su jumis susisiekti.");
    check("city", f.city.value.trim().length >= 2, "Įrašykite miestą ar savivaldybę.");
    check("type", !!f.type.value, "Pasirinkite darbų tipą.");
    var areaRaw = f.area.value.trim();
    var areaNum = window.GrindasCalc.parseNum(areaRaw);
    check("area", !areaRaw || (areaNum > 0 && areaNum <= 100000), "Įrašykite plotą skaičiumi, pvz. 60 arba 62,5.");
    check("consent", f.consent.checked, "Be sutikimo negalėsime atsakyti į užklausą.");
    return { ok: ok, first: first };
  }

  qf.addEventListener("input", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true") validateQuote();
  });
  qf.addEventListener("change", function (e) {
    if (e.target.getAttribute("aria-invalid") === "true") validateQuote();
  });

  function payload() {
    var f = qf.elements;
    return {
      vardas: f.name.value.trim(),
      kontaktas: f.contact.value.trim(),
      miestas: f.city.value.trim(),
      darbu_tipas: f.type.options[f.type.selectedIndex].text,
      plotas_m2: f.area.value.trim(),
      laikas: f.timing.options[f.timing.selectedIndex].text,
      zinute: f.message.value.trim(),
      planuoklis: plannerData ? plannerData.rows.map(function (r) { return r[0] + ": " + r[1]; }) : null,
      sutikimas: true
    };
  }

  var result = document.getElementById("formResult");
  function showResult(kind, html) {
    result.hidden = false;
    result.className = "form-result is-" + kind;
    result.innerHTML = html;
    result.focus();
  }

  qf.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = validateQuote();
    if (!v.ok) { v.first.focus(); return; }
    var data = payload();
    var btn = qf.querySelector("button[type=submit]");

    if (demoMode) {
      var labels = { vardas: "Vardas", kontaktas: "Kontaktas", miestas: "Miestas", darbu_tipas: "Darbų tipas", plotas_m2: "Plotas, m²", laikas: "Laikas", zinute: "Žinutė", planuoklis: "Planuoklis" };
      var txt = Object.keys(labels).filter(function (k) { return data[k]; }).map(function (k) {
        return labels[k] + ": " + (Array.isArray(data[k]) ? "\n  " + data[k].join("\n  ") : data[k]);
      }).join("\n");
      showResult("demo",
        "<h3 class=\"h4\">Užklausa neišsiųsta: veikia demo režimas</h3>" +
        "<p>Duomenys užpildyti teisingai. Tikroje svetainėje jie būtų išsiųsti įmonei. Žemiau matote, kas būtų perduota.</p>" +
        "<pre class=\"payload\"></pre>");
      result.querySelector(".payload").textContent = txt;
      return;
    }

    btn.disabled = true;
    btn.textContent = "Siunčiama…";
    fetch(cfg.form.endpoint, {
      method: cfg.form.method || "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      showResult("ok", "<h3 class=\"h4\">Užklausa išsiųsta</h3><p>Gavome jūsų užklausą. Susisieksime per vieną–dvi darbo dienas.</p>");
      qf.reset();
      plannerData = null;
      document.getElementById("plannerSummary").hidden = true;
    }).catch(function () {
      showResult("error", "<h3 class=\"h4\">Užklausos išsiųsti nepavyko</h3><p>Patikrinkite interneto ryšį ir bandykite dar kartą arba paskambinkite " + biz.phone + ".</p>");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Siųsti užklausą";
    });
  });
})();
