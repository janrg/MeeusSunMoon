import * as moonPhases from './moonPhases.js';
import * as sunTimes from './sunTimes.js';
import * as timeConversions from './timeConversions.js';

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

export {options, formatCI, sunrise, sunset, solarNoon, yearMoonPhases,
  roundToNearestMinute, returnTimeForPNMS};
