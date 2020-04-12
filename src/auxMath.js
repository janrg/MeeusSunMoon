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
    let sum = 0.0;
    const numCoeffs = coeffs.length;
    for (let i = 0; i < numCoeffs; i++) {
        sum += varPower * coeffs[i];
        varPower *= variable;
    }
    return sum;
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

export { deg2rad, rad2deg, sind, cosd, reduceAngle, polynomial, interpolateFromThree };
