/* eslint-env qunit */
import * as MeeusSunMoon from '../src/index.js';
import {locations, moonPhases} from './referenceTimes.js';

MeeusSunMoon.options({roundToNearestMinute: true});

QUnit.config.hidepassed = true;
const maxError = 1;

// Test that the correct times for moon phases are returned
QUnit.test('MoonPhases', function (assert) {
  const newMoons = MeeusSunMoon.yearMoonPhases(2016, 0);
  const firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1);
  const fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2);
  const lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3);
  let phaseTime;
  for (let i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], 'UTC');
    assert.ok(
      Math.abs(newMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `New Moon: ${
        newMoons[i].format('YYYY-MM-DD HH:mm')
      }/${phaseTime.format('HH:mm')}`
    );
  }
  for (let i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], 'UTC');
    assert.ok(
      Math.abs(firstQuarterMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `First Quarter: ${
        firstQuarterMoons[i].format('YYYY-MM-DD HH:mm')
      }/${phaseTime.format('HH:mm')}`
    );
  }
  for (let i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], 'UTC');
    assert.ok(
      Math.abs(fullMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `Full Moon: ${
        fullMoons[i].format('YYYY-MM-DD HH:mm')
      }/${phaseTime.format('HH:mm')}`
    );
  }
  for (let i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], 'UTC');
    assert.ok(
      Math.abs(lastQuarterMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `Last Quarter: ${
        lastQuarterMoons[i].format('YYYY-MM-DD HH:mm')
      }/${phaseTime.format('HH:mm')}`
    );
  }
});

// Now test that it works for returning moon phases in local time:
QUnit.test('MoonPhases with Timezone', function (assert) {
  const timezone = 'Pacific/Auckland';
  const newMoons = MeeusSunMoon.yearMoonPhases(2016, 0, timezone);
  const firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1, timezone);
  const fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2, timezone);
  const lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3, timezone);
  let phaseTime;
  for (let i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], 'UTC');
    phaseTime.tz(timezone);
    assert.ok(
      Math.abs(newMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `New Moon: ${
        newMoons[i].format('YYYY-MM-DD HH:mm Z')
      }/${phaseTime.format('HH:mm Z')}`
    );
  }
  for (let i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], 'UTC');
    phaseTime.tz(timezone);
    assert.ok(
      Math.abs(firstQuarterMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `First Quarter: ${
        firstQuarterMoons[i].format('YYYY-MM-DD HH:mm Z')
      }/${phaseTime.format('HH:mm Z')}`
    );
  }
  for (let i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], 'UTC');
    phaseTime.tz(timezone);
    assert.ok(
      Math.abs(fullMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `Full Moon: ${
        fullMoons[i].format('YYYY-MM-DD HH:mm Z')
      }/${phaseTime.format('HH:mm Z')}`
    );
  }
  for (let i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], 'UTC');
    phaseTime.tz(timezone);
    assert.ok(
      Math.abs(
        lastQuarterMoons[i].diff(phaseTime, 'minutes')) <= maxError,
      `Last Quarter: ${
        lastQuarterMoons[i].format('YYYY-MM-DD HH:mm Z')
      }/${phaseTime.format('HH:mm Z')}`
    );
  }
});

// Test sunrise, solar noon, and trnsit times for a range of locations for all
// of 2015
for (const {name, data, timezone, latitude, longitude} of locations) {
  QUnit.test(`Sunrise/Solar Noon/Sunset:${
    name
  }`, function (assert) { // jshint ignore:line
    for (let i = 0; i < data.length; i++) {
      const date = moment.tz(data[i][0], timezone);
      const sunrise = MeeusSunMoon.sunrise(date, latitude, longitude);
      const transit = MeeusSunMoon.solarNoon(date, longitude);
      const sunset = MeeusSunMoon.sunset(date, latitude, longitude);
      let refSunrise, refSunset;
      if (data[i][1] !== 'MS' && data[i][1] !== 'PN') {
        refSunrise = moment.tz(data[i][1], timezone);
        refSunset = moment.tz(data[i][2], timezone);
      } else {
        refSunrise = data[i][1];
        refSunset = data[i][2];
      }
      const refTransit = moment.tz(data[i][3], timezone);
      if (sunrise !== 'MS' && sunrise !== 'PN' &&
        sunset !== 'MS' && sunset !== 'PN'
      ) {
        assert.ok(
          Math.abs(sunrise.diff(refSunrise, 'minutes')) <= maxError,
          `${name} - Sunrise ${
            date.format('YYYY-MM-DD')
          } ${sunrise.format('HH:mm')}/${refSunrise.format('HH:mm')}`
        );
        assert.ok(
          Math.abs(sunset.diff(refSunset, 'minutes')) <= maxError,
          `${name} - Sunset ${
            date.format('YYYY-MM-DD')
          } ${sunset.format('HH:mm')}/${refSunset.format('HH:mm')}`
        );
      } else {
        assert.ok(
          sunrise === refSunrise,
          `${name} - Sunrise ${
            date.format('YYYY-MM-DD')
          } ${sunrise}/${refSunrise}`
        );
        assert.ok(
          sunset === refSunset,
          `${name} - Sunset ${
            date.format('YYYY-MM-DD')
          } ${sunset}/${refSunset}`
        );
      }
      assert.ok(
        Math.abs(transit.diff(refTransit, 'minutes')) <= maxError,
        `${name} - Solar Noon ${
          date.format('YYYY-MM-DD')
        } ${transit.format('HH:mm')}/${refTransit.format('HH:mm')}`
      );
    }
  });
}

// const dateFormatKeys = {'**': '‡', '--': '†'};
QUnit.test('Polar Night / Midnight Sun Marker', function (assert) {
  MeeusSunMoon.options({returnTimeForPNMS: true});
  const datePN = moment.tz('2016-07-01 12:00', 'Antarctica/McMurdo');
  const dateMS = moment.tz('2016-01-01 12:00', 'Antarctica/McMurdo');
  const datePNString = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunrise(datePN, -77.83333333, 166.6),
    'HH:mm'
  );
  const dateMSString = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunrise(dateMS, -77.83333333, 166.6),
    'HH:mm'
  );
  assert.ok(datePNString === '06:00†', `${datePNString}/06:00†`);
  assert.ok(dateMSString === '07:00‡', `${dateMSString}/07:00‡`);
});
