import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    // Implement JWT strategy here
    constructor(
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: true,
            secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
        });
    }

    //Validate the JWT payload and return the user information
    async validate(payload: { sub: string; email: string }) {
        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                createdAt: true,
                updatedAt: true,
                 // Exclude password from the returned user object
            },
        });
        if (!user) {
            throw new UnauthorizedException("User not found");
        }
        return user;
    }

    // async validate(reg: Request, payload: any) {
    //     console.log('🔍 JWT Payload nhận được:', payload);   // ← Phải thấy dòng này
    //     console.log('🔍 Authorization Header nhận được:', reg.headers.authorization);
    //     console.log('🔍 JWT Payload:', payload);

    //     const userId = payload.sub || payload.id;
    //     if (!userId) {
    //         console.log('❌ Payload không có sub/id');
    //         throw new UnauthorizedException('Invalid token payload');
    //     }

    //     const user = await this.prismaService.user.findUnique({
    //         where: { id: userId },
    //         select: {
    //             id: true,
    //             email: true,
    //             firstName: true,
    //             lastName: true,
    //             role: true,
    //         },
    //     });

    //     if (!user) {
    //         console.log('❌ User not found');
    //         throw new UnauthorizedException('User not found');
    //     }

    //     console.log('✅ JWT validate thành công - User ID:', user.id);
    //     return user;
    // }

}