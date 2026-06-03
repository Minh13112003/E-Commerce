export class AuthResponseDTOs {
    accessToken?: string;
    refreshToken?: string;

    user!: {
        email: string;
        firstName: string;
        age : number | null;
        phonenumber : string;
        lastName: string;
        role: string;
        createdAt : Date;
        updatedAt : Date;
    }
}