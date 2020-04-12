# MeeusSunMoon

[![MIT License][license-image]][license-url]

A JavaScript module for accurately calculating times of sunrise, solar noon,
sunset, as well as moon phases.

Based on "Astronomical Algorithms" by Jean Meeus.

## Documentation

### Dependencies

MeeusSunMoon requires [Luxon](https://moment.github.io/luxon/).

### Installation

#### Script Include

Compiled versions (both minified and not) are located in `dist/`.

```html
<script src="{yourjspath}/meeussunmoon.min.js"></script>
```

#### NPM

`npm install meeussunmoon`

For bundling (e.g., with Rollup) you can then import the ES6 module via

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
  returnTimeForNoEventCase: true, // default: false
  dateFormatKeys: {'SUN_HIGH': '‡', 'SUN_LOW': '†'} // default {'SUN_HIGH': '‡', 'SUN_LOW': '†'};
});
```

`roundToNearestMinute` rounds the reported time: up if seconds are 30+, down if
less.

`returnTimeForNoEventCase` handles the behaviour when no sunrise, sunset, etc.
time can be returned because the sun is too high or too low during the entire
day. If set to `false`, a string is returned, either `'SUN_HIGH'` or
`'SUN_LOW'`. If set to `true`, the return time will be 6:00 local standard
time (i.e. 7:00 local time if DST is in effect) for sunrise and 18:00 local
standard time for sunset (For civil, nautical, and astronomical dawn and dusk,
the times returned are 0:30h, 1:00h, and 1:30h earlier / later, respectively,
than for sunrise and sunset). Additionally, the DateTime object that is returned
will have a property `errorCode` set to either `'SUN_HIGH'` or `'SUN_LOW'`.
This way, the fact that this is not an actual sunrise/sunset time can be retrieved
later, e.g. with `MeeusSunMoon.formatCI`
(see below).

### Usage

#### Sunrise & Sunset

```js
MeeusSunMoon.sunrise(datetime, latitude, longitude);
MeeusSunMoon.sunset(datetime, latitude, longitude);
```

Returns the sunrise or sunset for the given date and location as a Luxon
DateTime object.

`datetime` is a Luxon DateTime object designating the day for which the sunrise/set
time should be calculated. The object should either contain a definite
timezone, or be in UTC, just a UTC offset will lead to unexpected behaviour

`latitude` is the geographic latitude in degrees (-90 to 90, North is positive,
South negative).

`longitude` is the geographic longitude in degrees (-180 to 180, East is
positive, West negative).

If there is no sunrise or sunset event on the given day, a string or a tagged
time will be returned (see above).

#### Civil, Nautical, and Astronomical Dawn & Dusk

```js
MeeusSunMoon.civilDawn(datetime, latitude, longitude);
MeeusSunMoon.civilDusk(datetime, latitude, longitude);
MeeusSunMoon.nauticalDawn(datetime, latitude, longitude);
MeeusSunMoon.nauticalDusk(datetime, latitude, longitude);
MeeusSunMoon.astronomicalDawn(datetime, latitude, longitude);
MeeusSunMoon.astronomicalDusk(datetime, latitude, longitude);
```

As above but for civil (center of the sun is 6° below the horizon), nautical
(center of the sun is 12° below the horizon), and astronomical (center of the
sun is 18° below the horizon) dawn and dusk.

If the specified event does not occur on the given day, a string or a tagged
time will be returned (see above).

#### Solar Noon

```js
MeusSunMoon.solarNoon(datetime, longitude);
```

Returns the solar noon for the given date and location as a L DateTime
object. Inputs as above.

#### Moon Phases

```js
MeeusSunMoon.yearMoonPhases(year, phase, timezone);
```

Returns an array of the datetimes as Luxon DateTime objects for all moons of the
given phase in the year.

`year` The Gregorian year for which the phases should be returned. Note: years
need to be written out in all digits, setting e.g. `96` as the year will NOT
return phases for the year 1996 but the year 96!

`phase` Phase of the moon as an integer. `0` for new moon, `1` for first
quarter, `2` for full moon, `3` for last quarter.

`timezone` Optional. IANA timezone string, e.g. `'Europe/London'`. If not
specified, times are returned as UTC.

#### formatCI

formatCI is a helper function of MeeusSunMoon which uses the custom property
attached to returned DateTimes in case of no event to provide an appropriately
marked string representation. 

By calling `MeeusSunMoon.formatCI(datetime, formatString)`, where `datetime`
is a Luxon DateTime object as above and `formatString` uses the same syntax as
`luxon.DateTime.toFormat()`, if the datetime was created with a key as described
above, a string as defined by `dateFormatKeys` is appended to the formatted date.

**Example:**
```js
// datetime, latitude, and longitude correspond to a location and time which
// experiences midnight sun
MeeusSunMoon.sunrise(datetime, latitude, longitude)
console.log(MeeusSunMoon.formatCI(sunrise, 'HH:mm'));
>> 06:00‡
```

## Accuracy

The algorithms themselves use many higher-order corrections in order to achieve
a high degree of accuracy. To ensure a correct implementation, I have compared
over 50,000 times across 16 locations spanning extremes of latitude and
longitude to outside sources such as the US Naval Observatory and
timeanddate.com and found that almost 98% agreed to the minute, with almost the
entire rest deviating by at most one minute. The only exception to this are days
immediately preceeding or following periods for which the given event does not
occur, where the discrepancy can be larger. For sunrise and sunset, this only
affects regions within the polar circles which experience polar night and
midnight sun.

`test/index.html` can be run to verify this if you downloaded the entire
repository. When `maxError` (maximum deviation in minutes for the test to pass)
in `test/tests.js` is set to 0, about 2% of the tests will fail. When set to 1,
all will pass. (Some times which fall under the exception above have been
excluded from testing, they are listed as empty strings in `referenceTimes.js`.)

Tests can also be run in the console via `npm run node-test`.

## Changelog

### 3.0.0

Switched to using Luxon instead of moment-timezone. Some API changes

### 2.1.2

Updated dependencies, use moment import as global, added coverage

### 2.1.1

Updated dependencies, fixed imports for node usage

### 2.1.0

Added functions for civil, nautical, and astronomical dawn and dusk.

### 2.0.0

Refactored into ES6 modules and distributed via node.

### 1.0.0

Initial release

## License

MeeusSunMoon is freely distributable under the terms of the
[MIT license](LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE
