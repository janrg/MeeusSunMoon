import * as MeeusSunMoon from "../src/index.js";
import { locations, moonPhases } from "./referenceTimes.js";

MeeusSunMoon.options({ roundToNearestMinute: true });

QUnit.config.hidepassed = true;
var maxError = 1;

// Test that the correct times for moon phases are returned
QUnit.test("MoonPhases", function(assert) {
  var newMoons = MeeusSunMoon.yearMoonPhases(2016, 0);
  var firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1);
  var fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2);
  var lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3);
  var phaseTime;
  for (let i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], "UTC");
    assert.ok(Math.abs(newMoons[i].diff(phaseTime, "minutes")) <= maxError, "New Moon: " + newMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (let i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], "UTC");
    assert.ok(Math.abs(firstQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "First Quarter: " + firstQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (let i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], "UTC");
    assert.ok(Math.abs(fullMoons[i].diff(phaseTime, "minutes")) <= maxError, "Full Moon: " + fullMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
  for (let i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], "UTC");
    assert.ok(Math.abs(lastQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "Last Quarter: " + lastQuarterMoons[i].format("YYYY-MM-DD HH:mm") + "/" + phaseTime.format("HH:mm"));
  }
});

// Now test that it works for returning moon phases in local time:
QUnit.test("MoonPhases with Timezone", function(assert) {
  let timezone = "Pacific/Auckland";
  let newMoons = MeeusSunMoon.yearMoonPhases(2016, 0, timezone);
  let firstQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 1, timezone);
  let fullMoons = MeeusSunMoon.yearMoonPhases(2016, 2, timezone);
  let lastQuarterMoons = MeeusSunMoon.yearMoonPhases(2016, 3, timezone);
  let phaseTime;
  for (let i = 0; i < moonPhases.newMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.newMoon[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(newMoons[i].diff(phaseTime, "minutes")) <= maxError, "New Moon: " + newMoons[i].format("YYYY-MM-DD HH:mm Z") + "/" + phaseTime.format("HH:mm Z"));
  }
  for (let i = 0; i < moonPhases.firstQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.firstQuarter[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(firstQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "First Quarter: " + firstQuarterMoons[i].format("YYYY-MM-DD HH:mm Z") + "/" + phaseTime.format("HH:mm Z"));
  }
  for (let i = 0; i < moonPhases.fullMoon.length; i++) {
    phaseTime = moment.tz(moonPhases.fullMoon[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(fullMoons[i].diff(phaseTime, "minutes")) <= maxError, "Full Moon: " + fullMoons[i].format("YYYY-MM-DD HH:mm Z") + "/" + phaseTime.format("HH:mm Z"));
  }
  for (let i = 0; i < moonPhases.lastQuarter.length; i++) {
    phaseTime = moment.tz(moonPhases.lastQuarter[i], "UTC");
    phaseTime.tz(timezone);
    assert.ok(Math.abs(lastQuarterMoons[i].diff(phaseTime, "minutes")) <= maxError, "Last Quarter: " + lastQuarterMoons[i].format("YYYY-MM-DD HH:mm Z") + "/" + phaseTime.format("HH:mm Z"));
  }
});

// Test sunrise, solar noon, and trnsit times for a range of locations for all of 2015
for (let location of locations) {
  QUnit.test( "Sunrise/Solar Noon/Sunset:" + location.name, function(assert) { // jshint ignore:line
    for (let i = 0; i < location.data.length; i++) {
      let date = moment.tz(location.data[i][0], location.timezone);
      let sunrise = MeeusSunMoon.sunrise(date, location.latitude, location.longitude);
      let transit = MeeusSunMoon.solarNoon(date, location.longitude);
      let sunset = MeeusSunMoon.sunset(date, location.latitude, location.longitude);
      let refSunrise, refSunset;
      if (location.data[i][1] != "MS" && location.data[i][1] != "PN") {
        refSunrise = moment.tz(location.data[i][1], location.timezone);
        refSunset = moment.tz(location.data[i][2], location.timezone);
      } else {
        refSunrise = location.data[i][1];
        refSunset = location.data[i][2];
      }
      let refTransit = moment.tz(location.data[i][3], location.timezone);
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

var dateFormatKeys = {"**":"‡", "--":"†"};
QUnit.test("Polar Night / Midnight Sun Marker", function(assert) {
  MeeusSunMoon.options({ returnTimeForPNMS: true });
  let datePN = moment.tz("2016-07-01 12:00", "Antarctica/McMurdo");
  let dateMS = moment.tz("2016-01-01 12:00", "Antarctica/McMurdo");
  let datePNString = MeeusSunMoon.formatCI(MeeusSunMoon.sunrise(datePN, -77.83333333, 166.6), "HH:mm");
  let dateMSString = MeeusSunMoon.formatCI(MeeusSunMoon.sunrise(dateMS, -77.83333333, 166.6), "HH:mm");
  assert.ok(datePNString == "06:00†", datePNString + "/06:00†");
  assert.ok(dateMSString == "07:00‡", dateMSString + "/07:00‡");
});
