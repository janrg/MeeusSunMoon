import * as constants from './constants';
import { DateTime, NoEventCode, RiseSetFlag } from './types';
import { DeltaT, datetimeToT } from './timeConversions';
import { cosd, interpolateFromThree, polynomial, rad2deg, reduceAngle, sind } from './auxMath';
import { returnTimeForNoEventCase, roundToNearestMinute } from './index';

/**
 * Calculates the solar transit time on a date at a given longitude (see AA
 * p102f).
 * @param {DateTime} datetime Date for which transit is calculated.
 * @param {number} L Longitude.
 * @returns {DateTime} Solar transit time.
 */
const sunTransit = (datetime: DateTime, L: number): DateTime => {
    const timezone = datetime.zone;
    let transit = datetime.set({ hour: 0, minute: 0, second: 0 }).setZone('UTC', { keepLocalTime: true });
    const deltaT = DeltaT(transit);
    const T = datetimeToT(transit);
    const Theta0 = apparentSiderealTimeGreenwich(T);
    // Want 0h TD for this, not UT
    const TD = T - (deltaT / (3600 * 24 * 36525));
    const alpha = sunApparentRightAscension(TD);
    // Sign flip for longitude from AA as we take East as positive
    let m = (alpha - L - Theta0) / 360;
    m = normalizeM(m, datetime.offset);
    const DeltaM = sunTransitCorrection(T, Theta0, deltaT, L, m);
    m += DeltaM;
    transit = transit.plus({ seconds: Math.floor(m * 3600 * 24 + 0.5) });
    if (roundToNearestMinute) {
        transit = transit.plus({ seconds: 30 }).set({ second: 0 });
    }
    return transit.setZone(timezone);
};

/**
 * Calculates the sunrise or sunset time on a date at a given latitude and
 * longitude (see AA p102f).
 * @param {DateTime} datetime Date for which sunrise or sunset is calculated.
 * @param {number} phi Latitude.
 * @param {number} L Longitude.
 * @param {string} flag 'RISE' or 'SET' depending on which event should be
 *     calculated.
 * @param {number} offset number of degrees below the horizon for the desired
 *     event (50/60 for sunrise/set, 6 for civil, 12 for nautical, 18 for
 *     astronomical dawn/dusk.
 * @returns {DateTime} Sunrise or sunset time.
 */
// eslint-disable-next-line complexity,require-jsdoc
const sunRiseSet = (datetime: DateTime, phi: number, L: number, flag: RiseSetFlag, offset: number = 50 / 60):
    DateTime => {
    const timezone = datetime.zone;
    let suntime = datetime.set({ hour: 0, minute: 0, second: 0 }).setZone('UTC', { keepLocalTime: true });
    const deltaT = DeltaT(suntime);
    const T = datetimeToT(suntime);
    const Theta0 = apparentSiderealTimeGreenwich(T);
    // Want 0h TD for this, not UT
    const TD = T - (deltaT / (3600 * 24 * 36525));
    const alpha = sunApparentRightAscension(TD);
    const delta = sunApparentDeclination(TD);
    const H0 = approxLocalHourAngle(phi, delta, offset);
    // Sign flip for longitude from AA as we take East as positive
    let m0 = (alpha - L - Theta0) / 360;
    m0 = normalizeM(m0, datetime.offset);
    let m;
    if (flag === 'RISE') {
        m = m0 - H0 / 360;
    } else {
        m = m0 + H0 / 360;
    }
    let counter = 0;
    let DeltaM = 1;
    // Repeat if correction is larger than ~9s
    while ((Math.abs(DeltaM) > 0.0001) && (counter < 3)) {
        DeltaM = sunRiseSetCorrection(T, Theta0, deltaT, phi, L, m, offset);
        m += DeltaM;
        counter++;
    }
    if (m > 0) {
        suntime = suntime.plus({ seconds: Math.floor(m * 3600 * 24 + 0.5) });
    } else {
        suntime = suntime.minus({ seconds: Math.floor(m * 3600 * 24 + 0.5) });
    }
    if (roundToNearestMinute) {
        suntime = suntime.plus({ seconds: 30 }).set({ second: 0 });
    }
    return suntime.setZone(timezone);
};

/**
 * Returns a fixed time as given by the hour parameter, an hour later during DST) if the
 * specified event does not occur on the date and returnTimeForNoEventCase is true. If
 * false, return whether the reason for no event is the sun being too high ('SUN_HIGH')
 * or too low ('SUN_LOW').
 * @param {DateTime} date The original date from which the event was calculated.
 * @param {string|undefined} errorCode The error code in case no event was found
 * @param {number} hour Hour to which the returned datetime should be set.
 * @param {number} minute Minute to which the returned datetime should be set.
 * @returns {(DateTime|string)} Time given by parameter 'hour' (+ correction for
 *     DST if applicable) or a string indicating why there was no event ('SUN_HIGH'
 *     or 'SUN_LOW')
 */
const handleNoEventCase = (date: DateTime, errorCode: NoEventCode, hour: number, minute: number = 0):
    (DateTime | NoEventCode) => {
    if (returnTimeForNoEventCase) {
        const returnDate = date.set({ hour, minute, second: 0 }).plus({ minutes: date.isInDST ? 60 : 0 });
        (returnDate as DateTime).errorCode = errorCode;
        return returnDate;
    }
    return errorCode;
};

/**
 * Calculates the approximate local hour angle of the sun at sunrise or sunset.
 * @param {number} phi Latitude (see AA p102 Eq15.1).
 * @param {number} delta Apparent declination of the sun.
 * @param {number} offset number of degrees below the horizon for the desired
 *     event (50/60 for sunrise/set, 6 for civil, 12 for nautical, 18 for
 *     astronomical dawn/dusk.
 * @returns {number} Approximate local hour angle.
 */
const approxLocalHourAngle = (phi: number, delta: number, offset: number): number => {
    const cosH0 = (sind(-offset) -
        sind(phi) * sind(delta)) /
        (cosd(phi) * cosd(delta));
    if (cosH0 < -1) {
        throw noEventCodes.SUN_HIGH;
    } else if (cosH0 > 1) {
        throw noEventCodes.SUN_LOW;
    }
    return rad2deg(Math.acos(cosH0));
};

/**
 * Normalizes a fractional time of day to be on the correct date.
 * @param {number} m Fractional time of day
 * @param {number} utcOffset Offset in minutes from UTC.
 * @returns {number} m Normalized m.
 */
const normalizeM = (m: number, utcOffset: number): number => {
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
 * @param {number} Theta0 Apparent sidereal time at Greenwich.
 * @param {number} deltaT ΔT = TT − UT.
 * @param {number} L Longitude.
 * @param {number} m Fractional time of day of the event.
 * @returns {number} Currection for the solar transit time.
 */
const sunTransitCorrection = (T: number, Theta0: number, deltaT: number, L: number, m: number): number => {
    const theta0 = Theta0 + 360.985647 * m;
    const n = m + deltaT / 864000;
    const alpha = interpolatedRa(T, n);
    const H = localHourAngle(theta0, L, alpha);
    return -H / 360;
};

/**
 * Calculates the correction for the sunrise/sunset time (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} Theta0 Apparent sidereal time at Greenwich.
 * @param {number} deltaT ΔT = TT − UT.
 * @param {number} phi Latitude.
 * @param {number} L Longitude.
 * @param {number} m Fractional time of day of the event.
 * @param {number} offset number of degrees below the horizon for the desired
 *     event (50/60 for sunrise/set, 6 for civil, 12 for nautical, 18 for
 *     astronomical dawn/dusk.
 * @returns {number} Correction for the sunrise/sunset time.
 */
const sunRiseSetCorrection =
    (T: number, Theta0: number, deltaT: number, phi: number, L: number, m: number, offset: number): number => {
        const theta0 = Theta0 + 360.985647 * m;
        const n = m + deltaT / 864000;
        const alpha = interpolatedRa(T, n);
        const delta = interpolatedDec(T, n);
        const H = localHourAngle(theta0, L, alpha);
        const h = altitude(phi, delta, H);
        return (h + offset) / (360 * cosd(delta) * cosd(phi) * sind(H));
    };

/**
 * Calculates the local hour angle of the sun (see AA p103).
 * @param {number} theta0 Sidereal time at Greenwich in degrees.
 * @param {number} L Longitude.
 * @param {number} alpha Apparent right ascension of the sun.
 * @returns {number} Local hour angle of the sun.
 */
const localHourAngle = (theta0: number, L: number, alpha: number): number => {
    // Sign flip for longitude
    let H = reduceAngle(theta0 + L - alpha);
    if (H > 180) {
        H -= 360;
    }
    return H;
};

/**
 * Calculates the altitude of the sun above the horizon (see AA P93 Eq13.6).
 * @param {number} phi Latitude.
 * @param {number} delta Apparent declination of the sun.
 * @param {number} H Local hour angle of the sun.
 * @returns {number} Altitude of the sun above the horizon.
 */
const altitude = (phi: number, delta: number, H: number): number => rad2deg(Math.asin(
    sind(phi) * sind(delta) + cosd(phi) * cosd(delta) * cosd(H)));

/**
 * Interpolates the sun's right ascension (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} n Fractional time of day of the event corrected by ΔT.
 * @returns {number} Interpolated right ascension.
 */
const interpolatedRa = (T: number, n: number): number => {
    const alpha1 = sunApparentRightAscension(T - (1 / 36525));
    const alpha2 = sunApparentRightAscension(T);
    const alpha3 = sunApparentRightAscension(T + (1 / 36525));
    const alpha = interpolateFromThree(alpha1, alpha2, alpha3, n, true);
    return reduceAngle(alpha);
};

/**
 * Interpolates the sun's declination (see AA p103).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @param {number} n Fractional time of day of the event corrected by ΔT.
 * @returns {number} Interpolated declination.
 */
const interpolatedDec = (T: number, n: number): number => {
    const delta1 = sunApparentDeclination(T - (1 / 36525));
    const delta2 = sunApparentDeclination(T);
    const delta3 = sunApparentDeclination(T + (1 / 36525));
    const delta = interpolateFromThree(delta1, delta2, delta3, n);
    return reduceAngle(delta);
};

/**
 * Calculates the apparent right ascension of the sun (see AA p165 Eq25.6).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent right ascension of the sun.
 */
const sunApparentRightAscension = (T: number): number => {
    const Omega = moonAscendingNodeLongitude(T);
    const epsilon = trueObliquityOfEcliptic(T) + 0.00256 * cosd(Omega);
    const lambda = sunApparentLongitude(T);
    const alpha = rad2deg(Math.atan2(cosd(epsilon) * sind(lambda), cosd(lambda)));
    return reduceAngle(alpha);
};

/**
 * Calculates the apparent declination of the sun (see AA p165 Eq25.7).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent declination of the sun.
 */
const sunApparentDeclination = (T: number): number => {
    const Omega = moonAscendingNodeLongitude(T);
    const epsilon = trueObliquityOfEcliptic(T) + 0.00256 * cosd(Omega);
    const lambda = sunApparentLongitude(T);
    return rad2deg(Math.asin(sind(epsilon) * sind(lambda)));
};

/**
 * Calculates the apparent sidereal time at Greenwich (see AA p88).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent sidereal time at Greenwich
 */
const apparentSiderealTimeGreenwich = (T: number): number => {
    const theta0 = meanSiderealTimeGreenwich(T);
    const epsilon = trueObliquityOfEcliptic(T);
    const DeltaPsi = nutationInLongitude(T);
    const theta = theta0 + DeltaPsi * cosd(epsilon);
    return reduceAngle(theta);
};

/**
 * Calculates the mean sidereal time at Greenwich (see AA p88 Eq12.4).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean sidereal time at Greenwich
 */
const meanSiderealTimeGreenwich = (T: number): number => {
    const JD2000 = T * 36525;
    return 280.46061837 + 360.98564736629 * JD2000 + 0.000387933 * T ** 2 - T ** 3 / 38710000;
};

/**
 * Calculates the true obliquity of the ecliptic (see AA p147).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} True obliquity of the ecliptic.
 */
const trueObliquityOfEcliptic = (T: number): number => {
    const epsilon0 = meanObliquityOfEcliptic(T);
    const DeltaEpsilon = nutationInObliquity(T);
    return epsilon0 + DeltaEpsilon;
};

/**
 * Calculates the mean obliquity of the ecliptic (see AA p147 Eq 22.3).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean obliquity of the ecliptic.
 */
const meanObliquityOfEcliptic = (T: number): number => {
    const U = T / 100;
    return polynomial(U, constants.meanObliquityOfEcliptic);
};

/**
 * Calculates the apparent longitude of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Apparent longitude of the sun.
 */
const sunApparentLongitude = (T: number): number => {
    const Sol = sunTrueLongitude(T);
    const Omega = moonAscendingNodeLongitude(T);
    return Sol - 0.00569 - 0.00478 * sind(Omega);
};

/**
 * Calculates the true longitude of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} True longitude of the sun.
 */
const sunTrueLongitude = (T: number): number => {
    const L0 = sunMeanLongitude(T);
    const C = sunEquationOfCenter(T);
    return L0 + C;
};

/**
 * Calculates the equation of center of the sun (see AA p164).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Equation of center of the sun.
 */
const sunEquationOfCenter = (T: number): number => {
    const M = sunMeanAnomaly(T);
    return (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * sind(M) +
        (0.019993 - 0.000101 * T) * sind(2 * M) + 0.000290 * sind(3 * M);
};

/**
 * Calculates the nutation in longitude of the sun (see AA p144ff).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Nutation in longitude of the sun.
 */
const nutationInLongitude = (T: number): number => {
    const D = moonMeanElongation(T);
    const M = sunMeanAnomaly(T);
    const MPrime = moonMeanAnomaly(T);
    const F = moonArgumentOfLatitude(T);
    const Omega = moonAscendingNodeLongitude(T);
    let DeltaPsi = 0;
    let sineArg;
    for (let i = 0; i < 63; i++) {
        sineArg = constants.nutations[i][0] * D + constants.nutations[i][1] * M + constants.nutations[i][2] * MPrime +
            constants.nutations[i][3] * F + constants.nutations[i][4] * Omega;
        DeltaPsi += (constants.nutations[i][5] + constants.nutations[i][6] * T) * sind(sineArg);
    }
    return DeltaPsi / 36000000;
};

/**
 * Calculates the nutation in obliquity of the sun (see AA p144ff).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Nutation in obliquity of the sun.
 */
const nutationInObliquity = (T: number): number => {
    const D = moonMeanElongation(T);
    const M = sunMeanAnomaly(T);
    const MPrime = moonMeanAnomaly(T);
    const F = moonArgumentOfLatitude(T);
    const Omega = moonAscendingNodeLongitude(T);
    let DeltaEpsilon = 0;
    let cosArg;
    for (let i = 0; i < 63; i++) {
        cosArg = constants.nutations[i][0] * D + constants.nutations[i][1] * M + constants.nutations[i][2] * MPrime +
            constants.nutations[i][3] * F + constants.nutations[i][4] * Omega;
        DeltaEpsilon += (constants.nutations[i][7] + constants.nutations[i][8] * T) * cosd(cosArg);
    }
    return DeltaEpsilon / 36000000;
};

/**
 * Calculates the argument of latitude of the moon (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Argument of latitude of the moon.
 */
const moonArgumentOfLatitude = (T: number): number => {
    const F = polynomial(T, constants.moonArgumentOfLatitude);
    return reduceAngle(F);
};

/**
 * Calculates the longitude of the ascending node of the Moon's mean orbit on
 * the ecliptic, measured from the mean equinox of the datea (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Longitude of the asc. node of the moon's mean orbit.
 */
const moonAscendingNodeLongitude = (T: number): number => {
    const Omega = polynomial(T, constants.moonAscendingNodeLongitude);
    return reduceAngle(Omega);
};

/**
 * Calculates the mean anomaly of the moon (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean anomaly of the moon.
 */
const moonMeanAnomaly = (T: number): number => {
    const MPrime = polynomial(T, constants.moonMeanAnomaly);
    return reduceAngle(MPrime);
};

/**
 * Calculates the mean elongation of the moon from the sun (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean elongation of the moon from the sun.
 */
const moonMeanElongation = (T: number): number => {
    const D = polynomial(T, constants.moonMeanElongation);
    return reduceAngle(D);
};

/**
 * Calculates the mean anomaly of the sun (see AA p144).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean anomaly of the sun.
 */
const sunMeanAnomaly = (T: number): number => {
    const M = polynomial(T, constants.sunMeanAnomaly);
    return reduceAngle(M);
};

/**
 * Calculates the mean longitude of the sun referred to the mean equinox of the
 * date (see AA p163).
 * @param {number} T Fractional number of Julian centuries since
 *     2000-01-01T12:00:00Z.
 * @returns {number} Mean longitude of the sun referred to the mean equinox of
 *     the date.
 */
const sunMeanLongitude = (T: number): number => {
    const L0 = polynomial(T, constants.sunMeanLongitude);
    return reduceAngle(L0);
};

const noEventCodes = {
    SUN_HIGH: 'SUN_HIGH',
    SUN_LOW: 'SUN_LOW',
};

export { sunRiseSet, sunTransit, handleNoEventCase };
