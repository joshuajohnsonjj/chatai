// https://fireship.io/lessons/node-crypto-examples/
import NodeRSA from 'node-rsa';
import fs from 'fs';

export class RsaCipher {
    private readonly key: NodeRSA;

    constructor(privatePemFilePath?: string) {
        if (!privatePemFilePath) {
            this.key = new NodeRSA({ b: 2048 });
            console.warn('Using RSA Cipher without specifiying pem file. Generating new keys...');
        } else {
            const pem = fs.readFileSync(privatePemFilePath, 'utf8');
            this.key = new NodeRSA(pem);
        }
    }

    public encrypt(plainData: string, rsaPublicKey: string): string {
        const tempKey = new NodeRSA();
        tempKey.importKey(rsaPublicKey, 'pkcs8-public-pem');
        return tempKey.encrypt(plainData, 'base64');
    }

    public decrypt(encryptedString: string): string {
        return this.key.decrypt(encryptedString, 'utf8');
    }

    public getPublicKey() {
        return this.key.exportKey('pkcs8-public-pem');
    }
}
