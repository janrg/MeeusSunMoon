MeeusSunMoon
============

[![MIT License][license-image]][license-url]

A JavaScript module for accurately calculating times of sunrise, solar noon,
sunset, as well as moon phases.

Based on "Astronomical Algorithms" by Jean Meeus.



## Documentation

### Dependencies

MeeusSunMoon requires [Moment.js](http://momentjs.com/) and
[Moment Timezone](http://momentjs.com/timezone/)

### Installation

#### Script Include

Compiled versions (both minified and not) are located in `dist/`. Since ES6
module support of currently used browsers is still limited, the versions not
ending in `-es` are recommended for most use cases.

```html
<script src="{yourjspath}/meeussunmoon.min.js"></script>
```

The dependencies are best included from a CDN, such as CDNJS:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.22.0/moment-with-locales.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/moment-timezone/0.5.14/moment-timezone-with-data.min.js"></script>
```
(Exact bundles depending on requirements)

#### NPM

`npm install meeussunmoon`

For bundling (e.g. with rollup) you can then import the ES6 module via

```js
import MeeusSunMoon from 'meeussunmoon'
```

or directly use it in the browser via

```js
import MeeusSunMoon from 'node_modules/meeussunmoon/dist/meeussunmoon-es.js'
```

### Configuration

There are three configuration options that can be set as

```js
MeeusSunMoon.options({
  roundToNearestMinute: true, // default: false
  returnTimeForPNMS: true, // default: false
  dateFormatKeys: {'**': '‡', '--': '†'} // default {'**': '‡', '--': '†'};
})
```

`roundToNearestMinute` rounds the reported time: up if seconds are 30+, down if
less.

`returnTimeForPNMS` handles the behaviour when no sunrise or sunset time can be
returned because the specified region would be experiencing polar night or
midnight sun on the date. If set to `false`, a string is returned, either `'PN'`
or `'MS'`. If set to `true`, the return time will be 6:00 local standard time
(i.e. 7:00 local time if DST is in effect) for sunrise and 18:00 local standard
time for sunset. Additionally, the moment.tz object that is returned will be
tagged inside its `creationData` property, with `'--'` for polar night and
`'**'` for midnight sun. This way, the fact that this is not an actual
sunrise/sunset time can be retrieved later, e.g. with `MeeusSunMoon.formatCI`
(see below).

### Usage

#### Sunrise & Sunset

```js
MeeusSunMoon.sunrise(datetime, latitude, longitude);
MeeusSunMoon.sunset(datetime, latitude, longitude);
```

Returns the sunrise or sunset for the given date and location as a moment.tz
object.

`datetime` is a moment.tz object designating the day for which the sunrise/set
time should be calculated. The object should either contain a definite timezone,
or be in UTC, just a UTC offset will lead to unexpected behaviour

`latitude` is the geographic latitude in degrees (-90 to 90, North is positive,
South negative).

`longitude` is the geographic longitude in degrees (-180 to 180, East is
positive, West negative).

If there is no sunrise or sunset event on the given day, a string or a tagged
time will be returned (see above).

#### Solar Noon

```js
MeusSunMoon.solarNoon(datetime, longitude);
```

Returns the solar noon for the given date and location as a moment.tz object.
Inputs as above.

#### Moon Phases

```js
MeeusSunMoon.yearMoonPhases(year, phase, timezone);
```

Returns an array of the datetimes as moment.tz objects for all moons of the
given phase in the year.

`year` The Gregorian year for which the phases should be returned. Note: years
need to be written out in all digits, setting e.g. `96` as the year will NOT
return phases for the year 1996 but the year 96!

`phase` Phase of the moon as an integer. `0` for new moon, `1` for first
quarter, `2` for full moon, `3` for last quarter.

`timezone` Optional. IANA timezone string, e.g. `'Europe/London'`. If not
specified, times are returned as UTC.

#### formatCI

formatCI is a helper function of MeeusSunMoon which (arguable mis-) uses the
`creationData` property of a moment object to store custom meta-information,
in this context to indicate that a given time is a fallback due to no sunrise or
sunset occuring on the given day. It makes use of the fact that the parser for
the `String + Format` constructor of moment.js ignores non-alphanumeric
characters. Thus, a key of special symbols can be stored in the `creationData`
by constructing a date like this:

```js
moment('**12-25-1995', 'MM-DD-YYYY');
```

By calling `MeeusSunMoon.formatCI(datetime, formatString)`, where `datetime`
is a moment object as above and `formatString` uses the same syntax as
`moment.format()`, if the datetime was created with a key as described above,
a string as defined by `dateFormatKeys` is appended to the formatted date.

**Example:**
```js
var myMoment = moment("**12-25-1995 06:00", "MM-DD-YYYY HH:mm");
console.log(MeeusSunMoon.formatCI(myMoment, "HH:mm"));
>> 06:00‡
```

## Accuracy

The algorithms themselves use many higher-order corrections in order to achieve
a high degree of accuracy. To ensure a correct implementation, I have compared
over 17,000 times across 16 locations spanning extremes of latitude and
longitude to outside sources such as the US Naval Observatory and found that 97%
agreed to the minute, with the rest deviating by at most one minute. The only
exception to this are locations experiencing polar night or midnight sun (i.e.
within the polar circles) for which - for the days immediately preceeding and
following periods of polar night or midnight sun - the discrepancy can be
larger.

`test/index.html` can be run to verify this if you downloaded the entire
repository. When `maxError` (maximum deviation in minutes for the test to pass)
in `test/tests.js` is set to 0, about 3% of the tests will fail. When set to 1,
all will pass. (For the test locations in northern and southern extremes, a few
dates just before and just after periods of polar night or midnight sun aren't
tested, as the accuracy is known to suffer there.)

Tests can also be run in the console via `npm run node-test`.

## Changelog

### 2.0.0

Refactored into ES6 modules and distributed via node.

### 1.0.0

Initial release

## License

MeeusSunMoon is freely distributable under the terms of the [MIT license](LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE
