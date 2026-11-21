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

  /* ---------- HERO: nuotrauka susiklosto iš plokščių (vieną kartą) ---------- */
  (function heroAssemble() {
    var fig = document.getElementById("heroPhoto");
    if (!fig || reduceMotion || !("IntersectionObserver" in window)) return;
    var img = fig.querySelector("img");
    var done = false;
    function reveal() { fig.classList.add("is-done"); }
    // jei nuotrauka nespėja įsikelti — rodome be animacijos
    var safety = setTimeout(function () { if (!done) { done = true; reveal(); } }, 4000);

    function run() {
      if (done) return;
      done = true;
      clearTimeout(safety);
      var W = fig.clientWidth, H = fig.clientHeight;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      if (!W || !H || !iw) { reveal(); return; }
      // tas pats „object-fit: cover“ išdėstymas kaip <img>
      var sc = Math.max(W / iw, H / ih), bw = iw * sc, bh = ih * sc;
      var ox = (W - bw) / 2, oy = (H - bh) / 2;
      var rows = 5, cols = 3, th = H / rows, tw = W / cols, gap = 3;
      var src = img.currentSrc || img.src;
      var frag = document.createDocumentFragment(), tiles = [], maxDelay = 0;
      for (var r = 0; r < rows; r++) {
        var start = (r % 2) ? -tw / 2 : 0; // eilės su perrišimu, kaip klojamos plokštės
        for (var x = start; x < W - 1; x += tw) {
          var left = Math.max(0, x), right = Math.min(W, x + tw), top = r * th;
          var t = document.createElement("span");
          t.className = "hero-tile";
          t.style.left = (left + gap / 2) + "px";
          t.style.top = (top + gap / 2) + "px";
          t.style.width = (right - left - gap) + "px";
          t.style.height = (th - gap) + "px";
          t.style.backgroundImage = "url(\"" + src + "\")";
          t.style.backgroundSize = bw + "px " + bh + "px";
          t.style.backgroundPosition = (ox - left - gap / 2) + "px " + (oy - top - gap / 2) + "px";
          // klojama nuo apačios (vartų) į viršų, iš kairės į dešinę
          var d = (rows - 1 - r) * 0.11 + (left / W) * 0.22;
          maxDelay = Math.max(maxDelay, d);
          t.style.setProperty("--d", d.toFixed(3) + "s");
          frag.appendChild(t); tiles.push(t);
        }
      }
      fig.classList.add("is-assembling");
      fig.appendChild(frag);
      // pabaigoje siūlės „užpildomos“: rodoma vientisa nuotrauka
      setTimeout(function () {
        reveal();
        fig.classList.remove("is-assembling");
        setTimeout(function () { tiles.forEach(function (n) { n.remove(); }); }, 260);
      }, (maxDelay + 0.5) * 1000);
    }

    var io = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      io.disconnect();
      if (img.complete && img.naturalWidth) run();
      else img.addEventListener("load", run, { once: true });
    }, { threshold: 0.3 });
    io.observe(fig);
  })();

  /* ---------- Pjūvis ---------- */
  var layers = {
    pavers: {
      title: "Trinkelės", y: [92, 132],
      text: [
        ["Kam reikalingos", "Priima apkrovą nuo žingsnių ar ratų ir paskirsto ją į apačią. Smėliu užpildytos siūlės leidžia trinkelėms dirbti kartu."],
        ["Į ką atsižvelgiame", "Storį renkamės pagal apkrovą: takui užtenka plonesnių, įvažiavimui reikia storesnių. Eglutė geriau atlaiko sukančius ratus."],
        ["Kodėl tai svarbu", "Net brangiausios trinkelės neišlaikys, jei apačioje silpnas pagrindas."]
      ]
    },
    bedding: {
      title: "Pastelės sluoksnis", y: [132, 160],
      text: [
        ["Kam reikalingas", "Plonas atsijų ar smėlio sluoksnis, ant kurio trinkelės išlyginamos į vieną aukštį."],
        ["Į ką atsižvelgiame", "Sluoksnis turi būti vienodo storio. Juo nelyginamos duobės: nelygumai taisomi pagrinde."],
        ["Kodėl tai svarbu", "Kur pastelė per stora, danga ilgainiui įdumba, o kieme atsiranda balos."]
      ]
    },
    aggregate: {
      title: "Skaldos pagrindas", y: [160, 250],
      text: [
        ["Kam reikalingas", "Pagrindinė laikanti dalis. Skalda pilama sluoksniais, kiekvienas tankinamas vibroplokšte."],
        ["Į ką atsižvelgiame", "Storį lemia apkrova ir gruntas: įvažiavimui jis gerokai storesnis nei takui. Čia formuojamas nuolydis vandeniui."],
        ["Kodėl tai svarbu", "Prastai sutankinta skalda slūgsta po pirmų žiemų, trinkelės pradeda klibėti."]
      ]
    },
    soil: {
      title: "Paruoštas gruntas", y: [250, 340],
      text: [
        ["Kam reikalingas", "Nukasus augalinį sluoksnį, gruntas išlyginamas ir sutankinamas. Ant jo remiasi visa konstrukcija."],
        ["Į ką atsižvelgiame", "Molis prastai praleidžia vandenį ir kilnojasi nuo šalčio, todėl gali reikėti geotekstilės ar drenažo."],
        ["Kodėl tai svarbu", "Grunto iš nuotraukos neįvertinsi, todėl pagrindo storį nustatome tik apžiūrėję vietą."]
      ]
    }
  };

  (function drawXsecPavers() {
    var g = document.getElementById("xsPavers");
    if (!g) return;
    var x = 40, i = 0, cols = ["#55585a", "#4c4f51", "#5d6062"];
    while (x < 600) {
      var w = Math.min(54, 600 - x);
      P.el("rect", { x: x + 1.5, y: 92, width: w - 3, height: 40, rx: 1.5, fill: cols[i % 3] }, g);
      P.el("rect", { x: x + w - 1.5, y: 96, width: 3, height: 36, fill: "#c9bb98" }, g);
      x += w; i++;
    }
  })();

  var xsSvg = document.getElementById("xsecSvg");
  if (xsSvg) {
    var tabs = Array.prototype.slice.call(document.querySelectorAll(".xsec-tabs [role=tab]"));
    var info = document.getElementById("xsecInfo");
    var bracket = P.el("g", { "class": "xs-bracket" }, xsSvg);
    P.el("path", { d: "", "class": "xs-bracket-line" }, bracket);

    var selectLayer = function (key, focus) {
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
    };

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
    var playXsec = function () {
      if (reduceMotion) return;
      xsFig.classList.remove("is-building"); void xsFig.offsetWidth; xsFig.classList.add("is-building");
    };
    var replay = document.getElementById("xsecReplay");
    replay.addEventListener("click", playXsec);
    if (reduceMotion) replay.hidden = true;
    else if ("IntersectionObserver" in window) {
      xsFig.classList.add("pre-build");
      var xio = new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting) { xsFig.classList.remove("pre-build"); playXsec(); xio.disconnect(); }
      }, { threshold: 0.45 });
      xio.observe(xsFig);
    }
  }

  /* ---------- Prieš / po schema ---------- */
  (function drawBeforeAfter() {
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
      P.el("rect", { x: -0.5, y: -0.5, width: 17, height: 3.4, fill: "#d9d4c8" }, svg);
      P.el("rect", { x: -0.5, y: -0.5, width: 17, height: 3.4, fill: "url(#" + prefix + "-hatch)", "class": "bld" }, svg);
      P.el("rect", { x: 5.6, y: 2.7, width: 4.8, height: 0.2, "class": "garage-door" }, svg);
      var t = P.el("text", { x: 8, y: 1.6, "class": "plan-label", "text-anchor": "middle" }, svg); t.textContent = "Garažas";
      var t2 = P.el("text", { x: 2.2, y: 1.6, "class": "plan-label", "text-anchor": "middle" }, svg); t2.textContent = "Namas";
    }
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
    [[3.2, 7.8, 1.3, 0.7], [13.4, 5.6, 1.1, 0.8], [1.5, 4.6, 0.9, 0.5]].forEach(function (e) {
      P.el("ellipse", { cx: e[0], cy: e[1], rx: e[2], ry: e[3], fill: "#8f7c62", opacity: 0.75 }, before);
    });
    P.el("path", { d: "M4.9 2.9 C5 5 4.6 7.5 4.2 10.5 L11.6 10.5 C11.3 7.5 11 5 11.1 2.9Z", fill: "url(#bb-grav)" }, before);
    P.el("path", { d: "M6.3 3.2 C6.2 5.5 6 8 5.8 10.5", stroke: "#7d6f5c", "stroke-width": 0.45, fill: "none", "stroke-linecap": "round", opacity: 0.8 }, before);
    P.el("path", { d: "M9.6 3.2 C9.6 5.5 9.7 8 9.9 10.5", stroke: "#7d6f5c", "stroke-width": 0.45, fill: "none", "stroke-linecap": "round", opacity: 0.8 }, before);
    P.el("ellipse", { cx: 7.6, cy: 3.6, rx: 1.6, ry: 0.5, fill: "#7f8e96", opacity: 0.85 }, before);
    P.el("ellipse", { cx: 9.8, cy: 6.4, rx: 0.6, ry: 0.3, fill: "#7f8e96", opacity: 0.8 }, before);
    [[1.6, 3.4], [1.9, 4.6], [1.5, 5.9], [1.8, 7.3], [1.6, 8.7]].forEach(function (s, i) {
      P.el("rect", { x: s[0], y: s[1], width: 0.8, height: 0.6, fill: "#a9a69e", transform: "rotate(" + (i % 2 ? 8 : -6) + " " + (s[0] + .4) + " " + (s[1] + .3) + ")" }, before);
    });
    house(before, "bb");

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
  })();

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
    function fromEvent(e) { var r = stage.getBoundingClientRect(); return ((e.clientX - r.left) / r.width) * 100; }
    stage.addEventListener("pointerdown", function (e) {
      if (e.button !== 0) return;
      dragging = true; stage.setPointerCapture(e.pointerId); set(fromEvent(e));
    });
    stage.addEventListener("pointermove", function (e) { if (dragging) set(fromEvent(e)); });
    function end() { dragging = false; }
    stage.addEventListener("pointerup", end);
    stage.addEventListener("pointercancel", end);
    set(50);
  })();

  /* ---------- Projektai (pavyzdiniai) ---------- */
  var IMG = "assets/img/photos/";
  var projects = [
    {
      img: "vidinis-kiemas-skalda", w: 990, h: 660, single: true,
      alt: "Vidinis kiemas iš didelių betoninių plokščių su skaldos siūlėmis prie tamsaus namo",
      title: "Vidinis kiemas su skaldos siūlėmis",
      place: "Kauno r.", area: "apie 70 m²", materials: "Didelio formato plokštės, smulki skalda siūlėms",
      text: "Plokštės paklotos su plačiomis siūlėmis, užpildytomis skalda. Vanduo susigeria, o kiemas neatrodo kaip ištisinis betonas."
    },
    {
      img: "takas-sodas", w: 1400, h: 2487,
      alt: "Trinkelių takas tarp medžių ir gėlynų",
      title: "Takas per sodą",
      place: "Trakai", area: "apie 45 m²", materials: "Betoninės trinkelės 20 × 10 cm, ruda, su perrišimu",
      text: "Platus takas nuo vartų iki namo. Kraštai atremti į vejos bortelius, kad žolė neužaugtų ant dangos."
    },
    {
      img: "kiemas-aikstele", w: 1600, h: 1067,
      alt: "Trinkelėmis išklota poilsio aikštelė su akmenine sėdima sienele",
      title: "Poilsio aikštelė kieme",
      place: "Vilniaus r.", area: "apie 40 m²", materials: "Trinkelių mišinys, smėlio ir pilki atspalviai",
      text: "Aikštelė prie esamos akmeninės sienelės. Danga pakelta virš vejos, kad po lietaus neliktų balų."
    },
    {
      img: "terasa-plokstes", w: 1600, h: 2192,
      alt: "Naujai išklota plokščių terasa palei namo sieną",
      title: "Terasa palei namą",
      place: "Kaunas", area: "apie 30 m²", materials: "Betoninės plokštės, tiesios eilės",
      text: "Plokštės paklotos su nuolydžiu nuo sienos, kad vanduo nebėgtų prie pamatų."
    },
    {
      img: "terasa-moderni", w: 1600, h: 1067,
      alt: "Šviesių plokščių terasa su pavėsine ir veja",
      title: "Terasa su pavėsine",
      place: "Kauno r.", area: "apie 35 m²", materials: "Šviesios plokštės 60 × 40 cm, vejos borteliai",
      text: "Pagrindas įrengtas po visa terasa. Plokštės paklotos iki vejos krašto ir atremtos į bortelį."
    }
  ];

  var list = document.getElementById("projects");
  if (list) projects.forEach(function (pr, i) {
    var li = document.createElement("li");
    li.className = "project project-" + (i + 1);
    var srcset = pr.single ? "" : ' srcset="' + IMG + pr.img + '-800.webp 800w, ' + IMG + pr.img + '.webp ' + pr.w + 'w"';
    var sizes = i === 0 ? "(max-width: 980px) 100vw, 60vw" : (i === 4 ? "(max-width: 980px) 100vw, 64vw" : "(max-width: 980px) 100vw, 32vw");
    li.innerHTML =
      '<figure class="project-photo"><img src="' + IMG + pr.img + (pr.single ? "" : "-800") + '.webp"' + srcset +
      ' sizes="' + sizes + '" width="' + pr.w + '" height="' + pr.h + '" loading="lazy" decoding="async" alt=""></figure>' +
      '<div class="project-text"><p class="project-flag">Pavyzdinis projektas</p><h3 class="h3"></h3>' +
      '<dl class="project-meta"><div><dt>Vieta</dt><dd></dd></div><div><dt>Plotas</dt><dd></dd></div><div><dt>Medžiagos</dt><dd></dd></div></dl>' +
      '<p class="project-desc"></p></div>';
    li.querySelector("img").alt = pr.alt;
    li.querySelector(".h3").textContent = pr.title;
    var dds = li.querySelectorAll("dd");
    dds[0].textContent = pr.place; dds[1].textContent = pr.area; dds[2].textContent = pr.materials;
    li.querySelector(".project-desc").textContent = pr.text;
    list.appendChild(li);
  });

  /* ---------- Užklausos forma ---------- */
  var qf = document.getElementById("quoteForm");
  var plannerData = null;
  var mode = cfg.form.mode || (cfg.form.endpoint ? "endpoint" : "demo");
  if (mode === "endpoint" && !cfg.form.endpoint) mode = "demo";
  var modeEl = document.getElementById("formMode");
  modeEl.textContent = mode === "demo" ? "Demo režimas: užklausa nesiunčiama, parodoma, kas būtų perduota."
    : mode === "mailto" ? "Paspaudus atsidarys jūsų el. pašto programa su paruoštu laišku." : "";

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
    setErr("type", ""); setErr("area", "");
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

  function validateQuote() {
    var f = qf.elements, ok = true, first = null;
    function check(name, cond, msg) {
      if (!cond) { setErr(name, msg); ok = false; if (!first) first = f[name]; }
      else setErr(name, "");
    }
    check("name", f.name.value.trim().length >= 2, "Įrašykite vardą.");
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
  qf.addEventListener("input", function (e) { if (e.target.getAttribute("aria-invalid") === "true") validateQuote(); });
  qf.addEventListener("change", function (e) { if (e.target.getAttribute("aria-invalid") === "true") validateQuote(); });

  var labels = { vardas: "Vardas", kontaktas: "Kontaktas", miestas: "Miestas", darbu_tipas: "Darbų tipas", plotas_m2: "Plotas, m²", laikas: "Laikas", zinute: "Žinutė", planuoklis: "Planuoklis" };
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
      planuoklis: plannerData ? plannerData.rows.map(function (r) { return r[0] + ": " + r[1]; }) : null
    };
  }
  function asText(data) {
    return Object.keys(labels).filter(function (k) { return data[k]; }).map(function (k) {
      return labels[k] + ": " + (Array.isArray(data[k]) ? "\n  " + data[k].join("\n  ") : data[k]);
    }).join("\n");
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
    if (qf.elements._honey.value) return; // botas
    var data = payload();
    var text = asText(data);
    var btn = qf.querySelector("button[type=submit]");

    if (mode === "demo") {
      showResult("demo", '<h3 class="h4">Užklausa neišsiųsta: demo režimas</h3><p>Duomenys užpildyti teisingai. Tikroje svetainėje įmonė gautų štai tokį laišką:</p><pre class="payload"></pre>');
      result.querySelector(".payload").textContent = text;
      return;
    }

    if (mode === "mailto") {
      var href = "mailto:" + biz.email + "?subject=" + encodeURIComponent(cfg.form.subject || "Užklausa") + "&body=" + encodeURIComponent(text);
      window.location.href = href;
      showResult("ok", '<h3 class="h4">Atidarytas el. pašto langas</h3><p>Patikrinkite laišką ir paspauskite „Siųsti“. Jei langas neatsidarė, parašykite adresu <a href="mailto:' + biz.email + '">' + biz.email + "</a>.</p>");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Siunčiama…";
    var body = Object.assign({}, data, {
      planuoklis: data.planuoklis ? data.planuoklis.join("\n") : "",
      _subject: (cfg.form.subject || "Užklausa") + ": " + data.darbu_tipas + ", " + data.miestas,
      _template: "table",
      _captcha: "false"
    });
    fetch(cfg.form.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      if (!res.ok) throw new Error("HTTP " + res.status);
      showResult("ok", '<h3 class="h4">Užklausa išsiųsta</h3><p>Gavome jūsų užklausą ir susisieksime per vieną–dvi darbo dienas.</p>');
      qf.reset();
      plannerData = null;
      document.getElementById("plannerSummary").hidden = true;
    }).catch(function () {
      showResult("error", '<h3 class="h4">Užklausos išsiųsti nepavyko</h3><p>Patikrinkite interneto ryšį ir bandykite dar kartą arba paskambinkite ' + biz.phone + ".</p>");
    }).then(function () {
      btn.disabled = false;
      btn.textContent = "Siųsti užklausą";
    });
  });
})();
