import aws from 'aws-sdk';

const kms = new aws.KMS({
	accessKeyId: process.env.AWS_KMS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_KMS_SECRET_KEY,
	region: process.env.AWS_KMS_REGION
});

const encryptionAlgorithm = 'RSAES_OAEP_SHA_256';

export const decrypt = (buffer): string => {
	const params = {
		CiphertextBlob: buffer, // The encrypted data (ciphertext).
		EncryptionAlgorithm: encryptionAlgorithm, // The encryption algorithm that was used to encrypt the data. This parameter is required to decrypt with an asymmetric KMS key.
		KeyId: process.env.AWS_KMS_MASTER_KEY_ID// A key identifier for the KMS key to use to decrypt the data. This parameter is required to decrypt with an asymmetric KMS key.
	};
	kms.decrypt(params, function(err, data) {
		if (err) {
			console.log(err, err.stack); // an error occurred
		}
		else {
			return data;           // successful response
		}   
		/*
        data = {
        EncryptionAlgorithm: "RSAES_OAEP_SHA_256", // The encryption algorithm that was used to decrypt the ciphertext.
        KeyId: "arn:aws:kms:us-west-2:111122223333:key/0987dcba-09fe-87dc-65ba-ab0987654321", // The Amazon Resource Name (ARN) of the KMS key that was used to decrypt the data.
        Plaintext: <Binary String>// The decrypted (plaintext) data.
        }
        */
	});     
	return '';
};
