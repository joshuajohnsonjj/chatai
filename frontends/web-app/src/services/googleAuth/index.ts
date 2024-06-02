import { loadGapiInsideDOM } from 'gapi-script';

const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export const initGoogleClient = async () => {
    await loadGapiInsideDOM();
    return new Promise((resolve, reject) => {
        (window as any).gapi.load('client:auth2', () => {
            (window as any).gapi.client
                .init({
                    apiKey: (import.meta as any).env.VITE_GOOGLE_API_KEY,
                    clientId: (import.meta as any).env.VITE_GOOGLE_CLIENT_ID,
                    discoveryDocs: DISCOVERY_DOCS,
                    scope: SCOPES,
                })
                .then(() => {
                    resolve((window as any).gapi);
                })
                .catch((error) => {
                    reject(error);
                });
        });
    });
};

export const googleSignIn = async () => {
    const auth2 = (window as any).gapi.auth2.getAuthInstance();
    const user = await auth2.signIn();
    return user.getAuthResponse();
};

export const googleSignOut = () => {
    const auth2 = (window as any).gapi.auth2.getAuthInstance();
    return auth2.signOut();
};
