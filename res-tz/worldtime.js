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
