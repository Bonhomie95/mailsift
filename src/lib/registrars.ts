/**
 * Normalize raw RDAP registrar names into friendly, consistently-colored
 * buckets. RDAP returns strings like "NameCheap, Inc." or "GoDaddy.com, LLC";
 * we map the common ones to clean labels and fall back to the raw name.
 */

interface RegistrarRule {
  id: string;
  name: string;
  color: string;
  patterns: string[]; // lowercased substrings tested against the raw name
}

const REGISTRAR_RULES: RegistrarRule[] = [
  { id: "namecheap", name: "Namecheap", color: "#d4202a", patterns: ["namecheap"] },
  { id: "godaddy", name: "GoDaddy", color: "#1ba179", patterns: ["godaddy", "go daddy"] },
  { id: "cloudflare", name: "Cloudflare Registrar", color: "#f6821f", patterns: ["cloudflare"] },
  { id: "google-domains", name: "Google / Squarespace Domains", color: "#4285f4", patterns: ["google", "squarespace"] },
  { id: "tucows", name: "Tucows / OpenSRS", color: "#00a4e4", patterns: ["tucows", "opensrs", "ascio", "enom"] },
  { id: "porkbun", name: "Porkbun", color: "#ef6f6c", patterns: ["porkbun"] },
  { id: "gandi", name: "Gandi", color: "#111111", patterns: ["gandi"] },
  { id: "ionos", name: "IONOS / 1&1", color: "#003d8f", patterns: ["ionos", "1&1", "1and1"] },
  { id: "ovh", name: "OVH", color: "#123f6d", patterns: ["ovh"] },
  { id: "namecom", name: "Name.com", color: "#4c5fd7", patterns: ["name.com", "name com"] },
  { id: "hostinger", name: "Hostinger", color: "#673de6", patterns: ["hostinger"] },
  { id: "dynadot", name: "Dynadot", color: "#0a7cff", patterns: ["dynadot"] },
  { id: "networksolutions", name: "Network Solutions / Web.com", color: "#e21836", patterns: ["network solutions", "web.com", "register.com"] },
  { id: "bluehost", name: "Bluehost / Newfold", color: "#2072b8", patterns: ["bluehost", "hostgator", "newfold", "domain.com", "fastdomain"] },
  { id: "amazon", name: "Amazon Registrar", color: "#ff9900", patterns: ["amazon"] },
  { id: "markmonitor", name: "MarkMonitor", color: "#7a2fdb", patterns: ["markmonitor", "csc corporate"] },
  { id: "wix", name: "Wix", color: "#0c6ebd", patterns: ["wix"] },
  { id: "spaceship", name: "Spaceship", color: "#00c2b2", patterns: ["spaceship"] },

  // ---------- Asia ----------
  { id: "alibaba", name: "Alibaba Cloud / HiChina", color: "#ff6a00", patterns: ["alibaba", "hichina", "aliyun", "wanwang"] },
  { id: "gmo", name: "GMO Internet / Onamae", color: "#00a0e9", patterns: ["gmo internet", "onamae", "value-domain", "value domain", "paperlined", "gmo-internet"] },
  { id: "xinnet", name: "Xin Net", color: "#c8102e", patterns: ["xin net", "xinnet"] },
  { id: "west", name: "West.cn / West263", color: "#1e73be", patterns: ["west263", "west.cn", "chengdu west", "zhengzhou"] },
  { id: "ename", name: "eName", color: "#0a68b1", patterns: ["ename"] },
  { id: "22net", name: "22net", color: "#009688", patterns: ["22net"] },
  { id: "pdr", name: "PDR / PublicDomainRegistry", color: "#f26722", patterns: ["publicdomainregistry", "pdr ltd", "pdr, ", "endurance"] },
  { id: "bigrock", name: "BigRock", color: "#ee2e24", patterns: ["bigrock"] },

  // ---------- Europe ----------
  { id: "strato", name: "Strato", color: "#009ee3", patterns: ["strato"] },
  { id: "united-domains", name: "united-domains", color: "#e2001a", patterns: ["united-domains", "united domains"] },
  { id: "key-systems", name: "Key-Systems / RRPproxy", color: "#7a2fdb", patterns: ["key-systems", "rrpproxy"] },
  { id: "internetx", name: "InterNetX", color: "#003d8f", patterns: ["internetx"] },
  { id: "aruba", name: "Aruba", color: "#f28c00", patterns: ["aruba"] },
  { id: "register-it", name: "Register.it / Dada", color: "#e30613", patterns: ["register.it", "dada"] },
  { id: "netim", name: "Netim", color: "#00539b", patterns: ["netim"] },
  { id: "eurodns", name: "EuroDNS", color: "#e2001a", patterns: ["eurodns"] },
  { id: "openprovider", name: "Openprovider", color: "#2e77bb", patterns: ["openprovider", "hosting concepts"] },
  { id: "transip", name: "TransIP", color: "#941651", patterns: ["transip"] },
  { id: "realtime-register", name: "Realtime Register", color: "#0a7d33", patterns: ["realtime register"] },
  { id: "gransy", name: "Gransy / Subreg", color: "#0aa1dd", patterns: ["gransy", "subreg"] },
  { id: "active24", name: "Active24", color: "#e30613", patterns: ["active24"] },
  { id: "123reg", name: "123-reg", color: "#5b2d8e", patterns: ["123-reg", "123 reg", "mesh digital"] },
  { id: "fasthosts", name: "Fasthosts", color: "#005eb8", patterns: ["fasthosts"] },
  { id: "namesco", name: "Names.co.uk / Namesco", color: "#e30613", patterns: ["namesco", "names.co.uk"] },

  // ---------- Americas ----------
  { id: "namesilo", name: "NameSilo", color: "#1f8f4e", patterns: ["namesilo"] },
  { id: "register-com", name: "Register.com", color: "#e21836", patterns: ["register.com"] },
  { id: "squarespace", name: "Squarespace Domains", color: "#111111", patterns: ["squarespace"] },
  { id: "enom", name: "eNom / OpenSRS / Hover", color: "#00a4e4", patterns: ["enom", "hover", "opensrs"] },
  { id: "dreamhost", name: "DreamHost", color: "#0086e5", patterns: ["dreamhost", "new dream network"] },
  { id: "automattic", name: "Automattic / WordPress.com", color: "#0087be", patterns: ["automattic", "wordpress", "knock knock whois"] },
  { id: "shopify", name: "Shopify", color: "#5e8e3e", patterns: ["shopify"] },
  { id: "epik", name: "Epik", color: "#f7941e", patterns: ["epik"] },
  { id: "sav", name: "Sav", color: "#111827", patterns: ["sav.com", "sav, llc", "sav llc"] },
  { id: "101domain", name: "101domain", color: "#e21836", patterns: ["101domain"] },
  { id: "namebright", name: "NameBright", color: "#2d7d46", patterns: ["namebright"] },
  { id: "com-laude", name: "Com Laude", color: "#7a2fdb", patterns: ["com laude", "nom-iq"] },
  { id: "registrobr", name: "Registro.br", color: "#00954c", patterns: ["registro.br", "nic.br", "br-nic", "núcleo", "nucleo de inf"] },
  { id: "locaweb", name: "Locaweb", color: "#1f9e57", patterns: ["locaweb"] },
  { id: "uolhost", name: "UOL Host", color: "#ff6900", patterns: ["uol "] },
  { id: "rebel", name: "Rebel / Momentous", color: "#e4002b", patterns: ["rebel.com", "momentous"] },

  // ---------- Australia ----------
  { id: "crazydomains", name: "Crazy Domains / Dreamscape", color: "#ff5100", patterns: ["crazy domains", "dreamscape"] },
  { id: "ventraip", name: "VentraIP / Synergy Wholesale", color: "#00b5e2", patterns: ["ventraip", "synergy wholesale"] },
  { id: "netregistry", name: "Netregistry", color: "#e4002b", patterns: ["netregistry", "arq group"] },

  // ---------- Batch 2 ----------
  { id: "wildwest", name: "Wild West Domains", color: "#1bdbdb", patterns: ["wild west"] },
  { id: "domaincom", name: "Domain.com", color: "#2e77bb", patterns: ["domain.com"] },
  { id: "web-com", name: "Web.com", color: "#e21836", patterns: ["web.com"] },
  { id: "lws", name: "LWS", color: "#e2001a", patterns: ["ligne web", "lws "] },
  { id: "combell", name: "Combell", color: "#ff6600", patterns: ["combell"] },
  { id: "onecom-reg", name: "One.com", color: "#0084ff", patterns: ["one.com", "group.one"] },
  { id: "infomaniak-reg", name: "Infomaniak", color: "#0098ff", patterns: ["infomaniak"] },
  { id: "netcup", name: "Netcup", color: "#0a7d33", patterns: ["netcup"] },
  { id: "hostpoint", name: "Hostpoint", color: "#e30613", patterns: ["hostpoint"] },
  { id: "metaregistrar", name: "Metaregistrar", color: "#2b6cb0", patterns: ["metaregistrar"] },
  { id: "cronon", name: "Cronon / STRATO", color: "#009ee3", patterns: ["cronon"] },
  { id: "onlinenic", name: "OnlineNIC", color: "#c8102e", patterns: ["onlinenic"] },
  { id: "todaynic", name: "Todaynic / Now.cn", color: "#1e73be", patterns: ["todaynic", "now.cn"] },
  { id: "paknic", name: "PakNIC", color: "#046a38", patterns: ["paknic"] },

  // ---------- Batch 3 ----------
  { id: "home-pl", name: "home.pl", color: "#e2001a", patterns: ["home.pl", "home_pl"] },
  { id: "nazwa-pl", name: "nazwa.pl", color: "#0a68b1", patterns: ["nazwa.pl", "nazwa "] },
  { id: "blacknight", name: "Blacknight", color: "#111111", patterns: ["blacknight"] },
  { id: "dondominio", name: "DonDominio", color: "#ff6600", patterns: ["dondominio", "soluciones corporativas ip"] },
  { id: "dinahosting", name: "Dinahosting", color: "#8dc63f", patterns: ["dinahosting"] },
  { id: "sakura-reg", name: "Sakura Internet", color: "#f39800", patterns: ["sakura internet", "sakura.ad.jp"] },
  { id: "freenom", name: "Freenom", color: "#2e77bb", patterns: ["freenom", "opentld"] },
  { id: "mono-ir", name: "MonoVM / IranNIC", color: "#239f40", patterns: ["monovm", "nic.ir", "irannic"] },

  // ---------- Batch 4 ----------
  { id: "reg-ru", name: "REG.RU", color: "#ff5c00", patterns: ["reg.ru", "reg.com "] },
  { id: "ru-center", name: "RU-CENTER / R01", color: "#e30613", patterns: ["ru-center", "regional network information", "r01", "nic.ru"] },
  { id: "beget", name: "Beget", color: "#1a9c2f", patterns: ["beget"] },
  { id: "loopia", name: "Loopia", color: "#e4002b", patterns: ["loopia"] },
  { id: "internetbs", name: "Internet.bs", color: "#0a68b1", patterns: ["internet.bs", "internetbs"] },
  { id: "marcaria", name: "Marcaria", color: "#2e77bb", patterns: ["marcaria"] },
  { id: "ukrnames", name: "Ukrnames / Imena", color: "#0057b7", patterns: ["ukrnames", "imena.ua", "hostmaster ltd"] },
  { id: "webglobe", name: "Webglobe", color: "#f7a800", patterns: ["webglobe", "gigold"] },
  { id: "gname", name: "Gname", color: "#2e77bb", patterns: ["gname"] },
  { id: "xincache", name: "Xincache / Chinese SMB", color: "#c0392b", patterns: ["xincache", "net-chinese", "35.com", "cn4e"] },
  { id: "pavietnam", name: "PA Vietnam", color: "#005baa", patterns: ["pavietnam", "pa vietnam"] },
  { id: "inet-vn", name: "iNET Vietnam", color: "#f37021", patterns: ["inet.vn", "inet corp"] },
  { id: "whogohost", name: "WhoGoHost", color: "#00a651", patterns: ["whogohost"] },
  { id: "web4africa", name: "Web4Africa", color: "#ff6600", patterns: ["web4africa"] },
  { id: "pdrl-truehost", name: "Truehost / Sasahost", color: "#1eb53a", patterns: ["truehost", "sasahost"] },
  { id: "onlydomains", name: "OnlyDomains / Freeparking", color: "#2e77bb", patterns: ["onlydomains", "freeparking"] },
];

const PALETTE = ["#6d5efc", "#e2231a", "#0a7cff", "#e79f2c", "#12a150", "#c026d3", "#0891b2", "#db2777"];

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export interface RegistrarBucket {
  id: string;
  name: string;
  color: string;
}

export function normalizeRegistrar(raw: string | null): RegistrarBucket {
  if (!raw || !raw.trim()) {
    return { id: "__unknown_registrar__", name: "Unknown Registrar", color: "#4b4b63" };
  }
  const low = raw.toLowerCase();
  for (const rule of REGISTRAR_RULES) {
    if (rule.patterns.some((p) => low.includes(p))) {
      return { id: rule.id, name: rule.name, color: rule.color };
    }
  }
  // Unrecognized: keep the raw name as its own bucket with a stable color.
  const clean = raw.replace(/,?\s*(inc\.?|llc|ltd\.?|gmbh|s\.a\.?|co\.?|corp\.?)$/i, "").trim() || raw;
  const id = "reg:" + clean.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return { id, name: clean, color: hashColor(id) };
}
