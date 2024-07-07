import type { Handler } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { type TestCredentialsRequestData } from '../../lib/types';
import { decryptData } from '../../lib/decryption';
import { NotionService } from '../../lib/dataSources/notion';
import { GoogleDriveService } from '../../lib/dataSources/googleDrive';
import { GmailService } from '../../lib/dataSources/gmail';
import { GoogleCalService } from '../../lib/dataSources/googleCal';
import { SlackService } from '../../lib/dataSources/slack';

dotenv.config({ path: __dirname + '/../../../../.env' });

/**
 * API Gateway /test-credentials POST handler
 */
export const handler: Handler = async (req): Promise<{ isValid: boolean; message: string }> => {
    const data: TestCredentialsRequestData = req.body;

    console.log(`Testing ${data.dataSourceTypeName} data source credential(s)`);

    switch (data.dataSourceTypeName) {
        case NotionService.DataSourceTypeName: {
            const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, data.secret);
            const validity = await new NotionService(decryptedSecret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case GoogleDriveService.DataSourceTypeName: {
            const validity = await new GoogleDriveService(data.secret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case GmailService.DataSourceTypeName: {
            const validity = await new GmailService(data.secret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case GoogleCalService.DataSourceTypeName: {
            const validity = await new GoogleCalService(data.secret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case SlackService.DataSourceTypeName: {
            const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, data.secret);
            const validity = await new SlackService(decryptedSecret).testConnection(data.externalId!);
            return {
                isValid: validity.appId && validity.token,
                message:
                    validity.appId && validity.token
                        ? ''
                        : !validity.appId
                          ? 'Invalid app id'
                          : 'Invalid token or missing scopes',
            };
        }
        default:
            return { isValid: false, message: 'Invalid data source type' };
    }
};
