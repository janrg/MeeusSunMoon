import { DateTime as LuxonDateTime } from 'luxon';

// eslint-disable-next-line require-jsdoc
export class DateTime extends LuxonDateTime {
    errorCode?: string;
}

export interface MeeusSunMoonOptions {
    roundToNearestMinute?: boolean;
    returnTimeForNoEventCase?: boolean;
    dateFormatKeys?: DateFormatKeys;
}

export interface DateFormatKeys {
    SUN_HIGH: string;
    SUN_LOW: string;
}
