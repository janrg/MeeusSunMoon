/**
 * Converts angles in degrees to radians.
 * @param {number} deg Angle in degrees.
 * @returns {number} Angle in radians.
 */
const deg2rad = function (deg) {
  return deg * 0.017453292519943295;
};

/**
 * Converts angles in radians to degrees.
 * @param {number} rad Angle in radians.
 * @returns {number} Angle in degrees.
 */
const rad2deg = function (rad) {
  return rad * 57.29577951308232;
};

/**
 * Calculates the sine of an angle given in degrees.
 * @param {number} deg Angle in degrees.
 * @returns {number} Sine of the angle.
 */
const sind = function (deg) {
  return Math.sin(deg2rad(deg));
};

/**
 * Calculates the cosine of an angle given in degrees.
 * @param {number} deg Angle in degrees.
 * @returns {number} Cosine of the angle.
 */
const cosd = function (deg) {
  return Math.cos(deg2rad(deg));
};

/**
 * Reduces an angle to the interval 0-360°.
 * @param {number} angle Angle in degrees.
 * @returns {number} Reduced angle in degrees.
 */
const reduceAngle = function (angle) {
  return angle - (360 * Math.floor(angle / 360));
};

/**
 * Takes the modulo of a number using floored division.
 * @param {number} a Original number.
 * @param {number} n divisor.
 * @returns {number} a mod n.
 */
const modulo = function (a, n) {
  return a - n * (Math.floor(a / n));
};

/**
 * Evaluates a polynomial in the form A + Bx + Cx^2...
 * @param {number} variable Value of x in the polynomial.
 * @param {array} coeffs Array of coefficients [A, B, C...].
 * @returns {number} Sum of the polynomial.
 */
const polynomial = function (variable, coeffs) {
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
 * @param {bool} normalize Whether the final result should be normalized.
 * @returns {number} Interpolated result.
 */
const interpolateFromThree = function (y1, y2, y3, n, normalize) {
  let a = y2 - y1;
  let b = y3 - y2;
  if (typeof normalize !== 'undefined' && normalize) {
    if (a < 0) { a += 360; }
    if (b < 0) { b += 360; }
  }
  const c = b - a;
  const y = y2 + (n / 2) * (a + b + n * c);
  return y;
};

export {deg2rad, rad2deg, sind, cosd, reduceAngle, modulo, polynomial,
  interpolateFromThree};
