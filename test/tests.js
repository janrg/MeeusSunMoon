"use strict";
MeeusSunMoon.roundToNearestMinute = true;
MeeusSunMoon.returnTimeForPNMS = false;
QUnit.config.hidepassed = true;
var date, sunrise, transit, sunset, refSunrise, refTransit, refSunset, i;
var maxError = 1;

// Test that the correct times for moon phases are returned
QUnit.test("MoonPhases", function(assert) {
  var newMoons = MeeusSunMoon.yearMoonPhases(2016, 0);
  var firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1);
  var fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2);
  var lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3);
  var i;
  var phaseTime;
  for (i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], "UTC");
    assert.ok(Math.abs(newMoons[i].diff(phaseTime, "minutes")) <= maxError, "New Moon: " + newMoons[i].format("YYYY-MM-DD HH:mm Z") + "/" + phaseTime.format("HH:mm Z"));
  }
  for (i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], "UTC");
    assert.ok(Math.abs(firstQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "First Quarter: " + firstQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], "UTC");
    assert.ok(Math.abs(fullMoons[i].diff(phaseTime, "minutes")) <= maxError, "Full Moon: " + fullMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], "UTC");
    assert.ok(Math.abs(lastQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "Last Quarter: " + lastQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
});

// Now test that it works for returning moon phases in local time:
QUnit.test("MoonPhases with Timezone", function(assert) {
  var timezone = "Pacific/Auckland";
  var newMoons = MeeusSunMoon.yearMoonPhases(2016, 0, timezone);
  var firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1, timezone);
  var fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2, timezone);
  var lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3, timezone);
  var i;
  var phaseTime;
  for (i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(newMoons[i].diff(phaseTime, "minutes")) <= maxError, "New Moon: " + newMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(firstQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "First Quarter: " + firstQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(fullMoons[i].diff(phaseTime, "minutes")) <= maxError, "Full Moon: " + fullMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(lastQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "Last Quarter: " + lastQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
});

// Test sunrise, solar noon, and trnsit times for a range of locations for all of 2015
var locations = [honolulu, vancouver, miami, quito, ushuaia, montevideo, nyalesund, berlin, capetown, nairobi, baghdad, shanghai, jakarta, mcmurdo, auckland, anadyr];
for (let location of locations) {
  QUnit.test( "Sunrise/Solar Noon/Sunset:" + location.name, function( assert ) {
    for (i = 0; i < location.data.length; i++) {
      date = moment.tz(location.data[i][0], location.timezone);
      sunrise = MeeusSunMoon.sunrise(date, location.latitude, location.longitude);
      transit = MeeusSunMoon.solarNoon(date, location.longitude);
      sunset = MeeusSunMoon.sunset(date, location.latitude, location.longitude);
      if (location.data[i][1] != "MS" && location.data[i][1] != "PN") {
        refSunrise = moment.tz(location.data[i][1], location.timezone);
        refSunset = moment.tz(location.data[i][2], location.timezone);
      } else {
        refSunrise = location.data[i][1];
        refSunset = location.data[i][2]
      }
      refTransit = moment.tz(location.data[i][3], location.timezone);
      if (sunrise != "MS" && sunrise != "PN" && sunset != "MS" && sunset != "PN"){
        assert.ok(Math.abs(sunrise.diff(refSunrise, "minutes")) <= maxError, location.name + " - Sunrise " + date.format("YYYY-MM-DD") + " " + sunrise.format("HH:mm") + "/" + refSunrise.format("HH:mm"));
        assert.ok(Math.abs(sunset.diff(refSunset, "minutes")) <= maxError, location.name + " - Sunset " + date.format("YYYY-MM-DD") + " " + sunset.format("HH:mm") + "/" + refSunset.format("HH:mm"));
      } else {
        assert.ok(sunrise === refSunrise, location.name + " - Sunrise " + date.format("YYYY-MM-DD") + " " + sunrise + "/" + refSunrise);
        assert.ok(sunset === refSunset, location.name + " - Sunset " + date.format("YYYY-MM-DD") + " " + sunset + "/" + refSunset);
      }
      assert.ok(Math.abs(transit.diff(refTransit, "minutes")) <= maxError, location.name + " - Solar Noon " + date.format("YYYY-MM-DD") + " " + transit.format("HH:mm") + "/" + refTransit.format("HH:mm"));
    }
  });
}
