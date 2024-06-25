export class RegisterResponseDto {
    uuid: string;
    userConfirmed: boolean;
}

export class AuthenticateResponseDto {
    accessToken: string;
    refreshToken: string;
    userId: string;
    email: string;
    name: string;
}
