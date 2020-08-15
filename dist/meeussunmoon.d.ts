import { DateTime as LuxonDateTime } from 'luxon';
import {DateFormatKeys, MoonPhase} from "../src/types";

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

export function sunrise(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function sunset(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function solarNoon(datetime: DateTime, longitude: number): DateTime;

export function civilDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function civilDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function nauticalDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function nauticalDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function astronomicalDawn(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function astronomicalDusk(datetime: DateTime, latitude: number, longitude: number): DateTime | NoEventCode;

export function yearMoonPhases(year: number, phase: MoonPhaseNumber, timezone?: string): Array<DateTime>;

export function yearAllMoonPhases(year: number, timezone?: string): Array<MoonPhase>;

export function format(datetime: DateTime, formatString: string): string;

export function settings(settings: MeeusSunMoonSettings): void;
