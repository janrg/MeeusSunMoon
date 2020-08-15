import { DateTime as LuxonDateTime } from 'luxon';

// eslint-disable-next-line require-jsdoc
export class DateTime extends LuxonDateTime {
    errorCode?: string;
}

export interface MeeusSunMoonSettings {
    roundToNearestMinute?: boolean;
    returnTimeForNoEventCase?: boolean;
    dateFormatKeys?: DateFormatKeys;
}

export interface DateFormatKeys {
    SUN_HIGH: string;
    SUN_LOW: string;
}

export interface MoonPhase {
    datetime: LuxonDateTime,
    phase: MoonPhaseNumber,
}

export type MoonPhaseNumber = 0 | 1 | 2 | 3;

export type RiseSetFlag = 'RISE' | 'SET';

export type NoEventCode = 'SUN_HIGH' | 'SUN_LOW';
