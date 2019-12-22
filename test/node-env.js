import {assert} from 'chai';
import moment from 'moment';

global.assert = assert;
global.moment = moment;

(async () => {
  await import('moment-timezone/builds/moment-timezone-with-data.min.js');
  run();
})();
