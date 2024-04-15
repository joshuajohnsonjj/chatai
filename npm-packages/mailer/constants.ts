export enum TemplateIds {
    OrganizationInvite = 'todo',
}

export const EmailSubject = {
    OrganizationInvite: (organizationName: string) => `You've been invited to join ${organizationName}`,
};
