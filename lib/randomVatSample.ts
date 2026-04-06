/**
 * Random fictional VAT claim data for form testing (n8n / Supabase).
 * Finland only — all values are synthetic.
 */

export type RandomVatSampleForm = {
  company_name: string;
  registration_number: string;
  vat_number: string;
  country: string;
  address: string;
  contact_person: string;
  contact_email: string;
  contact_phone: string;
  claim_period_start: string;
  claim_period_end: string;
  claim_type: string;
  total_claim_amount: string;
  currency: string;
  invoice_count: string;
  claim_description: string;
  bank_name: string;
  account_holder_name: string;
  iban: string;
  swift_code: string;
  invoice_references: string;
  transaction_references: string;
  additional_notes: string;
  declaration_accepted: boolean;
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digits(len: number): string {
  let s = "";
  for (let i = 0; i < len; i++) s += String(randInt(0, 9));
  return s;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

const CLAIM_TYPES = [
  "VAT Refund",
  "Input VAT Recovery",
  "Cross-Border VAT Claim",
  "Correction / Adjustment",
] as const;

const FIRST_NAMES = [
  "Aino",
  "Eero",
  "Liisa",
  "Juhani",
  "Sanna",
  "Mikko",
  "Kaisa",
  "Olli",
  "Emilia",
  "Antti",
  "Noora",
  "Pekka",
  "Helmi",
  "Ville",
  "Elina",
] as const;

const LAST_NAMES = [
  "Virtanen",
  "Korhonen",
  "Mäkinen",
  "Nieminen",
  "Laine",
  "Heikkinen",
  "Koskinen",
  "Järvinen",
  "Lehtonen",
  "Saarinen",
  "Tuominen",
  "Rantanen",
  "Salminen",
  "Karjalainen",
  "Laaksonen",
] as const;

const FINLAND_CITIES = [
  "Helsinki",
  "Espoo",
  "Tampere",
  "Vantaa",
  "Oulu",
  "Turku",
  "Jyväskylä",
  "Lahti",
  "Kuopio",
  "Pori",
] as const;

const FINLAND_STREETS = [
  "Mannerheimintie",
  "Aleksanterinkatu",
  "Fredrikinkatu",
  "Hämeenkatu",
  "Kauppakatu",
  "Kirkkokatu",
  "Satakunnankatu",
  "Tehtaankatu",
  "Vuorikatu",
  "Yliopistonkatu",
] as const;

const FINLAND_BANKS = [
  "Nordea Bank",
  "OP Corporate Bank",
  "Danske Bank A/S",
  "S-Pankki",
  "Ålandsbanken",
  "POP Pankki",
] as const;

const FINLAND_SWIFTS = [
  "NDEAFIHH",
  "OKOYFIHH",
  "DABAFIHH",
  "SBANFIHH",
  "AABAFI22",
  "POPFFI22",
] as const;

const COMPANY_SUFFIXES = ["Oy", "Oyj"] as const;

const COMPANY_BASES = [
  "Pohjan Teollisuus",
  "Suomen Logistiikka",
  "Keski-Suomen Osat",
  "Itämeren Tekniikka",
  "Lapin Raaka-aine",
  "Tammerkosken Palvelu",
  "Satakunnan Tuonti",
  "Etelä-Suomen Energia",
  "Vaasan Komponentit",
  "Kuopion Elintarvike",
  "Oulun Digitaalinen",
  "Helsingin Rakennusmateriaali",
] as const;

function finnishStreetLine(): string {
  const base = `${pick(FINLAND_STREETS)} ${randInt(3, 120)}`;
  return Math.random() > 0.62 ? `${base} ${randInt(1, 8)}` : base;
}

function finnishPostal(): string {
  return String(randInt(1000, 99999)).padStart(5, "0");
}

function finnishReg(): string {
  return `PRH-${randInt(100000, 999999)}`;
}

function finnishVat(): string {
  return `FI${digits(8)}`;
}

function finnishPhone(): string {
  return `+358 ${randInt(40, 50)} ${digits(3)} ${digits(4)}`;
}

function finnishIban(): string {
  return `FI${digits(16)}`;
}

function descriptionFor(claimType: string, amount: number): string {
  const lines: Record<string, string[]> = {
    "VAT Refund": [
      "Suomen arvonlisäverolain mukainen palautushakemus; myyntikirjanpito ja laskut ERP:ssä.",
      "Ylijäämäinen vähennys laitehankinnoista ja osittaisvapautuksen oikaisun jälkeen.",
    ],
    "Input VAT Recovery": [
      "Vähennys oikeus EU-toimittajilta ostetuista konsultti- ja pilvipalveluista.",
      "Rajat ylittävät neuvontakulut; kohdistus verolliseen liikevaihtoon tarkistettu.",
    ],
    "Cross-Border VAT Claim": [
      "EU-hankinnat käännetty verovelvollisuudella; hakemus vastaa EU-direktiivin käytäntöä.",
      "Tavarat kulkevat keskusvaraston kautta; tulli- ja ALV-dokumentaatio saatavilla.",
    ],
    "Correction / Adjustment": [
      "Aikaisemman kauden oikaisu toimittajahyvitysten ja uusien laskuarvojen perusteella.",
      "Oikaisu Verohallinnon ohjeen mukaisesti osittaisvapautuksen jakomenetelmään.",
    ],
  };
  const pool = lines[claimType] ?? lines["VAT Refund"];
  const base = pick(pool);
  return `${base} Ilmoitettu vaatimusperuste noin ${amount.toLocaleString("fi-FI", { maximumFractionDigits: 0 })} € (ilmoitusvaluutta EUR).`;
}

function extraNotes(): string {
  const pool = [
    "Käsittely toivottu ennen lakisääteistä määräaikaa.",
    "Liitteet: toimittajatiliotteet ja maksutositteet.",
    "Uusi toimittaja viime kvartaalilla; sisäinen tarkistuskansio täydennetty.",
    "Sama yhtiö hyväksytty aiemmin; liiketoimintamalli ennallaan.",
    "",
    "Maksu jaettu kahdelle tiliotteelle; treasury-kartta saatavilla.",
    "Yksi lasku korvattu uudella viitteellä; vanha mitätöity.",
  ];
  return pick(pool);
}

/** Random plausible Finland-only sample; safe to submit to test pipelines. */
export function generateRandomVatSample(): RandomVatSampleForm {
  const first = pick(FIRST_NAMES);
  const last = pick(LAST_NAMES);
  const city = pick(FINLAND_CITIES);
  const streetLine = finnishStreetLine();
  const postal = finnishPostal();
  const company_name = `${pick(COMPANY_BASES)} ${pick(COMPANY_SUFFIXES)}`;

  const amountTier = pick(["low", "mid", "high", "very_high"] as const);
  let amount = 0;
  let invoices = 0;
  switch (amountTier) {
    case "low":
      amount = randInt(900, 8900) + Math.random();
      invoices = randInt(2, 8);
      break;
    case "mid":
      amount = randInt(12000, 68000) + Math.random() * 100;
      invoices = randInt(6, 28);
      break;
    case "high":
      amount = randInt(82000, 220000) + Math.random() * 200;
      invoices = randInt(18, 55);
      break;
    case "very_high":
      amount = randInt(240000, 920000) + Math.random() * 500;
      invoices = randInt(35, 140);
      break;
  }

  const claim_type = pick([...CLAIM_TYPES]);
  const start = new Date();
  start.setMonth(start.getMonth() - randInt(2, 20));
  start.setDate(randInt(1, 25));
  const end = new Date(start);
  end.setDate(end.getDate() + randInt(45, 120));

  const year = start.getFullYear();
  const invA = randInt(10000, 99999);
  const invB = invA + randInt(3, 40);
  const invC = invB + randInt(3, 40);
  const txnA = randInt(500000, 9999999);
  const txnB = txnA + randInt(100, 9000);

  const sparseBank = Math.random() < 0.12;
  const bank_name = sparseBank ? "" : pick(FINLAND_BANKS);
  const iban = sparseBank ? "" : finnishIban();
  const swift_code = sparseBank ? "" : pick(FINLAND_SWIFTS);

  return {
    company_name,
    registration_number: finnishReg(),
    vat_number: finnishVat(),
    country: "Finland",
    address: `${streetLine}\n${postal} ${city}`,
    contact_person: `${first} ${last}`,
    contact_email: `${first.toLowerCase()}.${last.toLowerCase().replace(/ä/g, "a").replace(/ö/g, "o").replace(/å/g, "a")}${randInt(1, 99)}@example.com`,
    contact_phone: finnishPhone(),
    claim_period_start: isoDate(start),
    claim_period_end: isoDate(end),
    claim_type,
    total_claim_amount: amount.toFixed(2),
    currency: "EUR",
    invoice_count: String(invoices),
    claim_description: descriptionFor(claim_type, amount),
    bank_name,
    account_holder_name: company_name,
    iban,
    swift_code,
    invoice_references: `INV-${year}-${invA}, INV-${year}-${invB}, INV-${year}-${invC}`,
    transaction_references: `TXN-${year}-${txnA}, TXN-${year}-${txnB}`,
    additional_notes: extraNotes(),
    declaration_accepted: true,
  };
}
