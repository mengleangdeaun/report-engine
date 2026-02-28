import dayjs from 'dayjs';
import store from '@/store';

/**
 * Formats a Date object or string according to the User's Redux Preferences.
 * @param date The date string or object to format
 * @param includeTime Whether or not to append the time format if it exists
 * @returns 
 */
export const formatUserDate = (date: any, includeTime: boolean = false): string => {
    if (!date) return '-';

    // Safety check for "-0001-11-30" or "0000-00-00"
    if (typeof date === 'string' && (date.startsWith('0000') || date.includes('-0001'))) return '-';

    const parsedDate = dayjs(date);
    if (!parsedDate.isValid()) return String(date); // Fallback if it's not a real date at all

    // Fetch the Format from Redux dynamically
    const state = store.getState();
    const dateFormat = state.themeConfig.dateFormat || 'MMM DD, YYYY';
    const timeFormat = state.themeConfig.timeFormat || '12h';

    let finalFormat = dateFormat;

    if (includeTime) {
        if (timeFormat === '24h') {
            finalFormat += ' HH:mm';
        } else {
            finalFormat += ' hh:mm A';
        }
    }

    return parsedDate.format(finalFormat);
};
