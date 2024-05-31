export enum ErrorTypes {
    BadRequestError = 'BadRequestError',
    BadCredentialsError = 'BadCredentialsError',
    ResourceNotFoundError = 'ResourceNotFoundError',
    AccessDeniedError = 'AccessDeniedError',
    InternalError = 'InternalError',
}

export class BadRequestError extends Error {
    constructor(message: string) {
        super(message);
        this.name = ErrorTypes.BadRequestError;
    }
}

export class BadCredentialsError extends Error {
    constructor(message?: string) {
        super(message ?? 'The provided data source credentials are not valid.');
        this.name = ErrorTypes.BadCredentialsError;
    }
}

export class ResourceNotFoundError extends Error {
    constructor(id: string, type: string) {
        super(`${type} record with id ${id} does not exist.`);
        this.name = ErrorTypes.ResourceNotFoundError;
    }
}

export class AccessDeniedError extends Error {
    constructor(message?: string) {
        super(message ?? 'User not authorized to perform this action');
        this.name = ErrorTypes.AccessDeniedError;
    }
}

export class InternalError extends Error {
    constructor(message?: string) {
        super(message ?? "Oops... We couldn't complete that request. Contact support if issue persists.");
        this.name = ErrorTypes.InternalError;
    }
}
