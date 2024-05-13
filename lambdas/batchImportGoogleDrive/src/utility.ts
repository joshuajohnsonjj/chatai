import type { GoogleDriveSQSMessageBody } from '@joshuajohnsonjj38/google-drive';

export const isValidMessageBody = (body: GoogleDriveSQSMessageBody): boolean => {
    if (
        'fileId' in body &&
        typeof body.fileId === 'string' &&
        'fileUrl' in body &&
        typeof body.fileUrl === 'string' &&
        'ownerEntityId' in body &&
        typeof body.ownerEntityId === 'string' &&
        'fileName' in body &&
        typeof body.fileName === 'string' &&
        'secret' in body &&
        typeof body.secret === 'string' &&
        typeof body.dataSourceId === 'string'
    ) {
        return true;
    }

    return false;
};
