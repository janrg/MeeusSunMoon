import * as MSS from '../src/index';
import * as luxon from 'luxon';
import { DateTime, MoonPhaseNumber } from '../src/types';
import { locations, moonPhases } from './referenceTimes';

// Reference source now rounds down. moment.diff truncates to integer, so by not
// rounding here, the difference is the same it would be if we rounded down.
MSS.settings({ roundToNearestMinute: false });

const maxError = 1;

describe('the moon phases calculation', () => {
    [
        { name: 'newMoon', phase: 0 },
        { name: 'firstQuarter', phase: 1 },
        { name: 'fullMoon', phase: 2 },
        { name: 'lastQuarter', phase: 3 },
    ].forEach(({ name, phase }) => {
        describe(`for ${name}`, () => {
            it('should return the correct time in UTC', () => {
                const moonTimes = MSS.yearMoonPhases(2016, phase as MoonPhaseNumber);
                for (let i = 0; i < moonTimes.length; i++) {
                    const refTime = dateTimeFromReferenceTime(moonPhases[name][i]);
                    expect(Math.abs(moonTimes[i].diff(refTime).minutes)).toBeLessThanOrEqual(maxError);
                }
            });

            it('should return the correct time in a given timezone', () => {
                const timezone = 'Pacific/Auckland';
                const moonTimes = MSS.yearMoonPhases(2016, phase as MoonPhaseNumber, timezone);
                for (let i = 0; i < moonTimes.length; i++) {
                    const refTime = dateTimeFromReferenceTime(moonPhases[name][i])
                        .setZone(timezone);
                    expect(Math.abs(moonTimes[i].diff(refTime).minutes)).toBeLessThanOrEqual(maxError);
                    expect(moonTimes[i].toFormat('ZZ ZZZZZ')).toEqual(refTime.toFormat('ZZ ZZZZZ'));
                }
            });
        });
    });

    it('yearAllMoonPhases should return all moon phases in the correct order', () => {
        const moonPhases = MSS.yearAllMoonPhases(2016);
        const newMoons = MSS.yearMoonPhases(2016, 0);
        const firstQuarterMoons = MSS.yearMoonPhases(2016, 1);
        const fullMoons = MSS.yearMoonPhases(2016, 2);
        const lastQuarterMoons = MSS.yearMoonPhases(2016, 3);

        expect(moonPhases.filter((entry) => entry.phase === 0).map((entry) => entry.datetime))
            .toEqual(newMoons);
        expect(moonPhases.filter((entry) => entry.phase === 1).map((entry) => entry.datetime))
            .toEqual(firstQuarterMoons);
        expect(moonPhases.filter((entry) => entry.phase === 2).map((entry) => entry.datetime))
            .toEqual(fullMoons);
        expect(moonPhases.filter((entry) => entry.phase === 3).map((entry) => entry.datetime))
            .toEqual(lastQuarterMoons);
        // @ts-ignore
        expect(moonPhases).toBeSortedBy('datetime', { coerce: true });
    });
});

describe('the solar events calculations', () => {
    locations.forEach(({ latitude, longitude, timezone, name, data }) => {
        describe(`for ${name}`, () => {
            it('should return the correct times for sunrise', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const sunrise = MSS.sunrise(date, latitude, longitude);
                    const refSunrise = getRefEventTime(times[dataIndices.SUNRISE], timezone);
                    expectCorrectTimeOrNoEventCode(date, sunrise, refSunrise);
                });
            });

            it('should return the correct times for sunset', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const sunset = MSS.sunset(date, latitude, longitude);
                    const refSunset = getRefEventTime(times[dataIndices.SUNSET], timezone);
                    expectCorrectTimeOrNoEventCode(date, sunset, refSunset);
                });
            });

            it('should return the correct times for solar noon', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const solarNoon = MSS.solarNoon(date, latitude);
                    const refSolarNoon = getRefEventTime(times[dataIndices.SOLAR_NOON], timezone);
                    expectCorrectTimeOrNoEventCode(date, solarNoon, refSolarNoon);
                });
            });

            it('should return the correct times for civil dawn', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const civilDawn = MSS.civilDawn(date, latitude, longitude);
                    const refCivilDawn = getRefEventTime(times[dataIndices.CIVIL_DAWN], timezone);
                    expectCorrectTimeOrNoEventCode(date, civilDawn, refCivilDawn);
                });
            });

            it('should return the correct times for civil dusk', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const civilDusk = MSS.civilDusk(date, latitude, longitude);
                    const refCivilDusk = getRefEventTime(times[dataIndices.CIVIL_DUSK], timezone);
                    expectCorrectTimeOrNoEventCode(date, civilDusk, refCivilDusk);
                });
            });

            it('should return the correct times for nautical dawn', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const nauticalDawn = MSS.nauticalDawn(date, latitude, longitude);
                    const refNauticalDawn = getRefEventTime(times[dataIndices.NAUTICAL_DAWN], timezone);
                    expectCorrectTimeOrNoEventCode(date, nauticalDawn, refNauticalDawn);
                });
            });

            it('should return the correct times for nautical dusk', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const nauticalDusk = MSS.nauticalDusk(date, latitude, longitude);
                    const refNauticalDusk = getRefEventTime(times[dataIndices.NAUTICAL_DUSK], timezone);
                    expectCorrectTimeOrNoEventCode(date, nauticalDusk, refNauticalDusk);
                });
            });

            it('should return the correct times for astronomical dawn', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const astronomicalDawn = MSS.astronomicalDawn(date, latitude, longitude);
                    const refAstronomicalDawn = getRefEventTime(times[dataIndices.ASTRONOMICAL_DAWN], timezone);
                    expectCorrectTimeOrNoEventCode(date, astronomicalDawn, refAstronomicalDawn);
                });
            });

            it('should return the correct times for astronomical dusk', () => {
                data.forEach((times) => {
                    const date = dateTimeFromReferenceTime(times[dataIndices.DATE], timezone);
                    const astronomicalDusk = MSS.astronomicalDusk(date, latitude, longitude);
                    const refAstronomicalDusk = getRefEventTime(times[dataIndices.ASTRONOMICAL_DUSK], timezone);
                    expectCorrectTimeOrNoEventCode(date, astronomicalDusk, refAstronomicalDusk);
                });
            });
        });
    });

    describe('when no event can be calculated', () => {
        const latitude = -77.83333333;
        const longitude = 166.6;
        const dateSunHigh = luxon.DateTime.fromISO('2016-01-01T12:00:00', { zone: 'Pacific/Auckland' });
        const dateSunLow = luxon.DateTime.fromISO('2016-07-01T12:00:00', { zone: 'Pacific/Auckland' });

        const cases = [
            { name: 'sunrise',
                method: MSS.sunrise,
                sunHigh: true,
                expectedTimeString: '07:00‡',
                expectedCustomTimeString: '07:00 (High)' },
            { name: 'sunrise',
                method: MSS.sunrise,
                sunHigh: false,
                expectedTimeString: '06:00†',
                expectedCustomTimeString: '06:00 (Low)' },
            { name: 'sunset',
                method: MSS.sunset,
                sunHigh: true,
                expectedTimeString: '19:00‡',
                expectedCustomTimeString: '19:00 (High)' },
            { name: 'sunset',
                method: MSS.sunset,
                sunHigh: false,
                expectedTimeString: '18:00†',
                expectedCustomTimeString: '18:00 (Low)' },
            { name: 'civil dawn',
                method: MSS.civilDawn,
                sunHigh: true,
                expectedTimeString: '06:30‡',
                expectedCustomTimeString: '06:30 (High)' },
            { name: 'civil dawn',
                method: MSS.civilDawn,
                sunHigh: false,
                expectedTimeString: '05:30†',
                expectedCustomTimeString: '05:30 (Low)' },
            { name: 'civil dusk',
                method: MSS.civilDusk,
                sunHigh: true,
                expectedTimeString: '19:30‡',
                expectedCustomTimeString: '19:30 (High)' },
            { name: 'civil dusk',
                method: MSS.civilDusk,
                sunHigh: false,
                expectedTimeString: '18:30†',
                expectedCustomTimeString: '18:30 (Low)' },
            { name: 'nautical dawn',
                method: MSS.nauticalDawn,
                sunHigh: true,
                expectedTimeString: '06:00‡',
                expectedCustomTimeString: '06:00 (High)' },
            { name: 'nautical dusk',
                method: MSS.nauticalDusk,
                sunHigh: true,
                expectedTimeString: '20:00‡',
                expectedCustomTimeString: '20:00 (High)' },
            { name: 'astronomical dawn',
                method: MSS.astronomicalDawn,
                sunHigh: true,
                expectedTimeString: '05:30‡',
                expectedCustomTimeString: '05:30 (High)' },
            { name: 'astronomica dusk',
                method: MSS.astronomicalDusk,
                sunHigh: true,
                expectedTimeString: '20:30‡',
                expectedCustomTimeString: '20:30 (High)' },
        ];

        describe('and returnTimeForNoEventCase is false', () => {
            cases.forEach(({ name, method, sunHigh }) => {
                it(`${name} (sun ${sunHigh ? 'high' : 'low'})`, () => {
                    MSS.settings({ returnTimeForNoEventCase: false });
                    const result = method(sunHigh ? dateSunHigh : dateSunLow, latitude, longitude);
                    expect(result).toEqual(sunHigh ? 'SUN_HIGH' : 'SUN_LOW');
                });
            });
        });

        describe('and returnTimeForNoEventCase is true', () => {
            cases.forEach(({ name, method, sunHigh, expectedTimeString }) => {
                it(`${name} (sun ${sunHigh ? 'high' : 'low'})`, () => {
                    MSS.settings({ returnTimeForNoEventCase: true });
                    const event = method(sunHigh ? dateSunHigh : dateSunLow, latitude, longitude) as DateTime;
                    const result = MSS.format(event, 'HH:mm');
                    expect(result).toEqual(expectedTimeString);
                });
            });

            cases.forEach(({ name, method, sunHigh, expectedCustomTimeString }) => {
                it(`${name} (sun ${sunHigh ? 'high' : 'low'}) (custom \`dateFormatKeys\`)`, () => {
                    MSS.settings({
                        returnTimeForNoEventCase: true,
                        dateFormatKeys: {
                            SUN_HIGH: ' (High)',
                            SUN_LOW: ' (Low)',
                        },
                    });
                    const event = method(sunHigh ? dateSunHigh : dateSunLow, latitude, longitude) as DateTime;
                    const result = MSS.format(event, 'HH:mm');
                    expect(result).toEqual(expectedCustomTimeString);
                });
            });
        });
    });
});

const dataIndices = {
    ASTRONOMICAL_DAWN: 3,
    ASTRONOMICAL_DUSK: 4,
    CIVIL_DAWN: 7,
    CIVIL_DUSK: 8,
    DATE: 0,
    NAUTICAL_DAWN: 5,
    NAUTICAL_DUSK: 6,
    SOLAR_NOON: 9,
    SUNRISE: 1,
    SUNSET: 2,
};

const dateTimeFromReferenceTime = (referenceTime, timezone = 'UTC') => luxon.DateTime.fromFormat(
    referenceTime, 'yyyy-MM-dd HH:mm', { zone: timezone });

const expectCorrectTimeOrNoEventCode = (date, eventTime, refEventTime) => {
    // eslint-disable-next-line no-empty
    if (refEventTime === '') {
    } else if (typeof eventTime === 'string') {
        expect(eventTime).toEqual(refEventTime);
    } else {
        expect(Math.abs(eventTime.diff(refEventTime).minutes)).toBeLessThanOrEqual(maxError);
    }
};

const getRefEventTime = (entry, timezone) => {
    if (entry[0] === '2') {
        return dateTimeFromReferenceTime(entry, timezone);
    }
    return entry.replace('ASTRO', 'ASTRONOMICAL');
};
