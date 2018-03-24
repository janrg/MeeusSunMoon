import * as auxMath from './auxMath.js';
import * as constants from './constants.js';
import * as timeConversions from './timeConversions.js';
import {returnTimeForPNMS, roundToNearestMinute} from './index.js';

/**
 * Calculates the solar transit time on a date at a given longitude (see AA
 * p102f).
 * @param {moment} datetime Date for which transit is calculated.
 * @param {number} L Longitude.
 * @returns {moment} Solar transit time.
 */
const sunTransit = function (datetime, L) {
  const timezone = datetime.tz();
  const transit = moment.tz(
    [datetime.year(), datetime.month(), datetime.date(), 0, 0, 0], 'UTC');
  const DeltaT = timeConversions.DeltaT(transit);
  const T = timeConversions.datetimeToT(transit);
  const Theta0 = apparentSiderealTimeGreenwhich(T);
  // Want 0h TD for this, not UT
  const TD = T - (DeltaT / (3600 * 24 * 36525));
  const alpha = sunApparentRightAscension(TD);
  // Sign flip for longitude from AA as we take East as positive
  let m = (alpha - L - Theta0) / 360;
  m = normalizeM(m, datetime.utcOffset());
  const DeltaM = sunTransitCorrection(T, Theta0, DeltaT, L, m);
  m += DeltaM;
  transit.add(Math.floor(m * 3600 * 24 + 0.5), 'seconds');
  if (roundToNearestMinute) {
    transit.add(30, 'seconds');
    transit.second(0);
  }
  transit.tz(timezone);
  return transit;
};

/**
 * Calculates the sunrise or sunset time on a date at a given latitude and
 * longitude (see AA p102f).
 * @param {moment} datetime Date for which sunrise or sunset is calculated.
 * @param {number} phi Latitude.
 * @param {number} L Longitude.
 * @param {string} flag 'RISE' or 'SET' depending on which event should be
 *     calculated.
 * @returns {moment} Sunrise or sunset time.
 */
const sunRiseSet = function (datetime, phi, L, flag) {
  const timezone = datetime.tz();
  const suntime = moment.tz(
    [datetime.year(), datetime.month(), datetime.date(), 0, 0, 0], 'UTC');
  const DeltaT = timeConversions.DeltaT(suntime);
  const T = timeConversions.datetimeToT(suntime);
  const Theta0 = apparentSiderealTimeGreenwhich(T);
  // Want 0h TD for this, not UT
  const TD = T - (DeltaT / (3600 * 24 * 36525));
  const alpha = sunApparentRightAscension(TD);
  const delta = sunApparentDeclination(TD);
  const H0 = approxLocalHourAngle(phi, delta);
  // Sign flip for longitude from AA as we take East as positive
  let m0 = (alpha - L - Theta0) / 360;
  m0 = normalizeM(m0, datetime.utcOffset());
  let m;
  if (flag === 'RISE') {
    m = m0 - H0 / 360;
  } else if (flag === 'SET') {
    m = m0 + H0 / 360;
  } else {
    return false;
  }
  let counter = 0;
  let DeltaM = 1;
  // Repeat if correction is larger than ~9s
  while ((Math.abs(DeltaM) > 0.0001) && (counter < 3)) {
    DeltaM = sunRiseSetCorrection(T, Theta0, DeltaT, phi, L, m);
    m += DeltaM;
    counter++;
  }
  if (m > 0) {
    suntime.add(Math.floor(m * 3600 * 24 + 0.5), 'seconds');
  } else {
    suntime.subtract(Math.floor(Math.abs(m) * 3600 * 24 + 0.5), 'seconds');
  }
  if (roundToNearestMinute) {
    suntime.add(30, 'seconds');
    suntime.second(0);
  }
  suntime.tz(timezone);
  return suntime;
};

/**
 * Returns 06:00/18:00 (07:00/19:00 during DST) if there is no sunrise or sunset
 * on the date. If returnTimeForPNMS is true, otherwise return whether there is
 * Polar Night or Midnight Sun.
 * @param {moment} returnDate The calculated time for sunrise or sunset.
 * @param {moment} date The original date from which the event was calculated.
 * @param {int} hour Hour to which the returned datetime should be set.
 * @returns {(moment|string)} Time given by parameter 'hour' (+ correction for
 *     DST if applicable) or a string indicating that the location experiences
 *     midnight sun ('MS') or polar night ('PN') on that date.
 */
const returnPNMS = function (returnDate, date, hour) {
  if (returnTimeForPNMS) {
    if (date.isDST()) {
      hour += 1;
    }
    returnDate.tz(date.tz())
      .year(date.year())
      .month(date.month())
      .date(date.date())
      .hour(hour)
      .minute(0)
      .second(0);
  }
  return returnDate;
};

/**
 * Calculates the approximate local hour angle of the sun at sunrise or sunset.
 * @param {number} phi Latitude (see AA p102 Eq15.1).
 * @param {number} delta Apparent declination of the sun.
 * @returns {number} Approximate local hour angle.
 */
const approxLocalHourAngle = function (phi, delta) {
  const cosH0 = (auxMath.sind(-50 / 60) -
                auxMath.sind(phi) * auxMath.sind(delta)) /
                (auxMath.cosd(phi) * auxMath.cosd(delta));
  if (cosH0 < -1) {
    if (returnTimeForPNMS) {
      throw moment.tz('**2000-01-01 12:00:00', 'YYYY-MM-DD HH:mm:ss',
        'Europe/London');
    } else {
      throw 'MS';
    }
  } else if (cosH0 > 1) {
    if (returnTimeForPNMS) {
      throw moment.tz('--2000-01-01 12:00:00', 'YYYY-MM-DD HH:mm:ss',
        'Europe/London');
    } else {
      throw 'PN';
    }
  }
  const H0 = auxMath.rad2deg(Math.acos(cosH0));
  return H0;
};

/**
 * Normalizes a fractional time of day to be on the correct date.
 * @param {number} m Fractional time of day
 * @param {int} utcOffset Offset in minutes from UTC.
 * @returns {number} m Normalized m.
 */
const normalizeM = function (m, utcOffset) {
  const localM = m + utcOffset / 1440;
  if (localM < 0) {
    return m + 1;
  } else if (localM > 1) {
    return m - 1;
  }
  return m;
};

/**
 * Calculates the correction for the solar transit time (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} Theta0 Apparent sidereal time at Greenwhich.
 * @param {number} DeltaT ΔT = TT − UT.
 * @param {number} L Longitude.
 * @param {number} m Fractional time of day of the event.
 * @returns {number} Currection for the solar transit time.
 */
const sunTransitCorrection = function (T, Theta0, DeltaT, L, m) {
  const theta0 = Theta0 + 360.985647 * m;
  const n = m + DeltaT / 864000;
  const alpha = interpolatedRa(T, n);
  const H = localHourAngle(theta0, L, alpha);
  const DeltaM = -H / 360;
  return DeltaM;
};

/**
 * Calculates the correction for the sunrise/sunset time (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} Theta0 Apparent sidereal time at Greenwhich.
 * @param {number} DeltaT ΔT = TT − UT.
 * @param {number} phi Latitude.
 * @param {number} L Longitude.
 * @param {number} m Fractional time of day of the event.
 * @returns {number} Currection for the sunrise/sunset time.
 */
const sunRiseSetCorrection = function (T, Theta0, DeltaT, phi, L, m) {
  const theta0 = Theta0 + 360.985647 * m;
  const n = m + DeltaT / 864000;
  const alpha = interpolatedRa(T, n);
  const delta = interpolatedDec(T, n);
  const H = localHourAngle(theta0, L, alpha);
  const h = altitude(phi, delta, H);
  const DeltaM = (h + 50 / 60) /
    (360 * auxMath.cosd(delta) * auxMath.cosd(phi) * auxMath.sind(H));
  return DeltaM;
};

/**
 * Calculates the local hour angle of the sun (see AA p103).
 * @param {number} theta0 Sidereal time at Greenwhich in degrees.
 * @param {number} L Longitude.
 * @param {number} alpha Apparent right ascension of the sun.
 * @returns {number} Local hour angle of the sun.
 */
const localHourAngle = function (theta0, L, alpha) {
  // Signflip for longitude
  let H = auxMath.reduceAngle(theta0 + L - alpha);
  if (H > 180) { H -= 360; }
  return H;
};

/**
 * Calculates the altitude of the sun above the horizon (see AA P93 Eq13.6).
 * @param {number} phi Latitude.
 * @param {number} delta Apparent declination of the sun.
 * @param {number} H Local hour angle of the sun.
 * @returns {number} Altitude of the sun above the horizon.
 */
const altitude = function (phi, delta, H) {
  const h = auxMath.rad2deg(Math.asin(
    auxMath.sind(phi) * auxMath.sind(delta) +
    auxMath.cosd(phi) * auxMath.cosd(delta) * auxMath.cosd(H)));
  return h;
};

/**
 * Interpolates the sun's right ascension (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} n Fractional time of day of the event corrected by ΔT.
 * @returns {number} Interpolated right ascension.
 */
const interpolatedRa = function (T, n) {
  const alpha1 = sunApparentRightAscension(T - (1 / 36525));
  const alpha2 = sunApparentRightAscension(T);
  const alpha3 = sunApparentRightAscension(T + (1 / 36525));
  // I don't understand why the RA has to be interpolated with normalization
  // but the Dec without, but the returned values are wrong otherwise...
  const alpha = auxMath.interpolateFromThree(alpha1, alpha2, alpha3, n, true);
  return auxMath.reduceAngle(alpha);
};

/**
 * Interpolates the sun's declination (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} n Fractional time of day of the event corrected by ΔT.
 * @returns {number} Interpolated declination.
 */
const interpolatedDec = function (T, n) {
  const delta1 = sunApparentDeclination(T - (1 / 36525));
  const delta2 = sunApparentDeclination(T);
  const delta3 = sunApparentDeclination(T + (1 / 36525));
  const delta = auxMath.interpolateFromThree(delta1, delta2, delta3, n);
  return auxMath.reduceAngle(delta);
};

/**
 * Calculates the apparent right ascension of the sun (see AA p165 Eq25.6).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent right ascension of the sun.
 */
const sunApparentRightAscension = function (T) {
  const Omega = moonAscendingNodeLongitude(T);
  const epsilon = trueObliquityOfEcliptic(T) +
                  0.00256 * auxMath.cosd(Omega);
  const lambda = sunApparentLongitude(T);
  const alpha = auxMath.rad2deg(Math.atan2(
    auxMath.cosd(epsilon) * auxMath.sind(lambda), auxMath.cosd(lambda)));
  return auxMath.reduceAngle(alpha);
};

/**
 * Calculates the apparent declination of the sun (see AA p165 Eq25.7).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent declination of the sun.
 */
const sunApparentDeclination = function (T) {
  const Omega = moonAscendingNodeLongitude(T);
  const epsilon = trueObliquityOfEcliptic(T) +
                  0.00256 * auxMath.cosd(Omega);
  const lambda = sunApparentLongitude(T);
  const delta = auxMath.rad2deg(Math.asin(
    auxMath.sind(epsilon) * auxMath.sind(lambda)));
  return delta;
};

/**
 * Calculates the apparent sidereal time at Greenwhich (see AA p88).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent sidereal time at Greenwhich
 */
const apparentSiderealTimeGreenwhich = function (T) {
  const theta0 = meanSiderealTimeGreenwhich(T);
  const epsilon = trueObliquityOfEcliptic(T);
  const DeltaPsi = nutationInLongitude(T);
  const theta = theta0 + DeltaPsi * auxMath.cosd(epsilon);
  return auxMath.reduceAngle(theta);
};

/**
 * Calculates the mean sidereal time at Greenwhich (see AA p88 Eq12.4).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean sidereal time at Greenwhich
 */
const meanSiderealTimeGreenwhich = function (T) {
  const JD2000 = T * 36525;
  const theta0 = 280.46061837 + 360.98564736629 * JD2000 + 0.000387933 * T * T -
                 T * T * T / 38710000;
  return theta0;
};

/**
 * Calculates the true obliquity of the ecliptic (see AA p147).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} True obliquity of the ecliptic.
 */
const trueObliquityOfEcliptic = function (T) {
  const epsilon0 = meanObliquityOfEcliptic(T);
  const DeltaEpsilon = nutationInObliquity(T);
  const epsilon = epsilon0 + DeltaEpsilon;
  return epsilon;
};

/**
 * Calculates the mean obliquity of the ecliptic (see AA p147 Eq 22.3).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean obliquity of the ecliptic.
 */
const meanObliquityOfEcliptic = function (T) {
  const U = T / 100;
  const epsilon0 = auxMath.polynomial(U, constants.meanObliquityOfEcliptic);
  return epsilon0;
};

/**
 * Calculates the apparent longitude of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent longitude of the sun.
 */
const sunApparentLongitude = function (T) {
  const Sol = sunTrueLongitude(T);
  const Omega = moonAscendingNodeLongitude(T);
  const lambda = Sol - 0.00569 - 0.00478 * auxMath.sind(Omega);
  return lambda;
};

/**
 * Calculates the true longitude of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} True longitude of the sun.
 */
const sunTrueLongitude = function (T) {
  const L0 = sunMeanLongitude(T);
  const C = sunEquationOfCenter(T);
  const Sol = L0 + C;
  return Sol;
};

/**
 * Calculates the equation of center of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Equation of center of the sun.
 */
const sunEquationOfCenter = function (T) {
  const M = sunMeanAnomaly(T);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * auxMath.sind(M) +
            (0.019993 - 0.000101 * T) * auxMath.sind(2 * M) +
            0.000290 * auxMath.sind(3 * M);
  return C;
};

/**
 * Calculates the nutation in longitude of the sun (see AA p144ff).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Nutation in longitude of the sun.
 */
const nutationInLongitude = function (T) {
  const D = moonMeanElongation(T);
  const M = sunMeanAnomaly(T);
  const MPrime = moonMeanAnomaly(T);
  const F = moonArgumentOfLatitude(T);
  const Omega = moonAscendingNodeLongitude(T);
  let DeltaPsi = 0;
  let sineArg;
  for (let i = 0; i < 63; i++) {
    sineArg = constants.nutations[i][0] * D +
              constants.nutations[i][1] * M +
              constants.nutations[i][2] * MPrime +
              constants.nutations[i][3] * F +
              constants.nutations[i][4] * Omega;
    DeltaPsi += (constants.nutations[i][5] +
                 constants.nutations[i][6] * T) * auxMath.sind(sineArg);
  }
  DeltaPsi /= 36000000;
  return DeltaPsi;
};

/**
 * Calculates the nutation in obliquity of the sun (see AA p144ff).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Nutation in obliquity of the sun.
 */
const nutationInObliquity = function (T) {
  const D = moonMeanElongation(T);
  const M = sunMeanAnomaly(T);
  const MPrime = moonMeanAnomaly(T);
  const F = moonArgumentOfLatitude(T);
  const Omega = moonAscendingNodeLongitude(T);
  let DeltaEpsilon = 0;
  let cosArg;
  for (let i = 0; i < 63; i++) {
    cosArg = constants.nutations[i][0] * D +
             constants.nutations[i][1] * M +
             constants.nutations[i][2] * MPrime +
             constants.nutations[i][3] * F +
             constants.nutations[i][4] * Omega;
    DeltaEpsilon += (constants.nutations[i][7] +
                     constants.nutations[i][8] * T) * auxMath.cosd(cosArg);
  }
  DeltaEpsilon /= 36000000;
  return DeltaEpsilon;
};

/**
 * Calculates the argument of latitude of the moon (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Argument of latitude of the moon.
 */
const moonArgumentOfLatitude = function (T) {
  const F = auxMath.polynomial(T, constants.moonArgumentOfLatitude);
  return auxMath.reduceAngle(F);
};

/**
 * Calculates the longitude of the ascending node of the Moon's mean orbit on
 * the ecliptic, measured from the mean equinox of the datea (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Longitude of the asc. node of the moon's mean orbit.
 */
const moonAscendingNodeLongitude = function (T) {
  const Omega = auxMath.polynomial(T, constants.moonAscendingNodeLongitude);
  return auxMath.reduceAngle(Omega);
};

/**
 * Calculates the mean anomaly of the moon (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean anomaly of the moon.
 */
const moonMeanAnomaly = function (T) {
  const MPrime = auxMath.polynomial(T, constants.moonMeanAnomaly);
  return auxMath.reduceAngle(MPrime);
};

/**
 * Calculates the mean elongation of the moon from the sun (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean elongation of the moon from the sun.
 */
const moonMeanElongation = function (T) {
  const D = auxMath.polynomial(T, constants.moonMeanElongation);
  return auxMath.reduceAngle(D);
};

/**
 * Calculates the mean anomaly of the sun (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean anomaly of the sun.
 */
const sunMeanAnomaly = function (T) {
  const M = auxMath.polynomial(T, constants.sunMeanAnomaly);
  return auxMath.reduceAngle(M);
};

/**
 * Calculates the mean longitude of the sun referred to the mean equinox of the
 * date (see AA p163).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean longitude of the sun referred to the mean equinox of
 *     the date.
 */
const sunMeanLongitude = function (T) {
  const L0 = auxMath.polynomial(T, constants.sunMeanLongitude);
  return auxMath.reduceAngle(L0);
};

export {sunRiseSet, sunTransit, returnPNMS};
