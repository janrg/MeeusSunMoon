import { DateFormatKeys, MoonPhase } from "../src/types";
import { DateTime } from "luxon";

export class DateTimeWithErrorCode extends DateTime {
    errorCode?: string;
}

export interface MeeusSunMoonSettings {
    roundToNearestMinute?: boolean;
    returnTimeForNoEventCase?: boolean;
    dateFormatKeys?: DateFormatKeys;
}

export type NoEventCode = 'SUN_HIGH' | 'SUN_LOW';

export type MoonPhaseNumber = 0 | 1 | 2 | 3;

export function sunrise(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function sunset(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function solarNoon(datetime: DateTime, longitude: number): DateTimeWithErrorCode;

export function civilDawn(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function civilDusk(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function nauticalDawn(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function nauticalDusk(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function astronomicalDawn(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function astronomicalDusk(datetime: DateTime, latitude: number, longitude: number): DateTimeWithErrorCode | NoEventCode;

export function yearMoonPhases(year: number, phase: MoonPhaseNumber, timezone?: string): Array<DateTime>;

export function yearAllMoonPhases(year: number, timezone?: string): Array<MoonPhase>;

export function format(datetime: DateTimeWithErrorCode, formatString: string): string;

export function settings(settings: MeeusSunMoonSettings): void;
