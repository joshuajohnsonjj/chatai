import type { Handler } from 'aws-lambda';
import * as dotenv from 'dotenv';
import { type TestCredentialsRequestData } from '../../lib/types';
import { decryptData } from '../../lib/decryption';
import { NotionWrapper } from '../../lib/dataSources/notion';
import { GoogleDriveService } from '../../lib/dataSources/googleDrive';
import { SlackWrapper } from '../../lib/dataSources/slack';

dotenv.config({ path: __dirname + '/../../../../.env' });

enum DataSourceTypes {
    NOTION = 'NOTION',
    GOOGLE_DRIVE = 'GOOGLE_DRIVE',
    SLACK = 'SLACK',
}

/**
 * API Gateway /test-credentials POST handler
 */
export const handler: Handler = async (req): Promise<{ isValid: boolean; message: string }> => {
    const data: TestCredentialsRequestData = req.body;

    console.log(`Testing ${data.dataSourceTypeName} data source credential(s)`);

    const decryptedSecret = decryptData(process.env.RSA_PRIVATE_KEY!, data.secret);

    switch (data.dataSourceTypeName) {
        case DataSourceTypes.NOTION: {
            const validity = await new NotionWrapper(decryptedSecret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case DataSourceTypes.GOOGLE_DRIVE: {
            const validity = await new GoogleDriveService(decryptedSecret).testConnection();
            return { isValid: validity, message: validity ? '' : 'Invalid token' };
        }
        case DataSourceTypes.SLACK: {
            const validity = await new SlackWrapper(decryptedSecret).testConnection(data.externalId ?? '');
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
