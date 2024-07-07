export const USER_PROFILE_SCOPES = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
];

export const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.readonly';

export const CAL_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';

export const GOOGLE_ALL_SCOPES = [...USER_PROFILE_SCOPES, GMAIL_SCOPE, DRIVE_SCOPE, CAL_SCOPE];
