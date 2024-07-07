import * as forge from 'node-forge';

function importPrivateKey(pem: string): forge.pki.PrivateKey {
    return forge.pki.privateKeyFromPem(pem);
}

export function decryptData(privatePemString: string, encryptedBase64: string): string {
    const privateKey = importPrivateKey(privatePemString);
    const encryptedBytes = forge.util.decode64(encryptedBase64);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decryptedBytes = (privateKey as any).decrypt(encryptedBytes, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
    });

    return forge.util.decodeUtf8(decryptedBytes);
}
