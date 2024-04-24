import moment from 'moment';

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

/**
 * Formats raw text response into prettier output
 *      - formats numbered/bulleted lists
 *      - TODO: format code
 */
export const formatChatResponse = (rawResponse: string): string => {
    const startBulletRegex = /( \* )/g;
    const numberedListRegex = /(\d+\.)/g;

    const result = rawResponse
        .replace(startBulletRegex, '\n$1')
        .replace(numberedListRegex, '\n$1');

    return result.trim();
}
