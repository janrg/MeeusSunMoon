import { MeeusSunMoonSettings } from './types';

let roundToNearestMinute = false;
let returnTimeForNoEventCase = false;
let dateFormatKeys = {
    SUN_HIGH: '‡',
    SUN_LOW: '†',
};

const settings = (settings: MeeusSunMoonSettings) => {
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

export { settings, roundToNearestMinute, returnTimeForNoEventCase, dateFormatKeys };
