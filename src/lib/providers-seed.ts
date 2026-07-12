import type { ProviderRule } from "./types";

/**
 * Provider ids that used to be seeded but were since split or renamed. The
 * admin "Sync" prunes these from the database so stale merged rules don't shadow
 * their replacements. Append the OLD id here whenever you split/rename a seed.
 */
export const RETIRED_PROVIDER_IDS = ["tencent", "netease", "kakao", "hinet"];

/**
 * Built-in provider rules. These ship with the app so it works with zero
 * configuration. When Supabase is configured, admin-added providers are merged
 * on top of these (admin rows win on id collision).
 *
 * Matching is substring-based and case-insensitive. Order does not matter;
 * `priority` breaks ties when multiple providers match the same domain.
 */
export const SEED_PROVIDERS: ProviderRule[] = [
  {
    id: "google-workspace",
    name: "Google Workspace",
    category: "Google",
    matchOn: "mx",
    mxPatterns: ["aspmx.l.google.com", "googlemail.com", "google.com", "gmail-smtp"],
    nsPatterns: [],
    priority: 10,
    color: "#ea4335",
    icon: "🟥",
  },
  {
    id: "microsoft-365",
    name: "Microsoft 365",
    category: "Microsoft",
    matchOn: "mx",
    mxPatterns: ["mail.protection.outlook.com", "outlook.com", "office365.us"],
    nsPatterns: [],
    priority: 10,
    color: "#0078d4",
    icon: "🟦",
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    category: "Zoho",
    matchOn: "mx",
    mxPatterns: ["zoho.com", "zoho.eu", "zohomail", "zmvertical"],
    nsPatterns: [],
    priority: 10,
    color: "#e79f2c",
    icon: "🟧",
  },
  {
    id: "proton",
    name: "Proton Mail",
    category: "Proton",
    matchOn: "mx",
    mxPatterns: ["protonmail.ch", "proton.me", "protonmail"],
    nsPatterns: [],
    priority: 10,
    color: "#6d4aff",
    icon: "🟪",
  },
  {
    id: "namecheap-privateemail",
    name: "Namecheap Private Email",
    category: "Namecheap",
    matchOn: "both",
    mxPatterns: ["privateemail.com"],
    nsPatterns: ["registrar-servers.com"],
    priority: 8,
    color: "#d4202a",
    icon: "🔴",
  },
  {
    id: "godaddy",
    name: "GoDaddy",
    category: "GoDaddy",
    matchOn: "both",
    mxPatterns: ["secureserver.net"],
    nsPatterns: ["domaincontrol.com"],
    priority: 8,
    color: "#1bdbdb",
    icon: "🟩",
  },
  {
    id: "yandex",
    name: "Yandex Mail",
    category: "Yandex",
    matchOn: "mx",
    mxPatterns: ["yandex.net", "yandex.ru", "mx.yandex"],
    nsPatterns: [],
    priority: 10,
    color: "#fc3f1d",
    icon: "🟥",
  },
  {
    id: "icloud",
    name: "iCloud / Apple",
    category: "Apple",
    matchOn: "mx",
    mxPatterns: ["icloud.com", "mail.me.com", "apple.com"],
    nsPatterns: [],
    priority: 10,
    color: "#555555",
    icon: "⬜",
  },
  {
    id: "fastmail",
    name: "Fastmail",
    category: "Fastmail",
    matchOn: "mx",
    mxPatterns: ["messagingengine.com", "fastmail.com"],
    nsPatterns: [],
    priority: 10,
    color: "#0067b9",
    icon: "🟦",
  },
  {
    id: "amazon-workmail",
    name: "Amazon WorkMail / SES",
    category: "Amazon",
    matchOn: "mx",
    mxPatterns: ["awsapps.com", "amazonaws.com", "amazonses.com"],
    nsPatterns: [],
    priority: 9,
    color: "#ff9900",
    icon: "🟧",
  },
  {
    id: "rackspace",
    name: "Rackspace Email",
    category: "Rackspace",
    matchOn: "mx",
    mxPatterns: ["emailsrvr.com"],
    nsPatterns: [],
    priority: 9,
    color: "#e2231a",
    icon: "🔴",
  },
  {
    id: "cloudflare-email",
    name: "Cloudflare Email Routing",
    category: "Cloudflare",
    matchOn: "both",
    mxPatterns: ["mx.cloudflare.net"],
    nsPatterns: ["ns.cloudflare.com"],
    priority: 7,
    color: "#f6821f",
    icon: "🟧",
  },
  {
    id: "mimecast",
    name: "Mimecast",
    category: "Security Gateway",
    matchOn: "mx",
    mxPatterns: ["mimecast.com", "mimecast.co.za"],
    nsPatterns: [],
    priority: 6,
    color: "#7a2fdb",
    icon: "🟪",
  },
  {
    id: "titan",
    name: "Titan Email",
    category: "Titan",
    matchOn: "mx",
    mxPatterns: ["titan.email", "mx1.titan.email", "mx2.titan.email"],
    nsPatterns: [],
    priority: 9,
    color: "#1f6feb",
    icon: "🟦",
  },

  // ===================== Security gateways (global) =====================
  { id: "proofpoint", name: "Proofpoint", category: "Security Gateway", matchOn: "mx", mxPatterns: ["pphosted.com", "ppe-hosted.com"], nsPatterns: [], priority: 6, color: "#0aa1dd", icon: "🛡️" },
  { id: "barracuda", name: "Barracuda", category: "Security Gateway", matchOn: "mx", mxPatterns: ["barracudanetworks.com", "cudaops.com", "barracuda.com"], nsPatterns: [], priority: 6, color: "#0088ce", icon: "🛡️" },
  { id: "cisco-ironport", name: "Cisco Secure Email", category: "Security Gateway", matchOn: "mx", mxPatterns: ["iphmx.com"], nsPatterns: [], priority: 6, color: "#1ba0d7", icon: "🛡️" },
  { id: "sophos", name: "Sophos Email", category: "Security Gateway", matchOn: "mx", mxPatterns: ["sophos.com"], nsPatterns: [], priority: 5, color: "#12365a", icon: "🛡️" },
  { id: "trendmicro", name: "Trend Micro", category: "Security Gateway", matchOn: "mx", mxPatterns: ["trendmicro.com"], nsPatterns: [], priority: 5, color: "#d71920", icon: "🛡️" },
  { id: "forcepoint", name: "Forcepoint", category: "Security Gateway", matchOn: "mx", mxPatterns: ["mailcontrol.com"], nsPatterns: [], priority: 5, color: "#00857d", icon: "🛡️" },

  // ===================== Europe =====================
  { id: "gmx", name: "GMX", category: "United Internet (DE)", matchOn: "mx", mxPatterns: ["gmx.net"], nsPatterns: [], priority: 7, color: "#1c449b", icon: "🇩🇪" },
  { id: "webde", name: "Web.de", category: "United Internet (DE)", matchOn: "mx", mxPatterns: ["web.de"], nsPatterns: [], priority: 7, color: "#ffd800", icon: "🇩🇪" },
  { id: "ionos", name: "IONOS / 1&1", category: "IONOS (DE)", matchOn: "both", mxPatterns: ["kundenserver.de"], nsPatterns: ["ui-dns."], priority: 7, color: "#003d8f", icon: "🇩🇪" },
  { id: "telekom", name: "T-Online / Telekom", category: "Telekom (DE)", matchOn: "mx", mxPatterns: ["t-online.de"], nsPatterns: [], priority: 7, color: "#e20074", icon: "🇩🇪" },
  { id: "strato", name: "Strato", category: "Strato (DE)", matchOn: "mx", mxPatterns: ["rzone.de", "strato.de"], nsPatterns: [], priority: 6, color: "#009ee3", icon: "🇩🇪" },
  { id: "mailbox-org", name: "Mailbox.org", category: "Mailbox.org (DE)", matchOn: "mx", mxPatterns: ["mailbox.org"], nsPatterns: [], priority: 8, color: "#0a7d33", icon: "🇩🇪" },
  { id: "posteo", name: "Posteo", category: "Posteo (DE)", matchOn: "mx", mxPatterns: ["posteo.de"], nsPatterns: [], priority: 8, color: "#1a9c2f", icon: "🇩🇪" },
  { id: "tutanota", name: "Tuta (Tutanota)", category: "Tuta (DE)", matchOn: "mx", mxPatterns: ["tutanota.de", "tuta.com", "tutao.de"], nsPatterns: [], priority: 8, color: "#840010", icon: "🇩🇪" },
  { id: "hetzner", name: "Hetzner", category: "Hetzner (DE)", matchOn: "mx", mxPatterns: ["your-server.de", "hetzner.com"], nsPatterns: [], priority: 6, color: "#d50c2d", icon: "🇩🇪" },
  { id: "ovh", name: "OVHcloud", category: "OVH (FR)", matchOn: "both", mxPatterns: ["mail.ovh.net", "mx.ovh."], nsPatterns: ["ovh.net"], priority: 7, color: "#123f6d", icon: "🇫🇷" },
  { id: "orange", name: "Orange / Wanadoo", category: "Orange (FR)", matchOn: "mx", mxPatterns: ["orange.fr", "wanadoo.fr"], nsPatterns: [], priority: 7, color: "#ff7900", icon: "🇫🇷" },
  { id: "free-fr", name: "Free.fr", category: "Free (FR)", matchOn: "mx", mxPatterns: ["free.fr"], nsPatterns: [], priority: 7, color: "#c00000", icon: "🇫🇷" },
  { id: "gandi-mail", name: "Gandi Mail", category: "Gandi (FR)", matchOn: "mx", mxPatterns: ["gandi.net"], nsPatterns: [], priority: 6, color: "#1a1a1a", icon: "🇫🇷" },
  { id: "infomaniak", name: "Infomaniak", category: "Infomaniak (CH)", matchOn: "mx", mxPatterns: ["infomaniak.ch", "infomaniak.com"], nsPatterns: [], priority: 7, color: "#0098ff", icon: "🇨🇭" },
  { id: "bluewin", name: "Bluewin / Swisscom", category: "Swisscom (CH)", matchOn: "mx", mxPatterns: ["bluewin.ch"], nsPatterns: [], priority: 7, color: "#003da5", icon: "🇨🇭" },
  { id: "aruba-it", name: "Aruba", category: "Aruba (IT)", matchOn: "mx", mxPatterns: ["aruba.it", "arubabusiness.it"], nsPatterns: [], priority: 7, color: "#f28c00", icon: "🇮🇹" },
  { id: "libero", name: "Libero / Italiaonline", category: "Italiaonline (IT)", matchOn: "mx", mxPatterns: ["libero.it", "iol.it"], nsPatterns: [], priority: 7, color: "#e2001a", icon: "🇮🇹" },
  { id: "virgilio", name: "Virgilio", category: "Italiaonline (IT)", matchOn: "mx", mxPatterns: ["virgilio.it"], nsPatterns: [], priority: 6, color: "#0072bc", icon: "🇮🇹" },
  { id: "register-it", name: "Register.it", category: "Register.it (IT)", matchOn: "mx", mxPatterns: ["register.it"], nsPatterns: [], priority: 6, color: "#e30613", icon: "🇮🇹" },
  { id: "seznam", name: "Seznam", category: "Seznam (CZ)", matchOn: "mx", mxPatterns: ["seznam.cz"], nsPatterns: [], priority: 7, color: "#cc0000", icon: "🇨🇿" },
  { id: "wp-pl", name: "WP.pl", category: "Wirtualna Polska (PL)", matchOn: "mx", mxPatterns: ["wp.pl"], nsPatterns: [], priority: 7, color: "#e10600", icon: "🇵🇱" },
  { id: "onet", name: "Onet Poczta", category: "Onet (PL)", matchOn: "mx", mxPatterns: ["onet.pl"], nsPatterns: [], priority: 6, color: "#f68b1f", icon: "🇵🇱" },
  { id: "one-com", name: "One.com", category: "One.com (DK)", matchOn: "mx", mxPatterns: ["one.com"], nsPatterns: [], priority: 6, color: "#0084ff", icon: "🇩🇰" },
  { id: "mailru", name: "Mail.ru", category: "Mail.ru (RU)", matchOn: "mx", mxPatterns: ["mail.ru"], nsPatterns: [], priority: 7, color: "#005ff9", icon: "🇷🇺" },
  { id: "rambler", name: "Rambler", category: "Rambler (RU)", matchOn: "mx", mxPatterns: ["rambler.ru"], nsPatterns: [], priority: 6, color: "#ff6600", icon: "🇷🇺" },

  // ===================== Asia =====================
  { id: "qq", name: "Tencent QQ Mail", category: "Tencent (CN)", matchOn: "mx", mxPatterns: ["mx1.qq.com", "mx2.qq.com", "mx3.qq.com", "qq.com"], nsPatterns: [], domainPatterns: ["qq.com"], priority: 7, color: "#12b7f5", icon: "🇨🇳" },
  { id: "tencent-exmail", name: "Tencent Exmail (Enterprise)", category: "Tencent (CN)", matchOn: "mx", mxPatterns: ["mxbiz"], nsPatterns: [], priority: 9, color: "#0e8fd0", icon: "🇨🇳" },
  { id: "foxmail", name: "Foxmail", category: "Tencent (CN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["foxmail.com"], priority: 8, color: "#2a7fce", icon: "🇨🇳" },
  { id: "netease-163", name: "NetEase 163 Mail", category: "NetEase (CN)", matchOn: "mx", mxPatterns: ["163mx", "ym.163.com"], nsPatterns: [], priority: 8, color: "#d32f2f", icon: "🇨🇳" },
  { id: "netease-126", name: "NetEase 126 Mail", category: "NetEase (CN)", matchOn: "mx", mxPatterns: ["126mx"], nsPatterns: [], priority: 8, color: "#e53935", icon: "🇨🇳" },
  { id: "netease-yeah", name: "NetEase Yeah.net", category: "NetEase (CN)", matchOn: "mx", mxPatterns: ["yeahmx", "yeah.net"], nsPatterns: [], priority: 8, color: "#ef5350", icon: "🇨🇳" },
  { id: "i263", name: "263 Enterprise Mail", category: "263 (CN)", matchOn: "mx", mxPatterns: ["263.net", "263xmail", "mail.263"], nsPatterns: [], priority: 7, color: "#0a68b1", icon: "🇨🇳" },
  { id: "aliyun", name: "Alibaba Mail (Aliyun)", category: "Alibaba (CN)", matchOn: "mx", mxPatterns: ["mxhichina.com", "qiye.aliyun.com", "alibaba-inc.com"], nsPatterns: [], priority: 8, color: "#ff6a00", icon: "🇨🇳" },
  { id: "sina", name: "Sina Mail", category: "Sina (CN)", matchOn: "mx", mxPatterns: ["sina.com", "sina.cn"], nsPatterns: [], priority: 7, color: "#e60012", icon: "🇨🇳" },
  { id: "coremail", name: "Coremail", category: "Coremail (CN)", matchOn: "mx", mxPatterns: ["coremail"], nsPatterns: [], priority: 6, color: "#1e73be", icon: "🇨🇳" },
  { id: "21cn", name: "21CN", category: "21CN (CN)", matchOn: "mx", mxPatterns: ["21cn.com"], nsPatterns: [], priority: 6, color: "#0a68b1", icon: "🇨🇳" },
  { id: "naver", name: "Naver Mail", category: "Naver (KR)", matchOn: "mx", mxPatterns: ["naver.com"], nsPatterns: [], priority: 8, color: "#03c75a", icon: "🇰🇷" },
  { id: "worksmobile", name: "Naver Works", category: "Naver (KR)", matchOn: "mx", mxPatterns: ["worksmobile.com"], nsPatterns: [], priority: 8, color: "#00c73c", icon: "🇰🇷" },
  { id: "kakao", name: "Kakao Mail", category: "Kakao (KR)", matchOn: "mx", mxPatterns: ["kakao.com"], nsPatterns: [], priority: 7, color: "#ffcd00", icon: "🇰🇷" },
  { id: "daum", name: "Daum Mail", category: "Daum (KR)", matchOn: "mx", mxPatterns: ["daum.net", "hanmail.net"], nsPatterns: [], priority: 7, color: "#f9a01b", icon: "🇰🇷" },
  { id: "nate", name: "Nate", category: "Nate (KR)", matchOn: "mx", mxPatterns: ["nate.com"], nsPatterns: [], priority: 6, color: "#e4002b", icon: "🇰🇷" },
  { id: "rediff", name: "Rediffmail", category: "Rediff (IN)", matchOn: "mx", mxPatterns: ["rediffmail.com", "rediff.com"], nsPatterns: [], priority: 7, color: "#d1006c", icon: "🇮🇳" },
  { id: "sify", name: "Sify", category: "Sify (IN)", matchOn: "mx", mxPatterns: ["sify.com"], nsPatterns: [], priority: 5, color: "#e2231a", icon: "🇮🇳" },
  { id: "ntt-ocn", name: "OCN (NTT)", category: "NTT (JP)", matchOn: "mx", mxPatterns: ["ocn.ne.jp"], nsPatterns: [], priority: 7, color: "#0068b7", icon: "🇯🇵" },
  { id: "nifty", name: "@nifty", category: "Nifty (JP)", matchOn: "mx", mxPatterns: ["nifty.com", "nifty.ne.jp"], nsPatterns: [], priority: 6, color: "#e60027", icon: "🇯🇵" },
  { id: "biglobe", name: "Biglobe", category: "Biglobe (JP)", matchOn: "mx", mxPatterns: ["biglobe.ne.jp"], nsPatterns: [], priority: 6, color: "#e50012", icon: "🇯🇵" },
  { id: "sonet-jp", name: "So-net", category: "So-net (JP)", matchOn: "mx", mxPatterns: ["so-net.ne.jp"], nsPatterns: [], priority: 6, color: "#e60012", icon: "🇯🇵" },
  { id: "sakura", name: "Sakura Internet", category: "Sakura (JP)", matchOn: "mx", mxPatterns: ["sakura.ne.jp"], nsPatterns: [], priority: 6, color: "#f39800", icon: "🇯🇵" },
  { id: "gmo-jp", name: "GMO / Lolipop", category: "GMO (JP)", matchOn: "mx", mxPatterns: ["lolipop.jp", "gmoserver.jp", "gmo.jp"], nsPatterns: [], priority: 6, color: "#00a0e9", icon: "🇯🇵" },
  { id: "xserver", name: "Xserver", category: "Xserver (JP)", matchOn: "mx", mxPatterns: ["xserver.jp"], nsPatterns: [], priority: 6, color: "#1b6fb3", icon: "🇯🇵" },
  { id: "yahoo-jp", name: "Yahoo! Japan", category: "Yahoo Japan (JP)", matchOn: "mx", mxPatterns: ["yahoo.co.jp"], nsPatterns: [], priority: 7, color: "#ff0033", icon: "🇯🇵" },
  { id: "hinet", name: "HiNet", category: "Chunghwa (TW)", matchOn: "mx", mxPatterns: ["hinet.net"], nsPatterns: [], priority: 6, color: "#005bac", icon: "🇹🇼" },
  { id: "hibox", name: "Hibox", category: "Chunghwa (TW)", matchOn: "mx", mxPatterns: ["hibox"], nsPatterns: [], priority: 8, color: "#0091d5", icon: "🇹🇼" },

  // ===================== Americas =====================
  { id: "yahoo-aol", name: "Yahoo / AOL", category: "Yahoo (US)", matchOn: "mx", mxPatterns: ["yahoodns.net"], nsPatterns: [], priority: 8, color: "#6001d2", icon: "🇺🇸" },
  { id: "comcast", name: "Comcast / Xfinity", category: "Comcast (US)", matchOn: "mx", mxPatterns: ["comcast.net"], nsPatterns: [], priority: 7, color: "#f01717", icon: "🇺🇸" },
  { id: "att", name: "AT&T", category: "AT&T (US)", matchOn: "mx", mxPatterns: ["att.net", "sbcglobal.net", "prodigy.net"], nsPatterns: [], priority: 6, color: "#00a8e0", icon: "🇺🇸" },
  { id: "cox", name: "Cox", category: "Cox (US)", matchOn: "mx", mxPatterns: ["cox.net"], nsPatterns: [], priority: 6, color: "#00259a", icon: "🇺🇸" },
  { id: "spectrum", name: "Spectrum / Charter", category: "Charter (US)", matchOn: "mx", mxPatterns: ["charter.net", "rr.com"], nsPatterns: [], priority: 6, color: "#003057", icon: "🇺🇸" },
  { id: "uol", name: "UOL", category: "UOL (BR)", matchOn: "mx", mxPatterns: ["uol.com.br"], nsPatterns: [], priority: 7, color: "#ff6900", icon: "🇧🇷" },
  { id: "terra", name: "Terra", category: "Terra (BR)", matchOn: "mx", mxPatterns: ["terra.com.br", "terra.com"], nsPatterns: [], priority: 7, color: "#00954c", icon: "🇧🇷" },
  { id: "locaweb", name: "Locaweb", category: "Locaweb (BR)", matchOn: "mx", mxPatterns: ["locaweb.com.br"], nsPatterns: [], priority: 6, color: "#1f9e57", icon: "🇧🇷" },
  { id: "bol", name: "BOL", category: "UOL (BR)", matchOn: "mx", mxPatterns: ["bol.com.br"], nsPatterns: [], priority: 6, color: "#ffcc00", icon: "🇧🇷" },
  { id: "kinghost", name: "KingHost", category: "KingHost (BR)", matchOn: "mx", mxPatterns: ["kinghost.net"], nsPatterns: [], priority: 6, color: "#f7941e", icon: "🇧🇷" },

  // ===================== Batch 2 (toward top-10k coverage) =====================
  // China
  { id: "sohu", name: "Sohu Mail", category: "Sohu (CN)", matchOn: "mx", mxPatterns: ["sohu.com"], nsPatterns: [], priority: 6, color: "#e60012", icon: "🇨🇳" },
  { id: "chinamobile-139", name: "China Mobile 139", category: "China Mobile (CN)", matchOn: "mx", mxPatterns: ["139.com"], nsPatterns: [], priority: 6, color: "#0a68b1", icon: "🇨🇳" },
  { id: "chinatelecom-189", name: "China Telecom 189", category: "China Telecom (CN)", matchOn: "mx", mxPatterns: ["189.cn"], nsPatterns: [], priority: 6, color: "#0060af", icon: "🇨🇳" },
  { id: "tom-cn", name: "TOM Mail", category: "TOM (CN)", matchOn: "mx", mxPatterns: ["tom.com"], nsPatterns: [], priority: 5, color: "#e2231a", icon: "🇨🇳" },
  // United States ISPs / webmail
  { id: "frontier", name: "Frontier", category: "Frontier (US)", matchOn: "mx", mxPatterns: ["frontier.com", "frontiernet.net"], nsPatterns: [], priority: 6, color: "#ee3124", icon: "🇺🇸" },
  { id: "centurylink", name: "CenturyLink / Lumen", category: "Lumen (US)", matchOn: "mx", mxPatterns: ["centurylink.net", "embarqmail.com", "q.com"], nsPatterns: [], priority: 6, color: "#0d7b3e", icon: "🇺🇸" },
  { id: "optimum", name: "Optimum / Optonline", category: "Altice (US)", matchOn: "mx", mxPatterns: ["optonline.net"], nsPatterns: [], priority: 6, color: "#ee3124", icon: "🇺🇸" },
  { id: "earthlink", name: "EarthLink", category: "EarthLink (US)", matchOn: "mx", mxPatterns: ["earthlink.net"], nsPatterns: [], priority: 5, color: "#00539b", icon: "🇺🇸" },
  { id: "mailcom", name: "Mail.com", category: "United Internet (US)", matchOn: "mx", mxPatterns: ["mail.com", "email.com"], nsPatterns: [], priority: 6, color: "#004b8d", icon: "✉️" },
  // Privacy / indie mail
  { id: "hey", name: "HEY (Basecamp)", category: "HEY", matchOn: "mx", mxPatterns: ["hey.com"], nsPatterns: [], priority: 7, color: "#5522fa", icon: "✉️" },
  { id: "migadu", name: "Migadu", category: "Migadu", matchOn: "mx", mxPatterns: ["migadu.com"], nsPatterns: [], priority: 7, color: "#2b6cb0", icon: "✉️" },
  { id: "mailfence", name: "Mailfence", category: "Mailfence (BE)", matchOn: "mx", mxPatterns: ["mailfence.com"], nsPatterns: [], priority: 7, color: "#1a8fc1", icon: "🇧🇪" },
  { id: "hushmail", name: "Hushmail", category: "Hushmail (CA)", matchOn: "mx", mxPatterns: ["hushmail.com", "hush.com"], nsPatterns: [], priority: 6, color: "#f7941e", icon: "🇨🇦" },
  { id: "runbox", name: "Runbox", category: "Runbox (NO)", matchOn: "mx", mxPatterns: ["runbox.com"], nsPatterns: [], priority: 6, color: "#1f6f8b", icon: "🇳🇴" },
  { id: "startmail", name: "StartMail", category: "StartMail (NL)", matchOn: "mx", mxPatterns: ["startmail.com"], nsPatterns: [], priority: 6, color: "#e4002b", icon: "🇳🇱" },
  // Türkiye / other
  { id: "mynet", name: "Mynet", category: "Mynet (TR)", matchOn: "mx", mxPatterns: ["mynet.com"], nsPatterns: [], priority: 5, color: "#e30613", icon: "🇹🇷" },

  // ===================== Batch 3: regional consumer / ISP webmail =====================
  // Matched by the domain name itself (domainPatterns) — these are standalone
  // consumer/ISP mail brands. Sourced from public webmail-provider directories.
  // --- North America ---
  { id: "aol", name: "AOL Mail", category: "AOL (US)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["aol.com"], priority: 8, color: "#3399ff", icon: "🇺🇸" },
  { id: "verizon", name: "Verizon", category: "Verizon (US)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["verizon.net"], priority: 8, color: "#cd040b", icon: "🇺🇸" },
  { id: "bellsouth", name: "BellSouth", category: "AT&T (US)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["bellsouth.net"], priority: 8, color: "#00a8e0", icon: "🇺🇸" },
  { id: "juno", name: "Juno", category: "Juno (US)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["juno.com"], priority: 8, color: "#0a3d91", icon: "🇺🇸" },
  { id: "netzero", name: "NetZero", category: "NetZero (US)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["netzero.net"], priority: 8, color: "#009639", icon: "🇺🇸" },
  { id: "sympatico", name: "Sympatico (Bell)", category: "Bell (CA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sympatico.ca"], priority: 8, color: "#0072ce", icon: "🇨🇦" },
  { id: "rogers", name: "Rogers", category: "Rogers (CA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["rogers.com"], priority: 8, color: "#da291c", icon: "🇨🇦" },
  { id: "shaw", name: "Shaw", category: "Shaw (CA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["shaw.ca"], priority: 8, color: "#0055b8", icon: "🇨🇦" },
  { id: "videotron", name: "Vidéotron", category: "Vidéotron (CA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["videotron.ca"], priority: 8, color: "#f5a623", icon: "🇨🇦" },
  // --- United Kingdom ---
  { id: "btinternet", name: "BT Internet", category: "BT (UK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["btinternet.com", "btopenworld.com"], priority: 8, color: "#5514b4", icon: "🇬🇧" },
  { id: "sky-uk", name: "Sky", category: "Sky (UK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sky.com"], priority: 8, color: "#0072c9", icon: "🇬🇧" },
  { id: "virginmedia", name: "Virgin Media", category: "Virgin (UK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["virginmedia.com", "ntlworld.com", "blueyonder.co.uk"], priority: 8, color: "#e10a0a", icon: "🇬🇧" },
  { id: "talktalk", name: "TalkTalk", category: "TalkTalk (UK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["talktalk.net", "tiscali.co.uk"], priority: 8, color: "#7c2aa0", icon: "🇬🇧" },
  // --- France ---
  { id: "laposte", name: "Laposte.net", category: "La Poste (FR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["laposte.net"], priority: 8, color: "#ffcc00", icon: "🇫🇷" },
  { id: "sfr", name: "SFR", category: "SFR (FR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sfr.fr", "neuf.fr", "cegetel.net"], priority: 8, color: "#e2001a", icon: "🇫🇷" },
  { id: "bouygues", name: "Bouygues Telecom", category: "Bouygues (FR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["bbox.fr", "club-internet.fr"], priority: 8, color: "#00549f", icon: "🇫🇷" },
  { id: "aliceadsl", name: "Alice ADSL", category: "Alice (FR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["alice.fr", "aliceadsl.fr"], priority: 8, color: "#00a1e0", icon: "🇫🇷" },
  { id: "mailo", name: "Mailo / Net-C", category: "Mailo (FR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["mailo.com", "net-c.com"], priority: 8, color: "#1a73b7", icon: "🇫🇷" },
  // --- Germany / Austria / Switzerland ---
  { id: "freenet", name: "Freenet", category: "Freenet (DE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["freenet.de"], priority: 8, color: "#e2001a", icon: "🇩🇪" },
  { id: "arcor", name: "Arcor / Vodafone", category: "Vodafone (DE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["arcor.de", "vodafone.de", "vodafonemail.de"], priority: 8, color: "#e60000", icon: "🇩🇪" },
  { id: "gmx-at", name: "GMX Austria", category: "GMX (AT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["gmx.at"], priority: 8, color: "#1c449b", icon: "🇦🇹" },
  { id: "aon-at", name: "A1 / Aon", category: "A1 (AT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["aon.at", "a1.net"], priority: 8, color: "#e30613", icon: "🇦🇹" },
  { id: "sunrise-ch", name: "Sunrise", category: "Sunrise (CH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sunrise.ch"], priority: 8, color: "#ff0000", icon: "🇨🇭" },
  { id: "kolabnow", name: "Kolab Now", category: "Kolab (CH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["kolabnow.com"], priority: 8, color: "#2f6f9f", icon: "🇨🇭" },
  // --- Italy / Spain / Portugal ---
  { id: "tiscali", name: "Tiscali", category: "Tiscali (IT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["tiscali.it"], priority: 8, color: "#003399", icon: "🇮🇹" },
  { id: "tim-it", name: "TIM / Alice", category: "TIM (IT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["alice.it", "tim.it", "tin.it"], priority: 8, color: "#004691", icon: "🇮🇹" },
  { id: "movistar-es", name: "Movistar / Telefónica", category: "Telefónica (ES)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["movistar.es", "telefonica.net"], priority: 8, color: "#019df4", icon: "🇪🇸" },
  { id: "terra-es", name: "Terra España", category: "Terra (ES)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["terra.es"], priority: 8, color: "#00954c", icon: "🇪🇸" },
  { id: "sapo", name: "SAPO", category: "SAPO (PT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sapo.pt"], priority: 8, color: "#e30613", icon: "🇵🇹" },
  { id: "portugalmail", name: "PortugalMail", category: "PortugalMail (PT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["portugalmail.com", "mail.pt"], priority: 8, color: "#006600", icon: "🇵🇹" },
  // --- Benelux ---
  { id: "telenet", name: "Telenet", category: "Telenet (BE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telenet.be"], priority: 8, color: "#ffd200", icon: "🇧🇪" },
  { id: "proximus", name: "Proximus / Skynet", category: "Proximus (BE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["proximus.be", "skynet.be", "pandora.be"], priority: 8, color: "#5c2d91", icon: "🇧🇪" },
  { id: "ziggo", name: "Ziggo", category: "Ziggo (NL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ziggo.nl", "chello.nl"], priority: 8, color: "#f36f21", icon: "🇳🇱" },
  { id: "kpn", name: "KPN", category: "KPN (NL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["kpn.nl", "kpnmail.nl", "planet.nl", "hetnet.nl"], priority: 8, color: "#008fd3", icon: "🇳🇱" },
  // --- Nordics ---
  { id: "telia", name: "Telia", category: "Telia (SE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telia.com", "telia.se"], priority: 8, color: "#990ae3", icon: "🇸🇪" },
  { id: "spray-se", name: "Spray / Passagen", category: "Spray (SE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["spray.se", "passagen.se"], priority: 8, color: "#e4002b", icon: "🇸🇪" },
  { id: "suomi24", name: "Suomi24 / Luukku", category: "Suomi24 (FI)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["suomi24.fi", "luukku.com"], priority: 8, color: "#0072c6", icon: "🇫🇮" },
  { id: "telenor-no", name: "Telenor / Online.no", category: "Telenor (NO)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["online.no", "telenor.no", "frisurf.no"], priority: 8, color: "#00c1d4", icon: "🇳🇴" },
  { id: "jubii", name: "Jubii / TDC", category: "Jubii (DK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["jubii.dk", "tdcspace.dk", "post.tele.dk"], priority: 8, color: "#e4002b", icon: "🇩🇰" },
  // --- Central & Eastern Europe ---
  { id: "interia", name: "Interia", category: "Interia (PL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["interia.pl", "interia.eu"], priority: 8, color: "#00843d", icon: "🇵🇱" },
  { id: "o2-pl", name: "o2 / Tlen", category: "o2 (PL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["o2.pl", "tlen.pl", "go2.pl"], priority: 8, color: "#e2001a", icon: "🇵🇱" },
  { id: "centrum-cz", name: "Centrum", category: "Centrum (CZ)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["centrum.cz", "centrum.sk"], priority: 8, color: "#e30613", icon: "🇨🇿" },
  { id: "email-cz", name: "Email.cz / Post.cz", category: "Email.cz (CZ)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["email.cz", "post.cz", "volny.cz"], priority: 8, color: "#0a68b1", icon: "🇨🇿" },
  { id: "freemail-hu", name: "Freemail.hu", category: "Freemail (HU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["freemail.hu", "mailbox.hu"], priority: 8, color: "#477050", icon: "🇭🇺" },
  { id: "abv-bg", name: "Abv.bg", category: "Abv (BG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["abv.bg"], priority: 8, color: "#e4002b", icon: "🇧🇬" },
  { id: "mail-bg", name: "Mail.bg", category: "Mail.bg (BG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["mail.bg", "dir.bg"], priority: 8, color: "#0a68b1", icon: "🇧🇬" },
  // --- Russia / Ukraine ---
  { id: "mailru-family", name: "Mail.ru (inbox/list/bk)", category: "Mail.ru (RU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["inbox.ru", "list.ru", "bk.ru", "internet.ru"], priority: 8, color: "#005ff9", icon: "🇷🇺" },
  { id: "ukrnet", name: "Ukr.net", category: "Ukr.net (UA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ukr.net"], priority: 8, color: "#0057b7", icon: "🇺🇦" },
  { id: "meta-ua", name: "Meta.ua / i.ua", category: "Meta (UA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["meta.ua", "i.ua", "bigmir.net"], priority: 8, color: "#ffd700", icon: "🇺🇦" },
  // --- China (extra) ---
  { id: "chinamobile-10086", name: "China Mobile 10086", category: "China Mobile (CN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["10086.cn", "139.net"], priority: 8, color: "#0a68b1", icon: "🇨🇳" },
  // --- Japan (ISP/mobile) ---
  { id: "docomo", name: "NTT Docomo", category: "Docomo (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["docomo.ne.jp"], priority: 8, color: "#cc0000", icon: "🇯🇵" },
  { id: "au-kddi", name: "au / KDDI", category: "KDDI (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ezweb.ne.jp", "au.com", "ido.ne.jp"], priority: 8, color: "#eb5505", icon: "🇯🇵" },
  { id: "softbank-jp", name: "SoftBank", category: "SoftBank (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["softbank.ne.jp", "i.softbank.jp", "ybb.ne.jp"], priority: 8, color: "#a0a0a0", icon: "🇯🇵" },
  { id: "excite-jp", name: "Excite / Asahi-net", category: "Excite (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["excite.co.jp", "asahi-net.or.jp", "eonet.ne.jp", "bbiq.jp"], priority: 8, color: "#e60012", icon: "🇯🇵" },
  // --- Vietnam / SE Asia ---
  { id: "fpt-vn", name: "FPT", category: "FPT (VN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["fpt.vn", "fpt.com.vn"], priority: 8, color: "#f37021", icon: "🇻🇳" },
  { id: "vnpt", name: "VNPT / Vietteľ", category: "VNPT (VN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["vnpt.vn", "vnn.vn", "viettel.vn", "viettel.com.vn"], priority: 8, color: "#005baa", icon: "🇻🇳" },
  { id: "zalo-vn", name: "Zing / Zalo (VNG)", category: "VNG (VN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["zing.vn", "zalo.vn", "vietnamnet.vn"], priority: 8, color: "#0068ff", icon: "🇻🇳" },
  // --- India (extra) ---
  { id: "india-com", name: "India.com", category: "India.com (IN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["india.com", "indiatimes.com"], priority: 8, color: "#ff6600", icon: "🇮🇳" },
  // --- Latin America ---
  { id: "ig-br", name: "iG", category: "iG (BR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ig.com.br"], priority: 8, color: "#ee1c25", icon: "🇧🇷" },
  { id: "prodigy-mx", name: "Prodigy / Telmex", category: "Telmex (MX)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["prodigy.net.mx", "prodigy.mx", "telmex.com"], priority: 8, color: "#0033a0", icon: "🇲🇽" },
  { id: "telcel", name: "Telcel", category: "Telcel (MX)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telcel.com", "telcel.net"], priority: 8, color: "#004a97", icon: "🇲🇽" },
  { id: "fibertel-ar", name: "Fibertel / Arnet", category: "Fibertel (AR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["fibertel.com.ar", "arnet.com.ar", "speedy.com.ar"], priority: 8, color: "#e30613", icon: "🇦🇷" },
  { id: "claro-latam", name: "Claro", category: "Claro (LATAM)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["claro.com.br", "claro.com.co", "claro.com.ar", "claro.cl"], priority: 8, color: "#da291c", icon: "🌎" },
  // --- Oceania ---
  { id: "bigpond", name: "BigPond / Telstra", category: "Telstra (AU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["bigpond.com", "bigpond.net.au", "telstra.com"], priority: 8, color: "#0d54ff", icon: "🇦🇺" },
  { id: "optus", name: "Optus", category: "Optus (AU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["optusnet.com.au", "optus.com.au"], priority: 8, color: "#00b8d4", icon: "🇦🇺" },
  { id: "iinet", name: "iiNet / Westnet", category: "iiNet (AU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["iinet.net.au", "westnet.com.au", "internode.on.net", "ozemail.com.au"], priority: 8, color: "#f57f29", icon: "🇦🇺" },
  { id: "tpg", name: "TPG / Dodo", category: "TPG (AU)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["tpg.com.au", "dodo.com.au", "exemail.com.au"], priority: 8, color: "#e4002b", icon: "🇦🇺" },
  { id: "xtra-nz", name: "Xtra (Spark)", category: "Spark (NZ)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["xtra.co.nz"], priority: 8, color: "#ff6f00", icon: "🇳🇿" },
  // --- Middle East / Africa ---
  { id: "walla", name: "Walla", category: "Walla (IL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["walla.co.il", "walla.com"], priority: 8, color: "#e4002b", icon: "🇮🇱" },
  { id: "bezeq", name: "Bezeq", category: "Bezeq (IL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["bezeqint.net", "013net.net"], priority: 8, color: "#0a3d91", icon: "🇮🇱" },
  { id: "mweb", name: "MWEB", category: "MWEB (ZA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["mweb.co.za"], priority: 8, color: "#e4002b", icon: "🇿🇦" },
  { id: "telkomsa", name: "Telkom SA / Webmail.co.za", category: "Telkom (ZA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telkomsa.net", "webmail.co.za", "vodamail.co.za", "absamail.co.za"], priority: 8, color: "#00a9ce", icon: "🇿🇦" },
  { id: "etisalat", name: "Etisalat", category: "Etisalat (AE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["etisalat.ae", "emirates.net.ae"], priority: 8, color: "#8dc63f", icon: "🇦🇪" },

  // ===================== Batch 4: more countries (top local ISP / webmail) =====================
  // --- Japan (ISPs) ---
  { id: "plala", name: "Plala (NTT)", category: "Plala (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["plala.or.jp"], priority: 8, color: "#e50012", icon: "🇯🇵" },
  { id: "dion-au", name: "au one net / DION", category: "KDDI (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["dion.ne.jp"], priority: 8, color: "#eb5505", icon: "🇯🇵" },
  { id: "odn-jp", name: "ODN (SoftBank)", category: "SoftBank (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["odn.ne.jp"], priority: 8, color: "#a0a0a0", icon: "🇯🇵" },
  { id: "hiho-jp", name: "hi-ho", category: "hi-ho (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["hi-ho.ne.jp"], priority: 8, color: "#0068b7", icon: "🇯🇵" },
  { id: "goo-jp", name: "goo", category: "goo (JP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["goo.ne.jp", "goo.jp"], priority: 8, color: "#3cb44b", icon: "🇯🇵" },
  // --- India (ISPs / portals) ---
  { id: "bsnl", name: "BSNL / DataOne", category: "BSNL (IN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["bsnl.in", "bsnl.co.in", "dataone.in", "sancharnet.in"], priority: 8, color: "#e2231a", icon: "🇮🇳" },
  { id: "vsnl", name: "VSNL / Tata", category: "Tata (IN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["vsnl.com", "vsnl.net", "tatadocomo.com"], priority: 8, color: "#486aae", icon: "🇮🇳" },
  { id: "airtelmail", name: "Airtel Mail", category: "Airtel (IN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["airtelmail.com", "airtelbroadband.in"], priority: 8, color: "#e40000", icon: "🇮🇳" },
  { id: "in-com", name: "In.com", category: "In.com (IN)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["in.com"], priority: 8, color: "#f47216", icon: "🇮🇳" },
  // --- Indonesia ---
  { id: "telkomnet", name: "Telkom Indonesia", category: "Telkom (ID)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telkom.net", "telkom.net.id", "plasa.com"], priority: 8, color: "#e30613", icon: "🇮🇩" },
  { id: "cbn-id", name: "CBN", category: "CBN (ID)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["cbn.net.id"], priority: 8, color: "#0a68b1", icon: "🇮🇩" },
  { id: "indosat", name: "Indosat", category: "Indosat (ID)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["indosat.net.id", "indo.net.id", "centrin.net.id"], priority: 8, color: "#ed1c24", icon: "🇮🇩" },
  // --- Philippines ---
  { id: "pldt-ph", name: "PLDT", category: "PLDT (PH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["pldtdsl.net", "pldt.net"], priority: 8, color: "#e4002b", icon: "🇵🇭" },
  { id: "sky-ph", name: "Sky / Destiny", category: "Sky (PH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["skyinet.net", "mydestiny.net"], priority: 8, color: "#0072ce", icon: "🇵🇭" },
  // --- Thailand ---
  { id: "loxinfo", name: "LoxInfo", category: "LoxInfo (TH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["loxinfo.co.th", "csloxinfo.com"], priority: 8, color: "#e30613", icon: "🇹🇭" },
  { id: "ksc-th", name: "KSC", category: "KSC (TH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ksc.net.th", "ksc.th.com"], priority: 8, color: "#0a68b1", icon: "🇹🇭" },
  // --- Malaysia ---
  { id: "tm-my", name: "TM / Streamyx", category: "TM (MY)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["tm.net.my", "streamyx.com"], priority: 8, color: "#ee7203", icon: "🇲🇾" },
  { id: "jaring-my", name: "Jaring", category: "Jaring (MY)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["jaring.my", "po.jaring.my"], priority: 8, color: "#005baa", icon: "🇲🇾" },
  // --- Singapore ---
  { id: "singnet", name: "SingNet (Singtel)", category: "Singtel (SG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["singnet.com.sg", "singtel.com"], priority: 8, color: "#e4002b", icon: "🇸🇬" },
  { id: "pacific-sg", name: "Pacific Internet / StarHub", category: "StarHub (SG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["pacific.net.sg", "starhub.net.sg"], priority: 8, color: "#8dc63f", icon: "🇸🇬" },
  // --- Pakistan ---
  { id: "cybernet-pk", name: "CyberNet", category: "CyberNet (PK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["cyber.net.pk"], priority: 8, color: "#01411c", icon: "🇵🇰" },
  { id: "brain-pk", name: "Brain / WOL", category: "Brain (PK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["brain.net.pk", "wol.net.pk", "paknet.com.pk"], priority: 8, color: "#046a38", icon: "🇵🇰" },
  // --- Iran ---
  { id: "chmail", name: "Chmail (National)", category: "Chmail (IR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["chmail.ir"], priority: 8, color: "#239f40", icon: "🇮🇷" },
  { id: "mailfa", name: "Mailfa", category: "Mailfa (IR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["mailfa.com"], priority: 8, color: "#da0000", icon: "🇮🇷" },
  // --- Egypt ---
  { id: "linknet-eg", name: "LINK.NET", category: "LINK (EG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["link.net", "linkdsl.com"], priority: 8, color: "#c8102e", icon: "🇪🇬" },
  { id: "tedata-eg", name: "TE Data", category: "TE Data (EG)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["tedata.net.eg", "tedata.net"], priority: 8, color: "#0a3d91", icon: "🇪🇬" },
  // --- Greece ---
  { id: "in-gr", name: "in.gr", category: "in.gr (GR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["in.gr"], priority: 8, color: "#004c9b", icon: "🇬🇷" },
  { id: "otenet-gr", name: "OTEnet / Cosmote", category: "OTE (GR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["otenet.gr", "cosmote.gr", "hol.gr"], priority: 8, color: "#98ca3c", icon: "🇬🇷" },
  { id: "forthnet-gr", name: "Forthnet", category: "Forthnet (GR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["forthnet.gr", "the.forthnet.gr"], priority: 8, color: "#e4002b", icon: "🇬🇷" },
  // --- Ireland ---
  { id: "eircom-ie", name: "Eir / Eircom", category: "Eir (IE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["eircom.net", "eir.ie"], priority: 8, color: "#00a0af", icon: "🇮🇪" },
  { id: "iol-ie", name: "Irish Online (IOL)", category: "IOL (IE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["iol.ie", "indigo.ie"], priority: 8, color: "#169b62", icon: "🇮🇪" },
  // --- Turkey (extra) ---
  { id: "superonline", name: "Superonline (Turkcell)", category: "Turkcell (TR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["superonline.com", "turkcell.com.tr"], priority: 8, color: "#ffc900", icon: "🇹🇷" },
  { id: "ttnet-tr", name: "TTNET / Türk Telekom", category: "Türk Telekom (TR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ttmail.com", "turk.net", "ttnet.net.tr"], priority: 8, color: "#004b93", icon: "🇹🇷" },
  // --- Israel (extra) ---
  { id: "netvision-il", name: "NetVision", category: "NetVision (IL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["netvision.net.il", "012.net.il"], priority: 8, color: "#0a3d91", icon: "🇮🇱" },
  { id: "nana-il", name: "Nana10", category: "Nana (IL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["nana10.co.il", "nana.co.il"], priority: 8, color: "#e4002b", icon: "🇮🇱" },
  // --- Netherlands / Germany / Nordics (extra) ---
  { id: "xs4all", name: "XS4ALL", category: "XS4ALL (NL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["xs4all.nl"], priority: 8, color: "#e30613", icon: "🇳🇱" },
  { id: "alice-de", name: "Alice / O2 DE", category: "O2 (DE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["alice-dsl.de", "alice.de", "o2online.de"], priority: 8, color: "#0050a0", icon: "🇩🇪" },
  { id: "comhem-se", name: "Comhem / Tele2", category: "Tele2 (SE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["comhem.se", "bredband.net", "tele2.se"], priority: 8, color: "#00b5e2", icon: "🇸🇪" },
  // --- Spain (extra) ---
  { id: "ono-es", name: "ONO / Vodafone ES", category: "Vodafone (ES)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["ono.com", "wanadoo.es"], priority: 8, color: "#e60000", icon: "🇪🇸" },
  // --- Brazil (extra) ---
  { id: "globo-br", name: "Globo / R7", category: "Globo (BR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["globo.com", "globomail.com", "r7.com"], priority: 8, color: "#0a6b3b", icon: "🇧🇷" },
  { id: "oi-br", name: "Oi", category: "Oi (BR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["oi.com.br", "veloxmail.com.br"], priority: 8, color: "#5a2d81", icon: "🇧🇷" },

  // ===================== Batch 5: E. Europe, Baltics, C. Asia, Gulf/Levant, Africa, S. Asia, LatAm =====================
  // --- Slovakia / Slovenia ---
  { id: "azet-sk", name: "Azet.sk", category: "Azet (SK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["azet.sk", "pobox.sk"], priority: 8, color: "#e30613", icon: "🇸🇰" },
  { id: "zoznam-sk", name: "Zoznam.sk", category: "Zoznam (SK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["zoznam.sk", "post.sk"], priority: 8, color: "#f7a800", icon: "🇸🇰" },
  { id: "siol-si", name: "SiOL (Telekom Slovenije)", category: "SiOL (SI)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["siol.net", "email.si", "volja.net"], priority: 8, color: "#e30613", icon: "🇸🇮" },
  // --- Serbia / Croatia ---
  { id: "sbb-rs", name: "SBB / EUnet", category: "SBB (RS)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["sbb.rs", "eunet.rs", "sezampro.rs", "verat.net"], priority: 8, color: "#004b93", icon: "🇷🇸" },
  { id: "telekom-rs", name: "Telekom Srbija / PTT", category: "Telekom (RS)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["telekom.rs", "open.telekom.rs", "ptt.rs", "mts.rs"], priority: 8, color: "#e4002b", icon: "🇷🇸" },
  { id: "tcom-hr", name: "Hrvatski Telekom (T-Com)", category: "HT (HR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["t-com.hr", "tel.hr", "inet.hr"], priority: 8, color: "#e20074", icon: "🇭🇷" },
  { id: "net-hr", name: "Net.hr", category: "Net.hr (HR)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["net.hr", "vip.hr"], priority: 8, color: "#e4002b", icon: "🇭🇷" },
  // --- Baltics ---
  { id: "inbox-lv", name: "Inbox.lv", category: "Inbox (LV)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["inbox.lv", "inbox.eu", "apollo.lv", "one.lv"], priority: 8, color: "#4caf50", icon: "🇱🇻" },
  { id: "inbox-lt", name: "Inbox.lt / Takas", category: "Inbox (LT)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["inbox.lt", "takas.lt", "mail.lt", "one.lt"], priority: 8, color: "#43a047", icon: "🇱🇹" },
  { id: "hot-ee", name: "Hot.ee / Mail.ee", category: "Estonia (EE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["hot.ee", "mail.ee", "online.ee", "neti.ee"], priority: 8, color: "#0072ce", icon: "🇪🇪" },
  // --- Belarus / Ukraine / Kazakhstan ---
  { id: "tutby", name: "Tut.by", category: "Tut.by (BY)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["tut.by", "open.by", "mail.by"], priority: 8, color: "#008000", icon: "🇧🇾" },
  { id: "ukr-extra", name: "Online.ua / Mail.ua", category: "Ukraine (UA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["online.ua", "mail.ua", "email.ua"], priority: 8, color: "#ffd700", icon: "🇺🇦" },
  { id: "mail-kz", name: "Mail.kz / Nur.kz", category: "Kazakhstan (KZ)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["mail.kz", "nur.kz", "bk.kz"], priority: 8, color: "#00afca", icon: "🇰🇿" },
  // --- Morocco / Kenya ---
  { id: "menara-ma", name: "Menara (Maroc Telecom)", category: "Maroc Telecom (MA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["menara.ma", "iam.net.ma"], priority: 8, color: "#c1272d", icon: "🇲🇦" },
  { id: "safaricom-ke", name: "Safaricom / Wananchi", category: "Kenya (KE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["safaricom.co.ke", "wananchi.com", "africaonline.co.ke", "swiftkenya.com"], priority: 8, color: "#43b02a", icon: "🇰🇪" },
  // --- Gulf ---
  { id: "stc-sa", name: "STC / Saudi", category: "STC (SA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["stc.com.sa", "sahara.com.sa", "zajil.com", "naseej.com.sa"], priority: 8, color: "#4f2d7f", icon: "🇸🇦" },
  { id: "qualitynet-kw", name: "Qualitynet / KEMS", category: "Kuwait (KW)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["qualitynet.net", "kems.net"], priority: 8, color: "#007a3d", icon: "🇰🇼" },
  { id: "batelco-bh", name: "Batelco", category: "Batelco (BH)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["batelco.com.bh"], priority: 8, color: "#e4002b", icon: "🇧🇭" },
  { id: "omantel-om", name: "Omantel", category: "Omantel (OM)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["omantel.net.om"], priority: 8, color: "#c8102e", icon: "🇴🇲" },
  { id: "qatarnet-qa", name: "Qatar Net (Ooredoo)", category: "Ooredoo (QA)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["qatar.net.qa"], priority: 8, color: "#8a1538", icon: "🇶🇦" },
  // --- Levant ---
  { id: "cyberia-lb", name: "Cyberia / IDM", category: "Lebanon (LB)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["cyberia.net.lb", "idm.net.lb", "dm.net.lb", "inco.com.lb", "terra.net.lb"], priority: 8, color: "#e4002b", icon: "🇱🇧" },
  { id: "go-jo", name: "Go / Nets (Jordan)", category: "Jordan (JO)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["go.com.jo", "nets.com.jo", "index.com.jo", "wanadoo.jo"], priority: 8, color: "#007a3d", icon: "🇯🇴" },
  // --- South Asia ---
  { id: "slt-lk", name: "SLT / Eureka", category: "SLT (LK)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["slt.lk", "sltnet.lk", "eureka.lk"], priority: 8, color: "#8a1f2b", icon: "🇱🇰" },
  { id: "wlink-np", name: "WorldLink / NTC", category: "Nepal (NP)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["wlink.com.np", "ntc.net.np", "mos.com.np"], priority: 8, color: "#dc143c", icon: "🇳🇵" },
  { id: "agni-bd", name: "Agni / BOL (Bangladesh)", category: "Bangladesh (BD)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["agni.com", "bol-online.com", "citechco.net"], priority: 8, color: "#006a4e", icon: "🇧🇩" },
  // --- Latin America ---
  { id: "cantv-ve", name: "CANTV", category: "CANTV (VE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["cantv.net"], priority: 8, color: "#0033a0", icon: "🇻🇪" },
  { id: "etb-co", name: "ETB / UNE / EPM", category: "Colombia (CO)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["etb.net.co", "une.net.co", "epm.net.co", "telesat.com.co"], priority: 8, color: "#fcd116", icon: "🇨🇴" },
  { id: "vtr-cl", name: "VTR / Entel", category: "Chile (CL)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["vtr.net", "entelchile.net", "tie.cl", "123.cl"], priority: 8, color: "#0039a6", icon: "🇨🇱" },
  { id: "speedy-pe", name: "Speedy / Telefónica Perú", category: "Perú (PE)", matchOn: "mx", mxPatterns: [], nsPatterns: [], domainPatterns: ["speedy.com.pe", "terra.com.pe"], priority: 8, color: "#d91023", icon: "🇵🇪" },

  // ===================== Batch 6: business mail hosts (from unknown-bucket analysis) =====================
  // Recurring third-party MX hosts found in real "unknown" exports — mostly Asian
  // business email hosting + enterprise suites + security gateways.
  { id: "netease-enterprise", name: "NetEase Enterprise (Qiye)", category: "NetEase (CN)", matchOn: "mx", mxPatterns: ["mxmail.netease.com", "qiye.163.com"], nsPatterns: [], priority: 6, color: "#c62828", icon: "🇨🇳" },
  { id: "osdog", name: "osdog.net Mail", category: "osdog (TW/CN)", matchOn: "mx", mxPatterns: ["osdog.net"], nsPatterns: [], priority: 8, color: "#5b7c99", icon: "📧" },
  { id: "feishu", name: "Feishu (Lark CN)", category: "ByteDance (CN)", matchOn: "mx", mxPatterns: ["feishu.cn"], nsPatterns: [], priority: 8, color: "#00d6b9", icon: "🇨🇳" },
  { id: "lark", name: "Lark", category: "ByteDance", matchOn: "mx", mxPatterns: ["larksuite.com"], nsPatterns: [], priority: 8, color: "#00b8d9", icon: "🌐" },
  { id: "dingtalk", name: "DingTalk Mail", category: "Alibaba (CN)", matchOn: "mx", mxPatterns: ["dingtalk.com"], nsPatterns: [], priority: 8, color: "#3296fa", icon: "🇨🇳" },
  { id: "ecount", name: "Ecount", category: "Ecount (KR)", matchOn: "mx", mxPatterns: ["ecount.com"], nsPatterns: [], priority: 8, color: "#1a73b7", icon: "🇰🇷" },
  { id: "ms365-china", name: "Microsoft 365 (China · 21Vianet)", category: "Microsoft", matchOn: "mx", mxPatterns: ["partner.outlook.cn"], nsPatterns: [], priority: 9, color: "#0078d4", icon: "🇨🇳" },
  { id: "hostinger-mail", name: "Hostinger Email", category: "Hostinger", matchOn: "mx", mxPatterns: ["hostinger.com", "hostinger.io"], nsPatterns: [], priority: 7, color: "#673de6", icon: "✉️" },
  { id: "global-mail-cn", name: "Global-Mail (CN)", category: "Global-Mail (CN)", matchOn: "mx", mxPatterns: ["global-mail.cn"], nsPatterns: [], priority: 7, color: "#c0392b", icon: "🇨🇳" },
  { id: "hemail", name: "H-Email", category: "H-Email (CN)", matchOn: "mx", mxPatterns: ["h-email.net"], nsPatterns: [], priority: 7, color: "#2c82c9", icon: "🇨🇳" },
  { id: "mailcloud-tw", name: "MailCloud (TW)", category: "MailCloud (TW)", matchOn: "mx", mxPatterns: ["mailcloud.com.tw"], nsPatterns: [], priority: 7, color: "#16a085", icon: "🇹🇼" },
  { id: "chinaemail", name: "ChinaEmail", category: "ChinaEmail (CN)", matchOn: "mx", mxPatterns: ["chinaemail.cn"], nsPatterns: [], priority: 7, color: "#d35400", icon: "🇨🇳" },
  { id: "url-tw", name: "URL.com.tw", category: "URL (TW)", matchOn: "mx", mxPatterns: ["url.com.tw"], nsPatterns: [], priority: 6, color: "#2980b9", icon: "🇹🇼" },
  { id: "yunyou", name: "Yunyou Mail (CN)", category: "Yunyou (CN)", matchOn: "mx", mxPatterns: ["yunyou.top"], nsPatterns: [], priority: 6, color: "#8e44ad", icon: "🇨🇳" },
  { id: "cn-misc-mail", name: "China SMB mail hosts", category: "China SMB (CN)", matchOn: "mx", mxPatterns: ["zmail300.cn", "cn4e.com", "chengmail.cn", "xmailbox.cn", "cnnc.email", "wo.cn", "16388888.com", "edgedns.com.cn"], nsPatterns: [], priority: 6, color: "#a04000", icon: "🇨🇳" },
  { id: "spaceship-mail", name: "Spaceship Email", category: "Spaceship", matchOn: "mx", mxPatterns: ["spaceship.net"], nsPatterns: [], priority: 7, color: "#00c2b2", icon: "🚀" },
  // Security / relay gateways
  { id: "fireeye", name: "FireEye / Trellix", category: "Security Gateway", matchOn: "mx", mxPatterns: ["fireeyecloud.com"], nsPatterns: [], priority: 6, color: "#ff5a00", icon: "🛡️" },
  { id: "spamexperts", name: "SpamExperts / N-able", category: "Security Gateway", matchOn: "mx", mxPatterns: ["mailspamprotection.com", "antispamcloud.com"], nsPatterns: [], priority: 6, color: "#1abc9c", icon: "🛡️" },
  { id: "securemx-jp", name: "SecureMX (JP)", category: "Security Gateway", matchOn: "mx", mxPatterns: ["securemx.jp"], nsPatterns: [], priority: 6, color: "#c0392b", icon: "🛡️" },
  { id: "mailchannels", name: "MailChannels", category: "Security Gateway", matchOn: "mx", mxPatterns: ["mailchannels.net"], nsPatterns: [], priority: 5, color: "#2c3e50", icon: "🛡️" },
];
