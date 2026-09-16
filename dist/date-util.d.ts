export type MonthGrid = (number | undefined)[][];
export interface MonthData {
    date: Date;
    month: MonthGrid;
}
export interface MonthTracker {
    years: Record<number, Record<number, MonthGrid>>;
    current?: Date;
}
export declare const monthTracker: MonthTracker;
export declare const months: string[];
export declare const days: string[];
export declare function createMonthTracker(): MonthTracker;
export declare function scrapeMonth(date: Date, tracker?: MonthTracker): MonthData;
export declare function scrapePreviousMonth(tracker?: MonthTracker): MonthData;
export declare function scrapeNextMonth(tracker?: MonthTracker): MonthData;
export declare function getDisplayDate(_date: Date): string;
export declare function parseTimeInput(input: string): [number, number, number];
export declare function formatTimeInputValue(hours: number, minutes: number, seconds: number, showSeconds?: boolean): string;
export declare function formatTime(hours: number, minutes: number, seconds: number, showSeconds?: boolean): string;
export declare function formatTimeFromInputElement(input: string, showSeconds?: boolean): string;
