Source code for worldti.me
==========================

[Worldti.me](https://worldti.me) provides a short URL for a specific
time, which is automatically converted across timezones.  The site is
static, with all conversion done browser-side in JavaScript.

Worldti.me does not use an external timezone API.  Timezone accuracy
comes from the browser's local IANA timezone data, exposed through the
standard `Intl` APIs.  A current browser with `Intl.DateTimeFormat` and
`Intl.supportedValuesOf("timeZone")` gives the full timezone picker; if
the picker API is unavailable, the app falls back to UTC and the
browser's local timezone.

Permalinks store the selected time and a compact slug for the
organizer's IANA timezone.  Common IANA zones use a 2-3 character code,
with the older area/location slug as a fallback for zones outside the
table.  If a date is selected, the permalink stores the exact UTC minute
of the event.  If no date is selected, the permalink stores only the
wall-clock time and timezone.  For example, `Europe/London` is stored as
`ldn`, and `America/New_York` is stored as `nyc`.

If no date is selected, Worldti.me uses today's date in the selected
timezone when the link is opened, and displays only the time.

Worldti.me is lightweight: deployed files are about 56kb before HTTP
compression.

Available under the GPLv3.0 or later.

Worldti.me includes the following library:

- [new.css](https://github.com/xz/new.css)


Testing
-------

Run the timezone and URL tests with:

```
node test-worldtime.js
```


Alternatives
------------

If you don't like [worldti.me](https://worldti.me), you may prefer
[starts-at.com](https://www.starts-at.com).  However, we think worldti.me has
several advantages:

- Short URLs
- Lightweight static files
- No tracking
- No external timezone API
- Picking a date is optional
- Open source
- Cleaner design (in our opinion!)
