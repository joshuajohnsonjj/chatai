/* eslint-disable @typescript-eslint/no-explicit-any */
export type DataSourceAdditonalConfig = NotionAdditonalConfig | GmailAdditonalConfig;

export interface NotionAdditonalConfig {
    includeComments: boolean;
}

export interface GmailAdditonalConfig {
    onlySent: boolean;
    sentToWhitelist: string;
    receivedFromWhitelist: string;
}

export enum AdditonalConfigInputType {
    BOOLEAN = 'BOOLEAN',
    MULTI_STRING = 'MULTI_STRING',
    STRING = 'STRING',
    DATE = 'DATE',
}

export interface AdditionalConfigTemplate {
    [configFieldName: string]: {
        type: AdditonalConfigInputType;
        description: string;
        displayName: string;
        default: any;
    };
}
