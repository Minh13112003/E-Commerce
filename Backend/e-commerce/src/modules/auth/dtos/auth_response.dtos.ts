export class AuthResponseDTOs {
    accessToken?: string;
    refreshToken?: string;

    user!: {
        email: string;
        firstName: string;
        lastName: string;
        role: string;
    }
}