# GRINDAS — demonstracinė trinkelių klojimo svetainė

Statinė svetainė be priklausomybių ir be „build“ žingsnio: HTML, CSS ir paprastas JavaScript.
Visi keliai santykiniai, todėl veikia GitHub Pages ir iš repozitorijos subkatalogo (`/vardas/repo/`).

## Struktūra

```
index.html            puslapis
privatumas.html       privatumo informacijos šablonas
assets/css/styles.css stiliai
assets/js/config.js   KAINOS, verslo duomenys, formos endpoint — keisti čia
assets/js/paving.js   trinkelių raštų generatorius (SVG, realiu masteliu)
assets/js/planner.js  kiemo planuoklis ir skaičiavimai (window.GrindasCalc)
assets/js/main.js     hero animacija, pjūvis, prieš/po, galerija, užklausos forma
```

## Pritaikymas tikram verslui

1. `config.js` → `business`: pavadinimas, telefonas, el. paštas, aptarnavimo zona, įmonės kodas.
2. `config.js` → `uses`, `materials`, `patterns`, `curbs`, `mobilization`: savos kainos (EUR/m², EUR/m).
3. `config.js` → `form.endpoint`: įrašykite JSON POST adresą (pvz. Formspree ar savo API). Kol tuščia, forma veikia demo režimu ir nieko nesiunčia.
4. `index.html`: pašalinkite demo juostą, skyrių „Apie įmonę“ pakeiskite tikra informacija; galerijos projektus (`main.js` → `projects`) pakeiskite tikrais objektais ir nuotraukomis.
5. Prieš/po: įdėkite tikras, tuo pačiu kampu darytas nuotraukas vietoje SVG iliustracijų.
6. `privatumas.html`: užpildykite laukus laužtiniuose skliaustuose.
7. Pridėkite `og:image` (absoliutus URL), `canonical`, `sitemap.xml`, jei reikia — LocalBusiness JSON-LD su tikrais duomenimis.

## Paleidimas lokaliai

```
npx serve .
```
