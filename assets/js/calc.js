/*
 * GRINDAS — planuoklio skaičiavimai (be DOM).
 * Veikia naršyklėje (window.GrindasCalc) ir Node (require(...).create(config)) — testai: tests/calc.test.js
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = { create: factory };
  } else {
    root.GrindasCalc = factory(root.GRINDAS_CONFIG);
  }
})(typeof self !== "undefined" ? self : this, function (cfg) {
  "use strict";

  /* "7,5" → 7.5; neigiami, tušti, su raidėmis ar 1e3 → NaN */
  function parseNum(v) {
    if (typeof v === "number") return isFinite(v) ? v : NaN;
    var s = String(v == null ? "" : v).trim().replace(/\s/g, "").replace(",", ".");
    if (!/^\d+(\.\d+)?$/.test(s)) return NaN;
    return parseFloat(s);
  }

  /*
   * Stačiakampis: A × B.
   * L forma: A × B stačiakampis be kampo a × b.
   * L formos perimetras lygus apgaubiančio stačiakampio perimetrui 2(A + B),
   * nes išpjovos dvi kraštinės (a ir b) pakeičia dvi pašalintas atkarpas.
   */
  function geometry(shape, a, b, ca, cb) {
    var area = shape === "l" ? a * b - ca * cb : a * b;
    return { area: area, perimeter: 2 * (a + b) };
  }

  /* Grąžina { errors: { laukas: tekstas }, form: "bendra klaida" } */
  function validate(s) {
    var L = cfg.limits, e = {};
    function side(key, label) {
      var v = s[key];
      if (isNaN(v)) e[key] = "Įveskite skaičių, pvz. 7,5";
      else if (v < L.minSide) e[key] = label + " turi būti bent " + L.minSide + " m";
      else if (v > L.maxSide) e[key] = label + " negali viršyti " + L.maxSide + " m";
    }
    side("a", "Ilgis");
    side("b", "Plotis");
    if (s.shape === "l") {
      ["ca", "cb"].forEach(function (k) {
        var v = s[k];
        if (isNaN(v)) e[k] = "Įveskite skaičių, pvz. 3";
        else if (v < 0.5) e[k] = "Išpjova turi būti bent 0,5 m";
      });
      if (!e.ca && !e.a && s.ca > s.a - 0.5) e.ca = "Turi būti bent 0,5 m mažesnė už ilgį A";
      if (!e.cb && !e.b && s.cb > s.b - 0.5) e.cb = "Turi būti bent 0,5 m mažesnė už plotį B";
    }
    var form = "";
    if (!Object.keys(e).length) {
      var g = geometry(s.shape, s.a, s.b, s.ca, s.cb);
      if (g.area < L.minArea) form = "Plotas per mažas skaičiavimui (mažiau nei " + L.minArea + " m²). Tokius darbus įvertiname individualiai.";
      else if (g.area > L.maxArea) form = "Didesnį nei " + L.maxArea + " m² plotą skaičiuojame tik individualiai. Parašykite mums.";
    }
    return { errors: e, form: form };
  }

  function roundTo(v) { var r = cfg.roundTo || 1; return Math.round(v / r) * r; }
  function clampWaste(w) {
    w = Number(w);
    if (!isFinite(w)) w = cfg.limits.minWaste;
    return Math.min(cfg.limits.maxWaste, Math.max(cfg.limits.minWaste, w));
  }

  function fmtNum(v, d) {
    return v.toLocaleString("lt-LT", { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 });
  }

  /*
   * Kainos logika:
   *  medžiaga  = kaina €/m² × paskirties koef. × spalvos koef. × kiekis su atsarga (m²)
   *  klojimas  = kaina €/m² × medžiagos koef. × rašto koef. × plotas (be atsargos)
   *  pagrindas = kaina €/m² × plotas (jei pasirinkta)
   *  borteliai = kaina €/m × perimetras (jei pasirinkta)
   *  + fiksuotos organizavimo išlaidos
   * Kiekviena eilutė apvalinama iki cfg.roundTo, suma — apvalintų eilučių suma.
   */
  function estimate(s) {
    var use = cfg.uses[s.use];
    var mat = cfg.materials[s.material];
    var pat = cfg.patterns[s.pattern];
    var col = mat.colors[s.color];
    if (!use || !mat || !pat || !col) throw new Error("Nežinomas pasirinkimas");
    var g = geometry(s.shape, s.a, s.b, s.ca, s.cb);
    var waste = clampWaste(s.waste);
    var qtyM2 = g.area * (1 + waste / 100);
    var unitArea = mat.unit.l * mat.unit.w;
    var pieces = Math.ceil(qtyM2 / unitArea - 1e-9);

    var items = [];
    var mf = use.materialFactor * col.factor;
    items.push({
      key: "material",
      label: mat.label + ", " + col.label.toLowerCase() + " (" + fmtNum(qtyM2, 1) + " m²)",
      low: roundTo(mat.price[0] * mf * qtyM2),
      high: roundTo(mat.price[1] * mf * qtyM2)
    });
    var lf = mat.laborFactor * pat.laborFactor;
    items.push({
      key: "labor",
      label: "Klojimas: " + pat.label.toLowerCase() + ", pjovimas, siūlės",
      low: roundTo(use.labor[0] * lf * g.area),
      high: roundTo(use.labor[1] * lf * g.area)
    });
    if (s.prep) {
      items.push({
        key: "prep",
        label: "Pagrindo paruošimas: kasimas, išvežimas, skalda",
        low: roundTo(use.groundPrep[0] * g.area),
        high: roundTo(use.groundPrep[1] * g.area)
      });
    }
    if (s.curbs) {
      items.push({
        key: "curbs",
        label: cfg.curbs.label + " (" + fmtNum(g.perimeter, 1) + " m)",
        low: roundTo(cfg.curbs.price[0] * g.perimeter),
        high: roundTo(cfg.curbs.price[1] * g.perimeter)
      });
    }
    items.push({ key: "mob", label: cfg.mobilization.label, low: cfg.mobilization.price[0], high: cfg.mobilization.price[1] });

    var low = 0, high = 0;
    items.forEach(function (it) { low += it.low; high += it.high; });
    return {
      area: g.area, perimeter: g.perimeter, waste: waste,
      qtyM2: qtyM2, pieces: pieces, items: items, low: low, high: high,
      belowMinimum: high < cfg.minimumOrder
    };
  }

  /*
   * Sluoksnių rinkinys pagal apkrovą ir gruntą (cm, nuo–iki).
   * Iš viršaus: trinkelės, pastelė, skalda, [smėlis, jei gruntas prastas]. Kasimo gylis = jų suma.
   */
  function layerStack(loadKey, soilKey) {
    var L = cfg.layers.loads[loadKey], S = cfg.layers.soils[soilKey];
    if (!L || !S) throw new Error("Nežinoma apkrova ar gruntas");
    var stack = [
      { key: "pavers", cm: L.pavers.slice() },
      { key: "bedding", cm: L.bedding.slice() },
      { key: "aggregate", cm: L.base.slice() }
    ];
    if (S.sand) stack.push({ key: "sand", cm: S.sand.slice() });
    var depth = stack.reduce(function (t, l) { return [t[0] + l.cm[0], t[1] + l.cm[1]]; }, [0, 0]);
    return { layers: stack, depth: depth, geotextile: S.geotextile };
  }

  /*
   * Viso darbo kaina už m² kainoraščiui: medžiaga + klojimas + pagrindas, be bortelių ir be
   * fiksuotų organizavimo išlaidų. Skaičiuojama tuo pačiu estimate(), kaip planuoklyje (100 m² plotas).
   */
  function fullJobPerM2(use, material, color, pattern, waste) {
    var e = estimate({ shape: "rect", a: 10, b: 10, use: use, material: material, color: color, pattern: pattern, prep: true, curbs: false, waste: waste == null ? 5 : waste });
    var low = 0, high = 0;
    e.items.forEach(function (it) { if (it.key !== "mob") { low += it.low; high += it.high; } });
    return [Math.round(low / e.area), Math.round(high / e.area)];
  }

  return { parseNum: parseNum, geometry: geometry, validate: validate, estimate: estimate, fmtNum: fmtNum, clampWaste: clampWaste, layerStack: layerStack, fullJobPerM2: fullJobPerM2 };
});
