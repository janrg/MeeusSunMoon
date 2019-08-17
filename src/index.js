import * as momentNs from 'moment-timezone';
import * as moonPhases from './moonPhases.js';
import * as sunTimes from './sunTimes.js';
import * as timeConversions from './timeConversions.js';

const moment = momentNs;

let roundToNearestMinute = false;
let returnTimeForPNMS = false;
let dateFormatKeys = {'**': '‡', '--': '†'};

/**
 * Sets options (roundToNearestMinute, returnTimeForPNMS, dateFormatKey) for the
 * module.
 * @param {object} options Options to be set.
 */
const options = function (options) {
  if (typeof options.roundToNearestMinute === 'boolean') {
    roundToNearestMinute = options.roundToNearestMinute;
  }
  if (typeof options.returnTimeForPNMS === 'boolean') {
    returnTimeForPNMS = options.returnTimeForPNMS;
  }
  if (typeof options.dateFormatKeys === 'object') {
    dateFormatKeys = options.dateFormatKeys;
  }
};

/**
 * Uses the extra information encoded into the moment object for dates without
 * a sunrise or sunset if returnTimeForPNMS is true to mark the output string.
 * @param {moment} datetime Input datetime.
 * @param {string} formatString Valid moment format string.
 * @returns {string} Formatted string with marker appended.
 */
const formatCI = function (datetime, formatString) {
  const customKey = datetime.creationData().input.slice(0, 2);
  let datestring = datetime.format(formatString);
  if (dateFormatKeys[customKey]) {
    datestring += dateFormatKeys[customKey];
  }
  return datestring;
};

/**
 * Calculates sunrise on the provided date.
 * @param {moment} datetime Datetime for which sunrise is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of sunrise or a string indicating that the
 *     location experiences midnight sun ('MS') or polar night ('PN') on that
 *     date (unless returnTimeForPNMS is true).
 */
const sunrise = function (datetime, phi, L) {
  let sunrise;
  try {
    sunrise = sunTimes.sunRiseSet(datetime, phi, L, 'RISE');
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 6);
  }
  return sunrise;
};

/**
 * Calculates sunset on the provided date.
 * @param {moment} datetime Datetime for which sunset is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of sunset or a string indicating that the
 *     location experiences midnight sun ('MS') or polar night ('PN') on that
 *     date (unless returnTimeForPNMS is true).
 */
const sunset = function (datetime, phi, L) {
  let sunset;
  try {
    sunset = sunTimes.sunRiseSet(datetime, phi, L, 'SET');
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 18);
  }
  return sunset;
};

/**
 * Calculates civil dawn (sun 6° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which civil dawn is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of civil dawn or a string ('NCD') indicating
 *     that the location does not experience civil dawn on that date (unless
 *     returnTimeForPNMS is true).
 */
const civilDawn = function (datetime, phi, L) {
  let civilDawn;
  try {
    civilDawn = sunTimes.sunRiseSet(datetime, phi, L, 'RISE', 6);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 5, 30);
  }
  return civilDawn;
};

/**
 * Calculates civil dusk (sun 6° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which civil dusk is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of civil dusk or a string ('NCD') indicating
 *     that the location does not experience civil dusk on that date (unless
 *     returnTimeForPNMS is true).
 */
const civilDusk = function (datetime, phi, L) {
  let civilDusk;
  try {
    civilDusk = sunTimes.sunRiseSet(datetime, phi, L, 'SET', 6);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 18, 30);
  }
  return civilDusk;
};

/**
 * Calculates nautical dawn (sun 12° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which nautical dawn is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of nautical dawn or a string ('NND')
 *     indicating that the location does not experience nautical dawn on that
 *     date (unless returnTimeForPNMS is true).
 */
const nauticalDawn = function (datetime, phi, L) {
  let nauticalDawn;
  try {
    nauticalDawn = sunTimes.sunRiseSet(datetime, phi, L, 'RISE', 12);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 5);
  }
  return nauticalDawn;
};

/**
 * Calculates nautical dusk (sun 12° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which nautical dusk is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of nautical dusk or a string ('NND')
 *     indicating that the location does not experience nautical dusk on that
 *     date (unless returnTimeForPNMS is true).
 */
const nauticalDusk = function (datetime, phi, L) {
  let nauticalDusk;
  try {
    nauticalDusk = sunTimes.sunRiseSet(datetime, phi, L, 'SET', 12);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 19);
  }
  return nauticalDusk;
};

/**
 * Calculates astronomical dawn (sun 18° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which astronomical dawn is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of astronomical dawn or a string ('NAD')
 *     indicating that the location does not experience astronomical dawn on
 *     that date (unless returnTimeForPNMS is true).
 */
const astronomicalDawn = function (datetime, phi, L) {
  let astronomicalDawn;
  try {
    astronomicalDawn = sunTimes.sunRiseSet(datetime, phi, L, 'RISE', 18);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 4, 30);
  }
  return astronomicalDawn;
};

/**
 * Calculates astronomical dusk (sun 18° below horizon) on the provided date.
 * @param {moment} datetime Datetime for which astronomical dusk is calculated.
 *     Should always contain a timezone or be in UTC, lone UTC offsets might
 *     lead to unexpected behaviour.
 * @param {number} phi Latitude of target location.
 * @param {number} L longitude of target location.
 * @returns {(moment|string)} Time of astronomical dusk or a string ('NAD')
 *     indicating that the location does not experience astronomical dusk on
 *     that date (unless returnTimeForPNMS is true).
 */
const astronomicalDusk = function (datetime, phi, L) {
  let astronomicalDusk;
  try {
    astronomicalDusk = sunTimes.sunRiseSet(datetime, phi, L, 'SET', 18);
  } catch (err) {
    return sunTimes.returnPNMS(err, datetime, 19, 30);
  }
  return astronomicalDusk;
};

/**
 * Calculates solar noon on the provided date.
 * @param {moment} datetime Datetime for which solar noon is calculated. Should
 *     always contain a timezone or be in UTC, lone UTC offsets might lead to
 *     unexpected behaviour.
 * @param {number} L longitude of target location.
 * @returns {moment} Time of solar noon at the given longitude.
 */
const solarNoon = function (datetime, L) {
  const transit = sunTimes.sunTransit(datetime, L);
  return transit;
};

/**
 * Calculates all moons of the given phase that occur within the given
 * Gregorian calendar year.
 * @param {int} year Year for which moon phases should be calculated.
 * @param {int} phase 0 -> new moon, 1 -> first quarter,
 *                    2 -> full moon, 3 -> last quarter.
 * @param {string} timezone Optional: IANA timezone string.
 * @returns {array} Array of moment objects for moons of the given phase.
 */
const yearMoonPhases = function (year, phase, timezone) {
  const yearBegin = moment([year]);
  const yearEnd = moment([year + 1]);
  // this will give us k for the first new moon of the year or earlier
  let k = Math.floor(timeConversions.approxK(yearBegin)) - 1;
  // taking 15 events will make sure we catch every event in the year
  const phaseTimes = [];
  let JDE;
  let moonDatetime;
  let DeltaT;
  for (let i = 0; i < 15; i++) {
    JDE = moonPhases.truePhase(k, phase);
    // we pretend it's JD and not JDE
    moonDatetime = timeConversions.JDToDatetime(JDE);
    // now use that to calculate deltaT
    DeltaT = timeConversions.DeltaT(moonDatetime);
    if (DeltaT > 0) {
      moonDatetime.subtract(Math.abs(DeltaT), 'seconds');
    } else {
      moonDatetime.add(Math.abs(DeltaT), 'seconds');
    }
    if (roundToNearestMinute) {
      moonDatetime.add(30, 'seconds');
      moonDatetime.second(0);
    }
    if (typeof timezone === 'undefined') {
      timezone = 'UTC';
    }
    moonDatetime.tz(timezone);
    if ((moonDatetime.isAfter(yearBegin)) && (moonDatetime.isBefore(yearEnd))) {
      phaseTimes.push(moonDatetime);
    }
    k++;
  }
  return phaseTimes;
};

export {options, formatCI, sunrise, sunset, civilDawn, civilDusk, nauticalDawn,
  nauticalDusk, astronomicalDawn, astronomicalDusk, solarNoon, yearMoonPhases,
  roundToNearestMinute, returnTimeForPNMS};
