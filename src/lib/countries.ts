/**
 * Country reference data for the Country Sorter.
 *
 * Deliberately tiny: each country needs only a display name and a primary IANA
 * timezone. Everything else the UI shows is DERIVED at runtime so we ship no
 * extra data and pay for no services:
 *   - flag emoji  -> from the ISO2 code (regional-indicator codepoints)
 *   - local time  -> Intl.DateTimeFormat with the country's timeZone
 *   - UTC offset  -> same
 *   - bucket color-> hashed from the ISO2 code (stable per country)
 *   - send window -> computed from the local hour (good time to email?)
 *
 * `timeZone` is the country's primary/most-populous zone. Countries that span
 * several zones are listed in MULTI_TZ so the UI can note "spans N zones".
 */

export interface Country {
  /** English display name. */
  name: string;
  /** Primary IANA timezone (capital / most-populous zone). */
  timeZone: string;
}

/** ISO-3166-1 alpha-2 -> { name, primary timezone }. */
export const COUNTRIES: Record<string, Country> = {
  AD: { name: "Andorra", timeZone: "Europe/Andorra" },
  AE: { name: "United Arab Emirates", timeZone: "Asia/Dubai" },
  AF: { name: "Afghanistan", timeZone: "Asia/Kabul" },
  AG: { name: "Antigua and Barbuda", timeZone: "America/Antigua" },
  AI: { name: "Anguilla", timeZone: "America/Anguilla" },
  AL: { name: "Albania", timeZone: "Europe/Tirane" },
  AM: { name: "Armenia", timeZone: "Asia/Yerevan" },
  AO: { name: "Angola", timeZone: "Africa/Luanda" },
  AQ: { name: "Antarctica", timeZone: "Antarctica/McMurdo" },
  AR: { name: "Argentina", timeZone: "America/Argentina/Buenos_Aires" },
  AS: { name: "American Samoa", timeZone: "Pacific/Pago_Pago" },
  AT: { name: "Austria", timeZone: "Europe/Vienna" },
  AU: { name: "Australia", timeZone: "Australia/Sydney" },
  AW: { name: "Aruba", timeZone: "America/Aruba" },
  AX: { name: "Åland Islands", timeZone: "Europe/Mariehamn" },
  AZ: { name: "Azerbaijan", timeZone: "Asia/Baku" },
  BA: { name: "Bosnia and Herzegovina", timeZone: "Europe/Sarajevo" },
  BB: { name: "Barbados", timeZone: "America/Barbados" },
  BD: { name: "Bangladesh", timeZone: "Asia/Dhaka" },
  BE: { name: "Belgium", timeZone: "Europe/Brussels" },
  BF: { name: "Burkina Faso", timeZone: "Africa/Ouagadougou" },
  BG: { name: "Bulgaria", timeZone: "Europe/Sofia" },
  BH: { name: "Bahrain", timeZone: "Asia/Bahrain" },
  BI: { name: "Burundi", timeZone: "Africa/Bujumbura" },
  BJ: { name: "Benin", timeZone: "Africa/Porto-Novo" },
  BL: { name: "Saint Barthélemy", timeZone: "America/St_Barthelemy" },
  BM: { name: "Bermuda", timeZone: "Atlantic/Bermuda" },
  BN: { name: "Brunei", timeZone: "Asia/Brunei" },
  BO: { name: "Bolivia", timeZone: "America/La_Paz" },
  BQ: { name: "Caribbean Netherlands", timeZone: "America/Kralendijk" },
  BR: { name: "Brazil", timeZone: "America/Sao_Paulo" },
  BS: { name: "Bahamas", timeZone: "America/Nassau" },
  BT: { name: "Bhutan", timeZone: "Asia/Thimphu" },
  BW: { name: "Botswana", timeZone: "Africa/Gaborone" },
  BY: { name: "Belarus", timeZone: "Europe/Minsk" },
  BZ: { name: "Belize", timeZone: "America/Belize" },
  CA: { name: "Canada", timeZone: "America/Toronto" },
  CC: { name: "Cocos (Keeling) Islands", timeZone: "Indian/Cocos" },
  CD: { name: "DR Congo", timeZone: "Africa/Kinshasa" },
  CF: { name: "Central African Republic", timeZone: "Africa/Bangui" },
  CG: { name: "Congo", timeZone: "Africa/Brazzaville" },
  CH: { name: "Switzerland", timeZone: "Europe/Zurich" },
  CI: { name: "Côte d'Ivoire", timeZone: "Africa/Abidjan" },
  CK: { name: "Cook Islands", timeZone: "Pacific/Rarotonga" },
  CL: { name: "Chile", timeZone: "America/Santiago" },
  CM: { name: "Cameroon", timeZone: "Africa/Douala" },
  CN: { name: "China", timeZone: "Asia/Shanghai" },
  CO: { name: "Colombia", timeZone: "America/Bogota" },
  CR: { name: "Costa Rica", timeZone: "America/Costa_Rica" },
  CU: { name: "Cuba", timeZone: "America/Havana" },
  CV: { name: "Cape Verde", timeZone: "Atlantic/Cape_Verde" },
  CW: { name: "Curaçao", timeZone: "America/Curacao" },
  CX: { name: "Christmas Island", timeZone: "Indian/Christmas" },
  CY: { name: "Cyprus", timeZone: "Asia/Nicosia" },
  CZ: { name: "Czechia", timeZone: "Europe/Prague" },
  DE: { name: "Germany", timeZone: "Europe/Berlin" },
  DJ: { name: "Djibouti", timeZone: "Africa/Djibouti" },
  DK: { name: "Denmark", timeZone: "Europe/Copenhagen" },
  DM: { name: "Dominica", timeZone: "America/Dominica" },
  DO: { name: "Dominican Republic", timeZone: "America/Santo_Domingo" },
  DZ: { name: "Algeria", timeZone: "Africa/Algiers" },
  EC: { name: "Ecuador", timeZone: "America/Guayaquil" },
  EE: { name: "Estonia", timeZone: "Europe/Tallinn" },
  EG: { name: "Egypt", timeZone: "Africa/Cairo" },
  EH: { name: "Western Sahara", timeZone: "Africa/El_Aaiun" },
  ER: { name: "Eritrea", timeZone: "Africa/Asmara" },
  ES: { name: "Spain", timeZone: "Europe/Madrid" },
  ET: { name: "Ethiopia", timeZone: "Africa/Addis_Ababa" },
  FI: { name: "Finland", timeZone: "Europe/Helsinki" },
  FJ: { name: "Fiji", timeZone: "Pacific/Fiji" },
  FK: { name: "Falkland Islands", timeZone: "Atlantic/Stanley" },
  FM: { name: "Micronesia", timeZone: "Pacific/Pohnpei" },
  FO: { name: "Faroe Islands", timeZone: "Atlantic/Faroe" },
  FR: { name: "France", timeZone: "Europe/Paris" },
  GA: { name: "Gabon", timeZone: "Africa/Libreville" },
  GB: { name: "United Kingdom", timeZone: "Europe/London" },
  GD: { name: "Grenada", timeZone: "America/Grenada" },
  GE: { name: "Georgia", timeZone: "Asia/Tbilisi" },
  GF: { name: "French Guiana", timeZone: "America/Cayenne" },
  GG: { name: "Guernsey", timeZone: "Europe/Guernsey" },
  GH: { name: "Ghana", timeZone: "Africa/Accra" },
  GI: { name: "Gibraltar", timeZone: "Europe/Gibraltar" },
  GL: { name: "Greenland", timeZone: "America/Nuuk" },
  GM: { name: "Gambia", timeZone: "Africa/Banjul" },
  GN: { name: "Guinea", timeZone: "Africa/Conakry" },
  GP: { name: "Guadeloupe", timeZone: "America/Guadeloupe" },
  GQ: { name: "Equatorial Guinea", timeZone: "Africa/Malabo" },
  GR: { name: "Greece", timeZone: "Europe/Athens" },
  GT: { name: "Guatemala", timeZone: "America/Guatemala" },
  GU: { name: "Guam", timeZone: "Pacific/Guam" },
  GW: { name: "Guinea-Bissau", timeZone: "Africa/Bissau" },
  GY: { name: "Guyana", timeZone: "America/Guyana" },
  HK: { name: "Hong Kong", timeZone: "Asia/Hong_Kong" },
  HN: { name: "Honduras", timeZone: "America/Tegucigalpa" },
  HR: { name: "Croatia", timeZone: "Europe/Zagreb" },
  HT: { name: "Haiti", timeZone: "America/Port-au-Prince" },
  HU: { name: "Hungary", timeZone: "Europe/Budapest" },
  ID: { name: "Indonesia", timeZone: "Asia/Jakarta" },
  IE: { name: "Ireland", timeZone: "Europe/Dublin" },
  IL: { name: "Israel", timeZone: "Asia/Jerusalem" },
  IM: { name: "Isle of Man", timeZone: "Europe/Isle_of_Man" },
  IN: { name: "India", timeZone: "Asia/Kolkata" },
  IO: { name: "British Indian Ocean Territory", timeZone: "Indian/Chagos" },
  IQ: { name: "Iraq", timeZone: "Asia/Baghdad" },
  IR: { name: "Iran", timeZone: "Asia/Tehran" },
  IS: { name: "Iceland", timeZone: "Atlantic/Reykjavik" },
  IT: { name: "Italy", timeZone: "Europe/Rome" },
  JE: { name: "Jersey", timeZone: "Europe/Jersey" },
  JM: { name: "Jamaica", timeZone: "America/Jamaica" },
  JO: { name: "Jordan", timeZone: "Asia/Amman" },
  JP: { name: "Japan", timeZone: "Asia/Tokyo" },
  KE: { name: "Kenya", timeZone: "Africa/Nairobi" },
  KG: { name: "Kyrgyzstan", timeZone: "Asia/Bishkek" },
  KH: { name: "Cambodia", timeZone: "Asia/Phnom_Penh" },
  KI: { name: "Kiribati", timeZone: "Pacific/Tarawa" },
  KM: { name: "Comoros", timeZone: "Indian/Comoro" },
  KN: { name: "Saint Kitts and Nevis", timeZone: "America/St_Kitts" },
  KP: { name: "North Korea", timeZone: "Asia/Pyongyang" },
  KR: { name: "South Korea", timeZone: "Asia/Seoul" },
  KW: { name: "Kuwait", timeZone: "Asia/Kuwait" },
  KY: { name: "Cayman Islands", timeZone: "America/Cayman" },
  KZ: { name: "Kazakhstan", timeZone: "Asia/Almaty" },
  LA: { name: "Laos", timeZone: "Asia/Vientiane" },
  LB: { name: "Lebanon", timeZone: "Asia/Beirut" },
  LC: { name: "Saint Lucia", timeZone: "America/St_Lucia" },
  LI: { name: "Liechtenstein", timeZone: "Europe/Vaduz" },
  LK: { name: "Sri Lanka", timeZone: "Asia/Colombo" },
  LR: { name: "Liberia", timeZone: "Africa/Monrovia" },
  LS: { name: "Lesotho", timeZone: "Africa/Maseru" },
  LT: { name: "Lithuania", timeZone: "Europe/Vilnius" },
  LU: { name: "Luxembourg", timeZone: "Europe/Luxembourg" },
  LV: { name: "Latvia", timeZone: "Europe/Riga" },
  LY: { name: "Libya", timeZone: "Africa/Tripoli" },
  MA: { name: "Morocco", timeZone: "Africa/Casablanca" },
  MC: { name: "Monaco", timeZone: "Europe/Monaco" },
  MD: { name: "Moldova", timeZone: "Europe/Chisinau" },
  ME: { name: "Montenegro", timeZone: "Europe/Podgorica" },
  MF: { name: "Saint Martin", timeZone: "America/Marigot" },
  MG: { name: "Madagascar", timeZone: "Indian/Antananarivo" },
  MH: { name: "Marshall Islands", timeZone: "Pacific/Majuro" },
  MK: { name: "North Macedonia", timeZone: "Europe/Skopje" },
  ML: { name: "Mali", timeZone: "Africa/Bamako" },
  MM: { name: "Myanmar", timeZone: "Asia/Yangon" },
  MN: { name: "Mongolia", timeZone: "Asia/Ulaanbaatar" },
  MO: { name: "Macao", timeZone: "Asia/Macau" },
  MP: { name: "Northern Mariana Islands", timeZone: "Pacific/Saipan" },
  MQ: { name: "Martinique", timeZone: "America/Martinique" },
  MR: { name: "Mauritania", timeZone: "Africa/Nouakchott" },
  MS: { name: "Montserrat", timeZone: "America/Montserrat" },
  MT: { name: "Malta", timeZone: "Europe/Malta" },
  MU: { name: "Mauritius", timeZone: "Indian/Mauritius" },
  MV: { name: "Maldives", timeZone: "Indian/Maldives" },
  MW: { name: "Malawi", timeZone: "Africa/Blantyre" },
  MX: { name: "Mexico", timeZone: "America/Mexico_City" },
  MY: { name: "Malaysia", timeZone: "Asia/Kuala_Lumpur" },
  MZ: { name: "Mozambique", timeZone: "Africa/Maputo" },
  NA: { name: "Namibia", timeZone: "Africa/Windhoek" },
  NC: { name: "New Caledonia", timeZone: "Pacific/Noumea" },
  NE: { name: "Niger", timeZone: "Africa/Niamey" },
  NF: { name: "Norfolk Island", timeZone: "Pacific/Norfolk" },
  NG: { name: "Nigeria", timeZone: "Africa/Lagos" },
  NI: { name: "Nicaragua", timeZone: "America/Managua" },
  NL: { name: "Netherlands", timeZone: "Europe/Amsterdam" },
  NO: { name: "Norway", timeZone: "Europe/Oslo" },
  NP: { name: "Nepal", timeZone: "Asia/Kathmandu" },
  NR: { name: "Nauru", timeZone: "Pacific/Nauru" },
  NU: { name: "Niue", timeZone: "Pacific/Niue" },
  NZ: { name: "New Zealand", timeZone: "Pacific/Auckland" },
  OM: { name: "Oman", timeZone: "Asia/Muscat" },
  PA: { name: "Panama", timeZone: "America/Panama" },
  PE: { name: "Peru", timeZone: "America/Lima" },
  PF: { name: "French Polynesia", timeZone: "Pacific/Tahiti" },
  PG: { name: "Papua New Guinea", timeZone: "Pacific/Port_Moresby" },
  PH: { name: "Philippines", timeZone: "Asia/Manila" },
  PK: { name: "Pakistan", timeZone: "Asia/Karachi" },
  PL: { name: "Poland", timeZone: "Europe/Warsaw" },
  PM: { name: "Saint Pierre and Miquelon", timeZone: "America/Miquelon" },
  PR: { name: "Puerto Rico", timeZone: "America/Puerto_Rico" },
  PS: { name: "Palestine", timeZone: "Asia/Gaza" },
  PT: { name: "Portugal", timeZone: "Europe/Lisbon" },
  PW: { name: "Palau", timeZone: "Pacific/Palau" },
  PY: { name: "Paraguay", timeZone: "America/Asuncion" },
  QA: { name: "Qatar", timeZone: "Asia/Qatar" },
  RE: { name: "Réunion", timeZone: "Indian/Reunion" },
  RO: { name: "Romania", timeZone: "Europe/Bucharest" },
  RS: { name: "Serbia", timeZone: "Europe/Belgrade" },
  RU: { name: "Russia", timeZone: "Europe/Moscow" },
  RW: { name: "Rwanda", timeZone: "Africa/Kigali" },
  SA: { name: "Saudi Arabia", timeZone: "Asia/Riyadh" },
  SB: { name: "Solomon Islands", timeZone: "Pacific/Guadalcanal" },
  SC: { name: "Seychelles", timeZone: "Indian/Mahe" },
  SD: { name: "Sudan", timeZone: "Africa/Khartoum" },
  SE: { name: "Sweden", timeZone: "Europe/Stockholm" },
  SG: { name: "Singapore", timeZone: "Asia/Singapore" },
  SH: { name: "Saint Helena", timeZone: "Atlantic/St_Helena" },
  SI: { name: "Slovenia", timeZone: "Europe/Ljubljana" },
  SJ: { name: "Svalbard and Jan Mayen", timeZone: "Arctic/Longyearbyen" },
  SK: { name: "Slovakia", timeZone: "Europe/Bratislava" },
  SL: { name: "Sierra Leone", timeZone: "Africa/Freetown" },
  SM: { name: "San Marino", timeZone: "Europe/San_Marino" },
  SN: { name: "Senegal", timeZone: "Africa/Dakar" },
  SO: { name: "Somalia", timeZone: "Africa/Mogadishu" },
  SR: { name: "Suriname", timeZone: "America/Paramaribo" },
  SS: { name: "South Sudan", timeZone: "Africa/Juba" },
  ST: { name: "São Tomé and Príncipe", timeZone: "Africa/Sao_Tome" },
  SV: { name: "El Salvador", timeZone: "America/El_Salvador" },
  SX: { name: "Sint Maarten", timeZone: "America/Lower_Princes" },
  SY: { name: "Syria", timeZone: "Asia/Damascus" },
  SZ: { name: "Eswatini", timeZone: "Africa/Mbabane" },
  TC: { name: "Turks and Caicos Islands", timeZone: "America/Grand_Turk" },
  TD: { name: "Chad", timeZone: "Africa/Ndjamena" },
  TG: { name: "Togo", timeZone: "Africa/Lome" },
  TH: { name: "Thailand", timeZone: "Asia/Bangkok" },
  TJ: { name: "Tajikistan", timeZone: "Asia/Dushanbe" },
  TK: { name: "Tokelau", timeZone: "Pacific/Fakaofo" },
  TL: { name: "Timor-Leste", timeZone: "Asia/Dili" },
  TM: { name: "Turkmenistan", timeZone: "Asia/Ashgabat" },
  TN: { name: "Tunisia", timeZone: "Africa/Tunis" },
  TO: { name: "Tonga", timeZone: "Pacific/Tongatapu" },
  TR: { name: "Türkiye", timeZone: "Europe/Istanbul" },
  TT: { name: "Trinidad and Tobago", timeZone: "America/Port_of_Spain" },
  TV: { name: "Tuvalu", timeZone: "Pacific/Funafuti" },
  TW: { name: "Taiwan", timeZone: "Asia/Taipei" },
  TZ: { name: "Tanzania", timeZone: "Africa/Dar_es_Salaam" },
  UA: { name: "Ukraine", timeZone: "Europe/Kyiv" },
  UG: { name: "Uganda", timeZone: "Africa/Kampala" },
  US: { name: "United States", timeZone: "America/New_York" },
  UY: { name: "Uruguay", timeZone: "America/Montevideo" },
  UZ: { name: "Uzbekistan", timeZone: "Asia/Tashkent" },
  VA: { name: "Vatican City", timeZone: "Europe/Vatican" },
  VC: {
    name: "Saint Vincent and the Grenadines",
    timeZone: "America/St_Vincent",
  },
  VE: { name: "Venezuela", timeZone: "America/Caracas" },
  VG: { name: "British Virgin Islands", timeZone: "America/Tortola" },
  VI: { name: "U.S. Virgin Islands", timeZone: "America/St_Thomas" },
  VN: { name: "Vietnam", timeZone: "Asia/Ho_Chi_Minh" },
  VU: { name: "Vanuatu", timeZone: "Pacific/Efate" },
  WF: { name: "Wallis and Futuna", timeZone: "Pacific/Wallis" },
  WS: { name: "Samoa", timeZone: "Pacific/Apia" },
  YE: { name: "Yemen", timeZone: "Asia/Aden" },
  YT: { name: "Mayotte", timeZone: "Indian/Mayotte" },
  ZA: { name: "South Africa", timeZone: "Africa/Johannesburg" },
  ZM: { name: "Zambia", timeZone: "Africa/Lusaka" },
  ZW: { name: "Zimbabwe", timeZone: "Africa/Harare" },
};

/** Countries that span several timezones — UI notes this next to local time. */
export const MULTI_TZ: Record<string, number> = {
  US: 6,
  RU: 11,
  CA: 6,
  AU: 5,
  BR: 4,
  MX: 4,
  ID: 3,
  KZ: 2,
  CD: 2,
  MN: 2,
  CN: 1, // one legal zone despite width — kept for the note's "official time"
};

/** Is this a real country in our table? */
export function isCountry(iso2: string): boolean {
  return Object.prototype.hasOwnProperty.call(COUNTRIES, iso2.toUpperCase());
}

export function countryName(iso2: string): string {
  return COUNTRIES[iso2.toUpperCase()]?.name ?? iso2;
}

/**
 * Flag emoji from an ISO2 code, built from Unicode regional-indicator symbols
 * (🇦=U+1F1E6 …). No lookup table needed. Returns 🏳️ for unknown codes.
 */
export function isoToFlag(iso2: string): string {
  const cc = iso2.toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return "🏳️";
  const A = 0x1f1e6;
  return String.fromCodePoint(
    A + (cc.charCodeAt(0) - 65),
    A + (cc.charCodeAt(1) - 65),
  );
}

/**
 * Stable bucket color for a country — hash the ISO2 to a hue so every country
 * gets a distinct, consistent chip color (same visual language as providers).
 */
export function countryColor(iso2: string): string {
  let h = 0;
  for (const ch of iso2.toUpperCase()) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `hsl(${h}, 62%, 55%)`;
}

export interface LocalTimeInfo {
  /** e.g. "14:32" in the country's local zone. */
  time: string;
  /** e.g. "GMT+1". */
  offset: string;
  /** Local hour 0–23, for send-window logic. */
  hour: number;
  /** Short weekday, e.g. "Mon". */
  weekday: string;
}

/** Current local time in a country's primary timezone (Intl, no data). */
export function localTimeFor(
  iso2: string,
  now: Date = new Date(),
): LocalTimeInfo | null {
  const c = COUNTRIES[iso2.toUpperCase()];
  if (!c) return null;
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: c.timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      weekday: "short",
      timeZoneName: "shortOffset",
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
    let hour = parseInt(get("hour"), 10);
    if (hour === 24) hour = 0; // some engines emit 24 for midnight
    return {
      time: `${get("hour")}:${get("minute")}`,
      offset: get("timeZoneName") || "UTC",
      hour,
      weekday: get("weekday"),
    };
  } catch {
    return null;
  }
}

export type SendRating = "prime" | "good" | "ok" | "off";

export interface SendWindow {
  rating: SendRating;
  label: string;
}

/**
 * Judge whether *right now* is a good moment to email this country, from the
 * recipient's local hour + weekday. Tuned for B2B outreach (business hours,
 * mid-morning best). Weekends are downgraded.
 */
export function sendWindowFor(info: LocalTimeInfo | null): SendWindow {
  if (!info) return { rating: "off", label: "Unknown" };
  const weekend = info.weekday === "Sat" || info.weekday === "Sun";
  const h = info.hour;
  if (weekend) return { rating: "off", label: "Weekend" };
  if (h >= 9 && h < 11)
    return { rating: "prime", label: "Prime · mid-morning" };
  if (h >= 13 && h < 16) return { rating: "good", label: "Good · afternoon" };
  if (h >= 8 && h < 18) return { rating: "ok", label: "Business hours" };
  return { rating: "off", label: "Off-hours" };
}
