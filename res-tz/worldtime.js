(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory(root);
  } else {
    root.Worldtime = factory(root);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  var BASE62 = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  var DATED_EPOCH_OFFSET_MINUTES = 24 * 60;
  var SEARCH_WINDOW_MINUTES = 36 * 60;
  var TZ_AREA_TO_CODE = {
    Africa: "f",
    America: "a",
    Antarctica: "n",
    Arctic: "r",
    Asia: "s",
    Atlantic: "l",
    Australia: "u",
    Europe: "e",
    Indian: "i",
    Pacific: "p"
  };
  var TZ_CODE_TO_AREA = {
    f: "Africa",
    a: "America",
    n: "Antarctica",
    r: "Arctic",
    s: "Asia",
    l: "Atlantic",
    u: "Australia",
    e: "Europe",
    i: "Indian",
    p: "Pacific"
  };
  var SHORT_TZ_ZONE_TO_CODE = {
    "Africa/Abidjan": "abj",
    "Africa/Accra": "acc",
    "Africa/Addis_Ababa": "add",
    "Africa/Algiers": "alg",
    "Africa/Asmera": "asm",
    "Africa/Bamako": "bmk",
    "Africa/Bangui": "bng",
    "Africa/Banjul": "bnj",
    "Africa/Bissau": "bss",
    "Africa/Blantyre": "bln",
    "Africa/Brazzaville": "brz",
    "Africa/Bujumbura": "bjm",
    "Africa/Cairo": "cai",
    "Africa/Casablanca": "cas",
    "Africa/Ceuta": "ceu",
    "Africa/Conakry": "cnk",
    "Africa/Dakar": "dkr",
    "Africa/Dar_es_Salaam": "dar",
    "Africa/Djibouti": "djb",
    "Africa/Douala": "dou",
    "Africa/El_Aaiun": "ea",
    "Africa/Freetown": "frt",
    "Africa/Gaborone": "gbr",
    "Africa/Harare": "hrr",
    "Africa/Johannesburg": "jnb",
    "Africa/Juba": "jub",
    "Africa/Kampala": "kmp",
    "Africa/Khartoum": "khr",
    "Africa/Kigali": "kgl",
    "Africa/Kinshasa": "fih",
    "Africa/Lagos": "lag",
    "Africa/Libreville": "lbr",
    "Africa/Lome": "lom",
    "Africa/Luanda": "lnd",
    "Africa/Lubumbashi": "lbm",
    "Africa/Lusaka": "lsk",
    "Africa/Malabo": "mlb",
    "Africa/Maputo": "mpt",
    "Africa/Maseru": "msr",
    "Africa/Mbabane": "mbb",
    "Africa/Mogadishu": "mgd",
    "Africa/Monrovia": "mnr",
    "Africa/Nairobi": "nbo",
    "Africa/Ndjamena": "ndj",
    "Africa/Niamey": "nmy",
    "Africa/Nouakchott": "nkc",
    "Africa/Ouagadougou": "gdg",
    "Africa/Porto-Novo": "pn",
    "Africa/Sao_Tome": "st",
    "Africa/Tripoli": "trp",
    "Africa/Tunis": "tun",
    "Africa/Windhoek": "wnd",
    "America/Adak": "ada",
    "America/Anchorage": "anc",
    "America/Anguilla": "ngl",
    "America/Antigua": "ntg",
    "America/Araguaina": "ara",
    "America/Argentina/La_Rioja": "lrj",
    "America/Argentina/Rio_Gallegos": "rig",
    "America/Argentina/Salta": "slt",
    "America/Argentina/San_Juan": "sju",
    "America/Argentina/San_Luis": "slu",
    "America/Argentina/Tucuman": "tuc",
    "America/Argentina/Ushuaia": "ush",
    "America/Aruba": "aru",
    "America/Asuncion": "asu",
    "America/Bahia": "ba",
    "America/Bahia_Banderas": "bb",
    "America/Barbados": "brb",
    "America/Belem": "blm",
    "America/Belize": "blz",
    "America/Blanc-Sablon": "bs",
    "America/Boa_Vista": "bv",
    "America/Bogota": "bog",
    "America/Boise": "boi",
    "America/Buenos_Aires": "bue",
    "America/Cambridge_Bay": "cb",
    "America/Campo_Grande": "cg",
    "America/Cancun": "cun",
    "America/Caracas": "ccs",
    "America/Catamarca": "ctm",
    "America/Cayenne": "cyn",
    "America/Cayman": "cym",
    "America/Chicago": "chi",
    "America/Chihuahua": "chh",
    "America/Ciudad_Juarez": "cjs",
    "America/Coral_Harbour": "ch",
    "America/Cordoba": "cor",
    "America/Costa_Rica": "sjc",
    "America/Coyhaique": "cyh",
    "America/Creston": "crs",
    "America/Cuiaba": "cui",
    "America/Curacao": "crc",
    "America/Danmarkshavn": "dnm",
    "America/Dawson": "dws",
    "America/Dawson_Creek": "dc",
    "America/Denver": "den",
    "America/Detroit": "det",
    "America/Dominica": "dmn",
    "America/Edmonton": "edm",
    "America/Eirunepe": "rnp",
    "America/El_Salvador": "sal",
    "America/Fort_Nelson": "fn",
    "America/Fortaleza": "for",
    "America/Glace_Bay": "gb",
    "America/Godthab": "gdt",
    "America/Goose_Bay": "gba",
    "America/Grand_Turk": "gt",
    "America/Grenada": "grn",
    "America/Guadeloupe": "gdl",
    "America/Guatemala": "gua",
    "America/Guayaquil": "gye",
    "America/Guyana": "gyn",
    "America/Halifax": "hfx",
    "America/Havana": "hav",
    "America/Hermosillo": "hmo",
    "America/Indiana/Knox": "knx",
    "America/Indiana/Marengo": "mrn",
    "America/Indiana/Petersburg": "ptr",
    "America/Indiana/Tell_City": "tc",
    "America/Indiana/Vevay": "vvy",
    "America/Indiana/Vincennes": "vnc",
    "America/Indiana/Winamac": "wnm",
    "America/Indianapolis": "ind",
    "America/Inuvik": "nvk",
    "America/Iqaluit": "qlt",
    "America/Jamaica": "jam",
    "America/Jujuy": "jjy",
    "America/Juneau": "jun",
    "America/Kentucky/Monticello": "mnt",
    "America/Kralendijk": "krl",
    "America/La_Paz": "lpz",
    "America/Lima": "lim",
    "America/Los_Angeles": "la",
    "America/Louisville": "lou",
    "America/Lower_Princes": "lp",
    "America/Maceio": "mac",
    "America/Managua": "mga",
    "America/Manaus": "mao",
    "America/Marigot": "mrg",
    "America/Martinique": "mrt",
    "America/Matamoros": "mtm",
    "America/Mazatlan": "mzt",
    "America/Mendoza": "mdz",
    "America/Menominee": "mnm",
    "America/Merida": "mid",
    "America/Metlakatla": "mtl",
    "America/Mexico_City": "mex",
    "America/Miquelon": "mql",
    "America/Moncton": "mnc",
    "America/Monterrey": "mty",
    "America/Montevideo": "mvd",
    "America/Montserrat": "mon",
    "America/Nassau": "nas",
    "America/New_York": "nyc",
    "America/Nome": "nom",
    "America/Noronha": "nrn",
    "America/North_Dakota/Beulah": "blh",
    "America/North_Dakota/Center": "cnt",
    "America/North_Dakota/New_Salem": "ns",
    "America/Ojinaga": "jng",
    "America/Panama": "pty",
    "America/Paramaribo": "prm",
    "America/Phoenix": "phx",
    "America/Port_of_Spain": "pos",
    "America/Port-au-Prince": "pap",
    "America/Porto_Velho": "pv",
    "America/Puerto_Rico": "pr",
    "America/Punta_Arenas": "pa",
    "America/Rankin_Inlet": "ri",
    "America/Recife": "rcf",
    "America/Regina": "yqr",
    "America/Resolute": "rsl",
    "America/Rio_Branco": "rb",
    "America/Santarem": "snt",
    "America/Santiago": "sgo",
    "America/Santo_Domingo": "sdq",
    "America/Sao_Paulo": "sao",
    "America/Scoresbysund": "scr",
    "America/Sitka": "stk",
    "America/St_Barthelemy": "sb",
    "America/St_Johns": "yyt",
    "America/St_Kitts": "sk",
    "America/St_Lucia": "sl",
    "America/St_Thomas": "sth",
    "America/St_Vincent": "sv",
    "America/Swift_Current": "sc",
    "America/Tegucigalpa": "tgu",
    "America/Thule": "thl",
    "America/Tijuana": "tij",
    "America/Toronto": "tor",
    "America/Tortola": "trt",
    "America/Vancouver": "van",
    "America/Whitehorse": "wht",
    "America/Winnipeg": "ywg",
    "America/Yakutat": "ykt",
    "Antarctica/Casey": "csy",
    "Antarctica/Davis": "dvs",
    "Antarctica/DumontDUrville": "dd",
    "Antarctica/Macquarie": "mcq",
    "Antarctica/Mawson": "mws",
    "Antarctica/McMurdo": "mm",
    "Antarctica/Palmer": "plm",
    "Antarctica/Rothera": "rth",
    "Antarctica/Syowa": "syw",
    "Antarctica/Troll": "trl",
    "Antarctica/Vostok": "vst",
    "Arctic/Longyearbyen": "lng",
    "Asia/Aden": "ade",
    "Asia/Almaty": "ala",
    "Asia/Amman": "amm",
    "Asia/Anadyr": "ndy",
    "Asia/Aqtau": "aqt",
    "Asia/Aqtobe": "qtb",
    "Asia/Ashgabat": "shg",
    "Asia/Atyrau": "tyr",
    "Asia/Baghdad": "bgw",
    "Asia/Bahrain": "bah",
    "Asia/Baku": "bak",
    "Asia/Bangkok": "bkk",
    "Asia/Barnaul": "brn",
    "Asia/Beirut": "bey",
    "Asia/Bishkek": "fru",
    "Asia/Brunei": "bwn",
    "Asia/Calcutta": "del",
    "Asia/Chita": "cia",
    "Asia/Colombo": "cmb",
    "Asia/Damascus": "dam",
    "Asia/Dhaka": "dac",
    "Asia/Dili": "dil",
    "Asia/Dubai": "dxb",
    "Asia/Dushanbe": "dsh",
    "Asia/Famagusta": "fmg",
    "Asia/Gaza": "gaz",
    "Asia/Hebron": "hbr",
    "Asia/Hong_Kong": "hkg",
    "Asia/Hovd": "hvd",
    "Asia/Irkutsk": "ikt",
    "Asia/Jakarta": "jkt",
    "Asia/Jayapura": "jyp",
    "Asia/Jerusalem": "jer",
    "Asia/Kabul": "kbl",
    "Asia/Kamchatka": "pkc",
    "Asia/Karachi": "khi",
    "Asia/Katmandu": "ktm",
    "Asia/Khandyga": "khn",
    "Asia/Krasnoyarsk": "kja",
    "Asia/Kuala_Lumpur": "kul",
    "Asia/Kuching": "kch",
    "Asia/Kuwait": "kwt",
    "Asia/Macau": "mfm",
    "Asia/Magadan": "gdx",
    "Asia/Makassar": "mks",
    "Asia/Manila": "mnl",
    "Asia/Muscat": "mct",
    "Asia/Nicosia": "nic",
    "Asia/Novokuznetsk": "nov",
    "Asia/Novosibirsk": "ovb",
    "Asia/Omsk": "oms",
    "Asia/Oral": "ora",
    "Asia/Phnom_Penh": "pnh",
    "Asia/Pontianak": "pnt",
    "Asia/Pyongyang": "fnj",
    "Asia/Qatar": "doh",
    "Asia/Qostanay": "qst",
    "Asia/Qyzylorda": "qyz",
    "Asia/Rangoon": "rgn",
    "Asia/Riyadh": "ruh",
    "Asia/Saigon": "sgn",
    "Asia/Sakhalin": "skh",
    "Asia/Samarkand": "sam",
    "Asia/Seoul": "sel",
    "Asia/Shanghai": "sha",
    "Asia/Singapore": "sin",
    "Asia/Srednekolymsk": "srd",
    "Asia/Taipei": "tpe",
    "Asia/Tashkent": "tas",
    "Asia/Tbilisi": "tbs",
    "Asia/Tehran": "thr",
    "Asia/Thimphu": "thp",
    "Asia/Tokyo": "tyo",
    "Asia/Tomsk": "tms",
    "Asia/Ulaanbaatar": "uln",
    "Asia/Urumqi": "urc",
    "Asia/Ust-Nera": "un",
    "Asia/Vientiane": "vnt",
    "Asia/Vladivostok": "vvo",
    "Asia/Yakutsk": "yks",
    "Asia/Yekaterinburg": "svx",
    "Asia/Yerevan": "evn",
    "Atlantic/Azores": "azr",
    "Atlantic/Bermuda": "bda",
    "Atlantic/Canary": "can",
    "Atlantic/Cape_Verde": "cv",
    "Atlantic/Faeroe": "far",
    "Atlantic/Madeira": "fnc",
    "Atlantic/Reykjavik": "rkv",
    "Atlantic/South_Georgia": "sg",
    "Atlantic/St_Helena": "sh",
    "Atlantic/Stanley": "stn",
    "Australia/Adelaide": "adl",
    "Australia/Brisbane": "bne",
    "Australia/Broken_Hill": "bhq",
    "Australia/Darwin": "drw",
    "Australia/Eucla": "euc",
    "Australia/Hobart": "hba",
    "Australia/Lindeman": "lin",
    "Australia/Lord_Howe": "ldh",
    "Australia/Melbourne": "mel",
    "Australia/Perth": "per",
    "Australia/Sydney": "syd",
    "Europe/Amsterdam": "ams",
    "Europe/Andorra": "ndr",
    "Europe/Astrakhan": "str",
    "Europe/Athens": "ath",
    "Europe/Belgrade": "beg",
    "Europe/Berlin": "ber",
    "Europe/Bratislava": "brt",
    "Europe/Brussels": "bru",
    "Europe/Bucharest": "buh",
    "Europe/Budapest": "bud",
    "Europe/Busingen": "bsn",
    "Europe/Chisinau": "chs",
    "Europe/Copenhagen": "cph",
    "Europe/Dublin": "dub",
    "Europe/Gibraltar": "gib",
    "Europe/Guernsey": "gue",
    "Europe/Helsinki": "hel",
    "Europe/Isle_of_Man": "iom",
    "Europe/Istanbul": "ist",
    "Europe/Jersey": "jrs",
    "Europe/Kaliningrad": "kgd",
    "Europe/Kiev": "kyv",
    "Europe/Kirov": "krv",
    "Europe/Lisbon": "lis",
    "Europe/Ljubljana": "lju",
    "Europe/London": "ldn",
    "Europe/Luxembourg": "lux",
    "Europe/Madrid": "mad",
    "Europe/Malta": "mla",
    "Europe/Mariehamn": "mrh",
    "Europe/Minsk": "msq",
    "Europe/Monaco": "mco",
    "Europe/Moscow": "mos",
    "Europe/Oslo": "osl",
    "Europe/Paris": "par",
    "Europe/Podgorica": "tgd",
    "Europe/Prague": "prg",
    "Europe/Riga": "rix",
    "Europe/Rome": "rom",
    "Europe/Samara": "kur",
    "Europe/San_Marino": "smr",
    "Europe/Sarajevo": "sjj",
    "Europe/Saratov": "srt",
    "Europe/Simferopol": "sip",
    "Europe/Skopje": "skp",
    "Europe/Sofia": "sof",
    "Europe/Stockholm": "sto",
    "Europe/Tallinn": "tll",
    "Europe/Tirane": "tia",
    "Europe/Ulyanovsk": "lyn",
    "Europe/Vaduz": "vad",
    "Europe/Vatican": "vat",
    "Europe/Vienna": "vie",
    "Europe/Vilnius": "vno",
    "Europe/Volgograd": "vog",
    "Europe/Warsaw": "waw",
    "Europe/Zagreb": "zag",
    "Europe/Zurich": "zur",
    "Indian/Antananarivo": "tnr",
    "Indian/Chagos": "cha",
    "Indian/Christmas": "xch",
    "Indian/Cocos": "cck",
    "Indian/Comoro": "cmr",
    "Indian/Kerguelen": "krg",
    "Indian/Mahe": "sez",
    "Indian/Maldives": "mle",
    "Indian/Mauritius": "mru",
    "Indian/Mayotte": "myt",
    "Indian/Reunion": "run",
    "Pacific/Apia": "api",
    "Pacific/Auckland": "akl",
    "Pacific/Bougainville": "bgn",
    "Pacific/Chatham": "cht",
    "Pacific/Easter": "ipc",
    "Pacific/Efate": "efa",
    "Pacific/Enderbury": "end",
    "Pacific/Fakaofo": "fkf",
    "Pacific/Fiji": "fji",
    "Pacific/Funafuti": "fnf",
    "Pacific/Galapagos": "glp",
    "Pacific/Gambier": "gmb",
    "Pacific/Guadalcanal": "gu",
    "Pacific/Guam": "gum",
    "Pacific/Honolulu": "hnl",
    "Pacific/Kiritimati": "kir",
    "Pacific/Kosrae": "ksr",
    "Pacific/Kwajalein": "kwj",
    "Pacific/Majuro": "maj",
    "Pacific/Marquesas": "mrq",
    "Pacific/Midway": "mdw",
    "Pacific/Nauru": "nau",
    "Pacific/Niue": "niu",
    "Pacific/Norfolk": "nlk",
    "Pacific/Noumea": "nou",
    "Pacific/Pago_Pago": "ppg",
    "Pacific/Palau": "ror",
    "Pacific/Pitcairn": "pcn",
    "Pacific/Ponape": "pni",
    "Pacific/Port_Moresby": "pom",
    "Pacific/Rarotonga": "rar",
    "Pacific/Saipan": "spn",
    "Pacific/Tahiti": "ppt",
    "Pacific/Tarawa": "trw",
    "Pacific/Tongatapu": "tbu",
    "Pacific/Truk": "trk",
    "Pacific/Wake": "wak",
    "Pacific/Wallis": "wll"
  };
  var SHORT_TZ_CODE_TO_ZONE = invertTimeZoneCodeMap(SHORT_TZ_ZONE_TO_CODE);

  var partsFormatterCache = new Map();
  var displayFormatterCache = new Map();
  var allTimeZones = [];

  function hasIntlTimeZoneSupport() {
    return typeof Intl === "object" &&
      typeof Intl.DateTimeFormat === "function" &&
      canUseTimeZone("UTC");
  }

  function canUseTimeZone(timeZone) {
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: timeZone }).format(new Date(0));
      return true;
    } catch (error) {
      return false;
    }
  }

  function canonicalTimeZone(timeZone) {
    try {
      return new Intl.DateTimeFormat("en-US", { timeZone: timeZone }).resolvedOptions().timeZone;
    } catch (error) {
      return null;
    }
  }

  function localTimeZone() {
    try {
      var resolved = new Intl.DateTimeFormat().resolvedOptions().timeZone;
      return resolved && canUseTimeZone(resolved) ? canonicalTimeZone(resolved) || resolved : "UTC";
    } catch (error) {
      return "UTC";
    }
  }

  function getSupportedTimeZones() {
    var zones = ["UTC", localTimeZone()];

    if (typeof Intl.supportedValuesOf === "function") {
      try {
        zones = zones.concat(Intl.supportedValuesOf("timeZone"));
      } catch (error) {
        // Keep the UTC/local fallback below.
      }
    }

    return uniqueTimeZones(zones)
      .filter(canUseTimeZone)
      .sort(compareTimeZones);
  }

  function uniqueTimeZones(zones) {
    var seen = new Set();
    return zones.map(function (zone) {
      var canonical = canonicalTimeZone(zone) || zone;
      return canonical;
    }).filter(function (zone) {
      if (seen.has(zone)) return false;
      seen.add(zone);
      return true;
    });
  }

  function compareTimeZones(a, b) {
    if (a === "UTC") return -1;
    if (b === "UTC") return 1;
    return a.localeCompare(b);
  }

  function partsFormatter(timeZone) {
    if (!partsFormatterCache.has(timeZone)) {
      partsFormatterCache.set(
        timeZone,
        new Intl.DateTimeFormat("en-US-u-ca-iso8601-nu-latn", {
          timeZone: timeZone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hourCycle: "h23"
        })
      );
    }
    return partsFormatterCache.get(timeZone);
  }

  function displayFormatter(timeZone, includeDate) {
    var cacheKey = timeZone + "|" + (includeDate ? "date" : "time");
    if (!displayFormatterCache.has(cacheKey)) {
      var options = {
        timeZone: timeZone,
        hour: "numeric",
        minute: "2-digit",
        hour12: true
      };

      if (includeDate) {
        options.weekday = "short";
        options.year = "numeric";
        options.month = "short";
        options.day = "numeric";
      }

      displayFormatterCache.set(
        cacheKey,
        new Intl.DateTimeFormat("en-US", options)
      );
    }
    return displayFormatterCache.get(cacheKey);
  }

  function zonedParts(date, timeZone) {
    var fields = {};
    partsFormatter(timeZone).formatToParts(date).forEach(function (part) {
      if (part.type !== "literal") {
        fields[part.type] = Number(part.value);
      }
    });
    return {
      year: fields.year,
      month: fields.month,
      day: fields.day,
      hour: fields.hour,
      minute: fields.minute,
      second: fields.second
    };
  }

  function utcMsFromParts(parts) {
    var date = new Date(0);
    date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
    date.setUTCHours(parts.hour || 0, parts.minute || 0, parts.second || 0, 0);
    return date.getTime();
  }

  function validDateParts(year, month, day) {
    if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
      return false;
    }
    if (year < 1 || month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }
    var probe = new Date(utcMsFromParts({ year: year, month: month, day: day }));
    return probe.getUTCFullYear() === year &&
      probe.getUTCMonth() === month - 1 &&
      probe.getUTCDate() === day;
  }

  function sameWallMinute(parts, target) {
    return parts.year === target.year &&
      parts.month === target.month &&
      parts.day === target.day &&
      parts.hour === target.hour &&
      parts.minute === target.minute;
  }

  function possibleInstantsFor(timeZone, target) {
    if (!canUseTimeZone(timeZone)) {
      throw new Error("Unsupported timezone: " + timeZone);
    }
    if (!validDateParts(target.year, target.month, target.day)) {
      throw new Error("Invalid date");
    }
    if (!Number.isInteger(target.hour) || target.hour < 0 || target.hour > 23) {
      throw new Error("Invalid hour");
    }
    if (!Number.isInteger(target.minute) || target.minute < 0 || target.minute > 59) {
      throw new Error("Invalid minute");
    }

    var guessMs = utcMsFromParts(target);
    var startMs = guessMs - SEARCH_WINDOW_MINUTES * 60000;
    var endMs = guessMs + SEARCH_WINDOW_MINUTES * 60000;
    var matches = [];

    for (var ms = startMs; ms <= endMs; ms += 60000) {
      var instant = new Date(ms);
      if (sameWallMinute(zonedParts(instant, timeZone), target)) {
        matches.push(instant);
      }
    }

    return matches;
  }

  function numberToBase62(value) {
    if (!Number.isSafeInteger(value) || value < 0) {
      throw new Error("Base62 value must be a non-negative safe integer");
    }
    if (value === 0) {
      return "0";
    }

    var digits = "";
    var remaining = value;
    while (remaining > 0) {
      digits = BASE62[remaining % 62] + digits;
      remaining = Math.floor(remaining / 62);
    }
    return digits;
  }

  function base62ToNumber(text) {
    if (!text) {
      return null;
    }

    var value = 0;
    for (var index = 0; index < text.length; index += 1) {
      var digit = BASE62.indexOf(text[index]);
      if (digit === -1) {
        return null;
      }
      value = value * 62 + digit;
      if (!Number.isSafeInteger(value)) {
        return null;
      }
    }
    return value;
  }

  function fixedBase62(value, width) {
    var encoded = numberToBase62(value);
    if (encoded.length > width) {
      throw new Error("Base62 value exceeds fixed width");
    }
    return encoded.padStart(width, "0");
  }

  function invertTimeZoneCodeMap(zoneToCode) {
    var codeToZone = {};
    Object.keys(zoneToCode).forEach(function (zone) {
      var code = zoneToCode[zone];
      if (!/^[a-z0-9]{2,3}$/.test(code) || code === "z" || codeToZone[code]) {
        throw new Error("Invalid short timezone code: " + code);
      }
      codeToZone[code] = zone;
    });
    return codeToZone;
  }

  function decodeSlugComponent(component) {
    try {
      return decodeURIComponent(component);
    } catch (error) {
      return "";
    }
  }

  function encodeTimeZoneSlug(timeZone) {
    var canonical = canonicalTimeZone(timeZone) || timeZone;
    if (canonical === "UTC" || canonical === "Etc/UTC") {
      return "z";
    }

    if (SHORT_TZ_ZONE_TO_CODE[canonical]) {
      return SHORT_TZ_ZONE_TO_CODE[canonical];
    }

    var pieces = canonical.split("/");
    var area = pieces.shift();
    var code = TZ_AREA_TO_CODE[area];
    if (code && pieces.length > 0) {
      return code + "-" + pieces.map(encodeURIComponent).join("~");
    }

    return "x-" + canonical.split("/").map(encodeURIComponent).join("~");
  }

  function decodeTimeZoneSlug(slug) {
    if (slug === "z") {
      return "UTC";
    }

    if (SHORT_TZ_CODE_TO_ZONE[slug]) {
      return SHORT_TZ_CODE_TO_ZONE[slug];
    }

    var splitAt = slug.indexOf("-");
    if (splitAt < 1) {
      return null;
    }

    var code = slug.slice(0, splitAt);
    var rest = slug.slice(splitAt + 1);
    var pieces = rest.split("~").map(decodeSlugComponent);

    if (pieces.some(function (piece) { return piece === ""; })) {
      return null;
    }
    if (code === "x") {
      return pieces.join("/");
    }

    var area = TZ_CODE_TO_AREA[code];
    return area ? area + "/" + pieces.join("/") : null;
  }

  function encodePermalink(instant, timeZone, includeDate) {
    var encodedTime;
    if (includeDate === false) {
      var parts = zonedParts(instant, timeZone);
      encodedTime = fixedBase62(parts.hour * 60 + parts.minute, 2);
    } else {
      encodedTime = fixedBase62(
        Math.trunc(instant.getTime() / 60000) + DATED_EPOCH_OFFSET_MINUTES,
        6
      );
    }

    return "t" + encodedTime + "-" + encodeTimeZoneSlug(timeZone);
  }

  function decodePermalink(token) {
    var match = /^t([0-9A-Za-z]{2}|[0-9A-Za-z]{6})-(.+)$/.exec(token || "");
    if (!match) {
      return null;
    }

    var encodedTime = match[1];
    var timeZone = decodeTimeZoneSlug(match[2]);
    if (!timeZone || !canUseTimeZone(timeZone)) {
      return null;
    }

    if (encodedTime.length === 2) {
      var minuteOfDay = base62ToNumber(encodedTime);
      if (minuteOfDay === null || minuteOfDay > 1439) {
        return null;
      }
      return {
        hour: Math.floor(minuteOfDay / 60),
        includeDate: false,
        minute: minuteOfDay % 60,
        timeZone: canonicalTimeZone(timeZone) || timeZone
      };
    }

    var epochMinute = base62ToNumber(encodedTime);
    if (epochMinute === null) {
      return null;
    }
    var instant = new Date((epochMinute - DATED_EPOCH_OFFSET_MINUTES) * 60000);
    if (!Number.isFinite(instant.getTime())) {
      return null;
    }
    return {
      instant: instant,
      includeDate: true,
      timeZone: canonicalTimeZone(timeZone) || timeZone
    };
  }

  function formatInstant(instant, timeZone, includeDate) {
    return displayFormatter(timeZone, includeDate !== false).format(instant);
  }

  function formatZoneName(timeZone) {
    if (timeZone === "UTC") {
      return "UTC";
    }
    var pieces = timeZone.split("/");
    return pieces[pieces.length - 1].replace(/_/g, " ");
  }

  function dateSerial(parts) {
    return Math.floor(utcMsFromParts({
      year: parts.year,
      month: parts.month,
      day: parts.day
    }) / 86400000);
  }

  function dayOffsetBetween(instant, baseTimeZone, displayTimeZone) {
    return dateSerial(zonedParts(instant, displayTimeZone)) -
      dateSerial(zonedParts(instant, baseTimeZone));
  }

  function formatDayOffset(dayOffset) {
    if (dayOffset === 0) {
      return "";
    }
    return " " +
      (dayOffset > 0 ? "+" : "") +
      dayOffset +
      " day" +
      (Math.abs(dayOffset) === 1 ? "" : "s");
  }

  function displayLine(label, timeZone, instant, includeDate, dayOffset) {
    return label +
      " (" +
      formatZoneName(timeZone) +
      "): " +
      formatInstant(instant, timeZone, includeDate) +
      formatDayOffset(dayOffset || 0);
  }

  function fitSingleLine(element) {
    element.style.fontSize = "";

    var availableWidth = element.parentElement.clientWidth;
    if (!availableWidth || element.scrollWidth <= availableWidth) {
      return;
    }

    var currentSize = parseFloat(root.getComputedStyle(element).fontSize);
    if (!currentSize) {
      return;
    }

    var fittedSize = Math.floor(currentSize * availableWidth / element.scrollWidth);
    element.style.fontSize = Math.max(1, fittedSize) + "px";
  }

  function fitResultLines(dom) {
    fitSingleLine(dom.localDisplay);
    fitSingleLine(dom.organizerDisplay);
  }

  function utcLabel(instant) {
    return instant.toISOString().replace(".000Z", "Z");
  }

  function parseDateInput(value) {
    if (!value) {
      return { ok: true, value: null };
    }

    var match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) {
      return { ok: false, message: "Enter the date as YYYY-MM-DD." };
    }

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    if (year < 1970 || year > 9999 || !validDateParts(year, month, day)) {
      return { ok: false, message: "Enter a valid date from 1970 through 9999." };
    }

    return {
      ok: true,
      value: { year: year, month: month, day: day }
    };
  }

  function parseTimeInput(value) {
    var match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
    if (!match) {
      return null;
    }

    var hour = Number(match[1]);
    var minute = Number(match[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return { hour: hour, minute: minute };
  }

  function tokenFromLocation(location) {
    try {
      var url = new URL(location.href);
      var queryToken = url.searchParams.get("t");
      if (queryToken) {
        return queryToken;
      }
      var lastSegment = url.pathname.split("/").filter(Boolean).pop() || "";
      return /^(index\.html|about|about\.html)$/.test(lastSegment) ? "" : lastSegment;
    } catch (error) {
      return "";
    }
  }

  function permalinkUrl(token) {
    if (typeof window === "undefined" || !window.location || window.location.protocol === "file:") {
      return "https://worldti.me/" + token;
    }
    if (/^(localhost|127\.0\.0\.1|\[::1\])$/.test(window.location.hostname)) {
      return window.location.origin + "/?t=" + encodeURIComponent(token);
    }
    return window.location.origin + "/" + token;
  }

  function getDom(document) {
    function id(name) {
      return document.getElementById(name);
    }
    return {
      picker: id("picker"),
      timeForm: id("time-form"),
      time: id("time"),
      date: id("date"),
      timeZone: id("timezone"),
      timeZoneOptions: id("timezone-options"),
      ambiguity: id("ambiguity"),
      generatedLinkBox: id("generatedlinkbox"),
      generatedLink: id("generatedlink"),
      copyLinkRow: id("copylinkrow"),
      copyLinkButton: id("copylinkbutton"),
      copyStatus: id("copystatus"),
      generateError: id("errorgentext"),
      urlError: id("urlerror"),
      jsError: id("jserror"),
      display: id("displaytime"),
      localDisplay: id("localdisplay"),
      organizerDisplay: id("organizerdisplay"),
      showAll: id("showalllink"),
      tableFilterRow: id("tablefilterrow"),
      tableFilter: id("tablefilter"),
      timetable: id("timetable"),
      timetableBody: document.querySelector("#timetable tbody")
    };
  }

  function clearGeneratedLink(dom) {
    dom.generatedLinkBox.hidden = true;
    dom.copyLinkRow.hidden = true;
    dom.generatedLink.textContent = "";
    dom.generatedLink.removeAttribute("href");
    dom.copyLinkButton.disabled = true;
    dom.copyStatus.textContent = "";
  }

  function setGeneratedLink(dom, href) {
    dom.generatedLinkBox.hidden = false;
    dom.copyLinkRow.hidden = false;
    dom.generatedLink.textContent = href;
    dom.generatedLink.href = href;
    dom.copyLinkButton.disabled = false;
    dom.copyStatus.textContent = "";
  }

  function hideAmbiguity(dom) {
    dom.ambiguity.hidden = true;
    dom.ambiguity.textContent = "";
    delete dom.ambiguity.dataset.key;
  }

  function setError(dom, message) {
    dom.generateError.textContent = message || "";
  }

  function markDirty(dom) {
    setError(dom, "");
    hideAmbiguity(dom);
    updateGeneratedLink(dom, false);
  }

  function formKey(formData) {
    var wall = formData.wallTime;
    return [
      formData.timeZone,
      wall.year,
      wall.month,
      wall.day,
      wall.hour,
      wall.minute
    ].join("|");
  }

  function readForm(dom) {
    var timeZone = selectedTimeZone(dom);
    if (!timeZone) {
      return { ok: false, message: "Choose a valid timezone." };
    }

    var time = parseTimeInput(dom.time.value);
    if (!time) {
      return { ok: false, message: "Enter a valid time." };
    }

    var parsedDate = parseDateInput(dom.date.value);
    if (!parsedDate.ok) {
      return parsedDate;
    }

    var dateParts = parsedDate.value || zonedParts(new Date(), timeZone);
    return {
      ok: true,
      includeDate: parsedDate.value !== null,
      timeZone: timeZone,
      wallTime: {
        year: dateParts.year,
        month: dateParts.month,
        day: dateParts.day,
        hour: time.hour,
        minute: time.minute
      }
    };
  }

  function showAmbiguity(dom, formData, instants) {
    dom.ambiguity.dataset.key = formKey(formData);
    dom.ambiguity.innerHTML = "<legend>This time occurs twice in the selected timezone</legend>" +
      instants.map(function (instant, index) {
        return "<label><input type=\"radio\" name=\"occurrence\" value=\"" +
          index +
          "\"> " +
        (index === 0 ? "Earlier" : "Later") +
        ": " +
        formatInstant(instant, formData.timeZone, true) +
        " (" +
        utcLabel(instant) +
        ")</label>";
      }).join("");
    dom.ambiguity.hidden = false;
  }

  function selectedAmbiguousInstant(dom, instants) {
    var checked = dom.ambiguity.querySelector("input[name='occurrence']:checked");
    if (!checked) {
      return null;
    }
    return instants[Number(checked.value)] || null;
  }

  function updateGeneratedLink(dom, showErrors) {
    clearGeneratedLink(dom);
    setError(dom, "");

    var formData = readForm(dom);
    if (!formData.ok) {
      if (showErrors) {
        setError(dom, formData.message);
      }
      return false;
    }

    var instants = possibleInstantsFor(formData.timeZone, formData.wallTime);
    if (instants.length === 0) {
      if (showErrors) {
        setError(dom, "That local time does not exist in the selected timezone.");
      }
      return false;
    }

    var instant = instants[0];
    if (formData.includeDate && instants.length > 1) {
      var key = formKey(formData);
      if (dom.ambiguity.hidden || dom.ambiguity.dataset.key !== key) {
        showAmbiguity(dom, formData, instants);
        setError(dom, "Choose which occurrence to link to.");
        return;
      }

      instant = selectedAmbiguousInstant(dom, instants);
      if (!instant) {
        setError(dom, "Choose which occurrence to link to.");
        return false;
      }
    } else {
      hideAmbiguity(dom);
    }

    var token = encodePermalink(instant, formData.timeZone, formData.includeDate);
    setGeneratedLink(dom, permalinkUrl(token));
    return true;
  }

  function fallbackCopy(text) {
    var field = root.document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.position = "fixed";
    field.style.left = "-9999px";
    root.document.body.appendChild(field);
    field.select();
    var copied = root.document.execCommand("copy");
    field.remove();
    return copied;
  }

  function copyGeneratedLink(dom) {
    if (!dom.generatedLink.href && !updateGeneratedLink(dom, true)) {
      return;
    }

    var href = dom.generatedLink.href;
    var copied = fallbackCopy(href) ? Promise.resolve() :
      root.navigator && root.navigator.clipboard ?
        root.navigator.clipboard.writeText(href) :
        Promise.reject();

    copied.then(function () {
      dom.copyStatus.textContent = "Copied";
    }).catch(function () {
      dom.copyStatus.textContent = fallbackCopy(href) ? "Copied" : "Copy failed";
    });
  }

  function handleFormSubmit(event, dom) {
    event.preventDefault();
    copyGeneratedLink(dom);
  }

  function normalizeTimeZoneSearch(text) {
    return (text || "").toLowerCase().replace(/[\/_-]+/g, " ").trim();
  }

  function matchingTimeZones(query) {
    var normalizedQuery = normalizeTimeZoneSearch(query);
    if (!normalizedQuery) {
      return allTimeZones;
    }
    return allTimeZones.filter(function (zone) {
      return normalizeTimeZoneSearch(zone).indexOf(normalizedQuery) !== -1;
    });
  }

  function showTimeZoneOptions(dom, zones, activeIndex) {
    var hasOptions = zones.length > 0;

    dom.zoneMatches = zones;
    dom.zoneIndex = hasOptions ? activeIndex : -1;
    dom.timeZoneOptions.innerHTML = zones.map(function (zone, index) {
      return "<div class=\"timezone-option\" id=\"timezone-option-" +
        index +
        "\" data-zone=\"" +
        zone +
        "\" role=\"option\" aria-selected=\"" +
        (index === activeIndex ? "true" : "false") +
        "\">" +
        zone +
        "</div>";
    }).join("");
    dom.timeZoneOptions.hidden = !hasOptions;
    dom.timeZone.setAttribute("aria-expanded", hasOptions ? "true" : "false");
    dom.timeZone[hasOptions ? "setAttribute" : "removeAttribute"](
      "aria-activedescendant",
      "timezone-option-" + activeIndex
    );
  }

  function closeTimeZoneOptions(dom) {
    dom.zoneMatches = [];
    dom.zoneIndex = -1;
    dom.timeZoneOptions.hidden = true;
    dom.timeZone.setAttribute("aria-expanded", "false");
    dom.timeZone.removeAttribute("aria-activedescendant");
  }

  function chooseTimeZone(dom, zone) {
    dom.timeZone.value = zone;
    dom.timeZone.dataset.zone = zone;
    closeTimeZoneOptions(dom);
  }

  function selectedTimeZone(dom) {
    var value = dom.timeZone.value.trim();
    if (dom.timeZone.dataset.zone === value && canUseTimeZone(value)) {
      return canonicalTimeZone(value) || value;
    }

    var canonical = canonicalTimeZone(value);
    return canonical && canUseTimeZone(canonical) ? canonical : null;
  }

  function populateTimeZoneCombobox(dom) {
    allTimeZones = getSupportedTimeZones();
    chooseTimeZone(dom, selectedTimeZone(dom) ||
      (allTimeZones.indexOf(localTimeZone()) === -1 ? "UTC" : localTimeZone()));
  }

  function setupPicker(dom) {
    populateTimeZoneCombobox(dom);
    dom.timeForm.addEventListener("submit", function (event) {
      handleFormSubmit(event, dom);
    });

    dom.timeZone.addEventListener("input", function () {
      if (dom.timeZone.value !== dom.timeZone.dataset.zone) {
        delete dom.timeZone.dataset.zone;
      }
      showTimeZoneOptions(dom, matchingTimeZones(dom.timeZone.value), 0);
      markDirty(dom);
    });

    dom.timeZone.addEventListener("focus", function () {
      showTimeZoneOptions(dom, matchingTimeZones(dom.timeZone.value), 0);
    });

    dom.timeZone.addEventListener("keydown", function (event) {
      var zones = dom.timeZoneOptions.hidden ?
        matchingTimeZones(dom.timeZone.value) :
        dom.zoneMatches;
      var activeIndex = dom.zoneIndex < 0 ? 0 : dom.zoneIndex;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        if (zones.length === 0) {
          return;
        }
        activeIndex = (activeIndex + (event.key === "ArrowDown" ? 1 : -1) + zones.length) % zones.length;
        showTimeZoneOptions(dom, zones, activeIndex);
      } else if (event.key === "Enter" && !dom.timeZoneOptions.hidden) {
        if (zones[activeIndex]) {
          event.preventDefault();
          chooseTimeZone(dom, zones[activeIndex]);
          markDirty(dom);
        }
      } else if (event.key === "Escape") {
        closeTimeZoneOptions(dom);
      }
    });

    dom.timeZoneOptions.addEventListener("pointerdown", function (event) {
      var option = event.target.closest("[data-zone]");
      if (option) {
        event.preventDefault();
        chooseTimeZone(dom, option.dataset.zone);
        markDirty(dom);
      }
    });

    dom.timeZone.addEventListener("blur", function () {
      root.setTimeout(function () {
        closeTimeZoneOptions(dom);
      }, 100);
    });

    dom.ambiguity.addEventListener("change", function () {
      updateGeneratedLink(dom, false);
    });
    dom.copyLinkButton.addEventListener("click", function () {
      copyGeneratedLink(dom);
    });

    [dom.time, dom.date].forEach(function (field) {
      field.addEventListener("input", function () {
        markDirty(dom);
      });
      field.addEventListener("change", function () {
        markDirty(dom);
      });
    });

    updateGeneratedLink(dom, false);
    root.addEventListener("pageshow", function () {
      updateGeneratedLink(dom, false);
    });
  }

  function showErrorPage(dom, message) {
    dom.picker.hidden = true;
    dom.display.hidden = true;
    dom.urlError.textContent = message || "Error, invalid link";
    dom.urlError.hidden = false;
  }

  function resolveDecodedTime(decoded) {
    if (decoded.includeDate) {
      return {
        instant: decoded.instant,
        includeDate: true
      };
    }

    var today = zonedParts(new Date(), decoded.timeZone);
    var instants = possibleInstantsFor(decoded.timeZone, {
      year: today.year,
      month: today.month,
      day: today.day,
      hour: decoded.hour,
      minute: decoded.minute
    });

    if (instants.length === 0) {
      return {
        error: "That local time does not exist today in the organizer's timezone."
      };
    }

    return {
      instant: instants[0],
      includeDate: false
    };
  }

  function renderTimeTable(dom, instant, includeDate, baseTimeZone) {
    dom.timetableBody.textContent = "";
    getSupportedTimeZones().forEach(function (zone) {
      var dayOffset = includeDate ? 0 : dayOffsetBetween(instant, baseTimeZone, zone);
      var formattedTime = formatInstant(instant, zone, includeDate) + formatDayOffset(dayOffset);
      var row = dom.timetableBody.insertRow(-1);
      row.insertCell(-1).textContent = zone;
      row.insertCell(-1).textContent = formattedTime;
      row.dataset.filterText = normalizeTimeZoneSearch(zone + " " + formattedTime);
    });
  }

  function filterTimeTable(dom) {
    var query = normalizeTimeZoneSearch(dom.tableFilter.value);
    Array.from(dom.timetableBody.rows).forEach(function (row) {
      row.hidden = query !== "" && row.dataset.filterText.indexOf(query) === -1;
    });
  }

  function showPermalink(dom, decoded) {
    var localZone = localTimeZone();
    var resolved = resolveDecodedTime(decoded);
    if (resolved.error) {
      showErrorPage(dom, resolved.error);
      return;
    }

    dom.picker.hidden = true;
    dom.urlError.hidden = true;
    dom.display.hidden = false;

    dom.localDisplay.textContent = displayLine(
      "Your time",
      localZone,
      resolved.instant,
      resolved.includeDate,
      resolved.includeDate ? 0 : dayOffsetBetween(resolved.instant, decoded.timeZone, localZone)
    );
    dom.organizerDisplay.textContent = displayLine(
      "Organiser's time",
      decoded.timeZone,
      resolved.instant,
      resolved.includeDate
    );
    fitResultLines(dom);
    root.addEventListener("resize", function () {
      fitResultLines(dom);
    });

    dom.showAll.onclick = function () {
      renderTimeTable(dom, resolved.instant, resolved.includeDate, decoded.timeZone);
      dom.tableFilter.value = "";
      dom.tableFilterRow.hidden = false;
      dom.showAll.style.display = "none";
      dom.timetable.hidden = false;
      dom.tableFilter.focus();
    };

    dom.tableFilter.addEventListener("input", function () {
      filterTimeTable(dom);
    });
  }

  function init() {
    var document = root.document;
    if (!document) {
      return;
    }

    var dom = getDom(document);
    dom.jsError.hidden = true;

    if (!hasIntlTimeZoneSupport()) {
      dom.picker.hidden = false;
      dom.display.hidden = true;
      setError(dom, "This browser does not provide local timezone data.");
      return;
    }

    var token = tokenFromLocation(root.location);
    if (!token) {
      dom.picker.hidden = false;
      dom.display.hidden = true;
      dom.urlError.hidden = true;
      setupPicker(dom);
      return;
    }

    var decoded = decodePermalink(token);
    if (!decoded) {
      showErrorPage(dom);
      return;
    }

    showPermalink(dom, decoded);
  }

  return {
    BASE62: BASE62,
    canUseTimeZone: canUseTimeZone,
    canonicalTimeZone: canonicalTimeZone,
    dayOffsetBetween: dayOffsetBetween,
    decodePermalink: decodePermalink,
    decodeTimeZoneSlug: decodeTimeZoneSlug,
    encodePermalink: encodePermalink,
    encodeTimeZoneSlug: encodeTimeZoneSlug,
    formatInstant: formatInstant,
    getSupportedTimeZones: getSupportedTimeZones,
    init: init,
    localTimeZone: localTimeZone,
    possibleInstantsFor: possibleInstantsFor,
    zonedParts: zonedParts
  };
});
