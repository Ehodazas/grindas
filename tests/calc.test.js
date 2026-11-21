/*
 * Planuoklio skaičiavimų testai. Paleidimas (reikia Node 18+):
 *   node --test tests/
 */
"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("path");

globalThis.window = {};
require(path.join(__dirname, "..", "assets", "js", "config.js"));
const cfg = globalThis.window.GRINDAS_CONFIG;
const C = require(path.join(__dirname, "..", "assets", "js", "calc.js")).create(cfg);

const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const base = { shape: "rect", a: 12, b: 7, ca: 5, cb: 3, use: "kiemas", material: "betonines", pattern: "eglute", color: "pilka", prep: true, curbs: true, waste: 10 };

test("skaičių įvestis: kablelis, tarpai, netinkamos reikšmės", () => {
  assert.equal(C.parseNum("7,5"), 7.5);
  assert.equal(C.parseNum(" 12 "), 12);
  assert.equal(C.parseNum("12.25"), 12.25);
  assert.equal(C.parseNum("1 200"), 1200);
  for (const bad of ["", "abc", "12m", "-3", "1e3", "7,5,2", "12.", ",5", null, undefined, NaN, Infinity]) {
    assert.ok(Number.isNaN(C.parseNum(bad)), `turėjo būti NaN: ${bad}`);
  }
});

test("stačiakampio plotas ir perimetras", () => {
  assert.deepEqual(C.geometry("rect", 12, 7), { area: 84, perimeter: 38 });
  const g = C.geometry("rect", 7.5, 3.2);
  close(g.area, 24); close(g.perimeter, 21.4);
});

test("L formos plotas: A × B − a × b", () => {
  assert.equal(C.geometry("l", 12, 7, 5, 3).area, 69);
  close(C.geometry("l", 10, 6, 9.5, 5.5).area, 7.75);
  close(C.geometry("l", 8.4, 6.2, 2.1, 1.7).area, 8.4 * 6.2 - 2.1 * 1.7);
});

test("L formos perimetras lygus apgaubiančio stačiakampio perimetrui", () => {
  // Kraštinės einant aplink: (A−a) + b + a + (B−b) + A + B = 2(A+B)
  const A = 12, B = 7, a = 5, b = 3;
  const walked = (A - a) + b + a + (B - b) + A + B;
  assert.equal(C.geometry("l", A, B, a, b).perimeter, walked);
  assert.equal(walked, 38);
});

test("validacija: kraštinių ribos", () => {
  assert.ok(C.validate({ ...base, a: NaN }).errors.a);
  assert.ok(C.validate({ ...base, a: 0.9 }).errors.a);
  assert.ok(C.validate({ ...base, a: 60.1 }).errors.a);
  assert.deepEqual(C.validate({ ...base, a: 1, b: 4 }).errors, {});
  assert.deepEqual(C.validate({ ...base, a: 60, b: 30 }).errors, {});
});

test("validacija: stačiakampiui išpjovos laukai nesvarbūs", () => {
  const v = C.validate({ ...base, shape: "rect", ca: NaN, cb: 99 });
  assert.deepEqual(v.errors, {});
  assert.equal(v.form, "");
});

test("validacija: L formos išpjova turi būti bent 0,5 m mažesnė", () => {
  assert.ok(C.validate({ ...base, shape: "l", a: 10, b: 6, ca: 10, cb: 2 }).errors.ca);
  assert.ok(C.validate({ ...base, shape: "l", a: 10, b: 6, ca: 9.6, cb: 2 }).errors.ca);
  assert.equal(C.validate({ ...base, shape: "l", a: 10, b: 6, ca: 9.5, cb: 2 }).errors.ca, undefined);
  assert.ok(C.validate({ ...base, shape: "l", a: 10, b: 6, ca: 3, cb: 6 }).errors.cb);
  assert.ok(C.validate({ ...base, shape: "l", a: 10, b: 6, ca: 0.4, cb: 2 }).errors.ca);
});

test("validacija: per mažas ir per didelis plotas", () => {
  assert.match(C.validate({ ...base, a: 1.5, b: 2 }).form, /per mažas/);
  assert.equal(C.validate({ ...base, a: 2, b: 2 }).form, "");          // lygiai 4 m²
  assert.match(C.validate({ ...base, a: 60, b: 40 }).form, /individualiai/);
  assert.equal(C.validate({ ...base, a: 50, b: 40 }).form, "");        // lygiai 2000 m²
  assert.equal(C.validate({ ...base, shape: "l", a: 3, b: 3, ca: 2, cb: 2.5 }).form, "");          // 9 − 5 = 4 m², riba leidžiama
  assert.match(C.validate({ ...base, shape: "l", a: 3, b: 3, ca: 2.5, cb: 2.2 }).form, /per mažas/); // 9 − 5,5 = 3,5 m²
});

test("medžiagų kiekis su atsarga ir vienetai", () => {
  const e = C.estimate(base);
  close(e.qtyM2, 84 * 1.1);
  assert.equal(e.pieces, 4620);                 // 92,4 m² / 0,02 m²
  const slabs = C.estimate({ ...base, material: "ploksciu", pattern: "tiesi", color: "sviesi", waste: 5 });
  close(slabs.qtyM2, 88.2);
  assert.equal(slabs.pieces, Math.ceil(88.2 / 0.24)); // 368
  assert.equal(slabs.pieces, 368);
});

test("atsarga ribojama 3–15 %", () => {
  assert.equal(C.estimate({ ...base, waste: 40 }).waste, 15);
  assert.equal(C.estimate({ ...base, waste: 0 }).waste, 3);
  assert.equal(C.estimate({ ...base, waste: NaN }).waste, 3);
});

test("ranka patikrintas pavyzdys: kiemas 12 × 7 m, pilkos trinkelės, eglutė", () => {
  // medžiaga: 11 × 92,4 = 1016,4 → 1020;  17 × 92,4 = 1570,8 → 1570
  // klojimas: 15 × 1,15 × 84 = 1449 → 1450;  22 × 1,15 × 84 = 2125,2 → 2130
  // pagrindas: 16 × 84 = 1344 → 1340;  24 × 84 = 2016 → 2020
  // borteliai: 14 × 38 = 532 → 530;  22 × 38 = 836 → 840
  // organizavimas: 150–300
  const e = C.estimate(base);
  assert.deepEqual(e.items.map(i => [i.key, i.low, i.high]), [
    ["material", 1020, 1570], ["labor", 1450, 2130], ["prep", 1340, 2020], ["curbs", 530, 840], ["mob", 150, 300]
  ]);
  assert.equal(e.low, 4490);
  assert.equal(e.high, 6860);
});

test("L forma skaičiuoja pagal 69 m², borteliai pagal 38 m", () => {
  const e = C.estimate({ ...base, shape: "l" });
  assert.equal(e.area, 69);
  const labor = e.items.find(i => i.key === "labor");
  assert.equal(labor.low, Math.round(15 * 1.15 * 69 / 10) * 10);
  const curbs = e.items.find(i => i.key === "curbs");
  assert.equal(curbs.low, 530);
});

test("be pagrindo ir be bortelių šių eilučių nėra", () => {
  const e = C.estimate({ ...base, prep: false, curbs: false });
  assert.deepEqual(e.items.map(i => i.key), ["material", "labor", "mob"]);
});

test("visos kombinacijos: suma lygi eilučių sumai, nuo ≤ iki, apvalinta iki 10 €", () => {
  let n = 0;
  for (const use of Object.keys(cfg.uses))
    for (const material of Object.keys(cfg.materials))
      for (const pattern of cfg.materials[material].patterns)
        for (const color of Object.keys(cfg.materials[material].colors))
          for (const prep of [true, false])
            for (const curbs of [true, false])
              for (const shape of ["rect", "l"]) {
                const s = { ...base, use, material, pattern, color, prep, curbs, shape };
                const e = C.estimate(s);
                const sumL = e.items.reduce((t, i) => t + i.low, 0);
                const sumH = e.items.reduce((t, i) => t + i.high, 0);
                assert.equal(e.low, sumL); assert.equal(e.high, sumH);
                assert.ok(e.low > 0 && e.low <= e.high);
                e.items.forEach(i => { assert.ok(i.low <= i.high, i.key); assert.equal(i.low % 10, 0); assert.equal(i.high % 10, 0); });
                // medžiaga skaičiuojama nuo kiekio su atsarga, klojimas — nuo ploto
                const m = cfg.materials[material], u = cfg.uses[use];
                const matLow = Math.round(m.price[0] * u.materialFactor * m.colors[color].factor * e.qtyM2 / 10) * 10;
                assert.equal(e.items[0].low, matLow);
                const labLow = Math.round(u.labor[0] * m.laborFactor * cfg.patterns[pattern].laborFactor * e.area / 10) * 10;
                assert.equal(e.items[1].low, labLow);
                n++;
              }
  assert.ok(n > 300, `patikrinta kombinacijų: ${n}`);
});

test("pastaba apie minimalų užsakymą mažiems darbams", () => {
  assert.equal(C.estimate({ ...base, a: 2, b: 2, prep: false, curbs: false }).belowMinimum, true);
  assert.equal(C.estimate(base).belowMinimum, false);
});
