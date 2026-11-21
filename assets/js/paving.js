/*
 * Paving engine: generuoja SVG <pattern> elementus realiu masteliu (1 vienetas = 1 m).
 * Naudojamas hero, planuoklyje, galerijoje ir prieš/po iliustracijoje.
 */
(function () {
  "use strict";
  var NS = "http://www.w3.org/2000/svg";

  function hash(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function shade(hex, amt) {
    var n = parseInt(hex.slice(1), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function f(c) { return Math.max(0, Math.min(255, Math.round(amt < 0 ? c * (1 + amt) : c + (255 - c) * amt))); }
    return "#" + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
  }

  /* Grąžina { w, h, rects:[[x,y,w,h], ...] } vienai pasikartojančiai plytelei */
  function layout(pattern, L, W) {
    var rects = [], tw, th, i, j;
    if (pattern === "eglute") {
      // 90° eglutė: gardelė (W,W) ir (2W,-2W) → stačiakampė periodo plytelė 4W×4W
      var u = W, P = 4 * u;
      tw = th = P * 2;
      for (var k = 0; k < 8; k++) {
        for (var bx = 0; bx < 2; bx++) {
          for (var by = 0; by < 2; by++) {
            var ox = bx * P, oy = by * P;
            var kk = k % 4;
            if (k >= 4) continue;
            rects.push([ox + kk * u, oy + kk * u, 2 * u, u]);
            rects.push([ox + kk * u, oy + kk * u + u, u, 2 * u]);
          }
        }
      }
      // apgaubiančios kopijos, kad plytelės kraštai susijungtų
      var base = rects.slice();
      rects = [];
      for (i = -1; i <= 1; i++) for (j = -1; j <= 1; j++) {
        base.forEach(function (r) { rects.push([r[0] + i * tw, r[1] + j * th, r[2], r[3]]); });
      }
      return { w: tw, h: th, rects: rects };
    }
    if (pattern === "pintine") {
      var Lb = 2 * W;
      tw = th = 2 * Lb * 2;
      for (i = 0; i < 2; i++) for (j = 0; j < 2; j++) {
        var x0 = i * 2 * Lb, y0 = j * 2 * Lb;
        rects.push([x0, y0, Lb, W], [x0, y0 + W, Lb, W]);
        rects.push([x0 + Lb, y0, W, Lb], [x0 + Lb + W, y0, W, Lb]);
        rects.push([x0, y0 + Lb, W, Lb], [x0 + W, y0 + Lb, W, Lb]);
        rects.push([x0 + Lb, y0 + Lb, Lb, W], [x0 + Lb, y0 + Lb + W, Lb, W]);
      }
      return { w: tw, h: th, rects: rects };
    }
    if (pattern === "perrisimas") {
      var nx = L >= 0.5 ? 3 : 4, ny = L >= 0.5 ? 3 : 4;
      tw = L * nx; th = W * 2 * ny;
      for (j = 0; j < ny * 2; j++) {
        var off = (j % 2) ? -L / 2 : 0;
        for (i = 0; i <= nx; i++) rects.push([off + i * L, j * W, L, W]);
      }
      return { w: tw, h: th, rects: rects };
    }
    // tiesi
    var cx = L >= 0.5 ? 3 : 4, cy = L >= 0.5 ? 4 : 8;
    tw = L * cx; th = W * cy;
    for (j = 0; j < cy; j++) for (i = 0; i < cx; i++) rects.push([i * L, j * W, L, W]);
    return { w: tw, h: th, rects: rects };
  }

  /*
   * opts: { id, pattern, unit:{l,w}, colors:[hex...], joint?:hex }
   * Grąžina SVG <pattern> elementą (DOM).
   */
  function createPattern(opts) {
    var L = opts.unit.l, W = opts.unit.w;
    var lay = layout(opts.pattern, L, W);
    var colors = opts.colors;
    var joint = opts.joint || shade(colors[0], -0.42);
    var gap = Math.max(0.006, W * 0.06);
    var p = document.createElementNS(NS, "pattern");
    p.setAttribute("id", opts.id);
    p.setAttribute("patternUnits", "userSpaceOnUse");
    p.setAttribute("width", lay.w);
    p.setAttribute("height", lay.h);
    if (opts.rotate) p.setAttribute("patternTransform", "rotate(" + opts.rotate + ")");
    var html = '<rect width="' + lay.w + '" height="' + lay.h + '" fill="' + joint + '"/>';
    lay.rects.forEach(function (r, idx) {
      var cIdx = Math.floor(hash(idx + Math.round(r[0] * 100) * 7 + Math.round(r[1] * 100) * 13) * colors.length);
      var c = colors[cIdx % colors.length];
      var v = (hash(idx * 3.7) - 0.5) * 0.08;
      c = shade(c, v);
      html += '<rect x="' + (r[0] + gap / 2).toFixed(4) + '" y="' + (r[1] + gap / 2).toFixed(4) +
        '" width="' + (r[2] - gap).toFixed(4) + '" height="' + (r[3] - gap).toFixed(4) +
        '" rx="' + (gap * 0.6).toFixed(4) + '" fill="' + c + '"/>';
    });
    p.innerHTML = html;
    return p;
  }

  /* Pagalbinė: sukuria pattern iš konfigūracijos raktų */
  function fromConfig(id, materialKey, colorKey, patternKey) {
    var cfg = window.GRINDAS_CONFIG;
    var m = cfg.materials[materialKey];
    var col = m.colors[colorKey] || m.colors[Object.keys(m.colors)[0]];
    return createPattern({ id: id, pattern: patternKey, unit: m.unit, colors: col.hex });
  }

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  /* Matmenų linija su brūkšneliais ir užrašu (metrais) */
  function dimension(parent, x1, y1, x2, y2, label, opts) {
    opts = opts || {};
    var g = el("g", { "class": "dim" + (opts.cls ? " " + opts.cls : "") }, parent);
    var t = opts.tick || 0.18;
    var horizontal = Math.abs(y2 - y1) < Math.abs(x2 - x1);
    el("line", { x1: x1, y1: y1, x2: x2, y2: y2, "class": "dim-line" }, g);
    if (horizontal) {
      el("line", { x1: x1 - t / 2, y1: y1 + t / 2, x2: x1 + t / 2, y2: y1 - t / 2, "class": "dim-tick" }, g);
      el("line", { x1: x2 - t / 2, y1: y2 + t / 2, x2: x2 + t / 2, y2: y2 - t / 2, "class": "dim-tick" }, g);
    } else {
      el("line", { x1: x1 - t / 2, y1: y1 + t / 2, x2: x1 + t / 2, y2: y1 - t / 2, "class": "dim-tick" }, g);
      el("line", { x1: x2 - t / 2, y1: y2 + t / 2, x2: x2 + t / 2, y2: y2 - t / 2, "class": "dim-tick" }, g);
    }
    var mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    var fs = opts.fontSize || 0.36;
    var text = el("text", {
      x: horizontal ? mx : mx - fs * 0.45,
      y: horizontal ? my - fs * 0.45 : my,
      "class": "dim-text",
      "font-size": fs,
      "text-anchor": "middle"
    }, g);
    if (!horizontal) text.setAttribute("transform", "rotate(-90 " + (mx - fs * 0.45) + " " + my + ")");
    text.textContent = label;
    return g;
  }

  function fmtM(v) {
    return (Math.round(v * 100) / 100).toLocaleString("lt-LT", { maximumFractionDigits: 2 }) + " m";
  }

  window.Paving = {
    NS: NS,
    createPattern: createPattern,
    fromConfig: fromConfig,
    el: el,
    dimension: dimension,
    shade: shade,
    fmtM: fmtM
  };
})();
