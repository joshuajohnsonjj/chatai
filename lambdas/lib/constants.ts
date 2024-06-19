export const EMBEDDING_SIZE_IN_BYTES = 6144;

export enum InternalAPIEndpoints {
    COMPLETED_IMPORTS = '/v1/dataSource/internal/imports/completed',
    STARTING_IMPORTS = '/v1/dataSource/internal/imports/initiate',
    GOOGLE_AUTH_REFRESH = '/v1/auth/google/refresh',
}
