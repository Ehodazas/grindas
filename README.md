# GRINDAS — demonstracinė trinkelių klojimo svetainė

Statinė svetainė be priklausomybių ir be „build“ žingsnio: HTML, CSS ir paprastas JavaScript.
Visi keliai santykiniai, todėl veikia GitHub Pages ir iš repozitorijos subkatalogo (`/vardas/repo/`).

Gyvai: https://ehodazas.github.io/grindas/

## Struktūra

```
index.html              puslapis
privatumas.html         privatumo politika (laužtiniuose skliaustuose esančius duomenis pakeisti įmonės)
assets/css/styles.css   stiliai
assets/js/config.js     KAINOS ir verslo duomenys (telefonas, zona) — keisti čia
assets/js/calc.js       planuoklio skaičiavimai (be DOM, testuojami)
assets/js/paving.js     trinkelių raštų generatorius (SVG, realiu masteliu)
assets/js/planner.js    planuoklio sąsaja ir SVG planas
assets/js/main.js       hero animacija, paslaugos, pjūvis, prieš/po, galerija, skambinimo mygtukai
assets/img/photos/      nuotraukos (WebP, 800 px ir pilno dydžio)
tests/calc.test.js      skaičiavimų testai
```

## Skaičiuoklės testai

```
node --test tests/
```

19 testų: stačiakampio ir L formos plotas, perimetras, validacijos ribos, medžiagų kiekis ir vienetai,
ranka patikrintas kainos pavyzdys, visos 384 paskirties / medžiagos / rašto / spalvos / pagrindo / bortelių / formos kombinacijos,
sluoksnių storis ir kasimo gylis pagal apkrovą ir gruntą, plano nuorodos atkūrimas ir sugadintų nuorodų atmetimas.

## Kontaktas

Užklausos formos nėra: visi „Skambinti“ mygtukai ir telefone matoma apatinė juosta veda į `business.phoneHref` iš `config.js`.

„Siųsti šį planą sąmatai“ atidaro el. laišką adresu `business.email` su visais planuoklio pasirinkimais ir nuoroda (`?planas=1&…#planuoklis`), kuri atidaro tą patį planą. „Kopijuoti planą“ nukopijuoja tą patį tekstą Viber ar Messenger žinutei.

## Pritaikymas tikram verslui

1. `config.js` → `business`: pavadinimas, telefonas (`phone` ir `phoneHref`), el. paštas, zona.
2. `config.js` → kainos (`uses`, `materials`, `patterns`, `curbs`, `mobilization`).
   - `social`: Facebook ir Instagram nuorodos (kol tuščia, ikonos niekur neveda).
   - `reviews`: tikri Google atsiliepimai, įvertinimas, kiekis ir `googleUrl`; nustatyti `demo: false`.
   - `promise`: pažadas hero bloke.
   - `layers`: sluoksnių storiai pagal apkrovą ir gruntą (sluoksnių schema ir kasimo gylis).
   - `trust`: tikri skaičiai „Apie mus“ skyriui (garantija, patirtis, objektai).
3. Pašalinti „Demo projektas“ žymą (`index.html`, poraštė), projektus (`main.js` → `projects`) pakeisti tikrais.
4. Prieš/po: įdėti tikras, tuo pačiu kampu darytas nuotraukas vietoje schemos.
5. Pridėti `og:image` (absoliutus URL), `canonical`, `sitemap.xml`.

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
| hero-ivaziavimas | R_ INVSCIMENTO | https://unsplash.com/photos/_kMBp2hJ8TU |
| namas-medinis-takas | Yudiono Putranto | https://unsplash.com/photos/BWwOd21Y6mk |
| takas-borteliai | Sergej (skstrannik) | https://unsplash.com/photos/i_fpJG0GU5A |
`kiemas-zalios-siules` ir `vidinis-kiemas-skalda` pateikė projekto autorius. Prieš naudojant viešai
reikia įsitikinti, kad turite teisę jas naudoti (šaltinis ir licencija).

## Paleidimas lokaliai

```
npx serve .
```
