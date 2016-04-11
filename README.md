MeeusSunMoon
============

[![MIT License][license-image]][license-url]

A JavaScript module for accurately calculating times of sunrise, solar noon, sunsets, and moon phases.
Based on "Astronomical Algorithms" by Jean Meeus.

## Dependencies

MeeusSunMoon requires [Moment.js](http://momentjs.com/) and [Moment Timezone](http://momentjs.com/timezone/)

## Documentation

### Configuration

There are two configuration options which can be set as

<code>MeeusSunMoon.roundToNearestMinute = true|false;</code>
<code>MeeusSunMoon.returnTimeForPNMS = true|false;</code>

(default values are false)

<code>roundToNearestMinute</code> rounds the reported time, up if seconds are 30+, down if less.

<code>returnTimeForPNMS</code> handles the behaviour when no sunrise or sunset time can be returned
because the specified region would be experiencing polar night or midnight sun on the date. If set to
<code>false</code>, a string is returned, either <code>"PN"</code> or <code>"MS"</code>. If set to
<code>true</code>, the return time will be 6:00 local standard time (i.e. 7:00 local time if DST is in
effect) for sunrise and 18:00 local standard time for sunset. Additionally, the moment.tz object that is
returned will be tagged inside its <code>creationData</code> property, with <code>"--"</code> for polar night
and <code>"**"</code> for midnight sun. This way, the fact that this is not an actual sunrise/sunset time
can be retrieved later, e.g. with moment-custom-info (see below).

### Usage

#### Sunrise & Sunset

<code>MeeusSunMoon.sunrise(datetime, latitude, longitude);</code>
<code>MeeusSunMoon.sunset(datetime, latitude, longitude);</code>

Returns the sunrise or sunset for the given date and location as a moment.tz object.

<code>datetime</code> is a moment.tz object designating the day for which the sunrise/set time should be calculated.
The object should either contain a definite timezone, or be in UTC, just a UTC offset will lead to unexpected behaviour

<code>latitude</code> is the geograpphic latitude in degrees (-90 to 90, North is positive, South negative).

<code>longitude</code> is the geographic longitude in degrees (-180 to 180, East is positive, West negative).

If there is no sunrise or sunset event on the given day, a string or a tagged time will be returned (see above).

#### Solar Noon

<code>MeusSunMoon.solarNoon(datetime, longitude);</code>

Returns the solar noon for the given date and location as a moment.tz object. Inputs as above.

#### Moon Phases

<code>MeeusSunMoon.yearMoonPhases(year, phase, timezone);</code>

Returns an array of the datetimes as moment.tz objects for all moons of the given phase in the year.

<code>year</code> The Gregorian year for which the phases should be returned. Note: setting e.g. <code>96</code> as
the year will NOT return phases for the year 1996 but the year 96.

<code>phase</code> Phase of the moon as an integer. <code>0</code> for new moon, <code>1</code> for first quarter,
<code>2</code> for full moon, <code>3</code> for last quarter.

<code>timezone</code> Optional. IANA timezone string, e.g. <code>"Europe/London"</code>. If not specified, times are
returned as UTC.

#### moment-custom-info

moment-custom-info is a very small plugin for moment.js which (arguable mis-) uses the <code>creationData</code> property of a moment object
to store custom meta-information, e.g. in the context of MeeusSunMoon to indicate that a given time is a fallback due to
no sunrise or sunset occuring on the given day. It makes use of the fact that the parser for the <code>String + Format</code>
constructor of moment.js ignores non-alphanumeric characters. Thus, a key of special symbols can be stored in the <code>creationData</code>
by constructing a date like this:

<code>moment("**12-25-1995", "MM-DD-YYYY");</code>

moment-custom-info provides a wrapper for <code>moment.format()</code> called <code>moment.formatCI()</code>, which in addition
to the standard format string takes an array of key-value pairs to associate a 2-character token used in the object's creation
with a string to be placed behind the standard output of <code>moment.format()</code>.

**Example:**

    var dateFormatKeys = {"**":"‡", "--":"†"};
    var myMoment = moment("**12-25-1995 06:00", "MM-DD-YYYY HH:mm");
    console.log(myMoment.formatCI("HH:mm", dateFormatKeys));

will return <code>06:00‡</code>.

## Accuracy

The algorithms themselves use many higher-order corrections in order to achieve a high degree of accuracy. To ensure a correct implementation,
I have compared over 17,000 times across 16 locations spanning extremes of latitude and longitude to outside sources such as the US Naval Observatory
and found that 97% agreed to the minute, with the rest deviating by at most one minute. The only exception to this are locations experiencing polar
night or midnight sun (i.e. within the polar circles) for which - for the days immediately preceeding and following periods of polar night or midnight
sun - the discrepancy can be larger.

<code>test/tests.html</code> can be run to verify this. When <code>maxError</code> (maximum deviation in minutes for the test to pass) in <code>test/tests.js</code>
is set to 0, about 3% of the tests will fail. When set to 1, all will pass. (For the test locations in northern and southern extremes, a few dates just before and
just after periods of polar night or midnight sun aren't tested, as the accuracy is known to suffer there.)

## Changelog

### 1.0.0

Initial release

## License

MeeusSunMoon is freely distributable under the terms of the [MIT license](LICENSE).

[license-image]: http://img.shields.io/badge/license-MIT-blue.svg
[license-url]: LICENSE
