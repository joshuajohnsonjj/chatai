export const dateToGmailMinDateFilter = (date: Date): string =>
    `after:${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
