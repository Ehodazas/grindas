/*
 * Kiemo planuoklis: geometrija, kiekiai, orientacinė kaina ir SVG planas.
 * Skaičiavimai atskirti į calc.js.
 */
(function () {
  "use strict";
  var cfg = window.GRINDAS_CONFIG;
  var P = window.Paving;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Skaičiavimai — assets/js/calc.js (testuojami tests/calc.test.js) */
  var Calc = window.GrindasCalc;
  var parseNum = Calc.parseNum, validate = Calc.validate, estimate = Calc.estimate, fmtNum = Calc.fmtNum;
  function fmtEur(v) { return fmtNum(v, 0) + " €"; }

  /* ---------- UI ---------- */

  var form = document.getElementById("plannerForm");
  if (!form) return;
  var svg = document.getElementById("plannerSvg");

  var state = {
    shape: "rect", a: 12, b: 7, ca: 5, cb: 3,
    use: "kiemas", material: "betonines", pattern: "eglute", color: "grafitas",
    prep: true, curbs: true, waste: 10, wasteTouched: false
  };
  var shown = { a: 12, b: 7, ca: 5, cb: 3, shape: "rect" }; // geometrija, kuri šiuo metu nupiešta
  var lastValid = null;
  var patSeq = 0;

  function chip(container, name, value, label, checked, extraHtml) {
    var l = document.createElement("label");
    l.className = "chip";
    l.innerHTML = '<input type="radio" name="' + name + '" value="' + value + '"' + (checked ? " checked" : "") + '>' +
      (extraHtml || "") + "<span>" + label + "</span>";
    container.appendChild(l);
  }

  function buildUse() {
    var c = document.getElementById("useChips");
    Object.keys(cfg.uses).forEach(function (k) { chip(c, "use", k, cfg.uses[k].label, k === state.use); });
  }
  function buildMaterials() {
    var c = document.getElementById("materialChips");
    Object.keys(cfg.materials).forEach(function (k) {
      var m = cfg.materials[k];
      chip(c, "material", k, m.label + ' <small>' + m.unitLabel + "</small>", k === state.material);
    });
  }
  function buildPatterns() {
    var c = document.getElementById("patternChips");
    c.innerHTML = "";
    var m = cfg.materials[state.material];
    if (m.patterns.indexOf(state.pattern) < 0) state.pattern = m.patterns[0];
    m.patterns.forEach(function (k) {
      var id = "pp-" + k + "-" + state.material;
      var mini = '<svg class="chip-pat" viewBox="0 0 1.2 0.6" aria-hidden="true"><defs></defs><rect width="1.2" height="0.6" fill="url(#' + id + ')"/></svg>';
      chip(c, "pattern", k, cfg.patterns[k].label, k === state.pattern, mini);
      var defs = c.lastChild.querySelector("defs");
      defs.appendChild(P.createPattern({ id: id, pattern: k, unit: { l: m.unit.l * 0.9, w: m.unit.w * 0.9 }, colors: ["#b9b7b0", "#aeaca5"], joint: "#6d6f6c" }));
    });
  }
  function buildColors() {
    var c = document.getElementById("colorChips");
    c.innerHTML = "";
    var m = cfg.materials[state.material];
    if (!m.colors[state.color]) state.color = Object.keys(m.colors)[0];
    Object.keys(m.colors).forEach(function (k) {
      var col = m.colors[k];
      var stops = col.hex.map(function (h, i) {
        var a = (i / col.hex.length) * 100, b = ((i + 1) / col.hex.length) * 100;
        return h + " " + a + "% " + b + "%";
      }).join(", ");
      var l = document.createElement("label");
      l.className = "swatch";
      l.innerHTML = '<input type="radio" name="color" value="' + k + '"' + (k === state.color ? " checked" : "") + '>' +
        '<span class="sw" style="background:linear-gradient(90deg,' + stops + ')"></span><span class="sw-label">' + col.label + "</span>";
      c.appendChild(l);
    });
  }

  function readForm() {
    var fd = new FormData(form);
    state.shape = fd.get("shape");
    state.a = parseNum(fd.get("a"));
    state.b = parseNum(fd.get("b"));
    state.ca = parseNum(fd.get("ca"));
    state.cb = parseNum(fd.get("cb"));
    state.use = fd.get("use") || state.use;
    state.prep = fd.get("prep") === "yes";
    state.curbs = !!fd.get("curbs");
    state.waste = parseInt(fd.get("waste"), 10);
  }

  function setWasteSuggest() {
    var sug = cfg.patterns[state.pattern].waste;
    document.getElementById("wasteSuggest").textContent = sug;
    if (!state.wasteTouched) {
      form.elements.waste.value = sug;
      state.waste = sug;
    }
    form.elements.wasteOut.value = form.elements.waste.value + " %";
  }

  /* ---------- SVG planas ---------- */

  var gGrid, gFill, gCut, gEdge, gDims, defs, clipPath;

  function initSvg() {
    svg.innerHTML = "";
    defs = P.el("defs", {}, svg);
    var grid = P.el("pattern", { id: "pv-grid", patternUnits: "userSpaceOnUse", width: 1, height: 1 }, defs);
    P.el("path", { d: "M1 0H0V1", fill: "none", "class": "pv-gridline" }, grid);
    var cp = P.el("clipPath", { id: "pv-clip" }, defs);
    clipPath = P.el("path", {}, cp);
    P.el("rect", { x: -50, y: -50, width: 200, height: 200, fill: "url(#pv-grid)", "class": "pv-bg" }, svg);
    gCut = P.el("g", { "class": "pv-cut" }, svg);
    gFill = P.el("g", { "clip-path": "url(#pv-clip)" }, svg);
    gEdge = P.el("path", { "class": "pv-edge", fill: "none" }, svg);
    gDims = P.el("g", { "class": "pv-dims" }, svg);
  }

  function shapePath(d) {
    if (d.shape === "l") {
      return "M0 0H" + (d.a - d.ca) + "V" + d.cb + "H" + d.a + "V" + d.b + "H0Z";
    }
    return "M0 0H" + d.a + "V" + d.b + "H0Z";
  }

  function drawGeometry(d) {
    var big = Math.max(d.a, d.b);
    var pad = Math.max(1.4, big * 0.13);
    var fs = Math.max(0.28, big * 0.034);
    svg.setAttribute("viewBox", [-pad, -pad, d.a + pad * 2, d.b + pad * 2].map(function (v) { return v.toFixed(3); }).join(" "));
    var path = shapePath(d);
    clipPath.setAttribute("d", path);
    gEdge.setAttribute("d", path);
    gEdge.setAttribute("stroke-width", state.curbs ? Math.max(0.1, big * 0.009) : Math.max(0.03, big * 0.003));
    gEdge.classList.toggle("has-curbs", state.curbs);

    gCut.innerHTML = "";
    if (d.shape === "l") {
      P.el("rect", { x: d.a - d.ca, y: 0, width: d.ca, height: d.cb, "class": "pv-house" }, gCut);
      var t = P.el("text", { x: d.a - d.ca / 2, y: d.cb / 2, "class": "pv-house-label", "font-size": fs, "text-anchor": "middle", "dominant-baseline": "middle" }, gCut);
      t.textContent = d.ca > 2.2 && d.cb > 1 ? "Namas" : "";
    }

    gDims.innerHTML = "";
    var off = pad * 0.5;
    var opt = { fontSize: fs, tick: fs * 0.6 };
    P.dimension(gDims, 0, d.b + off, d.a, d.b + off, "A " + P.fmtM(d.a), opt);
    P.dimension(gDims, -off, 0, -off, d.b, "B " + P.fmtM(d.b), opt);
    if (d.shape === "l") {
      P.dimension(gDims, d.a - d.ca, -off, d.a, -off, "a " + P.fmtM(d.ca), opt);
      P.dimension(gDims, d.a + off, 0, d.a + off, d.cb, "b " + P.fmtM(d.cb), opt);
    }
    // mastelio juosta 1 m
    var sb = P.el("g", { "class": "pv-scale" }, gDims);
    var sx = d.a + pad * 0.2 - 1, sy = d.b + pad * 0.85;
    if (big > 25) {
      P.el("rect", { x: d.a - 5, y: sy - fs * 0.25, width: 5, height: fs * 0.25 }, sb);
      var st = P.el("text", { x: d.a - 2.5, y: sy - fs * 0.5, "font-size": fs * 0.8, "text-anchor": "middle" }, sb);
      st.textContent = "5 m";
    } else {
      P.el("rect", { x: sx, y: sy - fs * 0.25, width: 1, height: fs * 0.25 }, sb);
      var st2 = P.el("text", { x: sx + 0.5, y: sy - fs * 0.5, "font-size": fs * 0.8, "text-anchor": "middle" }, sb);
      st2.textContent = "1 m";
    }
  }

  var tweenId = 0;
  function animateGeometry(target) {
    var from = { a: shown.a, b: shown.b, ca: shown.ca, cb: shown.cb };
    var shapeChanged = target.shape !== shown.shape;
    if (shapeChanged && target.shape === "l" && shown.shape !== "l") { from.ca = 0.001; from.cb = 0.001; }
    shown.shape = target.shape;
    var id = ++tweenId;
    if (reduceMotion) { assign(target); drawGeometry(shownWithShape()); return; }
    var t0 = performance.now(), dur = 320;
    function step(now) {
      if (id !== tweenId) return;
      var k = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - k, 3);
      shown.a = from.a + (target.a - from.a) * e;
      shown.b = from.b + (target.b - from.b) * e;
      shown.ca = from.ca + (target.ca - from.ca) * e;
      shown.cb = from.cb + (target.cb - from.cb) * e;
      drawGeometry(shownWithShape());
      if (k < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  function assign(t) { shown.a = t.a; shown.b = t.b; shown.ca = t.ca; shown.cb = t.cb; }
  function shownWithShape() { return { shape: shown.shape, a: shown.a, b: shown.b, ca: shown.ca, cb: shown.cb }; }

  var currentFillKey = "";
  function drawFill() {
    var key = state.material + state.color + state.pattern;
    if (key === currentFillKey) return;
    currentFillKey = key;
    var id = "pv-pat-" + (++patSeq);
    var pat = P.fromConfig(id, state.material, state.color, state.pattern);
    defs.appendChild(pat);
    var r = P.el("rect", { x: -1, y: -1, width: 70, height: 70, fill: "url(#" + id + ")", "class": "pv-fill" }, gFill);
    var detail = document.getElementById("pvDetailRect");
    if (detail) detail.setAttribute("fill", "url(#" + id + ")");
    var olds = Array.prototype.slice.call(gFill.querySelectorAll(".pv-fill")).filter(function (n) { return n !== r; });
    if (reduceMotion || !olds.length) {
      cleanup();
    } else {
      r.classList.add("is-entering");
      // eslint-disable-next-line no-unused-expressions
      r.getBoundingClientRect();
      r.classList.remove("is-entering");
      setTimeout(cleanup, 380);
    }
    function cleanup() {
      olds.forEach(function (o) {
        var pid = (o.getAttribute("fill").match(/#([^)]+)/) || [])[1];
        o.remove();
        var pe = pid && document.getElementById(pid);
        if (pe) pe.remove();
      });
    }
  }

  /* ---------- Rezultatai ---------- */

  function showErrors(v) {
    ["a", "b", "ca", "cb"].forEach(function (k) {
      var input = form.elements[k];
      var msg = v.errors[k] || "";
      var active = k === "a" || k === "b" || state.shape === "l";
      document.getElementById("err-" + k).textContent = active ? msg : "";
      input.setAttribute("aria-invalid", active && msg ? "true" : "false");
    });
  }

  function render(opts) {
    opts = opts || {};
    readForm();
    form.classList.toggle("is-l", state.shape === "l");
    var mat = cfg.materials[state.material];
    var warn = document.getElementById("materialWarn");
    var notFor = mat.notFor && mat.notFor.indexOf(state.use) >= 0;
    warn.hidden = !notFor;
    warn.textContent = notFor ? mat.notForNote : "";

    var v = validate(state);
    showErrors(v);
    var errEl = document.getElementById("plannerError");
    var hasErr = Object.keys(v.errors).length > 0 || !!v.form;
    document.querySelector(".pv-results").classList.toggle("is-stale", hasErr);
    document.getElementById("toQuote").disabled = hasErr;

    drawFill();

    if (hasErr) {
      errEl.hidden = false;
      errEl.textContent = v.form || "Patikrinkite pažymėtus laukus. Rodomas paskutinis teisingas skaičiavimas.";
      return;
    }
    errEl.hidden = true;

    animateGeometry({ shape: state.shape, a: state.a, b: state.b, ca: state.ca, cb: state.cb });

    var est = estimate(state);
    lastValid = { state: JSON.parse(JSON.stringify(state)), est: est };

    document.getElementById("rArea").textContent = fmtNum(est.area, 2) + " m²";
    document.getElementById("rPerim").textContent = fmtNum(est.perimeter, 1) + " m";
    document.getElementById("rQty").textContent = fmtNum(est.qtyM2, 1) + " m²";
    document.getElementById("rQtySub").textContent = "apie " + fmtNum(est.pieces) + " vnt. " + mat.unitLabel + ", atsarga " + est.waste + " %";

    var tb = document.getElementById("estimateBody");
    tb.innerHTML = "";
    est.items.forEach(function (it) {
      var tr = document.createElement("tr");
      tr.innerHTML = "<th scope=\"row\"></th><td>" + fmtEur(it.low) + "</td><td>" + fmtEur(it.high) + "</td>";
      tr.firstChild.textContent = it.label;
      tb.appendChild(tr);
    });
    document.getElementById("tLow").textContent = fmtEur(est.low);
    document.getElementById("tHigh").textContent = fmtEur(est.high);

    var mn = document.getElementById("minOrderNote");
    mn.hidden = !est.belowMinimum;
    mn.textContent = est.belowMinimum ? "Nedideliems darbams (iki ~" + fmtEur(cfg.minimumOrder) + ") kaina dažnai skaičiuojama individualiai, nes technikos atvežimas sudaro didelę dalį." : "";

    var cap = document.getElementById("plannerSvgDesc");
    cap.textContent = (state.shape === "l" ? "L formos plotas" : "Stačiakampis plotas") + ", " + fmtNum(est.area, 2) + " m². " +
      mat.label + ", " + cfg.patterns[state.pattern].label.toLowerCase() + ", " + mat.colors[state.color].label.toLowerCase() +
      ". Tinklelis: 1 m.";
  }

  function summary() {
    if (!lastValid) return null;
    var s = lastValid.state, e = lastValid.est, m = cfg.materials[s.material];
    var dims = s.shape === "l"
      ? "L forma: " + P.fmtM(s.a) + " × " + P.fmtM(s.b) + " be kampo " + P.fmtM(s.ca) + " × " + P.fmtM(s.cb)
      : "Stačiakampis: " + P.fmtM(s.a) + " × " + P.fmtM(s.b);
    return {
      use: s.use,
      area: Math.round(e.area * 100) / 100,
      rows: [
        ["Plotas", fmtNum(e.area, 2) + " m² (" + dims + ")"],
        ["Paskirtis", cfg.uses[s.use].label],
        ["Medžiaga", m.label + ", " + m.colors[s.color].label.toLowerCase()],
        ["Raštas", cfg.patterns[s.pattern].label],
        ["Pagrindas", s.prep ? "Reikia paruošti" : "Jau paruoštas"],
        ["Borteliai", s.curbs ? "Taip, apie " + fmtNum(e.perimeter, 1) + " m" : "Ne"],
        ["Medžiagų kiekis", fmtNum(e.qtyM2, 1) + " m² (atsarga " + e.waste + " %)"],
        ["Orientacinė kaina", fmtEur(e.low) + " – " + fmtEur(e.high)]
      ]
    };
  }

  /* ---------- Įvykiai ---------- */

  form.addEventListener("input", function (ev) {
    var t = ev.target;
    if (t.name === "waste") { state.wasteTouched = true; form.elements.wasteOut.value = t.value + " %"; }
    render();
  });
  form.addEventListener("change", function (ev) {
    var t = ev.target;
    if (t.name === "material") {
      state.material = t.value;
      buildPatterns(); buildColors(); setWasteSuggest();
    } else if (t.name === "pattern") {
      state.pattern = t.value; setWasteSuggest();
    } else if (t.name === "color") {
      state.color = t.value;
    }
    render();
  });
  form.addEventListener("submit", function (e) { e.preventDefault(); });

  document.getElementById("wasteReset").addEventListener("click", function () {
    state.wasteTouched = false; setWasteSuggest(); render();
  });

  document.getElementById("toQuote").addEventListener("click", function () {
    var s = summary();
    if (!s) return;
    document.dispatchEvent(new CustomEvent("grindas:quote", { detail: s }));
  });

  /* Vaizdas: iš viršaus arba perspektyva */
  var pvFigure = document.querySelector(".pv-figure");
  document.querySelectorAll(".pv-view").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var iso = btn.getAttribute("data-view") === "iso";
      pvFigure.classList.toggle("is-iso", iso);
      document.querySelectorAll(".pv-view").forEach(function (b) {
        b.setAttribute("aria-pressed", b === btn ? "true" : "false");
      });
    });
  });

  buildUse(); buildMaterials(); buildPatterns(); buildColors();
  initSvg();
  setWasteSuggest();
  drawGeometry(shownWithShape());
  render();
})();
