#!/usr/bin/env node
"use strict";

var assert = require("node:assert/strict");
var Worldtime = require("./res-tz/worldtime.js");

function iso(instant) {
  return instant.toISOString();
}

function onlyInstant(timeZone, parts) {
  var instants = Worldtime.possibleInstantsFor(timeZone, parts);
  assert.equal(instants.length, 1);
  return instants[0];
}

assert.equal(Worldtime.encodeTimeZoneSlug("UTC"), "z");
assert.doesNotThrow(function () {
  Worldtime.init();
});
assert.equal(Worldtime.decodeTimeZoneSlug("z"), "UTC");
assert.equal(Worldtime.encodeTimeZoneSlug("America/New_York"), "a-New_York");
assert.equal(Worldtime.decodeTimeZoneSlug("a-New_York"), "America/New_York");
assert.equal(
  Worldtime.decodeTimeZoneSlug("a-Argentina~Buenos_Aires"),
  "America/Argentina/Buenos_Aires"
);

assert.equal(
  iso(onlyInstant("America/New_York", {
    year: 2026,
    month: 1,
    day: 15,
    hour: 9,
    minute: 0
  })),
  "2026-01-15T14:00:00.000Z"
);

assert.equal(
  Worldtime.possibleInstantsFor("America/New_York", {
    year: 2026,
    month: 3,
    day: 8,
    hour: 2,
    minute: 30
  }).length,
  0
);

assert.deepEqual(
  Worldtime.possibleInstantsFor("America/New_York", {
    year: 2026,
    month: 11,
    day: 1,
    hour: 1,
    minute: 30
  }).map(iso),
  [
    "2026-11-01T05:30:00.000Z",
    "2026-11-01T06:30:00.000Z"
  ]
);

assert.equal(
  iso(onlyInstant("Europe/London", {
    year: 2026,
    month: 5,
    day: 7,
    hour: 21,
    minute: 0
  })),
  "2026-05-07T20:00:00.000Z"
);

assert.equal(
  iso(onlyInstant("Pacific/Auckland", {
    year: 2026,
    month: 1,
    day: 1,
    hour: 0,
    minute: 30
  })),
  "2025-12-31T11:30:00.000Z"
);

var token = Worldtime.encodePermalink(new Date("2026-05-07T20:00:00.000Z"), "Europe/London");
assert.match(token, /^t[0-9A-Za-z]{6}-e-London$/);

var decoded = Worldtime.decodePermalink(token);
assert.equal(decoded.timeZone, Worldtime.canonicalTimeZone("Europe/London"));
assert.equal(decoded.includeDate, true);
assert.equal(decoded.instant.toISOString(), "2026-05-07T20:00:00.000Z");

var noDateToken = Worldtime.encodePermalink(
  new Date("2026-05-07T20:00:00.000Z"),
  "Europe/London",
  false
);
assert.match(noDateToken, /^t[0-9A-Za-z]{2}-e-London$/);
assert.equal(noDateToken, "tkk-e-London");

var decodedNoDate = Worldtime.decodePermalink(noDateToken);
assert.equal(decodedNoDate.includeDate, false);
assert.equal(decodedNoDate.hour, 21);
assert.equal(decodedNoDate.minute, 0);
assert.equal(decodedNoDate.timeZone, Worldtime.canonicalTimeZone("Europe/London"));
assert.equal(decodedNoDate.instant, undefined);

var timeOnly = Worldtime.formatInstant(new Date("2026-05-07T20:00:00.000Z"), "Europe/London", false);
assert.equal(timeOnly, "9:00 PM");
assert.doesNotMatch(timeOnly, /2026|May|Thu|Thursday/);

assert.equal(
  Worldtime.formatInstant(new Date("2026-05-07T20:00:00.000Z"), "Europe/London", true),
  "Thu, May 7, 2026, 9:00 PM"
);

assert.equal(
  Worldtime.dayOffsetBetween(
    new Date("2026-05-07T20:00:00.000Z"),
    "Europe/London",
    "Pacific/Auckland"
  ),
  1
);

assert.equal(
  Worldtime.dayOffsetBetween(
    new Date("2025-12-31T11:30:00.000Z"),
    "Pacific/Auckland",
    "America/Los_Angeles"
  ),
  -1
);

assert.equal(
  Worldtime.dayOffsetBetween(
    new Date("2026-05-07T20:00:00.000Z"),
    "Europe/London",
    "America/Los_Angeles"
  ),
  0
);

var earlyToken = Worldtime.encodePermalink(new Date("1969-12-31T15:00:00.000Z"), "Asia/Tokyo", true);
var earlyDecoded = Worldtime.decodePermalink(earlyToken);
assert.equal(earlyDecoded.instant.toISOString(), "1969-12-31T15:00:00.000Z");
assert.equal(earlyDecoded.includeDate, true);

console.log("All worldti.me tests passed");
