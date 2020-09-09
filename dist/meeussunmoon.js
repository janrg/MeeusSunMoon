/**
 * @license MeeusSunMoon v3.0.0
 * (c) 2018 Jan Greis
 * licensed under MIT
 */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('luxon')) :
    typeof define === 'function' && define.amd ? define(['exports', 'luxon'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MeeusSunMoon = {}, global.luxon));
}(this, (function (exports, luxon) { 'use strict';

    /**
     * Converts angles in degrees to radians.
     * @param {number} deg Angle in degrees.
     * @returns {number} Angle in radians.
     */
    const deg2rad = (deg) => deg * 0.017453292519943295;
    /**
     * Converts angles in radians to degrees.
     * @param {number} rad Angle in radians.
     * @returns {number} Angle in degrees.
     */
    const rad2deg = (rad) => rad * 57.29577951308232;
    /**
     * Calculates the sine of an angle given in degrees.
     * @param {number} deg Angle in degrees.
     * @returns {number} Sine of the angle.
     */
    const sind = (deg) => Math.sin(deg2rad(deg));
    /**
     * Calculates the cosine of an angle given in degrees.
     * @param {number} deg Angle in degrees.
     * @returns {number} Cosine of the angle.
     */
    const cosd = (deg) => Math.cos(deg2rad(deg));
    /**
     * Reduces an angle to the interval 0-360°.
     * @param {number} angle Angle in degrees.
     * @returns {number} Reduced angle in degrees.
     */
    const reduceAngle = (angle) => angle - (360 * Math.floor(angle / 360));
    /**
     * Evaluates a polynomial in the form A + Bx + Cx^2...
     * @param {number} variable Value of x in the polynomial.
     * @param {array} coeffs Array of coefficients [A, B, C...].
     * @returns {number} Sum of the polynomial.
     */
    const polynomial = (variable, coeffs) => {
        let varPower = 1;
        return coeffs.reduce((accumulator, currentValue) => {
            accumulator += varPower * currentValue;
            varPower *= variable;
            return accumulator;
        }, 0.0);
    };
    /**
     * Interpolates a value from 3 known values (see AA p24 Eq3.3).
     * @param {number} y1 Start value of the interval.
     * @param {number} y2 Middle value of the interval.
     * @param {number} y3 End value of the interval.
     * @param {number} n Location (-0.5 >= n >= 0.5) of result in the interval.
     * @param {boolean} normalize Whether the final result should be normalized.
     * @returns {number} Interpolated result.
     */
    const interpolateFromThree = (y1, y2, y3, n, normalize = false) => {
        let a = y2 - y1;
        let b = y3 - y2;
        if (typeof normalize !== 'undefined' && normalize) {
            if (a < 0) {
                a += 360;
            }
            if (b < 0) {
                b += 360;
            }
        }
        const c = b - a;
        return y2 + (n / 2) * (a + b + n * c);
    };

    /**
     * Converts a datetime in UTC to the corresponding Julian Date (see AA p60f).
     * @param {DateTime} datetime Datetime to be converted.
     * @returns {number} Julian date (fractional number of days since 1 January
     *     4713BC according to the proleptic Julian calendar.
     */
    const datetimeToJD = (datetime) => {
        let Y = datetime.year;
        let M = datetime.month;
        const D = datetime.day + (datetime.hour + (datetime.minute + datetime.second / 60) / 60) / 24;
        if (M < 3) {
            Y -= 1;
            M += 12;
        }
        const A = Math.floor(Y / 100);
        // Need a different B if we are before introduction of the Gregorian Calendar
        const gregorianCutoff = luxon.DateTime.fromISO('1582-10-15T12:00:00Z', { zone: 'UTC' });
        let B = 0;
        if (datetime > gregorianCutoff) {
            B = 2 - A + Math.floor(A / 4);
        }
        return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
    };
    /**
     * Converts a Julian Date to the corresponding datetime in UTC (see AA p63).
     * @param {number} JD Julian date to be converted
     * @returns {DateTime} Datetime corresponding to the given Julian date.
     */
    const JDToDatetime = (JD) => {
        JD += 0.5;
        const Z = Math.floor(JD);
        const F = JD - Z;
        let A = Z;
        if (Z >= 2299161) {
            const alpha = Math.floor((Z - 1867216.25) / 36524.25);
            A += 1 + alpha - Math.floor(alpha / 4);
        }
        const B = A + 1524;
        const C = Math.floor((B - 122.1) / 365.25);
        const D = Math.floor(365.25 * C);
        const E = Math.floor((B - D) / 30.6001);
        const fracDay = B - D - Math.floor(30.6001 * E) + F;
        const day = Math.floor(fracDay);
        const hour = Math.floor((fracDay - day) * 24);
        const minute = Math.floor(((fracDay - day) * 24 - hour) * 60);
        const second = Math.floor((((fracDay - day) * 24 - hour) * 60 - minute) * 60);
        let month = E - 1;
        if (E > 13) {
            month -= 12;
        }
        let year = C - 4715;
        if (month > 2) {
            year -= 1;
        }
        return luxon.DateTime.fromISO('2000-01-01T12:00:00Z', { zone: 'UTC' })
            // eslint-disable-next-line sort-keys
            .set({ year, month, day, hour, minute, second });
    };
    /**
     * Converts a Julian date to the number of Julian centuries since
     * 2000-01-01T12:00:00Z (see AA p87 Eq12.1).
     * @param {number} JD Julian date.
     * @returns {number} T.
     */
    const JDToT = (JD) => (JD - 2451545) / 36525;
    /**
     * Converts a datetime in UTC to the number of Julian centuries since
     * 2000-01-01T12:00:00Z.
     * @param {DateTime} datetime Datetime to be converted.
     * @returns {number} T.
     */
    const datetimeToT = (datetime) => JDToT(datetimeToJD(datetime));
    /* eslint-disable complexity */
    /**
     * Calculates the value of ΔT=TT−UT (see
     * http://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html).
     * @param {DateTime} datetime Datetime for which ΔT should be calculated.
     * @returns {number} ΔT.
     */
    const DeltaT = (datetime) => {
        let y = datetime.year;
        y += (datetime.month - 0.5) / 12;
        let u;
        let t;
        switch (true) {
            case y < -1999 || y > 3000:
                throw new RangeError('DeltaT can only be calculated between 1999 BCE and 3000 CE');
            case y < -500:
                u = (y - 1820) / 100;
                return -20 + 32 * Math.pow(u, 2);
            case y < 500:
                u = y / 100;
                return polynomial(u, [10583.6, -1014.41, 33.78311, -5.952053, -0.1798452, 0.022174192, 0.0090316521]);
            case y < 1600:
                u = (y - 1000) / 100;
                return polynomial(u, [1574.2, -556.01, 71.23472, 0.319781, -0.8503463, -0.005050998, 0.0083572073]);
            case y < 1700:
                t = y - 1600;
                return polynomial(t, [120, -0.9808, -0.01532, 1 / 7129]);
            case y < 1800:
                t = y - 1700;
                return polynomial(t, [8.83, 0.1603, -0.0059285, 0.00013336, -1 / 1174000]);
            case y < 1860:
                t = y - 1800;
                return polynomial(t, [13.72, -0.332447, 0.0068612, 0.0041116, -0.00037436, 0.0000121272, -0.0000001699, 0.000000000875]);
            case y < 1900:
                t = y - 1860;
                return polynomial(t, [7.62, 0.5737, -0.251754, 0.01680668, -0.0004473624, 1 / 233174]);
            case y < 1920:
                t = y - 1900;
                return polynomial(t, [-2.79, 1.494119, -0.0598939, 0.0061966, -0.000197]);
            case y < 1941:
                t = y - 1920;
                return polynomial(t, [21.20, 0.84493, -0.076100, 0.0020936]);
            case y < 1961:
                t = y - 1950;
                return polynomial(t, [29.07, 0.407, -1 / 233, 1 / 2547]);
            case y < 1986:
                t = y - 1975;
                return polynomial(t, [45.45, 1.067, -1 / 260, -1 / 718]);
            case y < 2005:
                t = y - 2000;
                return polynomial(t, [63.86, 0.3345, -0.060374, 0.0017275, 0.000651814, 0.00002373599]);
            case y < 2050:
                t = y - 2000;
                return polynomial(t, [62.92, 0.32217, 0.005589]);
            case y < 2150:
                return -20 + 32 * Math.pow(((y - 1820) / 100), 2) - 0.5628 * (2150 - y);
            default:
                u = (y - 1820) / 100;
                return -20 + 32 * Math.pow(u, 2);
        }
    };
    /* eslint-enable complexity */
    /**
     * Calculates an approximate value for k (the fractional number of new moons
     * since 2000-01-06).
     * @param {DateTime} datetime Datetime for which k is calculated.
     * @returns {number} k.
     */
    const approxK = (datetime) => {
        const year = datetime.year + (datetime.month) / 12 +
            datetime.day / 365.25;
        return (year - 2000) * 12.3685;
    };
    /**
     * Calculates T from k.
     * @param {number} k Fractional number of new moons since 2000-01-06.
     * @returns {number} T Fractional num. of centuries since 2000-01-01:12:00:00Z.
     */
    const kToT = (k) => k / 1236.85;

    let roundToNearestMinute = false;
    let returnTimeForNoEventCase = false;
    let dateFormatKeys = {
        SUN_HIGH: '‡',
        SUN_LOW: '†',
    };
    const settings = (settings) => {
        if (typeof settings.roundToNearestMinute === 'boolean') {
            roundToNearestMinute = settings.roundToNearestMinute;
        }
        if (typeof settings.returnTimeForNoEventCase === 'boolean') {
            returnTimeForNoEventCase = settings.returnTimeForNoEventCase;
        }
        if (typeof settings.dateFormatKeys === 'object') {
            dateFormatKeys = settings.dateFormatKeys;
        }
    };

    /** See AA p144 */
    const sunMeanAnomaly = [357.52772, 35999.050340, -0.0001603, -1 / 300000];
    /** See AA p163 Eq 25.2 */
    const sunMeanLongitude = [280.46646, 36000.76983, 0.0003032];
    /** See AA p147 Eq22.3 */
    const meanObliquityOfEcliptic = [84381.448 / 3600, -4680.93 / 3600, -1.55 / 3600, 1999.25 / 3600, -51.38 / 3600, -249.67 / 3600, -39.05 / 3600,
        7.12 / 3600, 27.87 / 3600, 5.79 / 3600, 2.45 / 3600];
    /** See AA p144 */
    const moonArgumentOfLatitude = [93.27191, 483202.017538, -0.0036825, 1 / 327270];
    /** See AA p144 */
    const moonAscendingNodeLongitude = [125.04452, -1934.136261, 0.0020708, 1 / 450000];
    /** See AA p144 */
    const moonMeanAnomaly = [134.96298, 477198.867398, 0.0086972, 1 / 56250];
    /** See AA p144 */
    const moonMeanElongation = [297.85036, 445267.111480, -0.0019142, 1 / 189474];
    /* eslint-disable no-multi-spaces, array-bracket-spacing */
    /**
     * Nutations in longitude and obliquity
     * See AA p145f
     */
    const nutations = [
        [0, 0, 0, 0, 1, -171996, -174.2, 92025, 8.9],
        [-2, 0, 0, 2, 2, -13187, -1.6, 5736, -3.1],
        [0, 0, 0, 2, 2, -2274, -0.2, 977, -0.5],
        [0, 0, 0, 0, 2, 2062, 0.2, -895, 0.5],
        [0, 1, 0, 0, 0, 1426, -3.4, 54, -0.1],
        [0, 0, 1, 0, 0, 712, 0.1, -7, 0],
        [-2, 1, 0, 2, 2, -517, 1.2, 224, -0.6],
        [0, 0, 0, 2, 1, -386, -0.4, 200, 0],
        [0, 0, 1, 2, 2, -301, 0, 129, -0.1],
        [-2, -1, 0, 2, 2, 217, -0.5, -95, 0.3],
        [-2, 0, 1, 0, 0, -158, 0, 0, 0],
        [-2, 0, 0, 2, 1, 129, 0.1, -70, 0],
        [0, 0, -1, 2, 2, 123, 0, -53, 0],
        [2, 0, 0, 0, 0, 63, 0, 0, 0],
        [0, 0, 1, 0, 1, 63, 0.1, -33, 0],
        [2, 0, -1, 2, 2, -59, 0, 26, 0],
        [0, 0, -1, 0, 1, -58, -0.1, 32, 0],
        [0, 0, 1, 2, 1, -51, 0, 27, 0],
        [-2, 0, 2, 0, 0, 48, 0, 0, 0],
        [0, 0, -2, 2, 1, 46, 0, -24, 0],
        [2, 0, 0, 2, 2, -38, 0, 16, 0],
        [0, 0, 2, 2, 2, -31, 0, 13, 0],
        [0, 0, 2, 0, 0, 29, 0, 0, 0],
        [-2, 0, 1, 2, 2, 29, 0, -12, 0],
        [0, 0, 0, 2, 0, 26, 0, 0, 0],
        [-2, 0, 0, 2, 0, -22, 0, 0, 0],
        [0, 0, -1, 2, 1, 21, 0, -10, 0],
        [0, 2, 0, 0, 0, 17, -0.1, 0, 0],
        [2, 0, -1, 0, 1, 16, 0, -8, 0],
        [-2, 2, 0, 2, 2, -16, 0.1, 7, 0],
        [0, 1, 0, 0, 1, -15, 0, 9, 0],
        [-2, 0, 1, 0, 1, -13, 0, 7, 0],
        [0, -1, 0, 0, 1, -12, 0, 6, 0],
        [0, 0, 2, -2, 0, 11, 0, 0, 0],
        [2, 0, -1, 2, 1, -10, 0, 5, 0],
        [2, 0, 1, 2, 2, -8, 0, 3, 0],
        [0, 1, 0, 2, 2, 7, 0, -3, 0],
        [-2, 1, 1, 0, 0, -7, 0, 0, 0],
        [0, -1, 0, 2, 2, -7, 0, 3, 0],
        [2, 0, 0, 2, 1, -7, 0, 3, 0],
        [2, 0, 1, 0, 0, 6, 0, 0, 0],
        [-2, 0, 2, 2, 2, 6, 0, -3, 0],
        [-2, 0, 1, 2, 1, 6, 0, -3, 0],
        [2, 0, -2, 0, 1, -6, 0, 3, 0],
        [2, 0, 0, 0, 1, -6, 0, 3, 0],
        [0, -1, 1, 0, 0, 5, 0, 0, 0],
        [-2, -1, 0, 2, 1, -5, 0, 3, 0],
        [-2, 0, 0, 0, 1, -5, 0, 3, 0],
        [0, 0, 2, 2, 1, -5, 0, 3, 0],
        [-2, 0, 2, 0, 1, 4, 0, 0, 0],
        [-2, 1, 0, 2, 1, 4, 0, 0, 0],
        [0, 0, 1, -2, 0, 4, 0, 0, 0],
        [-1, 0, 1, 0, 0, -4, 0, 0, 0],
        [-2, 1, 0, 0, 0, -4, 0, 0, 0],
        [1, 0, 0, 0, 0, -4, 0, 0, 0],
        [0, 0, 1, 2, 0, 3, 0, 0, 0],
        [0, 0, -2, 2, 2, -3, 0, 0, 0],
        [-1, -1, 1, 0, 0, -3, 0, 0, 0],
        [0, 1, 1, 0, 0, -3, 0, 0, 0],
        [0, -1, 1, 2, 2, -3, 0, 0, 0],
        [2, -1, -1, 2, 2, -3, 0, 0, 0],
        [0, 0, 3, 2, 2, 3, 0, 0, 0],
        [2, -1, 0, 2, 2, -3, 0, 0, 0],
    ];

    /**
     * Calculates the solar transit time on a date at a given longitude (see AA
     * p102f).
     * @param {DateTime} datetime Date for which transit is calculated.
     * @param {number} L Longitude.
     * @returns {DateTime} Solar transit time.
     */
    const sunTransit = (datetime, L) => {
        const timezone = datetime.zone;
        let transit = datetime.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .setZone('UTC', { keepLocalTime: true });
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
    const sunRiseSet = (datetime, phi, L, flag, offset = 50 / 60) => {
        const timezone = datetime.zone;
        let suntime = datetime.set({ hour: 0, minute: 0, second: 0, millisecond: 0 })
            .setZone('UTC', { keepLocalTime: true });
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
        }
        else {
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
        }
        else {
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
    const handleNoEventCase = (date, errorCode, hour, minute = 0) => {
        if (returnTimeForNoEventCase) {
            const returnDate = date.set({ hour, minute, second: 0 }).plus({ minutes: date.isInDST ? 60 : 0 });
            returnDate.errorCode = errorCode;
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
    const approxLocalHourAngle = (phi, delta, offset) => {
        const cosH0 = (sind(-offset) -
            sind(phi) * sind(delta)) /
            (cosd(phi) * cosd(delta));
        if (cosH0 < -1) {
            throw noEventCodes.SUN_HIGH;
        }
        else if (cosH0 > 1) {
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
    const normalizeM = (m, utcOffset) => {
        const localM = m + utcOffset / 1440;
        if (localM < 0) {
            return m + 1;
        }
        else if (localM > 1) {
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
    const sunTransitCorrection = (T, Theta0, deltaT, L, m) => {
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
    const sunRiseSetCorrection = (T, Theta0, deltaT, phi, L, m, offset) => {
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
    const localHourAngle = (theta0, L, alpha) => {
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
    const altitude = (phi, delta, H) => rad2deg(Math.asin(sind(phi) * sind(delta) + cosd(phi) * cosd(delta) * cosd(H)));
    /**
     * Interpolates the sun's right ascension (see AA p103).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} n Fractional time of day of the event corrected by ΔT.
     * @returns {number} Interpolated right ascension.
     */
    const interpolatedRa = (T, n) => {
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
    const interpolatedDec = (T, n) => {
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
    const sunApparentRightAscension = (T) => {
        const Omega = moonAscendingNodeLongitude$1(T);
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
    const sunApparentDeclination = (T) => {
        const Omega = moonAscendingNodeLongitude$1(T);
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
    const apparentSiderealTimeGreenwich = (T) => {
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
    const meanSiderealTimeGreenwich = (T) => {
        const JD2000 = T * 36525;
        return 280.46061837 + 360.98564736629 * JD2000 + 0.000387933 * Math.pow(T, 2) - Math.pow(T, 3) / 38710000;
    };
    /**
     * Calculates the true obliquity of the ecliptic (see AA p147).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} True obliquity of the ecliptic.
     */
    const trueObliquityOfEcliptic = (T) => {
        const epsilon0 = meanObliquityOfEcliptic$1(T);
        const DeltaEpsilon = nutationInObliquity(T);
        return epsilon0 + DeltaEpsilon;
    };
    /**
     * Calculates the mean obliquity of the ecliptic (see AA p147 Eq 22.3).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Mean obliquity of the ecliptic.
     */
    const meanObliquityOfEcliptic$1 = (T) => {
        const U = T / 100;
        return polynomial(U, meanObliquityOfEcliptic);
    };
    /**
     * Calculates the apparent longitude of the sun (see AA p164).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Apparent longitude of the sun.
     */
    const sunApparentLongitude = (T) => {
        const Sol = sunTrueLongitude(T);
        const Omega = moonAscendingNodeLongitude$1(T);
        return Sol - 0.00569 - 0.00478 * sind(Omega);
    };
    /**
     * Calculates the true longitude of the sun (see AA p164).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} True longitude of the sun.
     */
    const sunTrueLongitude = (T) => {
        const L0 = sunMeanLongitude$1(T);
        const C = sunEquationOfCenter(T);
        return L0 + C;
    };
    /**
     * Calculates the equation of center of the sun (see AA p164).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Equation of center of the sun.
     */
    const sunEquationOfCenter = (T) => {
        const M = sunMeanAnomaly$1(T);
        return (1.914602 - 0.004817 * T - 0.000014 * Math.pow(T, 2)) * sind(M) +
            (0.019993 - 0.000101 * T) * sind(2 * M) + 0.000290 * sind(3 * M);
    };
    /**
     * Calculates the nutation in longitude of the sun (see AA p144ff).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Nutation in longitude of the sun.
     */
    const nutationInLongitude = (T) => {
        const D = moonMeanElongation$1(T);
        const M = sunMeanAnomaly$1(T);
        const MPrime = moonMeanAnomaly$1(T);
        const F = moonArgumentOfLatitude$1(T);
        const Omega = moonAscendingNodeLongitude$1(T);
        let DeltaPsi = 0;
        let sineArg;
        for (let i = 0; i < 63; i++) {
            sineArg = nutations[i][0] * D + nutations[i][1] * M + nutations[i][2] * MPrime +
                nutations[i][3] * F + nutations[i][4] * Omega;
            DeltaPsi += (nutations[i][5] + nutations[i][6] * T) * sind(sineArg);
        }
        return DeltaPsi / 36000000;
    };
    /**
     * Calculates the nutation in obliquity of the sun (see AA p144ff).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Nutation in obliquity of the sun.
     */
    const nutationInObliquity = (T) => {
        const D = moonMeanElongation$1(T);
        const M = sunMeanAnomaly$1(T);
        const MPrime = moonMeanAnomaly$1(T);
        const F = moonArgumentOfLatitude$1(T);
        const Omega = moonAscendingNodeLongitude$1(T);
        let DeltaEpsilon = 0;
        let cosArg;
        for (let i = 0; i < 63; i++) {
            cosArg = nutations[i][0] * D + nutations[i][1] * M + nutations[i][2] * MPrime +
                nutations[i][3] * F + nutations[i][4] * Omega;
            DeltaEpsilon += (nutations[i][7] + nutations[i][8] * T) * cosd(cosArg);
        }
        return DeltaEpsilon / 36000000;
    };
    /**
     * Calculates the argument of latitude of the moon (see AA p144).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Argument of latitude of the moon.
     */
    const moonArgumentOfLatitude$1 = (T) => {
        const F = polynomial(T, moonArgumentOfLatitude);
        return reduceAngle(F);
    };
    /**
     * Calculates the longitude of the ascending node of the Moon's mean orbit on
     * the ecliptic, measured from the mean equinox of the datea (see AA p144).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Longitude of the asc. node of the moon's mean orbit.
     */
    const moonAscendingNodeLongitude$1 = (T) => {
        const Omega = polynomial(T, moonAscendingNodeLongitude);
        return reduceAngle(Omega);
    };
    /**
     * Calculates the mean anomaly of the moon (see AA p144).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Mean anomaly of the moon.
     */
    const moonMeanAnomaly$1 = (T) => {
        const MPrime = polynomial(T, moonMeanAnomaly);
        return reduceAngle(MPrime);
    };
    /**
     * Calculates the mean elongation of the moon from the sun (see AA p144).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Mean elongation of the moon from the sun.
     */
    const moonMeanElongation$1 = (T) => {
        const D = polynomial(T, moonMeanElongation);
        return reduceAngle(D);
    };
    /**
     * Calculates the mean anomaly of the sun (see AA p144).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Mean anomaly of the sun.
     */
    const sunMeanAnomaly$1 = (T) => {
        const M = polynomial(T, sunMeanAnomaly);
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
    const sunMeanLongitude$1 = (T) => {
        const L0 = polynomial(T, sunMeanLongitude);
        return reduceAngle(L0);
    };
    const noEventCodes = {
        SUN_HIGH: 'SUN_HIGH',
        SUN_LOW: 'SUN_LOW',
    };

    /**
     * Calculates the Julian date in ephemeris time of the moon near the date
     * corresponding to k (see AA p350ff).
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @param {number} phase 0 -> new moon, 1 -> first quarter,
     *                       2 -> full moon, 3 -> last quarter.
     * @returns {number} Julian date in ephemeris time of the moon of given phase.
     */
    const truePhase = (k, phase) => {
        k += phase / 4;
        const T = kToT(k);
        const E = eccentricityCorrection(T);
        const JDE = meanPhase(T, k);
        const M = sunMeanAnomaly$2(T, k);
        const MPrime = moonMeanAnomaly$2(T, k);
        const F = moonArgumentOfLatitude$2(T, k);
        const Omega = moonAscendingNodeLongitude$2(T, k);
        let DeltaJDE = 0;
        if (phase === 0 || phase === 2) {
            DeltaJDE += newMoonFullMoonCorrections(E, M, MPrime, F, Omega, phase);
        }
        else /* istanbul ignore else */ if (phase === 1 || phase === 3) {
            DeltaJDE += quarterCorrections(E, M, MPrime, F, Omega, phase);
        }
        DeltaJDE += commonCorrections(T, k);
        return JDE + DeltaJDE;
    };
    /**
     * Calculates the mean phase of the moon as Julian date in ephemeris time (see
     * AA p349 Eq49.1).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Julian date in ephemeris time of the moon of given mean
     *     phase.
     */
    const meanPhase = (T, k) => 2451550.09766 + 29.530588861 * k + 0.00015437 * Math.pow(T, 2) -
        0.000000150 * Math.pow(T, 3) + 0.00000000073 * Math.pow(T, 4);
    /**
     * Calculates the mean anomaly of the sun (see AA p350 Eq49.4).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Mean anomaly of the sun at the given time.
     */
    const sunMeanAnomaly$2 = (T, k) => 2.5534 + 29.10535670 * k - 0.0000014 * Math.pow(T, 2) -
        0.00000011 * Math.pow(T, 3);
    /**
     * Calculates the mean anomaly of the moon (see AA p350 Eq49.5).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Mean anomaly of the moon at the given time.
     */
    const moonMeanAnomaly$2 = (T, k) => 201.5643 + 385.81693528 * k + 0.0107582 * Math.pow(T, 2) +
        0.00001238 * Math.pow(T, 3) - 0.000000058 * Math.pow(T, 4);
    /**
     * Calculates the argument of latitude of the moon (see AA p350 Eq49.6).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Argument of latitude of the moon at the given time.
     */
    const moonArgumentOfLatitude$2 = (T, k) => 160.7108 + 390.67050284 * k - 0.0016118 * Math.pow(T, 2) -
        0.00000227 * Math.pow(T, 3) + 0.000000011 * Math.pow(T, 4);
    /**
     * Calculates the longitude of the ascending node of the lunar orbit (see AA
     * p350 Eq49.7).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Longitude of the ascending node of the lunar orbit at the
     *     given time.
     */
    const moonAscendingNodeLongitude$2 = (T, k) => 124.7746 - 1.56375588 * k + 0.0020672 * Math.pow(T, 2) +
        0.00000215 * Math.pow(T, 3);
    /**
     * Calculates the correction for the eccentricity of the earth's orbit.
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @returns {number} Eccentricity correction.
     */
    const eccentricityCorrection = (T) => 1 - 0.002516 * T - 0.0000074 * Math.pow(T, 2);
    /**
     * Calculates the corrections to the planetary arguments for the moon phases
     * that are common to all phases (see AA p352).
     * @param {number} T Fractional number of Julian centuries since
     *     2000-01-01T12:00:00Z.
     * @param {number} k The approximate fractional number of new moons since
     *     2000-01-06.
     * @returns {number} Correction to the Julian date in ephemeris time for the
     *     moon phase.
     */
    const commonCorrections = (T, k) => {
        const A = [
            0,
            299.77 + 0.107408 * k - 0.009173 * Math.pow(T, 2),
            251.88 + 0.016321 * k,
            251.83 + 26.651886 * k,
            349.42 + 36.412478 * k,
            84.66 + 18.206239 * k,
            141.74 + 53.303771 * k,
            207.14 + 2.453732 * k,
            154.84 + 7.306860 * k,
            34.52 + 27.261239 * k,
            207.19 + 0.121824 * k,
            291.34 + 1.844379 * k,
            161.72 + 24.198154 * k,
            239.56 + 25.513099 * k,
            331.55 + 3.592518 * k
        ];
        return 0.000325 * sind(A[1]) + 0.000165 * sind(A[2]) + 0.000164 * sind(A[3]) + 0.000126 * sind(A[4]) +
            0.000110 * sind(A[5]) + 0.000062 * sind(A[6]) + 0.000060 * sind(A[7]) + 0.000056 * sind(A[8]) +
            0.000047 * sind(A[9]) + 0.000042 * sind(A[10]) + 0.000040 * sind(A[11]) + 0.000037 * sind(A[12]) +
            0.000035 * sind(A[13]) + 0.000023 * sind(A[14]);
    };
    /**
     * Calculates the corrections to the planetary arguments for the moon phases
     * for full and new moons (see AA p351).
     * @param {number} E Correction for the eccentricity of the earth's orbit.
     * @param {number} M Mean anomaly of the sun.
     * @param {number} MPrime Mean anomaly of the moon.
     * @param {number} F Argument of latitude of the moon.
     * @param {number} Omega Longitude of the ascending node of the lunar orbit.
     * @param {number} phase 0 -> new moon, 1 -> first quarter,
     *                    2 -> full moon, 3 -> last quarter.
     * @returns {number} Correction to the Julian date in ephemeris time for the
     *     moon phase.
     */
    const newMoonFullMoonCorrections = (E, M, MPrime, F, Omega, phase) => {
        let DeltaJDE = -0.00111 * sind(MPrime - 2 * F) -
            0.00057 * sind(MPrime + 2 * F) +
            0.00056 * E * sind(2 * MPrime + M) -
            0.00042 * sind(3 * MPrime) +
            0.00042 * E * sind(M + 2 * F) +
            0.00038 * E * sind(M - 2 * F) -
            0.00024 * E * sind(2 * MPrime - M) -
            0.00017 * sind(Omega) -
            0.00007 * sind(MPrime + 2 * M) +
            0.00004 * sind(2 * MPrime - 2 * F) +
            0.00004 * sind(3 * M) +
            0.00003 * sind(MPrime + M - 2 * F) +
            0.00003 * sind(2 * MPrime + 2 * F) -
            0.00003 * sind(MPrime + M + 2 * F) +
            0.00003 * sind(MPrime - M + 2 * F) -
            0.00002 * sind(MPrime - M - 2 * F) -
            0.00002 * sind(3 * MPrime + M) +
            0.00002 * sind(4 * MPrime);
        if (phase === 0) {
            DeltaJDE +=
                -0.40720 * sind(MPrime) +
                    0.17241 * E * sind(M) +
                    0.01608 * sind(2 * MPrime) +
                    0.01039 * sind(2 * F) +
                    0.00739 * E * sind(MPrime - M) -
                    0.00514 * E * sind(MPrime + M) +
                    0.00208 * E * E * sind(2 * M);
        }
        else /* istanbul ignore else */ if (phase === 2) {
            DeltaJDE +=
                -0.40614 * sind(MPrime) +
                    0.17302 * E * sind(M) +
                    0.01614 * sind(2 * MPrime) +
                    0.01043 * sind(2 * F) +
                    0.00734 * E * sind(MPrime - M) -
                    0.00515 * E * sind(MPrime + M) +
                    0.00209 * E * E * sind(2 * M);
        }
        return DeltaJDE;
    };
    /**
     * Calculates the corrections to the planetary arguments for the moon phases
     * for first and last quarters (see AA p352).
     * @param {number} E Correction for the eccentricity of the earth's orbit.
     * @param {number} M Mean anomaly of the sun.
     * @param {number} MPrime Mean anomaly of the moon.
     * @param {number} F Argument of latitude of the moon.
     * @param {number} Omega Longitude of the ascending node of the lunar orbit.
     * @param {number} phase 0 -> new moon, 1 -> first quarter,
     *                    2 -> full moon, 3 -> last quarter.
     * @returns {number} Correction to the Julian date in ephemeris time for the
     *     moon phase.
     */
    const quarterCorrections = (E, M, MPrime, F, Omega, phase) => {
        let DeltaJDE = -0.62801 * sind(MPrime) +
            0.17172 * E * sind(M) -
            0.01183 * E * sind(MPrime + M) +
            0.00862 * sind(2 * MPrime) +
            0.00804 * sind(2 * F) +
            0.00454 * E * sind(MPrime - M) +
            0.00204 * E * E * sind(2 * M) -
            0.00180 * sind(MPrime - 2 * F) -
            0.00070 * sind(MPrime + 2 * F) -
            0.00040 * sind(3 * MPrime) -
            0.00034 * E * sind(2 * MPrime - M) +
            0.00032 * E * sind(M + 2 * F) +
            0.00032 * E * sind(M - 2 * F) -
            0.00028 * E * E * sind(MPrime + 2 * M) +
            0.00027 * E * sind(2 * MPrime + M) -
            0.00017 * sind(Omega) -
            0.00005 * sind(MPrime - M - 2 * F) +
            0.00004 * sind(2 * MPrime + 2 * F) -
            0.00004 * sind(MPrime + M + 2 * F) +
            0.00004 * sind(MPrime - 2 * M) +
            0.00003 * sind(MPrime + M - 2 * F) +
            0.00003 * sind(3 * M) +
            0.00002 * sind(2 * MPrime - 2 * F) +
            0.00002 * sind(MPrime - M + 2 * F) -
            0.00002 * sind(3 * MPrime + M);
        const W = 0.00306 -
            0.00038 * E * cosd(M) +
            0.00026 * cosd(MPrime) -
            0.00002 * cosd(MPrime - M) +
            0.00002 * cosd(MPrime + M) +
            0.00002 * cosd(2 * F);
        if (phase === 1) {
            DeltaJDE += W;
        }
        else /* istanbul ignore else */ if (phase === 3) {
            DeltaJDE -= W;
        }
        return DeltaJDE;
    };

    /**
     * Uses the extra information encoded into the DateTime object for dates without
     * a sun event if returnTimeForNoEventCase is true to mark the output string.
     * @param {DateTime} datetime Input datetime.
     * @param {string} formatString Valid DateTime format string.
     * @returns {string} Formatted string with marker appended.
     */
    const format = (datetime, formatString) => {
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
     * @returns {(DateTime|string)} Time of sunrise or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const sunrise = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'RISE');
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of sunset or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const sunset = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'SET');
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of civil dawn or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const civilDawn = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'RISE', 6);
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of civil dusk or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const civilDusk = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'SET', 6);
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of nautical dawn or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const nauticalDawn = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'RISE', 12);
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of nautical dusk or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const nauticalDusk = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'SET', 12);
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of astronomical dawn or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const astronomicalDawn = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'RISE', 18);
        }
        catch (err) {
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
     * @returns {(DateTime|string)} Time of astronomical dusk or a string indicating that no
     *     event could be calculated as the sun was too high ('SUN_HIGH') or too low
     *     ('SUN_LOW') during the entire day (unless returnTimeForNoEventCase is true).
     */
    const astronomicalDusk = (datetime, latitude, longitude) => {
        try {
            return sunRiseSet(datetime, latitude, longitude, 'SET', 18);
        }
        catch (err) {
            return handleNoEventCase(datetime, err, 19, 30);
        }
    };
    /**
     * Calculates solar noon on the provided date.
     * @param {DateTime} datetime Datetime for which solar noon is calculated. Should
     *     always contain a timezone or be in UTC, lone UTC offsets might lead to
     *     unexpected behaviour.
     * @param {number} longitude longitude of target location.
     * @returns {DateTime} Time of solar noon at the given longitude.
     */
    const solarNoon = (datetime, longitude) => sunTransit(datetime, longitude);
    /**
     * Calculates all moons of the given phase that occur within the given
     * Gregorian calendar year.
     * @param {number} year Year for which moon phases should be calculated.
     * @param {number} phase 0 -> new moon, 1 -> first quarter,
     *                    2 -> full moon, 3 -> last quarter.
     * @param {string} timezone Optional: IANA timezone string.
     * @returns {array} Array of DateTime objects for moons of the given phase.
     */
    const yearMoonPhases = (year, phase, timezone = 'UTC') => {
        const yearBegin = luxon.DateTime.fromObject(
        // eslint-disable-next-line sort-keys
        { year, month: 1, day: 1, hour: 0, minute: 0, second: 0, zone: timezone });
        const yearEnd = luxon.DateTime.fromObject(
        // eslint-disable-next-line sort-keys
        { year: year + 1, month: 1, day: 1, hour: 0, minute: 0, second: 0, zone: timezone });
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
            }
            else {
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
    const yearAllMoonPhases = (year, timezone = 'UTC') => [
        ...yearMoonPhases(year, 0, timezone).map((datetime) => ({ datetime, phase: 0 })),
        ...yearMoonPhases(year, 1, timezone).map((datetime) => ({ datetime, phase: 1 })),
        ...yearMoonPhases(year, 2, timezone).map((datetime) => ({ datetime, phase: 2 })),
        ...yearMoonPhases(year, 3, timezone).map((datetime) => ({ datetime, phase: 3 })),
    ].sort((a, b) => a.datetime.valueOf() - b.datetime.valueOf());

    exports.astronomicalDawn = astronomicalDawn;
    exports.astronomicalDusk = astronomicalDusk;
    exports.civilDawn = civilDawn;
    exports.civilDusk = civilDusk;
    exports.format = format;
    exports.nauticalDawn = nauticalDawn;
    exports.nauticalDusk = nauticalDusk;
    exports.settings = settings;
    exports.solarNoon = solarNoon;
    exports.sunrise = sunrise;
    exports.sunset = sunset;
    exports.yearAllMoonPhases = yearAllMoonPhases;
    exports.yearMoonPhases = yearMoonPhases;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
