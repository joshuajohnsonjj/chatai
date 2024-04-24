import axios from 'axios';
import { DocsAPIEndpoints } from './types';

export class GoogleDriveService {
    private static readonly DocsBaseUrl = 'https://docs.googleapis.com/v1';

    private static readonly DriveBaseUrl = 'https://www.googleapis.com/drive/v3';

    private readonly accessToken: string;

    constructor(accessToken: string) {
        this.accessToken = accessToken;
    }

    public async getFileContent(docId: string) {
        const response = await axios.request({
            method: 'get',
            baseURL: GoogleDriveService.DocsBaseUrl,
            url: `${DocsAPIEndpoints.READ_DOCUMET.replace(':documentId', docId)}?suggestionsViewMode=PREVIEW_WITHOUT_SUGGESTIONS`,
            headers: {
                Authorization: `Bearer: ${this.accessToken}`,
            },
        });

        console.log(response);
    }
}
