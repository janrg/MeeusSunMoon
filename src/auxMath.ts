/**
 * Converts angles in degrees to radians.
 * @param {number} deg Angle in degrees.
 * @returns {number} Angle in radians.
 */
const deg2rad = (deg: number): number => deg * 0.017453292519943295;

/**
 * Converts angles in radians to degrees.
 * @param {number} rad Angle in radians.
 * @returns {number} Angle in degrees.
 */
const rad2deg = (rad: number): number => rad * 57.29577951308232;

/**
 * Calculates the sine of an angle given in degrees.
 * @param {number} deg Angle in degrees.
 * @returns {number} Sine of the angle.
 */
const sind = (deg: number): number => Math.sin(deg2rad(deg));

/**
 * Calculates the cosine of an angle given in degrees.
 * @param {number} deg Angle in degrees.
 * @returns {number} Cosine of the angle.
 */
const cosd = (deg: number): number => Math.cos(deg2rad(deg));

/**
 * Reduces an angle to the interval 0-360°.
 * @param {number} angle Angle in degrees.
 * @returns {number} Reduced angle in degrees.
 */
const reduceAngle = (angle: number): number => angle - (360 * Math.floor(angle / 360));

/**
 * Evaluates a polynomial in the form A + Bx + Cx^2...
 * @param {number} variable Value of x in the polynomial.
 * @param {array} coeffs Array of coefficients [A, B, C...].
 * @returns {number} Sum of the polynomial.
 */
const polynomial = (variable: number, coeffs: Array<number>): number => {
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
const interpolateFromThree = (y1: number, y2: number, y3: number, n: number, normalize: boolean = false): number => {
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
