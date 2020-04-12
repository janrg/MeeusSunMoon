import * as luxon from 'luxon';
import { polynomial } from './auxMath';

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
    // Months are zero-indexed
    y += (datetime.month - 0.5) / 12;
    let u;
    let t;
    switch (true) {
        case y < -1999 || y > 3000:
            throw 'DeltaT can only be calculated between 1999 BCE and 3000 CE';
        case y < -500:
            u = (y - 1820) / 100;
            return -20 + 32 * u ** 2;
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
            return polynomial(t,
                [13.72, -0.332447, 0.0068612, 0.0041116, -0.00037436, 0.0000121272, -0.0000001699, 0.000000000875]);
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
            return -20 + 32 * ((y - 1820) / 100) ** 2 - 0.5628 * (2150 - y);
        default:
            u = (y - 1820) / 100;
            return -20 + 32 * u ** 2;
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

export { datetimeToJD, JDToDatetime, JDToT, datetimeToT, DeltaT, approxK, kToT };
