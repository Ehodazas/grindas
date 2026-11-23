(function () {
  "use strict";
  var cfg = window.GRINDAS_CONFIG;
  var P = window.Paving;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) document.documentElement.classList.add("reduce-motion");
  var IMG = "assets/img/photos/";

  /* ---------- Verslo duomenys ---------- */
  var biz = cfg.business;
  document.querySelectorAll("[data-biz]").forEach(function (n) {
    var k = n.getAttribute("data-biz");
    if (k === "phone") { n.textContent = biz.phone; n.setAttribute("href", biz.phoneHref); }
    else if (k === "email") { n.textContent = biz.email; n.setAttribute("href", "mailto:" + biz.email); }
    else if (k === "phoneText") { n.textContent = biz.phone; }
    else n.textContent = biz[k];
  });
  // visi „Skambinti“ mygtukai veda tiesiai į telefoną
  document.querySelectorAll("[data-tel]").forEach(function (n) { n.setAttribute("href", biz.phoneHref); });
  ["areaCall", "areaFoot"].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) el.textContent = biz.serviceAreas.join(", ") + ".";
  });
  var areaInline = document.getElementById("areaInline");
  if (areaInline) areaInline.textContent = biz.serviceAreas.join(", ") + ".";

  /* ---------- Antraštė ir navigacija ---------- */
  var header = document.querySelector(".site-header");
  var hero = document.querySelector(".hero");
  function updateHeader() { header.classList.toggle("is-solid", window.scrollY > (hero ? hero.offsetHeight - 90 : 10)); }
  window.addEventListener("scroll", updateHeader, { passive: true });
  window.addEventListener("resize", updateHeader);
  updateHeader();

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
    if (!fig) return;
    var img = fig.querySelector("img");
    function reveal() { fig.classList.add("is-done"); }
    if (reduceMotion || !("IntersectionObserver" in window)) { reveal(); return; }
    var done = false;
    var safety = setTimeout(function () { if (!done) { done = true; reveal(); } }, 4000);

    function run() {
      if (done) return;
      done = true; clearTimeout(safety);
      var W = fig.clientWidth, H = fig.clientHeight, iw = img.naturalWidth, ih = img.naturalHeight;
      if (!W || !H || !iw) { reveal(); return; }
      // atkartojamas <img> „object-fit: cover“ ir jo object-position (skiriasi kompiuteryje ir telefone)
      var sc = Math.max(W / iw, H / ih), bw = iw * sc, bh = ih * sc;
      var op = getComputedStyle(img).objectPosition.split(" ").map(function (v) { return parseFloat(v) / 100; });
      var ox = (W - bw) * (isNaN(op[0]) ? 0.5 : op[0]), oy = (H - bh) * (isNaN(op[1]) ? 0.5 : op[1]);
      var rows = 5, cols = W > 900 ? 5 : 3, th = H / rows, tw = W / cols, gap = 3;
      var src = img.currentSrc || img.src;
      var frag = document.createDocumentFragment(), tiles = [], maxDelay = 0;
      for (var r = 0; r < rows; r++) {
        var start = (r % 2) ? -tw / 2 : 0; // eilės su perrišimu
        for (var x = start; x < W - 1; x += tw) {
          var left = Math.max(0, x), right = Math.min(W, x + tw), top = r * th;
          var t = document.createElement("span");
          t.className = "hero-tile";
          t.style.cssText = "left:" + (left + gap / 2) + "px;top:" + (top + gap / 2) + "px;width:" + (right - left - gap) + "px;height:" + (th - gap) + "px;" +
            "background-image:url(\"" + src + "\");background-size:" + bw + "px " + bh + "px;background-position:" + (ox - left - gap / 2) + "px " + (oy - top - gap / 2) + "px";
          var d = (rows - 1 - r) * 0.1 + (left / W) * 0.25; // nuo apačios į viršų
          maxDelay = Math.max(maxDelay, d);
          t.style.setProperty("--d", d.toFixed(3) + "s");
          frag.appendChild(t); tiles.push(t);
        }
      }
      fig.classList.add("is-assembling");
      fig.appendChild(frag);
      setTimeout(function () {
        reveal(); fig.classList.remove("is-assembling");
        setTimeout(function () { tiles.forEach(function (n) { n.remove(); }); }, 320);
      }, (maxDelay + 0.52) * 1000);
    }
    var io = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      io.disconnect();
      if (img.complete && img.naturalWidth) { run(); return; }
      // lėtame ryšyje animacijos nelaukiame: nuotrauka tiesiog išryškėja, kai įsikelia
      var t0 = Date.now();
      img.addEventListener("load", function () {
        if (Date.now() - t0 > 1200) { done = true; clearTimeout(safety); reveal(); } else run();
      }, { once: true });
      img.addEventListener("error", function () { done = true; reveal(); }, { once: true });
    }, { threshold: 0.2 });
    io.observe(fig);
  })();

  /* ---------- Paslaugos: vienas atviras punktas, nuotrauka keičiasi ---------- */
  (function services() {
    var acc = document.getElementById("serviceAcc");
    if (!acc) return;
    var frame = document.querySelector(".services-photo");
    var photo = document.getElementById("servicePhoto");
    var items = Array.prototype.slice.call(acc.querySelectorAll(".acc-item"));
    function url(name) { return IMG + name + "-800.webp"; } // lengvi 800 px failai (~100–300 KB)

    // Visos paslaugų nuotraukos įkeliamos ir iškoduojamos iš anksto, kai skyrius artėja
    var cache = {};
    function preloadAll() {
      items.forEach(function (li) {
        var n = li.dataset.photo;
        if (cache[n]) return;
        var im = new Image();
        im.decoding = "async";
        im.src = url(n);
        cache[n] = im.decode ? im.decode().then(function () { return im; }, function () { return im; }) : Promise.resolve(im);
      });
    }
    if ("IntersectionObserver" in window) {
      var pio = new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting) { preloadAll(); pio.disconnect(); }
      }, { rootMargin: "800px 0px" });
      pio.observe(acc);
    } else preloadAll();

    var token = 0;
    function show(name, alt) {
      if (photo.dataset.current === name) return;
      photo.dataset.current = name;
      var my = ++token;
      if (!cache[name]) preloadAll();
      cache[name].then(function () {
        if (my !== token) return; // vartotojas jau paspaudė kitą punktą
        if (reduceMotion) { photo.src = url(name); photo.alt = alt; return; }
        // perėjimas: nauja nuotrauka uždedama ant senos ir išryškinama, be tuščio tarpo
        var over = new Image();
        over.className = "services-photo-next";
        over.alt = "";
        over.src = url(name);
        frame.appendChild(over);
        requestAnimationFrame(function () {
          over.classList.add("is-in");
          setTimeout(function () {
            photo.src = url(name); photo.alt = alt;
            over.remove();
          }, 200);
        });
      });
    }
    function open(li) {
      items.forEach(function (it) {
        var on = it === li;
        it.classList.toggle("is-open", on);
        it.querySelector(".acc-btn").setAttribute("aria-expanded", on ? "true" : "false");
        it.querySelector(".acc-panel").hidden = !on;
      });
      show(li.dataset.photo, li.dataset.alt);
      var tag = document.getElementById("servicePhotoTag");
      if (tag) tag.textContent = li.querySelector(".acc-btn").textContent;
    }
    photo.dataset.current = "egle-detale";
    items.forEach(function (li) {
      var btn = li.querySelector(".acc-btn");
      btn.addEventListener("click", function () { open(li); });
      btn.addEventListener("pointerenter", preloadAll, { once: true });
    });
    // nuorodos hero bloke: atidaro atitinkamą paslaugą ir nuslenka iki jos
    function openById(id) {
      var li = document.getElementById(id);
      if (li && li.classList.contains("acc-item")) { preloadAll(); open(li); return true; }
      return false;
    }
    document.querySelectorAll("[data-open-service]").forEach(function (a) {
      a.addEventListener("click", function (e) {
        var id = a.getAttribute("data-open-service");
        if (!openById(id)) return;
        e.preventDefault();
        var li = document.getElementById(id), behavior = reduceMotion ? "auto" : "smooth";
        if (window.innerWidth > 900) {
          // kompiuteryje: kuo daugiau skyriaus su antrašte ir nuotrauka, bet atidarytas punktas turi tilpti iki galo
          var head = document.getElementById("services-title").getBoundingClientRect().top + scrollY - 96;
          var itemEnd = li.getBoundingClientRect().bottom + scrollY - innerHeight + 24;
          window.scrollTo({ top: Math.max(head, itemEnd), behavior: behavior });
        } else {
          li.scrollIntoView({ behavior: behavior, block: "start" });
        }
        if (history.replaceState) history.replaceState(null, "", "#" + id);
      });
    });
    if (location.hash) openById(location.hash.slice(1));
  })();

  /* ---------- Sluoksnių pjūvis (izometrinis, pagal apkrovą ir gruntą) ---------- */
  (function layersDiagram() {
    var svg = document.getElementById("xsecSvg");
    if (!svg || !cfg.layers) return;
    var Calc = window.GrindasCalc;
    var W = 220, D = 220, OX = 215, OY = 272, C = 0.866, S = 0.5, PX = 3.6, SOIL = 46;
    function iso(x, y, z) { return [OX + (x - y) * C, OY + (x + y) * S - z]; }
    function pts(arr) { return arr.map(function (p) { var q = iso(p[0], p[1], p[2]); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "); }
    function line(g, a, b, cls) { var p = iso.apply(null, a), q = iso.apply(null, b); P.el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], "class": cls }, g); }
    function rng(cm) { return cm[0] === cm[1] ? cm[0] + " cm" : cm[0] + "–" + cm[1] + " cm"; }

    var defsHtml =
      '<pattern id="xs-agg" width="16" height="13" patternUnits="userSpaceOnUse"><rect width="16" height="13" fill="#a3a097"/><path d="M1 4l4-2 3 3-3 3-4-1zM10 1l5 1 1 4-4 2-3-3zM7 9l3-1 3 3-2 2-4-1z" fill="#878479"/><circle cx="14" cy="10" r="1.3" fill="#c0bdb4"/></pattern>' +
      '<pattern id="xs-sand" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="#d8c8a2"/><circle cx="2" cy="2" r=".7" fill="#bfae85"/><circle cx="6" cy="5" r=".6" fill="#bfae85"/></pattern>' +
      '<pattern id="xs-dsand" width="10" height="8" patternUnits="userSpaceOnUse"><rect width="10" height="8" fill="#e6dcc3"/><circle cx="3" cy="2" r=".8" fill="#cbbd98"/><circle cx="7" cy="6" r=".7" fill="#cbbd98"/></pattern>' +
      '<pattern id="xs-soil" width="22" height="14" patternUnits="userSpaceOnUse"><rect width="22" height="14" fill="#6e5a48"/><path d="M0 11l6-3M9 4l6-3M13 13l6-3" stroke="#5d4b3b" stroke-width="1.2"/></pattern>' +
      '<pattern id="xs-clay" width="22" height="14" patternUnits="userSpaceOnUse"><rect width="22" height="14" fill="#8a6f55"/><path d="M0 7h22" stroke="#7a604a" stroke-width="1.4"/></pattern>';

    var info = {
      pavers: { title: "Trinkelės", fill: "#6d7072",
        text: ["Priima apkrovą nuo žingsnių ar ratų ir paskirsto ją į apačią. Smėliu užpildytos siūlės leidžia trinkelėms dirbti kartu.",
               "Takui užtenka 6 cm trinkelių, įvažiavimui reikia 8 cm. Eglutės raštas geriau atlaiko sukančius ratus."],
        why: "Net geriausios trinkelės neišlaikys, jei apačioje silpnas pagrindas." },
      bedding: { title: "Pastelės sluoksnis", fill: "url(#xs-sand)",
        text: ["Plonas atsijų ar smėlio sluoksnis, ant kurio trinkelės išlyginamos į vieną aukštį.",
               "Turi būti vienodo storio, apie 3–5 cm. Juo nelyginamos duobės: nelygumai taisomi pagrinde."],
        why: "Kur pastelė per stora, danga ilgainiui įdumba ir kieme atsiranda balos." },
      aggregate: { title: "Skaldos pagrindas", fill: "url(#xs-agg)",
        text: ["Pagrindinė laikanti dalis. Skalda pilama sluoksniais ne storesniais nei 10–15 cm, kiekvienas tankinamas vibroplokšte.",
               "Storis priklauso nuo apkrovos: įvažiavimui gerokai storesnis nei takui. Čia formuojamas ir 1,5–2 % nuolydis nuo pastato."],
        why: "Prastai sutankinta skalda slūgsta po pirmų žiemų, o trinkelės pradeda klibėti." },
      sand: { title: "Drenuojantis smėlis", fill: "url(#xs-dsand)",
        text: ["Klojamas ant geotekstilės, kai gruntas molingas. Nuleidžia vandenį ir neleidžia skaldai susimaišyti su moliu.",
               "Molyje sluoksnis storesnis nei priemolyje."],
        why: "Be jo molis žiemą kilnojasi nuo šalčio ir danga iškyla." },
      soil: { title: "Paruoštas gruntas", fill: "url(#xs-soil)",
        text: ["Nukasus augalinį sluoksnį, gruntas išlyginamas ir sutankinamas. Ant jo remiasi visa konstrukcija.",
               "Smėlis gerai praleidžia vandenį. Priemolis ir molis jį laiko, todėl reikia geotekstilės ir drenuojančio sluoksnio."],
        why: "Grunto iš nuotraukos neįvertinsi, todėl pagrindo storį nustatome apžiūrėję vietą." }
    };

    var state = { load: "kiemas", soil: "smelis", sel: "pavers" };
    var fig = svg.closest(".xsec-figure");
    var infoBox = document.getElementById("xsecInfo");

    function radios(id, name, map, current) {
      var box = document.getElementById(id);
      Object.keys(map).forEach(function (k) {
        var l = document.createElement("label");
        l.innerHTML = '<input type="radio" name="' + name + '" value="' + k + '"' + (k === current ? " checked" : "") + "><span></span>";
        l.querySelector("span").textContent = map[k].label;
        box.appendChild(l);
      });
      box.addEventListener("change", function (e) { state[name] = e.target.value; draw(true); });
    }
    radios("loadSeg", "load", cfg.layers.loads, state.load);
    radios("soilSeg", "soil", cfg.layers.soils, state.soil);

    function showInfo(key) {
      var L = info[key];
      infoBox.innerHTML = "<h3></h3><p></p><p></p><p class=\"why\"></p>";
      infoBox.querySelector("h3").textContent = L.title;
      var ps = infoBox.querySelectorAll("p");
      ps[0].textContent = L.text[0]; ps[1].textContent = L.text[1]; ps[2].textContent = L.why;
      infoBox.classList.remove("swap"); void infoBox.offsetWidth; infoBox.classList.add("swap");
    }

    function select(key) {
      state.sel = key;
      svg.querySelectorAll(".xs-layer").forEach(function (g) {
        var on = g.getAttribute("data-layer") === key;
        g.classList.toggle("is-active", on);
        g.setAttribute("aria-pressed", on ? "true" : "false");
      });
      fig.classList.add("has-selection");
      showInfo(key);
    }

    function draw(changed) {
      var stack = Calc.layerStack(state.load, state.soil);
      var soilDef = cfg.layers.soils[state.soil];
      svg.innerHTML = "";
      P.el("defs", {}, svg).innerHTML = defsHtml;
      var st = document.createElementNS(P.NS, "style");
      st.textContent = ".xs-joint{stroke:#3f4244;stroke-width:1}";
      svg.appendChild(st);

      // sluoksniai iš apačios į viršų
      var bottomUp = [{ key: "soil", z: [0, SOIL], cm: null }];
      var z = SOIL;
      stack.layers.slice().reverse().forEach(function (l) {
        var h = ((l.cm[0] + l.cm[1]) / 2) * PX;
        bottomUp.push({ key: l.key, z: [z, z + h], cm: l.cm });
        z += h;
      });
      var topZ = z;

      // užrašų vietos: nuo viršaus žemyn, ne arčiau kaip 46 px viena nuo kitos
      var labelled = bottomUp.slice().reverse().map(function (L) {
        var s = iso(W, D * 0.35, (L.z[0] + L.z[1]) / 2);
        return { L: L, sx: s[0], sy: s[1], ly: s[1] };
      });
      for (var i = 0; i < labelled.length; i++) {
        if (i === 0) labelled[i].ly = Math.max(40, labelled[i].ly - 10);
        else labelled[i].ly = Math.max(labelled[i].ly, labelled[i - 1].ly + 46);
      }

      labelled.slice().reverse().forEach(function (o) {
        var L = o.L, I = info[L.key];
        var fill = L.key === "soil" && state.soil !== "smelis" ? "url(#xs-clay)" : I.fill;
        var sub = L.key === "soil" ? (soilDef.geotextile ? soilDef.label.toLowerCase() + ", su geotekstile" : soilDef.label.toLowerCase() + ", sutankintas") : rng(L.cm);
        var g = P.el("g", { "class": "xs-layer", "data-layer": L.key, tabindex: "0", role: "button", "aria-pressed": "false", "aria-label": I.title + ": " + sub }, svg);
        var body = P.el("g", { "class": "xs-body xs-" + L.key }, g);
        var z0 = L.z[0], z1 = L.z[1];
        P.el("polygon", { points: pts([[0, D, z0], [W, D, z0], [W, D, z1], [0, D, z1]]), fill: fill, stroke: "#2b2e2c", "stroke-width": 0.8 }, body);
        P.el("polygon", { points: pts([[W, D, z0], [W, 0, z0], [W, 0, z1], [W, D, z1]]), fill: fill, stroke: "#2b2e2c", "stroke-width": 0.8 }, body);
        P.el("polygon", { points: pts([[W, D, z0], [W, 0, z0], [W, 0, z1], [W, D, z1]]), fill: "rgba(0,0,0,.16)" }, body);
        if (L.key === "pavers") {
          var top = P.el("g", {}, body);
          P.el("polygon", { points: pts([[0, 0, z1], [W, 0, z1], [W, D, z1], [0, D, z1]]), fill: "#8b8e8f", stroke: "#2b2e2c", "stroke-width": 0.8 }, top);
          for (var k = 1; k < 10; k++) line(top, [0, k * 22, z1], [W, k * 22, z1], "xs-joint");
          for (var r = 0; r < 10; r++) for (var x = (r % 2) * 22; x < W; x += 44) if (x > 0) line(top, [x, r * 22, z1], [x, (r + 1) * 22, z1], "xs-joint");
          for (var x2 = 22; x2 < W; x2 += 44) line(body, [x2, D, z0], [x2, D, z1], "xs-joint");
          for (var y2 = 22; y2 < D; y2 += 22) line(body, [W, y2, z0], [W, y2, z1], "xs-joint");
        }
        if (L.key === "soil" && soilDef.geotextile) {
          // geotekstilė: punktyrinė linija grunto viršuje
          P.el("polyline", { points: pts([[0, D, z1], [W, D, z1], [W, 0, z1]]), fill: "none", stroke: "#f2efe8", "stroke-width": 2.2, "stroke-dasharray": "6 4" }, body);
        }
        P.el("circle", { cx: o.sx, cy: o.sy, r: 3, "class": "xs-dot" }, g);
        P.el("polyline", { points: [o.sx, o.sy, 420, o.sy, 444, o.ly, 460, o.ly].join(" "), fill: "none", "class": "xs-leader" }, g);
        var t1 = P.el("text", { x: 468, y: o.ly - 3, "class": "xs-label-title" }, g); t1.textContent = I.title;
        var t2 = P.el("text", { x: 468, y: o.ly + 15, "class": "xs-label-sub" }, g); t2.textContent = sub;
        P.el("rect", { x: 456, y: o.ly - 20, width: 240, height: 42, "class": "xs-hit" }, g);
        g.addEventListener("click", function () { select(L.key); });
        g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(L.key); } });
      });

      // kasimo gylio matmuo kairėje
      var a = iso(0, D, topZ), b = iso(0, D, SOIL), dx = -26;
      var gd = P.el("g", { "class": "xs-depthdim" }, svg);
      P.el("line", { x1: a[0] + dx, y1: a[1], x2: b[0] + dx, y2: b[1], "class": "xs-dimline" }, gd);
      P.el("line", { x1: a[0] + dx - 6, y1: a[1], x2: a[0] + dx + 6, y2: a[1], "class": "xs-dimline" }, gd);
      P.el("line", { x1: b[0] + dx - 6, y1: b[1], x2: b[0] + dx + 6, y2: b[1], "class": "xs-dimline" }, gd);
      var my = (a[1] + b[1]) / 2, mx = a[0] + dx - 10;
      var dt = P.el("text", { x: mx, y: my, "class": "xs-dimtext", "text-anchor": "middle", transform: "rotate(-90 " + mx + " " + my + ")" }, gd);
      dt.textContent = "≈ " + stack.depth[0] + "–" + stack.depth[1] + " cm";

      document.getElementById("xsDepth").textContent = "≈ " + stack.depth[0] + "–" + stack.depth[1] + " cm";
      document.getElementById("xsSoilNote").textContent = cfg.layers.loads[state.load].note + " " + soilDef.note;

      if (!svg.querySelector('.xs-layer[data-layer="' + state.sel + '"]')) state.sel = "pavers";
      select(state.sel);
      if (changed && !reduceMotion) { fig.classList.remove("xs-redraw"); void fig.offsetWidth; fig.classList.add("xs-redraw"); }
    }
    draw(false);

    var buildTimer;
    function play() {
      if (reduceMotion) return;
      fig.classList.remove("is-building"); void fig.getBoundingClientRect(); fig.classList.add("is-building");
      // po animacijos klasė nuimama, kad perpiešiant (pakeitus apkrovą ar gruntą) ji nesikartotų
      clearTimeout(buildTimer);
      buildTimer = setTimeout(function () { fig.classList.remove("is-building"); }, 1700);
    }
    var replay = document.getElementById("xsecReplay");
    replay.addEventListener("click", play);
    if (reduceMotion) replay.hidden = true;
    else fig.classList.add("pre-build");

    // skiltis suskleista; animacija pati paleidžiama tik pirmą kartą atvėrus
    var toggle = document.getElementById("layersToggle"), body = document.getElementById("layersBody");
    var toggleLabel = toggle && toggle.querySelector(".layers-toggle-label"), played = false;
    function setOpen(open) {
      if (!toggle || !body) return;
      body.hidden = !open;
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggleLabel.textContent = open ? "Slėpti dangos sluoksnius" : "Rodyti dangos sluoksnius";
      if (open && !played) { played = true; fig.classList.remove("pre-build"); play(); }
    }
    if (toggle) toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    function openFromHash() { if (location.hash === "#pagrindas") setOpen(true); }
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
  })();

  /* ---------- Pažadas klientui ---------- */
  document.querySelectorAll("[data-region]").forEach(function (n) { n.textContent = biz.region || ""; });

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
      P.el("rect", { x: -0.5, y: -0.5, width: 17, height: 3.4, fill: "#e3ded4" }, svg);
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
    var range = document.getElementById("baRange"), clip = document.getElementById("baClip"), handle = document.getElementById("baHandle");
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
    stage.addEventListener("pointerdown", function (e) { if (e.button !== 0) return; dragging = true; stage.setPointerCapture(e.pointerId); set(fromEvent(e)); });
    stage.addEventListener("pointermove", function (e) { if (dragging) set(fromEvent(e)); });
    stage.addEventListener("pointerup", function () { dragging = false; });
    stage.addEventListener("pointercancel", function () { dragging = false; });
    set(50);
  })();

  /* ---------- Projektai (pavyzdiniai) ---------- */
  var projects = [
    { img: "ivaziavimas-tujos", w: 1400, h: 1118, pos: "18% 50%", title: "Įvažiavimas prie garažo", meta: "Kauno r., apie 70 m²", area: "≈ 70 m²",
      alt: "Pilkų trinkelių įvažiavimas į garažą palei aukštą tujų gyvatvorę" },
    { img: "namas-medinis-takas", w: 1600, h: 1067, title: "Takas iš plokščių prie namo", meta: "Vilniaus r., apie 45 m²", area: "≈ 45 m²",
      alt: "Takas iš didelių plokščių su akmenukų siūlėmis prie medinio namo" },
    { img: "terasa-laipteliai", w: 1600, h: 1000, title: "Terasa su laipteliais", meta: "Kaunas, apie 35 m²", area: "≈ 35 m²",
      alt: "Pakelta plokščių terasa su lenktais betoniniais laipteliais rudenėjančiame sode" }
  ];
  var list = document.getElementById("projects");
  if (list) projects.forEach(function (pr, i) {
    var li = document.createElement("li");
    li.className = "project project-" + (i + 1);
    var srcset = pr.single ? "" : ' srcset="' + IMG + pr.img + "-800.webp 800w, " + IMG + pr.img + ".webp " + pr.w + 'w"';
    li.innerHTML = '<figure class="project-photo"><img src="' + IMG + pr.img + (pr.single ? "" : "-800") + '.webp"' + srcset +
      ' sizes="(max-width: 860px) 100vw, ' + (i === 0 ? "58vw" : "42vw") + '" width="' + pr.w + '" height="' + pr.h + '" loading="lazy" decoding="async" alt=""><span class="tape-tag" aria-hidden="true">' + pr.area + '</span></figure>' +
      '<div class="project-cap"><h3></h3><p></p></div>';
    li.querySelector("img").alt = pr.alt;
    if (pr.pos) li.querySelector("img").style.objectPosition = pr.pos;  // kur laikyti kadrą, kai nuotrauka apkerpama
    li.querySelector("h3").textContent = pr.title;
    li.querySelector("p").textContent = pr.meta;
    list.appendChild(li);
  });

  /* ---------- Socialiniai tinklai ---------- */
  (function social() {
    var icons = {
      facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13.5 21v-7.6h2.6l.4-3h-3V8.5c0-.9.3-1.5 1.5-1.5h1.6V4.3c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3A4.7 4.7 0 1 0 12 16.7 4.7 4.7 0 0 0 12 7.3zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM21 8.2c-.1-1.6-.4-3-1.6-4.1C18.3 3 16.9 2.6 15.3 2.5 13.6 2.4 10.4 2.4 8.7 2.5 7.1 2.6 5.7 3 4.6 4.1 3.5 5.2 3.1 6.6 3 8.2c-.1 1.7-.1 6.9 0 8.6.1 1.6.4 3 1.6 4.1 1.1 1.1 2.5 1.5 4.1 1.6 1.7.1 4.9.1 6.6 0 1.6-.1 3-.4 4.1-1.6 1.1-1.1 1.5-2.5 1.6-4.1.1-1.7.1-6.9 0-8.6zm-2.2 10.4a3.3 3.3 0 0 1-1.9 1.9c-1.3.5-4.4.4-4.9.4s-3.6.1-4.9-.4a3.3 3.3 0 0 1-1.9-1.9c-.5-1.3-.4-4.4-.4-4.9s-.1-3.6.4-4.9a3.3 3.3 0 0 1 1.9-1.9c1.3-.5 4.4-.4 4.9-.4s3.6-.1 4.9.4a3.3 3.3 0 0 1 1.9 1.9c.5 1.3.4 4.4.4 4.9s.1 3.6-.4 4.9z"/></svg>'
    };
    var names = { facebook: "Facebook", instagram: "Instagram" };
    var soc = cfg.social || {};
    document.querySelectorAll("[data-social]").forEach(function (box) {
      ["facebook", "instagram"].forEach(function (k) {
        var a = document.createElement("a");
        a.className = "social-link";
        a.innerHTML = icons[k];
        if (soc[k]) {
          a.href = soc[k]; a.target = "_blank"; a.rel = "noopener";
          a.setAttribute("aria-label", names[k]);
        } else {
          // nuoroda dar neįrašyta config.js: ikona matoma, bet niekur neveda
          a.href = "#"; a.setAttribute("aria-label", names[k] + " (nuoroda bus pridėta)"); a.title = names[k] + ": nuoroda bus pridėta";
          a.addEventListener("click", function (e) { e.preventDefault(); });
        }
        box.appendChild(a);
      });
    });
  })();

  /* ---------- Atsiliepimai ---------- */
  (function reviews() {
    var r = cfg.reviews, list = document.getElementById("reviewList");
    if (!r || !list) return;
    document.getElementById("gScore").textContent = r.rating;
    document.getElementById("gCount").textContent = r.count + " atsiliepimai Google";
    var g = document.getElementById("gRating");
    if (r.googleUrl) g.href = r.googleUrl;
    else { g.removeAttribute("target"); g.addEventListener("click", function (e) { e.preventDefault(); }); }
    g.setAttribute("aria-label", "Google įvertinimas " + r.rating + " iš 5, " + r.count + " atsiliepimai");
    r.items.forEach(function (it) {
      var li = document.createElement("li");
      li.className = "review";
      li.innerHTML = '<div class="review-stars" aria-label=""></div><blockquote></blockquote><p class="review-who"><strong></strong><span></span></p>';
      var stars = li.querySelector(".review-stars");
      stars.textContent = "★★★★★".slice(0, it.stars) + "☆☆☆☆☆".slice(0, 5 - it.stars);
      stars.setAttribute("aria-label", it.stars + " iš 5");
      li.querySelector("blockquote").textContent = it.text;
      li.querySelector("strong").textContent = it.name + ", " + it.place;
      li.querySelector(".review-who span").textContent = it.work;
      list.appendChild(li);
    });
    document.getElementById("reviewsDemo").hidden = !r.demo;
  })();

  /* ---------- Skaičiai „Apie mus“: skaičiuojami nuo nulio, po jais išsivynioja ruletė ---------- */
  (function trustStats() {
    var t = cfg.trust, ul = document.getElementById("trustStats");
    if (!t || !ul) return;
    var items = t.stats.map(function (st, i) {
      var li = document.createElement("li");
      li.style.setProperty("--i", i);
      li.innerHTML = '<span class="stat-value"></span><span class="stat-tape" aria-hidden="true"></span><span class="stat-label"></span>';
      var v = li.querySelector(".stat-value");
      v.textContent = st.value;
      li.querySelector(".stat-label").textContent = st.label;
      ul.appendChild(li);
      // visi sveikieji skaičiai reikšmėje animuojami kartu: „1–2 d.“, „350+“
      return { el: v, parts: st.value.split(/(\d+)/) };
    });
    if (reduceMotion || !("IntersectionObserver" in window)) { ul.classList.add("is-counted"); return; }
    function render(it, k) {
      it.el.textContent = it.parts.map(function (p) { return /^\d+$/.test(p) ? String(Math.round(Number(p) * k)) : p; }).join("");
    }
    items.forEach(function (it) { render(it, 0); });
    var io = new IntersectionObserver(function (ents) {
      if (!ents[0].isIntersecting) return;
      io.disconnect();
      ul.classList.add("is-counting");
      var t0 = performance.now(), dur = 1400;
      (function frame(now) {
        var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        items.forEach(function (it) { render(it, e); });
        if (k < 1) requestAnimationFrame(frame);
        else { items.forEach(function (it) { render(it, 1); }); ul.classList.add("is-counted"); }
      })(t0);
    }, { threshold: 0.5 });
    io.observe(ul);
  })();

  /* ---------- Skambučio juosta telefone (rodoma praslinkus hero) ---------- */
  (function callBar() {
    var bar = document.querySelector(".call-bar");
    if (!bar || !hero) return;
    function upd() { bar.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.6); }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  })();
})();
