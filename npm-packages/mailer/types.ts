export type EmailTemplateData = OrganizationInvite | WelcomeEmail;

export interface BaseEmailTemplate {
    subject: string;
}

export interface OrganizationInvite extends BaseEmailTemplate {
    organizationName: string;
    senderName: string;
    receiverName: string;
}

export interface WelcomeEmail extends BaseEmailTemplate {
    receiverName: string;
}
