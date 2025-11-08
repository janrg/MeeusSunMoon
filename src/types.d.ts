import { DateTime } from 'luxon';

export type MoonPhaseNumber = 0 | 1 | 2 | 3;

export type RiseSetFlag = 'RISE' | 'SET';

export type NoEventCode = 'SUN_HIGH' | 'SUN_LOW';

// @ts-ignore
export class DateTimeWithErrorCode extends DateTime {
    errorCode?: string;
}

export interface DateFormatKeys {
    SUN_HIGH: string;
    SUN_LOW: string;
}

export interface MeeusSunMoonSettings {
    roundToNearestMinute?: boolean;
    returnTimeForNoEventCase?: boolean;
    dateFormatKeys?: DateFormatKeys;
}

export interface MoonPhase {
    datetime: DateTime;
    phase: MoonPhaseNumber;
}
