
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import { Request } from 'express';
import { UnauthorizedException } from "@nestjs/common/exceptions/unauthorized.exception";
import * as bcrypt from 'bcrypt';
import { Injectable } from "@nestjs/common";

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'refresh-token') 
{
    constructor
    (
        private readonly prismaService: PrismaService,
        private readonly configService: ConfigService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.getOrThrow<string>('REFRESH_TOKEN_SECRET_KEY'),
            passReqToCallback: true, 
        });

    }

    async validate(req: Request, payload: { sub: string; email: string }) {
        const authHeader = req.headers.authorization; // Lấy refresh token từ header
        if(!authHeader) {
            throw new UnauthorizedException("Refresh token not found");
        }
        const refreshToken = authHeader.replace('Bearer ', '').trim(); // Giải mã refresh token
        if(!refreshToken) {
            throw new UnauthorizedException("Invalid refresh token");
        }
        const user = await this.prismaService.user.findUnique({
            where: { id: payload.sub },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                refreshToken: true, // Lấy refresh token từ database để so sánh
            },
        });
        if (!user || !user.refreshToken) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        const isRefreshTokenValid = await bcrypt.compare(refreshToken, user.refreshToken);
        if (!isRefreshTokenValid) {
            throw new UnauthorizedException("Refresh token does not match");
        }
        return {id : user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role};
    }
}