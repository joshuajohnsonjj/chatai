import NodeRSA from 'node-rsa';

export class RsaCipher {
    private readonly key?: NodeRSA;

    constructor(privatePemStr?: string) {
        if (privatePemStr) {
            this.key = new NodeRSA(privatePemStr);
        }
    }

    public encrypt(plainData: string, publicPemStr: string): string {
        const tempKey = new NodeRSA();
        tempKey.importKey(publicPemStr, 'pkcs8-public-pem');
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
