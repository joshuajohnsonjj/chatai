export enum DataSyncInterval {
    INSTANT = 'INSTANT',
    SEMI_DAILY = 'SEMI_DAILY',
    DAILY = 'DAILY',
    WEEKLY = 'WEEKLY',
}

export const IndexingIntervalOptions = {
    [DataSyncInterval.INSTANT]: {
        value: DataSyncInterval.INSTANT,
        text: 'Instant',
        level: 4,
    },
    [DataSyncInterval.SEMI_DAILY]: {
        value: DataSyncInterval.SEMI_DAILY,
        text: 'Semi-daily',
        level: 3,
    },
    [DataSyncInterval.DAILY]: {
        value: DataSyncInterval.DAILY,
        text: 'Daily',
        level: 2,
    },
    [DataSyncInterval.WEEKLY]: {
        value: DataSyncInterval.WEEKLY,
        text: 'Weekly',
        level: 1,
    },
};
