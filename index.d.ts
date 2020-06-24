declare module 'meeussunmoon' {
  import { Moment } from 'moment';

  export interface Options {
    roundToNearestMinute: boolean;
    returnTimeForPNMS: boolean;
    dateFormatKeys: {
      '**': string,
      '--': string
    };
  }

  /**
   * Sets options (roundToNearestMinute, returnTimeForPNMS, dateFormatKey) for the
   * module.
   * @param {object} options Options to be set.
   */
  export const options: (options: Options) => void;

  /**
   * Uses the extra information encoded into the moment object for dates without
   * a sunrise or sunset if returnTimeForPNMS is true to mark the output string.
   * @param {moment} datetime Input datetime.
   * @param {string} formatString Valid moment format string.
   * @returns {string} Formatted string with marker appended.
   */
  export const formatCI: (datetime: Moment, formatString: string) => void;

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
  export const sunrise: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const sunset: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const civilDawn: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const civilDusk: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const nauticalDawn: (datetime: Moment, phi: number, L: number) => Moment | string;
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
  export const nauticalDusk: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const astronomicalDawn: (datetime: Moment, phi: number, L: number) => Moment | string;

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
  export const astronomicalDusk: (datetime: Moment, phi: number, L: number) => Moment | string;

  /**
   * Calculates solar noon on the provided date.
   * @param {moment} datetime Datetime for which solar noon is calculated. Should
   *     always contain a timezone or be in UTC, lone UTC offsets might lead to
   *     unexpected behaviour.
   * @param {number} L longitude of target location.
   * @returns {moment} Time of solar noon at the given longitude.
   */
  export const solarNoon: (datetime: Moment, L: number) => Moment;

  /**
   * Calculates all moons of the given phase that occur within the given
   * Gregorian calendar year.
   * @param {int} year Year for which moon phases should be calculated.
   * @param {int} phase 0 -> new moon, 1 -> first quarter,
   *                    2 -> full moon, 3 -> last quarter.
   * @param {string} timezone Optional: IANA timezone string.
   * @returns {array} Array of moment objects for moons of the given phase.
   */
  export const yearMoonPhases: (year: number, phase: number, timezone: string) => Moment[];
}
