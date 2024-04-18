import NodeRSA from 'node-rsa';
import fs from 'fs';

export class RsaCipher {
    private readonly key?: NodeRSA;

    constructor(privatePemFilePath?: string) {
        if (privatePemFilePath) {
            const pem = fs.readFileSync(privatePemFilePath, 'utf8');
            this.key = new NodeRSA(pem);
        }
    }

    public encrypt(plainData: string, rsaPublicKeyFilePath: string): string {
        const tempKey = new NodeRSA();
        const publicPem = fs.readFileSync(rsaPublicKeyFilePath, 'utf8');
        tempKey.importKey(publicPem, 'pkcs8-public-pem');
        return tempKey.encrypt(plainData, 'base64');
    }

    public decrypt(encryptedString: string): string {
        if (!this.key) {
            return '';
        }
        return this.key.decrypt(encryptedString, 'utf8');
    }

    public getPublicKey() {
        if (!this.key) {
            return '';
        }
        return this.key.exportKey('pkcs8-public-pem');
    }
}
