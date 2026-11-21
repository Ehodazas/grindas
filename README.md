# GRINDAS — demonstracinė trinkelių klojimo svetainė

Statinė svetainė be priklausomybių ir be „build“ žingsnio: HTML, CSS ir paprastas JavaScript.
Visi keliai santykiniai, todėl veikia GitHub Pages ir iš repozitorijos subkatalogo (`/vardas/repo/`).

Gyvai: https://ehodazas.github.io/grindas/

## Struktūra

```
index.html              puslapis
privatumas.html         privatumo informacijos šablonas
assets/css/styles.css   stiliai
assets/js/config.js     KAINOS, verslo duomenys, formos siuntimas — keisti čia
assets/js/calc.js       planuoklio skaičiavimai (be DOM, testuojami)
assets/js/paving.js     trinkelių raštų generatorius (SVG, realiu masteliu)
assets/js/planner.js    planuoklio sąsaja ir SVG planas
assets/js/main.js       hero animacija, pjūvis, prieš/po, galerija, užklausos forma
assets/img/photos/      nuotraukos (WebP, 800 px ir pilno dydžio)
tests/calc.test.js      skaičiavimų testai
```

## Skaičiuoklės testai

```
node --test tests/
```

15 testų: stačiakampio ir L formos plotas, perimetras, validacijos ribos, medžiagų kiekis ir vienetai,
ranka patikrintas kainos pavyzdys ir visos 384 paskirties / medžiagos / rašto / spalvos / pagrindo / bortelių / formos kombinacijos.

## Užklausų siuntimas

`config.js` → `form.mode`:

- `"demo"` — nieko nesiunčia, parodo, kas būtų perduota (dabartinis nustatymas).
- `"endpoint"` — siunčia JSON. Paprasčiausia be serverio: [FormSubmit](https://formsubmit.co)
  `endpoint: "https://formsubmit.co/ajax/jusu@elpastas.lt"`. Pirmą kartą ateis patvirtinimo laiškas.
  Tinka ir Formspree ar savas API.
- `"mailto"` — atidaro lankytojo el. pašto programą su paruoštu laišku adresu `business.email`.

## Pritaikymas tikram verslui

1. `config.js` → `business`: pavadinimas, telefonas, el. paštas, zona, įmonės kodas.
2. `config.js` → kainos (`uses`, `materials`, `patterns`, `curbs`, `mobilization`).
3. `config.js` → `form`: įjungti siuntimą (žr. aukščiau).
4. Pašalinti „Demo projektas“ žymą (`index.html`, poraštė), projektus (`main.js` → `projects`) pakeisti tikrais.
5. Prieš/po: įdėti tikras, tuo pačiu kampu darytas nuotraukas vietoje schemos.
6. `privatumas.html`: užpildyti laukus laužtiniuose skliaustuose.
7. Pridėti `og:image` (absoliutus URL), `canonical`, `sitemap.xml`.

## Nuotraukos

Unsplash licencija (nemokamai, galima komerciškai, nuoroda neprivaloma):

| Failas | Autorius | Šaltinis |
|---|---|---|
| takas-sodas | Marion Alyek | https://unsplash.com/photos/exhPT9NLC6I |
| kiemas-aikstele | Sergej (skstrannik) | https://unsplash.com/photos/PqSpzuV1TXY |
| egle-detale | Taylor Smith | https://unsplash.com/photos/ho2GEnCV_O0 |
| terasa-plokstes | Brett Jordan | https://unsplash.com/photos/-UOiKGfzxXY |
| terasa-moderni | Tile Merchant Ireland | https://unsplash.com/photos/lCmZqcHM-OY |
| klojimas-darbas | Hilman Lutfi | https://unsplash.com/photos/D0H_u817oJ8 |
| klojimas-eiga | sq lim | https://unsplash.com/photos/8WU8XGleveo |
| ivaziavimas-pries | J. Rafi | https://unsplash.com/photos/gvhAbLY2XnU |
| trinkeles-paletes | Sergej (skstrannik) | https://unsplash.com/photos/DpYmK7HAP8Q |
| hero-takas-vakaras | RETRATO INMOBILIARIO | https://unsplash.com/photos/eLG6MsOeupk |
| namas-medinis-takas | Yudiono Putranto | https://unsplash.com/photos/BWwOd21Y6mk |
| takas-borteliai | Sergej (skstrannik) | https://unsplash.com/photos/i_fpJG0GU5A |
`kiemas-zalios-siules` ir `vidinis-kiemas-skalda` pateikė projekto autorius. Prieš naudojant viešai
reikia įsitikinti, kad turite teisę jas naudoti (šaltinis ir licencija).

## Paleidimas lokaliai

```
npx serve .
```
