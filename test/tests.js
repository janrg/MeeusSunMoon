/* eslint-disable complexity */
import * as MeeusSunMoon from '../src/index.js';
import {locations, moonPhases} from './referenceTimes.js';

// Reference source now rounds down. moment.diff truncates to integer, so by not
// rounding here, the difference is the same it would be if we rounded down.
MeeusSunMoon.options({roundToNearestMinute: false});

const maxError = 1;

// Test that the correct times for moon phases are returned
it('MoonPhases', function () {
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
it('MoonPhases with Timezone', function () {
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
// of 2016
for (const {name, data, timezone, latitude, longitude} of locations) {
  it(`Sunrise/Solar Noon/Sunset:${
    name
  }`, function () {
    this.timeout(50000); // eslint-disable-line no-invalid-this
    for (let i = 0; i < data.length; i++) {
      const date = moment.tz(data[i][0], timezone);
      const sunrise = MeeusSunMoon.sunrise(date, latitude, longitude);
      const transit = MeeusSunMoon.solarNoon(date, longitude);
      const sunset = MeeusSunMoon.sunset(date, latitude, longitude);
      const civilDawn = MeeusSunMoon.civilDawn(date, latitude, longitude);
      const civilDusk = MeeusSunMoon.civilDusk(date, latitude, longitude);
      const nauticalDawn = MeeusSunMoon.nauticalDawn(date, latitude, longitude);
      const nauticalDusk = MeeusSunMoon.nauticalDusk(date, latitude, longitude);
      const astronomicalDawn = MeeusSunMoon.astronomicalDawn(
        date, latitude, longitude);
      const astronomicalDusk = MeeusSunMoon.astronomicalDusk(
        date, latitude, longitude);
      let refSunrise, refSunset;
      let refCivilDawn, refCivilDusk;
      let refNauticalDawn, refNauticalDusk;
      let refAstronomicalDawn, refAstronomicalDusk;
      if (data[i][1].length === 16) {
        refSunrise = moment.tz(data[i][1], timezone);
      } else {
        refSunrise = data[i][1];
      }
      if (data[i][2].length === 16) {
        refSunset = moment.tz(data[i][2], timezone);
      } else {
        refSunset = data[i][2];
      }
      if (data[i][3].length === 16) {
        refAstronomicalDawn = moment.tz(data[i][3], timezone);
      } else {
        refAstronomicalDawn = data[i][3];
      }
      if (data[i][4].length === 16) {
        refAstronomicalDusk = moment.tz(data[i][4], timezone);
      } else {
        refAstronomicalDusk = data[i][4];
      }
      if (data[i][5].length === 16) {
        refNauticalDawn = moment.tz(data[i][5], timezone);
      } else {
        refNauticalDawn = data[i][5];
      }
      if (data[i][6].length === 16) {
        refNauticalDusk = moment.tz(data[i][6], timezone);
      } else {
        refNauticalDusk = data[i][6];
      }
      if (data[i][7].length === 16) {
        refCivilDawn = moment.tz(data[i][7], timezone);
      } else {
        refCivilDawn = data[i][7];
      }
      if (data[i][8].length === 16) {
        refCivilDusk = moment.tz(data[i][8], timezone);
      } else {
        refCivilDusk = data[i][8];
      }
      const refTransit = moment.tz(data[i][9], timezone);
      // Sunrise & Sunset
      if (refSunrise === 'MS' || refSunrise === 'PN') {
        assert.ok(
          sunrise === refSunrise,
          `${name} - Sunrise ${
            date.format('YYYY-MM-DD')
          } ${sunrise}/${refSunrise}`
        );
      } else if (refSunrise === '') {
        assert.ok(true,
          `${name} - Sunrise ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(sunrise.diff(refSunrise, 'minutes')) <= maxError,
          `${name} - Sunrise ${
            date.format('YYYY-MM-DD')
          } ${sunrise.format('HH:mm')}/${refSunrise.format('HH:mm')}`
        );
      }
      if (refSunset === 'MS' || refSunset === 'PN') {
        assert.ok(
          sunset === refSunset,
          `${name} - Sunset ${
            date.format('YYYY-MM-DD')
          } ${sunset}/${refSunset}`
        );
      } else if (refSunset === '') {
        assert.ok(true,
          `${name} - Sunset ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(sunset.diff(refSunset, 'minutes')) <= maxError,
          `${name} - Sunset ${
            date.format('YYYY-MM-DD')
          } ${sunset.format('HH:mm')}/${refSunset.format('HH:mm')}`
        );
      }
      // Civil Dawn & Dusk
      if (refCivilDawn === 'NCD') {
        assert.ok(
          civilDawn === refCivilDawn,
          `${name} - Civil Dawn ${
            date.format('YYYY-MM-DD')
          } ${civilDawn}/${refCivilDawn}`
        );
      } else if (refCivilDawn === '') {
        assert.ok(true,
          `${name} - Civil Dawn ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(civilDawn.diff(refCivilDawn, 'minutes')) <= maxError,
          `${name} - Civil Dawn ${
            date.format('YYYY-MM-DD')
          } ${civilDawn.format('HH:mm')}/${refCivilDawn.format('HH:mm')}`
        );
      }
      if (refCivilDusk === 'NCD') {
        assert.ok(
          civilDusk === refCivilDusk,
          `${name} - Civil Dusk ${
            date.format('YYYY-MM-DD')
          } ${civilDusk}/${refCivilDusk}`
        );
      } else if (refCivilDusk === '') {
        assert.ok(true,
          `${name} - Civil Dusk ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(civilDusk.diff(refCivilDusk, 'minutes')) <= maxError,
          `${name} - Civil Dusk ${
            date.format('YYYY-MM-DD')
          } ${civilDusk.format('HH:mm')}/${refCivilDusk.format('HH:mm')}`
        );
      }
      // Nautical Dawn & Dusk
      if (refNauticalDawn === 'NND') {
        assert.ok(
          nauticalDawn === refNauticalDawn,
          `${name} - Nautical Dawn ${
            date.format('YYYY-MM-DD')
          } ${nauticalDawn}/${refNauticalDawn}`
        );
      } else if (refNauticalDawn === '') {
        assert.ok(true,
          `${name} - Nautical Dawn ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(nauticalDawn.diff(refNauticalDawn, 'minutes')) <= maxError,
          `${name} - Nautical Dawn ${
            date.format('YYYY-MM-DD')
          } ${nauticalDawn.format('HH:mm')}/${refNauticalDawn.format('HH:mm')}`
        );
      }
      if (refNauticalDusk === 'NND') {
        assert.ok(
          nauticalDusk === refNauticalDusk,
          `${name} - Nautical Dusk ${
            date.format('YYYY-MM-DD')
          } ${nauticalDusk}/${refNauticalDusk}`
        );
      } else if (refNauticalDusk === '') {
        assert.ok(true,
          `${name} - Nautical Dusk ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(nauticalDusk.diff(refNauticalDusk, 'minutes')) <= maxError,
          `${name} - Nautical Dusk ${
            date.format('YYYY-MM-DD')
          } ${nauticalDusk.format('HH:mm')}/${refNauticalDusk.format('HH:mm')}`
        );
      }
      // Astronomical Dawn & Dusk
      if (refAstronomicalDawn === 'NAD') {
        assert.ok(
          astronomicalDawn === refAstronomicalDawn,
          `${name} - Astronomical Dawn ${
            date.format('YYYY-MM-DD')
          } ${astronomicalDawn}/${refAstronomicalDawn}`
        );
      } else if (refAstronomicalDawn === '') {
        assert.ok(true,
          `${name} - Astronomical Dawn ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(astronomicalDawn.diff(
            refAstronomicalDawn, 'minutes')) <= maxError,
          `${name} - Astronomical Dawn ${
            date.format('YYYY-MM-DD')
          } ${astronomicalDawn.format('HH:mm')}/${
            refAstronomicalDawn.format('HH:mm')}`
        );
      }
      if (refAstronomicalDusk === 'NAD') {
        assert.ok(
          astronomicalDusk === refAstronomicalDusk,
          `${name} - Astronomical Dusk ${
            date.format('YYYY-MM-DD')
          } ${astronomicalDusk}/${refAstronomicalDusk}`
        );
      } else if (refAstronomicalDusk === '') {
        assert.ok(true,
          `${name} - Astronomical Dusk ${date.format('YYYY-MM-DD')} skipped.`);
      } else {
        assert.ok(
          Math.abs(astronomicalDusk.diff(
            refAstronomicalDusk, 'minutes')) <= maxError,
          `${name} - Astronomical Dusk ${
            date.format('YYYY-MM-DD')
          } ${astronomicalDusk.format('HH:mm')}/${
            refAstronomicalDusk.format('HH:mm')}`
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
it('No Event Cases', function () {
  const datePN = moment.tz('2016-07-01 12:00', 'Antarctica/McMurdo');
  const dateMS = moment.tz('2016-01-01 12:00', 'Antarctica/McMurdo');
  let sunrisePN = MeeusSunMoon.sunrise(datePN, -77.83333333, 166.6);
  let sunsetPN = MeeusSunMoon.sunset(datePN, -77.83333333, 166.6);
  let sunriseMS = MeeusSunMoon.sunrise(dateMS, -77.83333333, 166.6);
  let sunsetMS = MeeusSunMoon.sunset(dateMS, -77.83333333, 166.6);
  let civilDawn = MeeusSunMoon.civilDawn(dateMS, -77.83333333, 166.6);
  let civilDusk = MeeusSunMoon.civilDusk(dateMS, -77.83333333, 166.6);
  let nauticalDawn = MeeusSunMoon.nauticalDawn(dateMS, -77.83333333, 166.6);
  let nauticalDusk = MeeusSunMoon.nauticalDusk(dateMS, -77.83333333, 166.6);
  let astronomicalDawn = MeeusSunMoon.astronomicalDawn(
    dateMS, -77.83333333, 166.6);
  let astronomicalDusk = MeeusSunMoon.astronomicalDusk(
    dateMS, -77.83333333, 166.6);
  assert.ok(sunrisePN === 'PN', `${sunrisePN}/PN`);
  assert.ok(sunsetPN === 'PN', `${sunsetPN}/PN`);
  assert.ok(sunriseMS === 'MS', `${sunriseMS}/MS`);
  assert.ok(sunsetMS === 'MS', `${sunsetMS}/MS`);
  assert.ok(civilDawn === 'NCD', `${civilDawn}/NCD`);
  assert.ok(civilDusk === 'NCD', `${civilDusk}/NCD`);
  assert.ok(nauticalDawn === 'NND', `${nauticalDawn}/NND`);
  assert.ok(nauticalDusk === 'NND', `${nauticalDusk}/NND`);
  assert.ok(astronomicalDawn === 'NAD', `${astronomicalDawn}/NAD`);
  assert.ok(astronomicalDusk === 'NAD', `${astronomicalDusk}/NAD`);
  MeeusSunMoon.options({returnTimeForPNMS: true});
  sunrisePN = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunrise(datePN, -77.83333333, 166.6), 'HH:mm');
  sunsetPN = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunset(datePN, -77.83333333, 166.6), 'HH:mm');
  sunriseMS = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunrise(dateMS, -77.83333333, 166.6), 'HH:mm');
  sunsetMS = MeeusSunMoon.formatCI(
    MeeusSunMoon.sunset(dateMS, -77.83333333, 166.6), 'HH:mm');
  civilDawn = MeeusSunMoon.formatCI(
    MeeusSunMoon.civilDawn(dateMS, -77.83333333, 166.6), 'HH:mm');
  civilDusk = MeeusSunMoon.formatCI(
    MeeusSunMoon.civilDusk(dateMS, -77.83333333, 166.6), 'HH:mm');
  nauticalDawn = MeeusSunMoon.formatCI(
    MeeusSunMoon.nauticalDawn(dateMS, -77.83333333, 166.6), 'HH:mm');
  nauticalDusk = MeeusSunMoon.formatCI(
    MeeusSunMoon.nauticalDusk(dateMS, -77.83333333, 166.6), 'HH:mm');
  astronomicalDawn = MeeusSunMoon.formatCI(
    MeeusSunMoon.astronomicalDawn(dateMS, -77.83333333, 166.6), 'HH:mm');
  astronomicalDusk = MeeusSunMoon.formatCI(
    MeeusSunMoon.astronomicalDusk(dateMS, -77.83333333, 166.6), 'HH:mm');
  assert.ok(sunrisePN === '06:00†', `${sunrisePN}/06:00†`);
  assert.ok(sunsetPN === '18:00†', `${sunsetPN}/18:00†`);
  assert.ok(sunriseMS === '07:00‡', `${sunriseMS}/07:00‡`);
  assert.ok(sunsetMS === '19:00‡', `${sunsetMS}/19:00‡`);
  assert.ok(civilDawn === '06:30‡', `${civilDawn}/06:30‡`);
  assert.ok(civilDusk === '19:30‡', `${civilDusk}/19:30‡`);
  assert.ok(nauticalDawn === '06:00‡', `${nauticalDawn}/06:00‡`);
  assert.ok(nauticalDusk === '20:00‡', `${nauticalDusk}/20:00‡`);
  assert.ok(astronomicalDawn === '05:30‡', `${astronomicalDawn}/05:30‡`);
  assert.ok(astronomicalDusk === '20:30‡', `${astronomicalDusk}/20:30‡`);
});
