/**
 * @license MeeusSunMoon v1.0.0
 * (c) 2016 Jan Greis
 * licensed under MIT
 */

var MeeusSunMoon = (function() {
  var my = {};

  my.roundToNearestMinute = false;
  my.returnTimeForPNMS = false;
 /************************
  *** TIME CONVERSIONS ***
  ************************/
  var timeConversions = {
    // Convert a datetime (in UTC) to Julian Date
    // See AA p60f
    datetimeToJD: function (datetime) {
      var Y = datetime.year();
      var M = datetime.month() + 1; // Months are zero-indexed
      var D = datetime.date() + (datetime.hour() + (datetime.minute() +
                                 datetime.second()/60)/60)/24;
      if (M < 3) {
        Y -= 1;
        M += 12;
      }
      var A = Math.floor(Y/100);
      // Need a different B if we are before the introduction of the Gregorian Calendar
      var gregorianCutoff = moment("1582-10-15T12:00:00Z");
      var B = 0;
      if (datetime.isAfter(gregorianCutoff)) {
        B = 2 - A + Math.floor(A/4);
      }
      var JD = Math.floor(365.25*(Y + 4716)) + Math.floor(30.6001*(M + 1)) + D + B - 1524.5;
      return JD;
    },

    // Convert a Julian Date to a datetime in UTC
    // See AA p63
    JDToDatetime: function (JD) {
      JD += 0.5;
      var Z = Math.floor(JD);
      var F = JD - Z;
      var A = Z;
      if (Z >= 2299161) {
        var alpha = Math.floor((Z - 1867216.25)/36524.25);
        A += 1 + alpha - Math.floor(alpha/4);
      }
      var B = A + 1524;
      var C = Math.floor((B - 122.1)/365.25);
      var D = Math.floor(365.25*C);
      var E = Math.floor((B - D)/30.6001);
      var fracDay = B - D - Math.floor(30.6001*E) + F;
      var day = Math.floor(fracDay);
      var hours = Math.floor((fracDay - day)*24);
      var minutes = Math.floor(((fracDay - day)*24 - hours)*60);
      var seconds = Math.floor((((fracDay - day)*24 - hours)*60 - minutes)*60);
      var month = E - 1;
      if (E > 13) {
        month -= 12;
      }
      var year = C - 4715;
      if (month > 2) {
        year -= 1;
      }
      var datetime = moment.tz("2000-01-01T12:00:00", "UTC");
      datetime.year(year);
      datetime.month(month - 1); // Months are zero-indexed
      datetime.date(day);
      datetime.hour(hours);
      datetime.minute(minutes);
      datetime.second(seconds);
      return datetime;
    },

    // Convert a Julian Date to T (Julian centuries since 01/01/2000 12UT)
    // See AA p87 Eq12.1
    JDToT: function (JD) {
      return (JD - 2451545)/36525;
    },

    // Convert a datetime (in UTC) to T (Julian centuries since 01/01/2000 12UT)
    datetimeToT: function (datetime) {
      return timeConversions.JDToT(timeConversions.datetimeToJD(datetime));
    },

    // Calculate ΔT=TT−UT
    // see http://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
    DeltaT: function (datetime) {
      var y = datetime.year();
      y += (datetime.month() + 0.5)/12; // Months are zero-indexed
      var u;
      var t;
      var DeltaT;
      switch (true) {
        case y < -1999:
          DeltaT = false;
          break;
        case y < -500:
          u = (y - 1820)/100;
          DeltaT = -20 + 32*u*u;
          break;
        case y < 500:
          u = y/100;
          DeltaT = 10583.6 - 1014.41*u + 33.78311*u*u - 5.952053*u*u*u -
                   0.1798452*u*u*u*u + 0.022174192*u*u*u*u*u +
                   0.0090316521*u*u*u*u*u*u;
          break;
        case y < 1600:
          u = (y - 1000)/100;
          DeltaT = 1574.2 - 556.01*u + 71.23472*u*u + 0.319781*u*u*u -
                   0.8503463*u*u*u*u - 0.005050998*u*u*u*u*u +
                   0.0083572073*u*u*u*u*u*u;
          break;
        case y < 1700:
          t = y - 1600;
          DeltaT = 120 - 0.9808*t - 0.01532*t*t + t*t*t/7129;
          break;
        case y < 1800:
          t = y - 1700;
          DeltaT = 8.83 + 0.1603*t - 0.0059285*t*t + 0.00013336*t*t*t -
                   t*t*t*t/1174000;
          break;
        case y < 1860:
          t = y - 1800;
          DeltaT = 13.72 - 0.332447*t + 0.0068612*t*t + 0.0041116*t*t*t -
                   0.00037436*t*t*t*t + 0.0000121272*t*t*t*t*t -
                   0.0000001699*t*t*t*t*t*t + 0.000000000875*t*t*t*t*t*t*t;
          break;
        case y < 1900:
          t = y - 1860;
          DeltaT = 7.62 + 0.5737*t - 0.251754*t*t + 0.01680668*t*t*t -
                   0.0004473624*t*t*t*t + t*t*t*t*t/233174;
          break;
        case y < 1920:
          t = y - 1900;
          DeltaT = -2.79 + 1.494119*t - 0.0598939*t*t + 0.0061966*t*t*t -
                    0.000197*t*t*t*t;
          break;
        case y < 1941:
          t = y - 1920;
          DeltaT = 21.20 + 0.84493*t - 0.076100*t*t + 0.0020936*t*t*t;
          break;
        case y < 1961:
          t = y - 1950;
          DeltaT = 29.07 + 0.407*t - t*t/233 + t*t*t/2547;
          break;
        case y < 1986:
          t = y - 1975;
          DeltaT = 45.45 + 1.067*t - t*t/260 - t*t*t/718;
          break;
        case y < 2005:
          t = y - 2000;
          DeltaT = 63.86 + 0.3345*t - 0.060374*t*t + 0.0017275*t*t*t +
                   0.000651814*t*t*t*t + 0.00002373599*t*t*t*t*t;
          break;
        case y < 2050:
          t = y - 2000;
          DeltaT = 62.92 + 0.32217*t + 0.005589*t*t;
          break;
        case y < 2150:
          DeltaT = -20 + 32*((y - 1820)/100)*((y - 1820)/100) - 0.5628*(2150 - y);
          break;
        default:
          u = (y - 1820)/100;
          DeltaT = -20 + 32*u*u;
        }
      return DeltaT;
    },
    
    // approximate value for k
    approxK: function (datetime) {
      var year = datetime.year() + (datetime.month() + 1)/12 + datetime.date()/365.25;
      return (year - 2000)*12.3685;
    },
    
    // convert k to T
    kToT: function (k) {
      return k/1236.85;
    }
  };

 /****************************************
  *** AUXILIARY MATHEMATICAL FUNCTIONS ***
  ****************************************/
  var auxMath = {
    // Convert angle in degrees to radians
    deg2rad: function (deg) {
      return deg*0.017453292519943295;
    },

    // Convert angle in radians to degrees
    rad2deg: function (rad) {
      return rad*57.29577951308232;
    },

    // Sine with argument in degrees
    sind: function (deg) {
      return Math.sin(auxMath.deg2rad(deg));
    },

    // Cosine with argument in degrees
    cosd: function (deg) {
      return Math.cos(auxMath.deg2rad(deg));
    },

    // Reduce an angle to the interval 0-360°
    reduceAngle: function (angle) {
      return angle - (360*Math.floor(angle/360));
    },

    // A modulo function using floored division
    modulo: function (a, n) {
      return a - n*(Math.floor(a/n));
    },

    // Evaluate a polynomial in the form A + Bx + Cx^2...
    polynomial: function (variable, coeffs) {
      var varPower = 1;
      var sum = 0.0;
      var numCoeffs = coeffs.length;
      for (var i = 0; i < numCoeffs; i++) {
        sum += varPower*coeffs[i];
        varPower *= variable;
      }
      return sum;
    },

    // Interpolate a value from three known
    // See AA p24 Eq3.3
    interpolateFromThree: function (y1, y2, y3, n, normalize) {
      if (typeof(normalize) === 'undefined') { normalize = false; }
      var a = y2 - y1;
      var b = y3 - y2;
      if (normalize) {
        if (a < 0) { a += 360; }
        if (b < 0) { b += 360; }
      }
      var c = b - a;
      var y = y2 + (n/2)*(a + b + n*c);
      return y;
    }
  };

 /************************************
  *** CALCULATIONS FOR MOON PHASES ***
  ************************************/
  var moonPhases = {
    /*************************************************************************
     * VARIABLES
     * phase:   Phase of the moon: 0 = new moon, 1 = first quarter,
     *                             2 = full moon, 3 = last quarter
     * T:       Fractional number of Julian centuries since 01/01/2000 12UT
     * k:       Number of new moons since 06/01/2000, integer values stand for
     *          new moons, int+0.25 first quarter, int+0.5 full moon,
     *          int+0.75 last quarter
     * M:       Mean anomaly of the sun
     * M_prime: Mean anomaly of the moon
     * F:       Argument of latitude of the moon
     * Omega:   Longitude of the ascending node of the lunar orbit
     * E:       Correction for the eccentricity of the earth's orbit
     * A:       Planetary arguments for lunar corrections
     * JDE:     Julian Date in ephemeris time (i.e. incl. ΔT)
     *************************************************************************/
    
    // JDE for true phase of the moon near date corresponding to k
    // See AA p350ff
    truePhase: function (k, phase) {
      k += phase/4;
      var T = timeConversions.kToT(k);
      var E = moonPhases.eccentricityCorrection(T);
      var JDE = moonPhases.meanPhase(T, k);
      var M = moonPhases.sunMeanAnomaly(T, k);
      var M_prime = moonPhases.moonMeanAnomaly(T, k);
      var F = moonPhases.moonArgumentOfLatitude(T, k);
      var Omega = moonPhases.moonAscendingNodeLongitude(T, k);
      var A = moonPhases.planetaryArguments(T, k);
      var DeltaJDE = 0;
      if (phase === 0 || phase === 2) {
        DeltaJDE += moonPhases.newMoonFullMoonCorrections(E, M, M_prime, F, Omega, phase);
      } else if (phase === 1 || phase === 3) {
        DeltaJDE += moonPhases.quarterCorrections(E, M, M_prime, F, Omega, phase);
      }
      DeltaJDE += moonPhases.commonCorrections(A);
      JDE += DeltaJDE;
      return JDE;
    },
    
    // Time of the phase as JDE
    // See AA p349 Eq49.1
    meanPhase: function (T, k) {
      var JDE = 2451550.09766 + 29.530588861*k + 0.00015437*T*T -
                0.000000150*T*T*T + 0.00000000073*T*T*T*T;
      return JDE;
    },
    
    // Mean anomaly of the sun
    // See AA p350 Eq49.4
    sunMeanAnomaly: function (T, k) {
      var M = 2.5534 + 29.10535670*k - 0.0000014*T*T - 0.00000011*T*T*T;
      return M;
    },
    
    // Mean anomaly of the moon
    // See AA p350 Eq49.5
    moonMeanAnomaly: function (T, k) {
      var M_prime = 201.5643 + 385.81693528*k + 0.0107582*T*T +
                    0.00001238*T*T*T - 0.000000058*T*T*T*T;
      return M_prime;
    },
    
    // Argument of latitude of the moon
    // See AA p350 Eq49.6
    moonArgumentOfLatitude: function (T, k) {
      var F = 160.7108 + 390.67050284*k - 0.0016118*T*T - 0.00000227*T*T*T +
              0.000000011*T*T*T*T;
      return F;
    },
    
    // Longitude of the ascending node of the lunar orbit
    // See AA p350 Eq49.7
    moonAscendingNodeLongitude: function (T, k) {
      var Omega = 124.7746 - 1.56375588*k + 0.0020672*T*T + 0.00000215*T*T*T;
      return Omega;
    },
    
    // Correction for the eccentricity of the earth's orbit
    eccentricityCorrection: function (T) {
      var E = 1 - 0.002516*T - 0.0000074*T*T;
      return E;
    },
    
    // Planetary arguments for moon phases
    // See AA p351
    planetaryArguments: function (T, k) {
      var A = [];
      A[0]  = 0; // Want to follow the numbering conventions from AA
      A[1]  = 299.77 +  0.107408*k - 0.009173*T*T;
      A[2]  = 251.88 +  0.016321*k;
      A[3]  = 251.83 + 26.651886*k;
      A[4]  = 349.42 + 36.412478*k;
      A[5]  =  84.66 + 18.206239*k;
      A[6]  = 141.74 + 53.303771*k;
      A[7]  = 207.14 +  2.453732*k;
      A[8]  = 154.84 +  7.306860*k;
      A[9]  =  34.52 + 27.261239*k;
      A[10] = 207.19 +  0.121824*k;
      A[11] = 291.34 +  1.844379*k;
      A[12] = 161.72 + 24.198154*k;
      A[13] = 239.56 + 25.513099*k;
      A[14] = 331.55 +  3.592518*k;
      return A;
    },
    
    // Corrections for all phases from planetary arguments
    // See AA p351f
    commonCorrections: function (A) {
      var DeltaJDE = 0.000325*auxMath.sind(A[1]) +
                     0.000165*auxMath.sind(A[2]) +
                     0.000164*auxMath.sind(A[3]) +
                     0.000126*auxMath.sind(A[4]) +
                     0.000110*auxMath.sind(A[5]) +
                     0.000062*auxMath.sind(A[6]) +
                     0.000060*auxMath.sind(A[7]) +
                     0.000056*auxMath.sind(A[8]) +
                     0.000047*auxMath.sind(A[9]) +
                     0.000042*auxMath.sind(A[10]) +
                     0.000040*auxMath.sind(A[11]) +
                     0.000037*auxMath.sind(A[12]) +
                     0.000035*auxMath.sind(A[13]) +
                     0.000023*auxMath.sind(A[14]);
      return DeltaJDE;
    },

    // Corrections for new moon and full moon
    // See AA p351
    newMoonFullMoonCorrections: function (E, M, M_prime, F, Omega, phase) {
      var DeltaJDE = - 0.00111*auxMath.sind(M_prime - 2*F) -
                       0.00057*auxMath.sind(M_prime + 2*F) +
                       0.00056*E*auxMath.sind(2*M_prime + M) -
                       0.00042*auxMath.sind(3*M_prime) +
                       0.00042*E*auxMath.sind(M + 2*F) +
                       0.00038*E*auxMath.sind(M - 2*F) -
                       0.00024*E*auxMath.sind(2*M_prime - M) -
                       0.00017*auxMath.sind(Omega) -
                       0.00007*auxMath.sind(M_prime + 2*M) +
                       0.00004*auxMath.sind(2*M_prime - 2*F) +
                       0.00004*auxMath.sind(3*M) +
                       0.00003*auxMath.sind(M_prime + M - 2*F) +
                       0.00003*auxMath.sind(2*M_prime + 2*F) -
                       0.00003*auxMath.sind(M_prime + M + 2*F) +
                       0.00003*auxMath.sind(M_prime - M + 2*F) -
                       0.00002*auxMath.sind(M_prime - M - 2*F) -
                       0.00002*auxMath.sind(3*M_prime + M) +
                       0.00002*auxMath.sind(4*M_prime);
      if (phase === 0) {
        DeltaJDE += - 0.40720*auxMath.sind(M_prime) +
                      0.17241*E*auxMath.sind(M) +
                      0.01608*auxMath.sind(2*M_prime) +
                      0.01039*auxMath.sind(2*F) +
                      0.00739*E*auxMath.sind(M_prime - M) -
                      0.00514*E*auxMath.sind(M_prime + M) +
                      0.00208*E*E*auxMath.sind(2*M);
      } else if (phase === 2) {
        DeltaJDE += - 0.40614*auxMath.sind(M_prime) +
                      0.17302*E*auxMath.sind(M) +
                      0.01614*auxMath.sind(2*M_prime) +
                      0.01043*auxMath.sind(2*F) +
                      0.00734*E*auxMath.sind(M_prime - M) -
                      0.00515*E*auxMath.sind(M_prime + M) +
                      0.00209*E*E*auxMath.sind(2*M);
      }
      return DeltaJDE;
    },

    // Corrections for the first and last quarter
    // See AA p352
    quarterCorrections: function (E, M, M_prime, F, Omega, phase) {
      var DeltaJDE = - 0.62801*auxMath.sind(M_prime) +
                       0.17172*E*auxMath.sind(M) -
                       0.01183*E*auxMath.sind(M_prime + M) +
                       0.00862*auxMath.sind(2*M_prime) +
                       0.00804*auxMath.sind(2*F) +
                       0.00454*E*auxMath.sind(M_prime - M) +
                       0.00204*E*E*auxMath.sind(2*M) -
                       0.00180*auxMath.sind(M_prime - 2*F) -
                       0.00070*auxMath.sind(M_prime + 2*F) -
                       0.00040*auxMath.sind(3*M_prime) -
                       0.00034*E*auxMath.sind(2*M_prime - M) +
                       0.00032*E*auxMath.sind(M + 2*F) +
                       0.00032*E*auxMath.sind(M - 2*F) -
                       0.00028*E*E*auxMath.sind(M_prime + 2*M) +
                       0.00027*E*auxMath.sind(2*M_prime + M) -
                       0.00017*auxMath.sind(Omega) -
                       0.00005*auxMath.sind(M_prime - M - 2*F) +
                       0.00004*auxMath.sind(2*M_prime + 2*F) -
                       0.00004*auxMath.sind(M_prime + M + 2*F) +
                       0.00004*auxMath.sind(M_prime - 2*M) +
                       0.00003*auxMath.sind(M_prime + M - 2*F) +
                       0.00003*auxMath.sind(3*M) +
                       0.00002*auxMath.sind(2*M_prime - 2*F) +
                       0.00002*auxMath.sind(M_prime - M + 2*F) -
                       0.00002*auxMath.sind(3*M_prime + M);
      var W = 0.00306 -
              0.00038*E*auxMath.cosd(M) +
              0.00026*auxMath.cosd(M_prime) -
              0.00002*auxMath.cosd(M_prime - M) +
              0.00002*auxMath.cosd(M_prime + M) +
              0.00002*auxMath.cosd(2*F);
      if (phase === 1) {
        DeltaJDE += W;
      } else if (phase === 3) {
        DeltaJDE -= W;
      }
      return DeltaJDE;
    }
  };

 /*********************************
  *** CONSTANTS FOR POLYNOMIALS ***
  *********************************/
  var constants = {
    // See AA p144
    sunMeanAnomaly: [357.52772, 35999.050340, -0.0001603, -1/300000],
    // See AA p163 Eq 25.2
    sunMeanLongitude: [280.46646, 36000.76983, 0.0003032],
    // See AA p144
    // See AA p147 Eq22.3
    meanObliquityOfEcliptic:
        [84381.448/3600, -4680.93/3600, -1.55/3600, 1999.25/3600, -51.38/3600,
         -249.67/3600, -39.05/3600, 7.12/3600, 27.87/3600, 5.79/3600, 2.45/3600],
    moonArgumentOfLatitude: [93.27191, 483202.017538, -0.0036825, 1/327270],
    // See AA p144
    moonAscendingNodeLongitude: [125.04452, -1934.136261, 0.0020708, 1/450000],
    // See AA p144
    moonMeanAnomaly: [134.96298, 477198.867398, 0.0086972, 1/56250],
    // See AA p144
    moonMeanElongation: [297.85036, 445267.111480, -0.0019142, 1/189474],
    // Nutations in longitude and obliquity
    // See AA p145f
    nutations:
       [[ 0,  0,  0,  0, 1, -171996, -174.2, 92025,  8.9],
        [-2,  0,  0,  2, 2,  -13187,   -1.6,  5736, -3.1],
        [ 0,  0,  0,  2, 2,   -2274,   -0.2,   977, -0.5],
        [ 0,  0,  0,  0, 2,    2062,    0.2,  -895,  0.5],
        [ 0,  1,  0,  0, 0,    1426,   -3.4,    54, -0.1],
        [ 0,  0,  1,  0, 0,     712,    0.1,    -7,    0],
        [-2,  1,  0,  2, 2,    -517,    1.2,   224, -0.6],
        [ 0,  0,  0,  2, 1,    -386,   -0.4,   200,    0],
        [ 0,  0,  1,  2, 2,    -301,      0,   129, -0.1],
        [-2, -1,  0,  2, 2,     217,   -0.5,   -95,  0.3],
        [-2,  0,  1,  0, 0,    -158,      0,     0,    0],
        [-2,  0,  0,  2, 1,     129,    0.1,   -70,    0],
        [ 0,  0, -1,  2, 2,     123,      0,   -53,    0],
        [ 2,  0,  0,  0, 0,      63,      0,     0,    0],
        [ 0,  0,  1,  0, 1,      63,    0.1,   -33,    0],
        [ 2,  0, -1,  2, 2,     -59,      0,    26,    0],
        [ 0,  0, -1,  0, 1,     -58,   -0.1,    32,    0],
        [ 0,  0,  1,  2, 1,     -51,      0,    27,    0],
        [-2,  0,  2,  0, 0,      48,      0,     0,    0],
        [ 0,  0, -2,  2, 1,      46,      0,   -24,    0],
        [ 2,  0,  0,  2, 2,     -38,      0,    16,    0],
        [ 0,  0,  2,  2, 2,     -31,      0,    13,    0],
        [ 0,  0,  2,  0, 0,      29,      0,     0,    0],
        [-2,  0,  1,  2, 2,      29,      0,   -12,    0],
        [ 0,  0,  0,  2, 0,      26,      0,     0,    0],
        [-2,  0,  0,  2, 0,     -22,      0,     0,    0],
        [ 0,  0, -1,  2, 1,      21,      0,   -10,    0],
        [ 0,  2,  0,  0, 0,      17,   -0.1,     0,    0],
        [ 2,  0, -1,  0, 1,      16,      0,    -8,    0],
        [-2,  2,  0,  2, 2,     -16,    0.1,     7,    0],
        [ 0,  1,  0,  0, 1,     -15,      0,     9,    0],
        [-2,  0,  1,  0, 1,     -13,      0,     7,    0],
        [ 0, -1,  0,  0, 1,     -12,      0,     6,    0],
        [ 0,  0,  2, -2, 0,      11,      0,     0,    0],
        [ 2,  0, -1,  2, 1,     -10,      0,     5,    0],
        [ 2,  0,  1,  2, 2,     -8,       0,     3,    0],
        [ 0,  1,  0,  2, 2,      7,       0,    -3,    0],
        [-2,  1,  1,  0, 0,     -7,       0,     0,    0],
        [ 0, -1,  0,  2, 2,     -7,       0,     3,    0],
        [ 2,  0,  0,  2, 1,     -7,       0,     3,    0],
        [ 2,  0,  1,  0, 0,      6,       0,     0,    0],
        [-2,  0,  2,  2, 2,      6,       0,    -3,    0],
        [-2,  0,  1,  2, 1,      6,       0,    -3,    0],
        [ 2,  0, -2,  0, 1,     -6,       0,     3,    0],
        [ 2,  0,  0,  0, 1,     -6,       0,     3,    0],
        [ 0, -1,  1,  0, 0,      5,       0,     0,    0],
        [-2, -1,  0,  2, 1,     -5,       0,     3,    0],
        [-2,  0,  0,  0, 1,     -5,       0,     3,    0],
        [ 0,  0,  2,  2, 1,     -5,       0,     3,    0],
        [-2,  0,  2,  0, 1,      4,       0,     0,    0],
        [-2,  1,  0,  2, 1,      4,       0,     0,    0],
        [ 0,  0,  1, -2, 0,      4,       0,     0,    0],
        [-1,  0,  1,  0, 0,     -4,       0,     0,    0],
        [-2,  1,  0,  0, 0,     -4,       0,     0,    0],
        [ 1,  0,  0,  0, 0,     -4,       0,     0,    0],
        [ 0,  0,  1,  2, 0,      3,       0,     0,    0],
        [ 0,  0, -2,  2, 2,     -3,       0,     0,    0],
        [-1, -1,  1,  0, 0,     -3,       0,     0,    0],
        [ 0,  1,  1,  0, 0,     -3,       0,     0,    0],
        [ 0, -1,  1,  2, 2,     -3,       0,     0,    0],
        [ 2, -1, -1,  2, 2,     -3,       0,     0,    0],
        [ 0,  0,  3,  2, 2,      3,       0,     0,    0],
        [ 2, -1,  0,  2, 2,     -3,       0,     0,    0]]
  };

 /**********************************
  *** CALCULATIONS FOR SUN TIMES ***
  **********************************/
  var sunTimes = {
    /*************************************************************************
     * VARIABLES
     * alpha:         Apparent right ascension of the sun
     * C:             Equation of the Center of the Sun
     * D:             Mean elongation of the Moon from the Sun
     * delta:         Apparent declination of the sun
     * DeltaEpsilon:  Nutations in obliquity
     * DeltaM         Correction for m
     * DeltaPsi:      Nutations in longitude
     * epsilon0:      Mean obliquity of the ecliptic
     * F:             Argument of latitude of the moon
     * H:             Local hour angle, measured westwards from south
     * h:             altitude, positive above the horizon
     * H0:            Approximate local hour angle
     * L:             Geographic longitude
     * L0:            Mean Longitude of the Sun referred to the mean equinox of
     *                the date
     * lambda:        Apparent longitude of the Sun
     * M_prime:       Mean anomaly of the moon
     * M:             Mean anomaly of the sun
     * m{x}           Times as fraction of day of event
     * Omega:         Longitude of the ascending node of the lunar orbit
     * phi:           Geographic latitude
     * Sol:           True Longitude of the Sun
     * T:             Fractional number of Julian centuries since 01/01/2000 12UT
     * theta:         Apparent sideral time at Greenwhich
     * theta0:        Mean sidereal time at Greenwhich
     *************************************************************************/
    
    // The transit time on the date at longitude L
    // See AA p102f
    sunTransit: function (datetime, L) {
      var timezone = datetime.tz();
      var transit = moment.tz([datetime.year(), datetime.month(), datetime.date(),
                               0, 0, 0], "UTC");
      var DeltaT = timeConversions.DeltaT(transit);
      var T = timeConversions.datetimeToT(transit);
      var Theta0 = sunTimes.apparentSiderealTimeGreenwhich(T);
      // Want 0h TD for this, not UT
      var TD = T - (DeltaT/(3600*24*36525));
      var alpha = sunTimes.sunApparentRightAscension(TD);
      // Sign flip for longitude from AA as we take East as positive
      var m = (alpha - L - Theta0)/360;
      m = sunTimes.normalizeM(m, datetime.utcOffset());
      var DeltaM = sunTimes.sunTransitCorrection(T, Theta0, DeltaT, L, m);
      m += DeltaM;
      transit.add(Math.floor(m*3600*24 + 0.5), 'seconds');
      if (my.roundToNearestMinute) {
        transit.add(30, 'seconds');
        transit.second(0);
      }
      transit.tz(timezone);
      return transit;
    },
    
    // The sunrise or sunset time on the date at latitude phi and longitude L
    // See AA p102f
    sunRiseSet: function (datetime, phi, L, flag) {
      var timezone = datetime.tz();
      var suntime = moment.tz([datetime.year(), datetime.month(), datetime.date(),
                               0, 0, 0], "UTC");
      var DeltaT = timeConversions.DeltaT(suntime);
      var T = timeConversions.datetimeToT(suntime);
      var Theta0 = sunTimes.apparentSiderealTimeGreenwhich(T);
      // Want 0h TD for this, not UT
      var TD = T - (DeltaT/(3600*24*36525));
      var alpha = sunTimes.sunApparentRightAscension(TD);
      var delta = sunTimes.sunApparentDeclination(TD);
      var H0 = sunTimes.approxLocalHourAngle(phi, delta);
      // Sign flip for longitude from AA as we take East as positive
      var m0 = (alpha - L - Theta0)/360;
      m0 = sunTimes.normalizeM(m0, datetime.utcOffset());
      var m;
      if (flag === "RISE") {
        m = m0 - H0/360;
      } else if (flag === "SET") {
        m = m0 + H0/360;
      } else {
        return false;
      }
      var counter = 0;
      var DeltaM = 1;
      // Repeat if correction is larger than ~9s
      while ((Math.abs(DeltaM) > 0.0001) && (counter < 3)) {
        DeltaM = sunTimes.sunRiseSetCorrection(T, Theta0, DeltaT, phi, L, m);
        m += DeltaM;
        counter++;
      }
      if (m > 0) {
        suntime.add(Math.floor(m*3600*24 + 0.5), 'seconds');
      } else {
        suntime.subtract(Math.floor(Math.abs(m)*3600*24 + 0.5), 'seconds');
      }
      if (my.roundToNearestMinute) {
        suntime.add(30, 'seconds');
        suntime.second(0);
      }
      suntime.tz(timezone);
      return suntime;
    },
    
    // Approximate local hour angle of the sun at rise or set
    // See AA p102 Eq15.1
    approxLocalHourAngle: function (phi, delta) {
      var cosH0 = (auxMath.sind(-50/60) - auxMath.sind(phi)*auxMath.sind(delta)) /
                  (auxMath.cosd(phi)*auxMath.cosd(delta));
      if (cosH0 < -1) {
        if (my.returnTimeForPNMS) {
          throw moment.tz("**2000-01-01 12:00:00", "YYYY-MM-DD HH:mm:ss", "Europe/London");
        } else {
          throw "MS";
        }
      } else if (cosH0 > 1) {
        if (my.returnTimeForPNMS) {
          throw moment.tz("--2000-01-01 12:00:00", "YYYY-MM-DD HH:mm:ss", "Europe/London");
        } else {
          throw "PN";
        }
      }
      var H0 = auxMath.rad2deg(Math.acos(cosH0));
      return H0;
    },

    // Normalize m to be on the correct date
    normalizeM: function (m, utcOffset) {
      var localM = m + utcOffset/1440;
      if (localM < 0) {
        return m + 1;
      } else if (localM > 1) {
        return m - 1;
      } else {
        return m;
      }
    },

    // Correction for transit time
    // See AA p103
    sunTransitCorrection: function (T, Theta0, DeltaT, L, m) {
      var theta0 = Theta0 + 360.985647*m;
      var n = m + DeltaT/864000;
      var alpha = sunTimes.interpolatedRa(T, n);
      var H = sunTimes.localHourAngle(theta0, L, alpha);
      var DeltaM = -H/360;
      return DeltaM;
    },

    sunRiseSetCorrection: function (T, Theta0, DeltaT, phi, L, m) {
      var theta0 = Theta0 + 360.985647*m;
      var n = m + DeltaT/864000;
      var alpha = sunTimes.interpolatedRa(T, n);
      var delta = sunTimes.interpolatedDec(T, n);
      var H = sunTimes.localHourAngle(theta0, L, alpha);
      var h = sunTimes.altitude(phi, delta, H);
      var DeltaM = (h + 50/60) /
                   (360*auxMath.cosd(delta)*auxMath.cosd(phi)*auxMath.sind(H));
      return DeltaM;
    },

    // Local Hour angle of the sun
    // See AA p103
    localHourAngle: function (theta0, L, alpha) {
      // Signflip for longitude
      var H = auxMath.reduceAngle(theta0 + L - alpha);
      if (H > 180) { H -= 360; }
      return H;
    },
   
    // Altitude of the sun above the horizon
    // See AA p93 Eq13.6
    altitude: function (phi, delta, H) {
      var h = auxMath.rad2deg(Math.asin(
          auxMath.sind(phi)*auxMath.sind(delta) +
          auxMath.cosd(phi)*auxMath.cosd(delta)*auxMath.cosd(H)));
      return h;
    },

    // interpolate right ascension at time given by T, n
    // See AA p103
    interpolatedRa: function (T, n) {
      var alpha1 = sunTimes.sunApparentRightAscension(T - (1/36525));
      var alpha2 = sunTimes.sunApparentRightAscension(T);
      var alpha3 = sunTimes.sunApparentRightAscension(T + (1/36525));
      // I don't understand why the RA has to be interpolated with normalization
      // but the Dec without, but the returned values are wrong otherwise...
      var alpha = auxMath.interpolateFromThree(alpha1, alpha2, alpha3, n, true);
      return auxMath.reduceAngle(alpha);
    },
    
    // interpolate declination at time given by T, n
    // See AA p103
    interpolatedDec: function (T, n) {
      var delta1 = sunTimes.sunApparentDeclination(T - (1/36525));
      var delta2 = sunTimes.sunApparentDeclination(T);
      var delta3 = sunTimes.sunApparentDeclination(T + (1/36525));
      var delta = auxMath.interpolateFromThree(delta1, delta2, delta3, n);
      return auxMath.reduceAngle(delta);
    },
    
    // Apparent right ascension of the sun
    // See AA p165 Eq25.6
    sunApparentRightAscension: function (T) {
      var Omega = sunTimes.moonAscendingNodeLongitude(T);
      var epsilon = sunTimes.trueObliquityOfEcliptic(T) +
                    0.00256*auxMath.cosd(Omega);
      var lambda = sunTimes.sunApparentLongitude(T);
      var alpha = auxMath.rad2deg(Math.atan2(
          auxMath.cosd(epsilon)*auxMath.sind(lambda), auxMath.cosd(lambda)));
      return auxMath.reduceAngle(alpha);
    },
    
    // Apparent declination of the sun
    // See AA p165 Eq25.7
    sunApparentDeclination: function (T) {
      var Omega = sunTimes.moonAscendingNodeLongitude(T);
      var epsilon = sunTimes.trueObliquityOfEcliptic(T) +
                    0.00256*auxMath.cosd(Omega);
      var lambda = sunTimes.sunApparentLongitude(T);
      var delta = auxMath.rad2deg(Math.asin(
          auxMath.sind(epsilon)*auxMath.sind(lambda)));
      return delta;
    },

    // Apparent sidereal time at Greenwhich
    // See AA p88
    apparentSiderealTimeGreenwhich: function (T) {
      var theta0 = sunTimes.meanSiderealTimeGreenwhich(T);
      var epsilon = sunTimes.trueObliquityOfEcliptic(T);
      var DeltaPsi = sunTimes.nutationInLongitude(T);
      var theta = theta0 + DeltaPsi*auxMath.cosd(epsilon);
      return auxMath.reduceAngle(theta);
    },

    // Mean sidereal time at Greenwhich
    // See AA P88 Eq12.4
    meanSiderealTimeGreenwhich: function (T) {
      var JD2000 = T*36525;
      var theta0 = 280.46061837 + 360.98564736629*JD2000 + 0.000387933*T*T -
                   T*T*T/38710000;
      return theta0;
    },

    // True obliquity of the ecliptic
    // See AA p147
    trueObliquityOfEcliptic: function (T) {
      var epsilon0 = sunTimes.meanObliquityOfEcliptic(T);
      var DeltaEpsilon = sunTimes.nutationInObliquity(T);
      var epsilon = epsilon0 + DeltaEpsilon;
      return epsilon;
    },

    // Mean obliquity of the ecliptic
    // See AA p147 Eq22.3
    meanObliquityOfEcliptic: function (T) {
      var U = T/100;
      var epsilon0 = auxMath.polynomial(U, constants.meanObliquityOfEcliptic);
      return epsilon0;
    },

    // Apparent Longitude of the Sun
    // See AA p164
    sunApparentLongitude: function (T) {
      var Sol = sunTimes.sunTrueLongitude(T);
      var Omega = sunTimes.moonAscendingNodeLongitude(T);
      var lambda = Sol - 0.00569 - 0.00478*auxMath.sind(Omega);
      return lambda;
    },

    // True Longitude of the Sun
    // See AA p164
    sunTrueLongitude: function (T) {
      var L0 = sunTimes.sunMeanLongitude(T);
      var C = sunTimes.sunEquationOfCenter(T);
      var Sol = L0 + C;
      return Sol;
    },

    // Equation of Center of the Sun
    // See AA p164
    sunEquationOfCenter: function (T) {
      var M = sunTimes.sunMeanAnomaly(T);
      var C = (1.914602 - 0.004817*T - 0.000014*T*T)*auxMath.sind(M) +
              (0.019993 - 0.000101*T)*auxMath.sind(2*M) +
               0.000290*auxMath.sind(3*M);
      return C;
    },

    // Nutation in longitude of the sun
    // See AA P 144ff
    nutationInLongitude: function (T) {
      var D = sunTimes.moonMeanElongation(T);
      var M = sunTimes.sunMeanAnomaly(T);
      var M_prime = sunTimes.moonMeanAnomaly(T);
      var F = sunTimes.moonArgumentOfLatitude(T);
      var Omega = sunTimes.moonAscendingNodeLongitude(T);
      var DeltaPsi = 0;
      var sineArg;
      for (var i = 0; i < 63; i++) {
        sineArg = constants.nutations[i][0]*D +
                  constants.nutations[i][1]*M +
                  constants.nutations[i][2]*M_prime +
                  constants.nutations[i][3]*F +
                  constants.nutations[i][4]*Omega;
        DeltaPsi += (constants.nutations[i][5] +
                     constants.nutations[i][6]*T)*auxMath.sind(sineArg);
      }
      DeltaPsi /= 36000000;
      return DeltaPsi;
    },
    
    // Nutation in obliquity of the sun
    // See AA p144ff
    nutationInObliquity: function (T) {
      var D = sunTimes.moonMeanElongation(T);
      var M = sunTimes.sunMeanAnomaly(T);
      var M_prime = sunTimes.moonMeanAnomaly(T);
      var F = sunTimes.moonArgumentOfLatitude(T);
      var Omega = sunTimes.moonAscendingNodeLongitude(T);
      var DeltaEpsilon = 0;
      var cosArg;
      for (var i = 0; i < 63; i++) {
        cosArg = constants.nutations[i][0]*D +
                 constants.nutations[i][1]*M +
                 constants.nutations[i][2]*M_prime +
                 constants.nutations[i][3]*F +
                 constants.nutations[i][4]*Omega;
        DeltaEpsilon += (constants.nutations[i][7] +
                         constants.nutations[i][8]*T)*auxMath.cosd(cosArg);
      }
      DeltaEpsilon /= 36000000;
      return DeltaEpsilon;
    },
    
    // Argument of Latitude of the moon
    // See AA p144
    moonArgumentOfLatitude: function (T) {
      var F = auxMath.polynomial(T, constants.moonArgumentOfLatitude);
      return auxMath.reduceAngle(F);
    },

    // Longitude of the ascending node of the Moon's mean orbit on the
    // ecliptic, measured from the mean equinox of the date
    // See AA p144
    moonAscendingNodeLongitude: function (T) {
      var Omega = auxMath.polynomial(T, constants.moonAscendingNodeLongitude);
      return auxMath.reduceAngle(Omega);
    },
    
    // Mean Anomaly of the Moon
    // See AA p144
    moonMeanAnomaly: function (T) {
      var M_prime = auxMath.polynomial(T, constants.moonMeanAnomaly);
      return auxMath.reduceAngle(M_prime);
    },
    
    // Mean elongation of the Moon from the Sun
    // See AA p144
    moonMeanElongation: function (T) {
      var D = auxMath.polynomial(T, constants.moonMeanElongation);
      return auxMath.reduceAngle(D);
    },
    
    // Mean anomaly of the Sun
    // See AA p144
    sunMeanAnomaly: function (T) {
      var M = auxMath.polynomial(T, constants.sunMeanAnomaly);
      return auxMath.reduceAngle(M);
    },
    
    // Mean Longitude of the Sun referred to the mean equinox of the date
    // See AA p163
    sunMeanLongitude: function (T) {
      var L0 = auxMath.polynomial(T, constants.sunMeanLongitude);
      return auxMath.reduceAngle(L0);
    }

  };

  var returnPNMS = function (returnDate, date, hour) {
    if (my.returnTimeForPNMS) {
      if (date.isDST()) {
        hour += 1;
      }
      returnDate.tz(date.tz()).year(date.year()).month(date.month()).date(date.date()).hour(hour).minute(0).second(0);
      return returnDate;
    } else {
      return returnDate;
    }
  };

 /************************
  *** PUBLIC FUNCTIONS ***
  ************************/

  // Returns a moment object with the sunrise for the date provided by datetime,
  // which should also be a moment object. Input date should always have a timezone
  // associated or be UTC, lone UTC offsets might lead to unexpected behaviour
  // phi and L are the latitude and longitude respectively
  // If there is no sunrise event on the given day, a string is returned, either
  // "MS" for midnight sun or "PN" for polar night (unless returnTimeForPNMS is true).
  my.sunrise = function (datetime, phi, L) {
    var sunrise;
    try {
      sunrise = sunTimes.sunRiseSet(datetime, phi, L, "RISE");
    }
    catch (err) {
      return returnPNMS(err, datetime, 6);
    }
    return sunrise;
  };

  // Returns a moment object with the sunset for the date provided by datetime,
  // which should also be a moment object. Input date should always have a timezone
  // associated or be UTC, lone UTC offsets might lead to unexpected behaviour
  // phi and L are the latitude and longitude respectively
  // If there is no sunset event on the given day, a string is returned, either
  // "MS" for midnight sun or "PN" for polar night (unless returnTimeForPNMS is true).
  my.sunset = function (datetime, phi, L) {
    var sunset;
    try {
      sunset = sunTimes.sunRiseSet(datetime, phi, L, "SET");
    }
    catch (err) {
      return returnPNMS(err, datetime, 18);
    }
    return sunset;
  };

  // Returns a moment object with the solar noon for the date provided by datetime,
  // which should also be a moment object. Input date should always have a timezone
  // associated or be UTC, lone UTC offsets might lead to unexpected behaviour
  // L is the longitude
  my.solarNoon = function (datetime, L) {
    var transit = sunTimes.sunTransit(datetime, L);
    return transit;
  };

  // Returns an array of moment objects for all moons of the given phase that
  // occur within the given calendar year. Phase is an integer where
  // 0 = new moon
  // 1 = first quarter
  // 2 = full moon
  // 3 = last quarter
  my.yearMoonPhases = function (year, phase, timezone) {
    var yearBegin = moment([year]);
    var yearEnd = moment([year + 1]);
    // this will give us k for the first new moon of the year or earlier
    var k = Math.floor(timeConversions.approxK(yearBegin)) - 1;
    // taking 15 events will make sure we catch every event in the year
    var phaseTimes = [];
    var JDE;
    var moonDatetime;
    var DeltaT;
    for (var i = 0; i < 15; i++) {
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
      if (my.roundToNearestMinute) {
        moonDatetime.add(30, 'seconds');
        moonDatetime.second(0);
      }
      if (timezone !== undefined) {
        timezone = "UTC";
      }
      moonDatetime.tz(timezone);
      if ((moonDatetime.isAfter(yearBegin)) && (moonDatetime.isBefore(yearEnd))) {
        phaseTimes.push(moonDatetime);
      }
      k++;
    }
    return phaseTimes;
  };

  return my;
}());
