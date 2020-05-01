import { DateTime as LuxonDateTime } from 'luxon';
import { DateFormatKeys } from "../src/types";

export class DateTime extends LuxonDateTime {
    errorCode?: string;
}

export interface MeeusSunMoonSettings {
    roundToNearestMinute?: boolean;
    returnTimeForNoEventCase?: boolean;
    dateFormatKeys?: DateFormatKeys;
}

export type NoEventCode = 'SUN_HIGH' | 'SUN_LOW';

export type MoonPhaseNumber = 0 | 1 | 2 | 3;

declare function sunrise(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function sunset(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function solarNoon(datetime: DateTime, longitude: number): DateTime;

declare function civilDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function civilDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function nauticalDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function nauticalDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function astronomicalDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function astronomicalDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

declare function yearMoonPhases(year: number, phase: MoonPhaseNumber, timezone?: string): Array<DateTime>;

declare function format(datetime: DateTime, formatString: string): string;

declare function settings(settings: MeeusSunMoonSettings): void;
