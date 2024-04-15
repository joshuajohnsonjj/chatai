import sgMail from '@sendgrid/mail';
import { EmailTemplateData } from './types';
import { TemplateIds } from './constants';

export class Mailer {
    private readonly senderAddress = 'joshuajohnsonjj38@gmail.com';

    constructor(key: string) {
        sgMail.setApiKey(key);
    }

    async sendMessage(receiverAddress: string, templateId: TemplateIds, data: EmailTemplateData): Promise<void> {
        const msg = {
            to: receiverAddress,
            from: this.senderAddress,
            templateId,
            dynamicTemplateData: data,
        };
        await sgMail.send(msg);
    }
}
