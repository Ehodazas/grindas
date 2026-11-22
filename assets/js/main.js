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
      // atkartojamas <img> „object-fit: cover“ ir object-position 50% 60%
      var sc = Math.max(W / iw, H / ih), bw = iw * sc, bh = ih * sc;
      var ox = (W - bw) * 0.5, oy = (H - bh) * 0.6;
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
  })();

  /* ---------- Sluoksnių pjūvis (izometrinis) ---------- */
  (function layersDiagram() {
    var svg = document.getElementById("xsecSvg");
    if (!svg) return;
    var W = 220, D = 220, OX = 205, OY = 235, C = 0.866, S = 0.5;
    function iso(x, y, z) { return [OX + (x - y) * C, OY + (x + y) * S - z]; }
    function pts(arr) { return arr.map(function (p) { var q = iso(p[0], p[1], p[2]); return q[0].toFixed(1) + "," + q[1].toFixed(1); }).join(" "); }
    function line(g, a, b, cls) { var p = iso.apply(null, a), q = iso.apply(null, b); P.el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], "class": cls }, g); }

    var defs = P.el("defs", {}, svg);
    defs.innerHTML =
      '<pattern id="xs-agg" width="16" height="13" patternUnits="userSpaceOnUse"><rect width="16" height="13" fill="#a3a097"/><path d="M1 4l4-2 3 3-3 3-4-1zM10 1l5 1 1 4-4 2-3-3zM7 9l3-1 3 3-2 2-4-1z" fill="#878479"/><circle cx="14" cy="10" r="1.3" fill="#c0bdb4"/></pattern>' +
      '<pattern id="xs-sand" width="9" height="7" patternUnits="userSpaceOnUse"><rect width="9" height="7" fill="#d8c8a2"/><circle cx="2" cy="2" r=".7" fill="#bfae85"/><circle cx="6" cy="5" r=".6" fill="#bfae85"/></pattern>' +
      '<pattern id="xs-soil" width="22" height="14" patternUnits="userSpaceOnUse"><rect width="22" height="14" fill="#6e5a48"/><path d="M0 11l6-3M9 4l6-3M13 13l6-3" stroke="#5d4b3b" stroke-width="1.2"/></pattern>';

    var layerDefs = [
      { key: "soil", z: [0, 70], fill: "url(#xs-soil)", ly: 352, title: "Paruoštas gruntas", sub: "nukastas ir sutankintas",
        info: ["Nukasus augalinį sluoksnį, gruntas išlyginamas ir sutankinamas. Ant jo remiasi visa konstrukcija.",
               "Molis prastai praleidžia vandenį ir kilnojasi nuo šalčio, todėl kartais reikia geotekstilės ar drenažo."],
        why: "Grunto iš nuotraukos neįvertinsi, todėl pagrindo storį nustatome apžiūrėję vietą." },
      { key: "aggregate", z: [70, 150], fill: "url(#xs-agg)", ly: 282, title: "Skaldos pagrindas", sub: "skalda 0–32 mm, 15–30 cm",
        info: ["Pagrindinė laikanti dalis. Skalda pilama sluoksniais, kiekvienas tankinamas vibroplokšte.",
               "Įvažiavimui pagrindas gerokai storesnis nei takui. Čia formuojamas ir nuolydis vandeniui."],
        why: "Prastai sutankinta skalda slūgsta po pirmų žiemų, o trinkelės pradeda klibėti." },
      { key: "bedding", z: [150, 176], fill: "url(#xs-sand)", ly: 214, title: "Pastelės sluoksnis", sub: "atsijos ar smėlis, apie 3–5 cm",
        info: ["Plonas sluoksnis, ant kurio trinkelės išlyginamos į vieną aukštį.",
               "Jis turi būti vienodo storio. Juo nelyginamos duobės: nelygumai taisomi pagrinde."],
        why: "Kur pastelė per stora, danga ilgainiui įdumba ir kieme atsiranda balos." },
      { key: "pavers", z: [176, 206], fill: "#6d7072", ly: 160, title: "Trinkelės", sub: "6 cm takui, 8 cm įvažiavimui",
        info: ["Priima apkrovą nuo žingsnių ar ratų ir paskirsto ją į apačią. Smėliu užpildytos siūlės leidžia trinkelėms dirbti kartu.",
               "Eglutės raštas geriau atlaiko sukančius automobilio ratus nei tiesios eilės."],
        why: "Net geriausios trinkelės neišlaikys, jei apačioje silpnas pagrindas." }
    ];

    var groups = {};
    layerDefs.forEach(function (L) {
      var g = P.el("g", { "class": "xs-layer", "data-layer": L.key, tabindex: "0", role: "button", "aria-pressed": "false", "aria-label": L.title + ": " + L.sub }, svg);
      var body = P.el("g", { "class": "xs-body xs-" + L.key }, g);
      var z0 = L.z[0], z1 = L.z[1];
      P.el("polygon", { points: pts([[0, D, z0], [W, D, z0], [W, D, z1], [0, D, z1]]), fill: L.fill, stroke: "#2b2e2c", "stroke-width": 0.8 }, body);
      P.el("polygon", { points: pts([[W, D, z0], [W, 0, z0], [W, 0, z1], [W, D, z1]]), fill: L.fill, stroke: "#2b2e2c", "stroke-width": 0.8 }, body);
      P.el("polygon", { points: pts([[W, D, z0], [W, 0, z0], [W, 0, z1], [W, D, z1]]), fill: "rgba(0,0,0,.16)" }, body);
      if (L.key === "pavers") {
        var top = P.el("g", {}, body);
        P.el("polygon", { points: pts([[0, 0, z1], [W, 0, z1], [W, D, z1], [0, D, z1]]), fill: "#8b8e8f", stroke: "#2b2e2c", "stroke-width": 0.8 }, top);
        for (var k = 1; k < 10; k++) line(top, [0, k * 22, z1], [W, k * 22, z1], "xs-joint");
        for (var r = 0; r < 10; r++) for (var x = (r % 2) * 22; x < W; x += 44) if (x > 0) line(top, [x, r * 22, z1], [x, (r + 1) * 22, z1], "xs-joint");
        for (var x2 = 22; x2 < W; x2 += 44) line(body, [x2, D, z0], [x2, D, z1], "xs-joint");
        for (var y2 = 22; y2 < D; y2 += 22) line(body, [W, y2, z0], [W, y2, z1], "xs-joint");
      }
      // atraminė linija iki užrašo
      var zm = (z0 + z1) / 2, s = iso(W, D * 0.35, zm);
      P.el("circle", { cx: s[0], cy: s[1], r: 3, "class": "xs-dot" }, g);
      P.el("polyline", { points: [s[0], s[1], 405, s[1], 428, L.ly, 444, L.ly].join(" "), fill: "none", "class": "xs-leader" }, g);
      var t1 = P.el("text", { x: 452, y: L.ly - 3, "class": "xs-label-title" }, g); t1.textContent = L.title;
      var t2 = P.el("text", { x: 452, y: L.ly + 15, "class": "xs-label-sub" }, g); t2.textContent = L.sub;
      P.el("rect", { x: 440, y: L.ly - 20, width: 236, height: 42, "class": "xs-hit" }, g);
      groups[L.key] = { g: g, def: L };
    });
    var jointStyle = document.createElementNS(P.NS, "style");
    jointStyle.textContent = ".xs-joint{stroke:#3f4244;stroke-width:1}";
    svg.appendChild(jointStyle);

    var fig = svg.closest(".xsec-figure");
    var info = document.getElementById("xsecInfo");
    function select(key) {
      Object.keys(groups).forEach(function (k) {
        var on = k === key;
        groups[k].g.classList.toggle("is-active", on);
        groups[k].g.setAttribute("aria-pressed", on ? "true" : "false");
      });
      fig.classList.add("has-selection");
      var L = groups[key].def;
      info.innerHTML = "<h3></h3><p></p><p></p><p class=\"why\"></p>";
      info.querySelector("h3").textContent = L.title;
      var ps = info.querySelectorAll("p");
      ps[0].textContent = L.info[0]; ps[1].textContent = L.info[1]; ps[2].textContent = L.why;
      info.classList.remove("swap"); void info.offsetWidth; info.classList.add("swap");
    }
    Object.keys(groups).forEach(function (k) {
      var g = groups[k].g;
      g.addEventListener("click", function () { select(k); });
      g.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(k); } });
    });
    select("pavers");

    function play() {
      if (reduceMotion) return;
      fig.classList.remove("is-building"); void fig.getBoundingClientRect(); fig.classList.add("is-building");
    }
    var replay = document.getElementById("xsecReplay");
    replay.addEventListener("click", play);
    if (reduceMotion) replay.hidden = true;
    else if ("IntersectionObserver" in window) {
      fig.classList.add("pre-build");
      var io = new IntersectionObserver(function (ents) {
        if (ents[0].isIntersecting) { fig.classList.remove("pre-build"); play(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(fig);
    }
  })();

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
    { img: "vidinis-kiemas-skalda", w: 990, h: 660, single: true, title: "Vidinis kiemas su skaldos siūlėmis", meta: "Kauno r., apie 70 m²", area: "≈ 70 m²",
      alt: "Vidinis kiemas iš didelių betoninių plokščių su skaldos siūlėmis prie tamsaus namo" },
    { img: "namas-medinis-takas", w: 1600, h: 1067, title: "Takas iš plokščių prie namo", meta: "Vilniaus r., apie 45 m²", area: "≈ 45 m²",
      alt: "Takas iš didelių plokščių su akmenukų siūlėmis prie medinio namo" },
    { img: "terasa-moderni", w: 1600, h: 1067, title: "Terasa su pavėsine", meta: "Kaunas, apie 35 m²", area: "≈ 35 m²",
      alt: "Šviesių plokščių terasa su pavėsine ir veja" }
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
    li.querySelector("h3").textContent = pr.title;
    li.querySelector("p").textContent = pr.meta;
    list.appendChild(li);
  });

  /* ---------- Skambučio juosta telefone (rodoma praslinkus hero) ---------- */
  (function callBar() {
    var bar = document.querySelector(".call-bar");
    if (!bar || !hero) return;
    function upd() { bar.classList.toggle("is-visible", window.scrollY > hero.offsetHeight * 0.6); }
    window.addEventListener("scroll", upd, { passive: true });
    upd();
  })();
})();
