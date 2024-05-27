import type { Handler } from 'aws-lambda';
import * as dotenv from 'dotenv';
import type { InitiateGoogleDriveWebhookRequestData, KillGoogleDriveWebhookRequestData } from '../../lib/types';
import { decryptData } from '../../lib/descryption';
import { GoogleDriveService } from '../../lib/dataSources/googleDrive';

dotenv.config({ path: __dirname + '/../../../../.env' });

/**
 * API Gateway /google-drive/webhook POST/DELETE handler
 */
export const handler: Handler = async (
    req,
): Promise<{
    success: boolean;
    id?: string;
    resourceId?: string;
}> => {
    const method: string = req.httpMethod;

    if (method === 'POST') {
        const data: InitiateGoogleDriveWebhookRequestData = req.body;
        console.log('Initiating webhook connection', data);

        const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, data.secret);
        const response = await new GoogleDriveService(decryptedSecret).initiateWebhookConnection(
            data.ownerEntityId,
            process.env.GOOGLE_WEBHOOK_HANDLER_ADDRESS!,
        );

        return {
            success: true,
            id: response.id,
            resourceId: response.resourceId,
        };
    } else {
        const data: KillGoogleDriveWebhookRequestData = req.body;
        console.log('Killing webhook connection', data);

        const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, data.secret);
        await new GoogleDriveService(decryptedSecret).killWebhookConnection(data.connectionId, data.resourceId);
    }

    return { success: true };
};
