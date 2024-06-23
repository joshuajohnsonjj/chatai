import { DataSyncInterval } from '../constants/dataSourceConfiguration';

export interface CreateDataSourceRequest {
    dataSourceTypeId: string;
    ownerEntityId: string;
    secret: string;
    backfillHistoricalStartDate?: string;
    selectedSyncInterval: DataSyncInterval;
    externalId?: string;
    refreshToken?: string;
    additionalConfiguration: any;
}
