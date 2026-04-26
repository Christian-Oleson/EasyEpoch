export interface MonthTracker {
    years: object;
    current?: Date;
}
export declare const monthTracker: MonthTracker;
export declare const months: string[];
export declare const days: string[];
export declare function createMonthTracker(): MonthTracker;
export declare function scrapeMonth(date: Date, tracker?: MonthTracker): {
    date: Date;
    month: undefined;
};
export declare function scrapePreviousMonth(tracker?: MonthTracker): {
    date: Date;
    month: undefined;
};
export declare function scrapeNextMonth(tracker?: MonthTracker): {
    date: Date;
    month: undefined;
};
export declare function getDisplayDate(_date: Date): string;
export declare function formatTimeFromInputElement(input: string, showSeconds?: boolean): string;
