import { DateTime } from 'luxon';
import { truePhase } from './moonPhases';
import { dateFormatKeys, roundToNearestMinute, settings } from './settings';
import { handleNoEventCase, sunRiseSet, sunTransit } from './sunTimes';
import { approxK, DeltaT, JDToDatetime } from './timeConversions';
import { DateTimeWithErrorCode, MoonPhase, MoonPhaseNumber, NoEventCode } from './types';

/**
 * Uses the extra information encoded into the DateTimeWithErrorCode object for dates without
 * a sun event if returnTimeForNoEventCase is true to mark the output string.
 * @param {DateTimeWithErrorCode} datetime Input datetime.
 * @param {string} formatString Valid DateTime format string.
 * @returns {string} Formatted string with marker appended.
 */
const format = (datetime: DateTimeWithErrorCode, formatString: string): string => {
    const noEventCode = datetime.errorCode;
    let datestring = datetime.toFormat(formatString);
    if (dateFormatKeys[noEventCode]) {
        datestring += dateFormatKeys[noEventCode];
    }
    return datestring;
};

/**
 * Calculates sunrise on the provided date.
 * @param {DateTime} datetime Datetime for which sunrise is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of sunrise or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const sunrise = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'RISE');
    } catch (err) {
        return handleNoEventCase(datetime, err, 6);
    }
};

/**
 * Calculates sunset on the provided date.
 * @param {DateTime} datetime Datetime for which sunset is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of sunset or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const sunset = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'SET');
    } catch (err) {
        return handleNoEventCase(datetime, err, 18);
    }
};

/**
 * Calculates civil dawn (sun 6° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which civil dawn is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of civil dawn or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const civilDawn = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'RISE', 6);
    } catch (err) {
        return handleNoEventCase(datetime, err, 5, 30);
    }
};

/**
 * Calculates civil dusk (sun 6° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which civil dusk is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of civil dusk or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const civilDusk = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'SET', 6);
    } catch (err) {
        return handleNoEventCase(datetime, err, 18, 30);
    }
};

/**
 * Calculates nautical dawn (sun 12° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which nautical dawn is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of nautical dawn or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const nauticalDawn = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'RISE', 12);
    } catch (err) {
        return handleNoEventCase(datetime, err, 5);
    }
};

/**
 * Calculates nautical dusk (sun 12° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which nautical dusk is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of nautical dusk or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const nauticalDusk = (datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'SET', 12);
    } catch (err) {
        return handleNoEventCase(datetime, err, 19);
    }
};

/**
 * Calculates astronomical dawn (sun 18° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which astronomical dawn is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of astronomical dawn or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const astronomicalDawn = (
    datetime: DateTime,
    latitude: number,
    longitude: number,
): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'RISE', 18);
    } catch (err) {
        return handleNoEventCase(datetime, err, 4, 30);
    }
};

/**
 * Calculates astronomical dusk (sun 18° below horizon) on the provided date.
 * @param {DateTime} datetime Datetime for which astronomical dusk is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} latitude Latitude of target location.
 * @param {number} longitude longitude of target location.
 * @returns {(DateTimeWithErrorCode|string)} Time of astronomical dusk or a string indicating that no
 *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
 *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
 */
const astronomicalDusk = (
    datetime: DateTime,
    latitude: number,
    longitude: number,
): DateTimeWithErrorCode | NoEventCode => {
    try {
        return sunRiseSet(datetime, latitude, longitude, 'SET', 18);
    } catch (err) {
        return handleNoEventCase(datetime, err, 19, 30);
    }
};

/**
 * Calculates solar noon on the provided date.
 * @param {DateTime} datetime Datetime for which solar noon is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} longitude longitude of target location.
 * @returns {DateTimeWithErrorCode} Time of solar noon at the given longitude.
 */
const solarNoon = (datetime: DateTime, longitude: number): DateTimeWithErrorCode => sunTransit(datetime, longitude);

/**
 * Calculates all moons of the given phase that occur within the given
 * Gregorian calendar year.
 * @param {number} year Year for which moon phases should be calculated.
 * @param {number} phase 0 -> new moon, 1 -> first quarter,
 *                    2 -> full moon, 3 -> last quarter.
 * @param {string} timezone Optional: IANA timezone string.
 * @returns {array} Array of DateTime objects for moons of the given phase.
 */
const yearMoonPhases = (year: number, phase: MoonPhaseNumber, timezone: string = 'UTC'): Array<DateTime> => {
    const yearBegin = DateTime.fromObject(
        { year, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
        { zone: timezone },
    );
    const yearEnd = DateTime.fromObject(
        { year: year + 1, month: 1, day: 1, hour: 0, minute: 0, second: 0 },
        { zone: timezone },
    );
    // this will give us k for the first new moon of the year or earlier
    let k = Math.floor(approxK(yearBegin)) - 1;
    // taking 15 events will make sure we catch every event in the year
    const phaseTimes = [];
    let JDE;
    let moonDatetime;
    let deltaT;
    for (let i = 0; i < 15; i++) {
        JDE = truePhase(k, phase);
        // we pretend it's JD and not JDE
        moonDatetime = JDToDatetime(JDE).setZone(timezone);
        // now use that to calculate deltaT
        deltaT = DeltaT(moonDatetime);
        if (deltaT > 0) {
            moonDatetime = moonDatetime.minus({ seconds: Math.round(Math.abs(deltaT)) });
        } else {
            moonDatetime = moonDatetime.plus({ seconds: Math.round(Math.abs(deltaT)) });
        }
        if (roundToNearestMinute) {
            moonDatetime = moonDatetime.plus({ seconds: 30 }).set({ second: 0 });
        }
        if (moonDatetime >= yearBegin && moonDatetime < yearEnd) {
            phaseTimes.push(moonDatetime);
        }
        k++;
    }
    return phaseTimes;
};

const yearAllMoonPhases = (year: number, timezone: string = 'UTC'): Array<MoonPhase> =>
    [
        ...yearMoonPhases(year, 0, timezone).map((datetime) => ({ datetime, phase: 0 as MoonPhaseNumber })),
        ...yearMoonPhases(year, 1, timezone).map((datetime) => ({ datetime, phase: 1 as MoonPhaseNumber })),
        ...yearMoonPhases(year, 2, timezone).map((datetime) => ({ datetime, phase: 2 as MoonPhaseNumber })),
        ...yearMoonPhases(year, 3, timezone).map((datetime) => ({ datetime, phase: 3 as MoonPhaseNumber })),
    ].sort((a, b) => a.datetime.valueOf() - b.datetime.valueOf());

export {
    format,
    sunrise,
    sunset,
    civilDawn,
    civilDusk,
    nauticalDawn,
    nauticalDusk,
    astronomicalDawn,
    astronomicalDusk,
    solarNoon,
    yearMoonPhases,
    yearAllMoonPhases,
    settings,
};
