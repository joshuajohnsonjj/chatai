async function importPublicKey(pem) {
    // Remove the PEM header and footer
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    const binaryDerString = window.atob(pemContents);
    const binaryDer = str2ab(binaryDerString);

    // Import the public key
    const publicKey = await crypto.subtle.importKey(
        'spki',
        binaryDer,
        {
            name: 'RSA-OAEP',
            hash: { name: 'SHA-256' },
        },
        true, // extractable
        ['encrypt'],
    );
    return publicKey;
}

function str2ab(str) {
    const buf = new ArrayBuffer(str.length);
    const bufView = new Uint8Array(buf);
    for (let i = 0, strLen = str.length; i < strLen; i++) {
        bufView[i] = str.charCodeAt(i);
    }
    return buf;
}

async function encryptWithImportedKey(publicKey, message) {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const encrypted = await crypto.subtle.encrypt(
        {
            name: 'RSA-OAEP',
        },
        publicKey,
        data,
    );

    return encrypted;
}

function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

export async function encrypt(secretMessage: string): Promise<string> {
    // Import the public key
    const publicKey = await importPublicKey(import.meta.env.VITE_RSA_PUBLIC_KEY);
    const encryptedData = await encryptWithImportedKey(publicKey, secretMessage);
    const encryptedBase64 = arrayBufferToBase64(encryptedData);

    return encryptedBase64;
}
