/*
 * GRINDAS — centrinė konfigūracija.
 * Visos kainos yra DEMONSTRACINĖS ir orientacinės (EUR su PVM).
 * Pritaikant tikram verslui, pakeiskite reikšmes čia — HTML ir JS kodo keisti nereikia.
 */
window.GRINDAS_CONFIG = {
  business: {
    name: "GRINDAS",
    legalNote: "Demonstracinė įmonė. Rekvizitai neegzistuoja.",
    phone: "+370 600 00000",
    phoneHref: "tel:+37060000000",
    email: "info@grindas.example",
    city: "Kaunas",
    hours: "I–V 8:00–18:00, VI pagal susitarimą",
    companyCode: "000000000",
    serviceAreas: [
      "Kaunas ir Kauno r.",
      "Vilnius ir Vilniaus r.",
      "Jonava",
      "Kėdainiai",
      "Kaišiadorys",
      "Prienai ir Birštonas",
      "Trakai",
      "Elektrėnai"
    ]
  },


  /* Socialiniai tinklai: įrašykite pilną nuorodą. Kol tuščia, ikona rodoma, bet niekur neveda. */
  social: {
    facebook: "",
    instagram: ""
  },

  /* Atsiliepimai. DEMO: pavyzdiniai, tikroje svetainėje pakeiskite tikrais Google atsiliepimais. */
  reviews: {
    demo: true,
    rating: "4,9",
    count: 27,
    googleUrl: "",      // nuoroda į įmonės Google atsiliepimus
    items: [
      { name: "Rasa", place: "Kauno r.", work: "Įvažiavimas, apie 70 m²", stars: 5,
        text: "Iš anksto gavome sąmatą raštu, darbai užtruko savaitę, kaip ir sakė. Prie garažo įrengė lataką, nes ten nuolat stovėdavo vanduo. Po žiemos niekas neįdubo." },
      { name: "Tomas", place: "Vilniaus r.", work: "Kiemas ir takas, apie 55 m²", stars: 5,
        text: "Patiko, kad atvažiavę pirmiausia patikrino gruntą ir paaiškino, kodėl reikia storesnio pagrindo. Po darbų išvežė visą žemę ir sutvarkė kraštus prie vejos." },
      { name: "Jurgita", place: "Kaunas", work: "Trinkelių perklojimas", stars: 5,
        text: "Įdubusią vietą prie įėjimo perklojo su tomis pačiomis trinkelėmis, suskilusias pakeitė. Kaina buvo tokia, kokią sutarėme." }
    ]
  },

  /* Pasitikėjimo ženklai. DEMO: skaičiai pavyzdiniai, įrašykite tikrus. */
  trust: {
    demo: true,
    stats: [
      { value: "5 m.", label: "garantija atliktiems darbams" },
      { value: "10+", label: "metų patirtis" },
      { value: "350+", label: "įrengtų kiemų, takų ir įvažiavimų" },
      { value: "1–2 d.", label: "iki apžiūros vietoje" }
    ]
  },

  currency: "EUR",

  /* Planuoklio ribos */
  limits: {
    minSide: 1,        // m
    maxSide: 60,       // m
    minArea: 4,        // m²
    maxArea: 2000,     // m²
    minWaste: 3,       // %
    maxWaste: 15       // %
  },

  /* Paskirtis: klojimo darbai ir pagrindo paruošimas (EUR/m², nuo–iki) */
  uses: {
    takas: {
      label: "Pėsčiųjų takas",
      labor: [14, 20],
      groundPrep: [12, 18],
      materialFactor: 1.0
    },
    kiemas: {
      label: "Kiemas",
      labor: [15, 22],
      groundPrep: [16, 24],
      materialFactor: 1.0
    },
    terasa: {
      label: "Terasa",
      labor: [16, 24],
      groundPrep: [14, 20],
      materialFactor: 1.0
    },
    ivaziavimas: {
      label: "Įvažiavimas",
      labor: [16, 24],
      groundPrep: [22, 32],
      materialFactor: 1.12, // storesnės trinkelės automobilių apkrovai
      note: "Įvažiavimui skaičiuojamos storesnės trinkelės ir tvirtesnis pagrindas."
    }
  },

  /* Medžiagos. unit — vieno elemento matmenys metrais (planui ir kiekiui). */
  materials: {
    betonines: {
      label: "Betoninės trinkelės",
      unit: { l: 0.2, w: 0.1 },
      unitLabel: "20 × 10 cm",
      price: [11, 17],
      laborFactor: 1.0,
      patterns: ["eglute", "perrisimas", "pintine", "tiesi"],
      colors: {
        pilka:    { label: "Pilka",        hex: ["#a3a29c", "#9a9993", "#acaba5"], factor: 1.0 },
        grafitas: { label: "Grafitas",     hex: ["#4f5254", "#57595b", "#46494b"], factor: 1.12 },
        smelio:   { label: "Smėlio",       hex: ["#cbbd9f", "#c2b394", "#d3c6aa"], factor: 1.12 },
        mix:      { label: "Rudens mišinys", hex: ["#8d6c52", "#b29775", "#6d5a4b", "#c8b28f", "#9c8a78"], factor: 1.18 }
      }
    },
    klinkeris: {
      label: "Klinkerio trinkelės",
      unit: { l: 0.2, w: 0.1 },
      unitLabel: "20 × 10 cm",
      price: [38, 60],
      laborFactor: 1.2,
      patterns: ["eglute", "perrisimas", "pintine"],
      colors: {
        raudona:   { label: "Raudona",   hex: ["#9b4a32", "#8e432d", "#a7553a"], factor: 1.0 },
        ruda:      { label: "Ruda",      hex: ["#6f4636", "#7b5140", "#634033"], factor: 1.0 },
        antracitas:{ label: "Antracitas", hex: ["#3e3c3b", "#474443", "#363433"], factor: 1.05 },
        marga:     { label: "Marga",     hex: ["#8e432d", "#6f4636", "#a96b4c", "#5b3a30", "#b07a5a"], factor: 1.08 }
      }
    },
    ploksciu: {
      label: "Didelio formato plokštės",
      unit: { l: 0.6, w: 0.4 },
      unitLabel: "60 × 40 cm",
      price: [26, 48],
      laborFactor: 1.25,
      patterns: ["tiesi", "perrisimas"],
      notFor: ["ivaziavimas"],
      notForNote: "Didelio formato plokštės įvažiavimui dažniausiai netinka: reikia specialiai tam skirtų storesnių plokščių ir kitokio pagrindo. Tai aptarsime apžiūros metu.",
      colors: {
        sviesi:   { label: "Šviesiai pilka", hex: ["#bdbcb5", "#b5b4ad", "#c4c3bc"], factor: 1.0 },
        grafitas: { label: "Grafitas",       hex: ["#56595b", "#5e6163", "#4f5254"], factor: 1.08 },
        smelio:   { label: "Smėlio",         hex: ["#cfc3ab", "#c7baa1", "#d6cbb4"], factor: 1.08 }
      }
    }
  },

  /* Raštai: darbo sudėtingumo koeficientas ir siūlomos atliekos (%) */
  patterns: {
    eglute:     { label: "Eglutė",          laborFactor: 1.15, waste: 10 },
    perrisimas: { label: "Su perrišimu",    laborFactor: 1.0,  waste: 5 },
    pintine:    { label: "Pintinė",         laborFactor: 1.08, waste: 7 },
    tiesi:      { label: "Tiesios eilės",   laborFactor: 1.0,  waste: 5 }
  },

  /* Borteliai: EUR už metrą, su betono padu */
  curbs: { label: "Borteliai", price: [14, 22] },

  /* Pažadas klientui: rodomas hero bloke. DEMO: pakeiskite tikru. */
  promise: "Apžiūra ir sąmata nemokamai. Perskambiname per 1 darbo dieną.",

  /* Dangos sluoksniai, cm (nuo–iki). ORIENTACINIAI: tikslų storį nustatome apžiūrėję gruntą. */
  layers: {
    loads: {
      takas:       { label: "Takas",       pavers: [6, 6], bedding: [3, 5], base: [15, 20], note: "Pėstiesiems ir dviračiams." },
      kiemas:      { label: "Kiemas",      pavers: [6, 8], bedding: [3, 5], base: [20, 25], note: "Kiemas, terasa, retkarčiais užvažiuojantis automobilis." },
      ivaziavimas: { label: "Įvažiavimas", pavers: [8, 8], bedding: [3, 5], base: [25, 35], note: "Kasdien važiuojantys lengvieji automobiliai." }
    },
    soils: {
      smelis:    { label: "Smėlis",    sand: null,     geotextile: false, note: "Gerai praleidžia vandenį. Gruntas tik sutankinamas." },
      priemolis: { label: "Priemolis", sand: [5, 10],  geotextile: true,  note: "Rekomenduojama geotekstilė ir drenuojantis smėlio sluoksnis." },
      molis:     { label: "Molis",     sand: [10, 15], geotextile: true,  note: "Laiko vandenį ir kilnojasi nuo šalčio: geotekstilė ir storesnis smėlio sluoksnis būtini." }
    }
  },

  /* Fiksuotos išlaidos objektui */
  mobilization: { label: "Technikos atvežimas ir darbų organizavimas", price: [150, 300] },

  /* Jei bendra suma mažesnė — rodoma pastaba */
  minimumOrder: 900,

  /* Sumų apvalinimas (EUR) */
  roundTo: 10
};
