import moment from 'moment';
import startCase from 'lodash/startCase';
import reverse from 'lodash/reverse';

export const dateToString = (date: Date): string => {
    const momentDate = moment(date);
    const minutesPassed = moment().diff(momentDate, 'minutes');
    const daysPassed = moment().diff(momentDate, 'days');

    if (minutesPassed < 1) {
        return 'Just now';
    } else if (minutesPassed == 1) {
        return 'A minute ago';
    } else if (minutesPassed < 60) {
        return `${minutesPassed} minutes ago`;
    } else if (daysPassed <= 6) {
        return momentDate.fromNow();
    } else {
        return momentDate.format('M/D/YYYY');
    }
};

export const formatStringStartCase = (original: string): string => startCase(original.toLowerCase());

export const maxStrLenToElipse = (str: string, maxLen = 170): string =>
    str.length < maxLen - 3 ? str : str.substring(0, maxLen - 3) + '...';

export const autocompleteSearch = (input: string, values: string[]): string[] =>
    values.filter((value) => value.toLowerCase().includes(input.toLowerCase()));

export const pretyPrintTopicValue = (topic: string): string => {
    const splitStr = reverse(topic.split('/'));
    for (const part of splitStr) {
        if (part !== 'Other') {
            return part;
        }
    }

    // fallback, but never should hit this...
    return topic;
};
