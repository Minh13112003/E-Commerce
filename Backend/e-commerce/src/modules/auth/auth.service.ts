import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { RegisterDTOs } from './dtos/register.dtos';
import { AuthResponseDTOs } from './dtos/auth_response.dtos';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { JwtService } from '@nestjs/jwt';
import LoginDTOs from './dtos/login.dtos';

@Injectable()
export class AuthService {
    private readonly SALT_ROUNDS = 10;
    constructor(
        private readonly prismaService: PrismaService, 
        private readonly jwtService: JwtService
    ){}

    async register(registerDTOs : RegisterDTOs) : Promise<AuthResponseDTOs>{
        const { email, password, firstName, lastName } = registerDTOs;

        //Kiểm tra xem email đã tồn tại chưa
        const existingUser = await this.prismaService.user.findUnique({
            where : {
                email : email
            }
        });

        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        // Tạo người dùng mới
        try{
            const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);
            const newUser = await this.prismaService.user.create({
                data : {
                    email,
                    password: hashedPassword,
                    firstName,
                    lastName
                },
                select : {
                    email : true,
                    firstName : true,
                    lastName : true,
                    password : false,
                    role : true,
                    updatedAt : true,
                    createdAt : true,
                    phonenumber : true,
                    age : true

                }
            });
            return {
                user : newUser,
            }
        }catch(error){
            throw new InternalServerErrorException('Failed to create user');
        }
    }

    private async generateTokens(userId: string, email: string) : Promise<{ accessToken: string; refreshToken: string}>{
            // Tạo payload cho token    
            const payload = { sub: userId, email };
            const refreshId = randomBytes(16).toString('hex'); // Tạo refresh token ngẫu nhiên
            const [ accessToken, refreshToken ] = await Promise.all([
                // Tạo access token
                this.jwtService.signAsync(payload, { expiresIn: '15m' }),
                // Tạo refresh token
                this.jwtService.signAsync({...payload, refreshId}, { expiresIn: '7d' })
            ]);

            return { accessToken, refreshToken };
    }

    private async updateRefreshToken(userId: string, refreshToken: string) : Promise<void>{
        await this.prismaService.user.update({
            where : {
                id : userId
            },
            data : {
                refreshToken
            }
        });
    }

    async refreshToken(userId: string) : Promise<AuthResponseDTOs>{
        const user = await this.prismaService.user.findUnique({
            where : {
                id : userId
            },
            select : {
                email : true,
                firstName : true,
                lastName : true,
                role : true,
                createdAt : true,
                updatedAt : true,
                phonenumber : true,
                age : true,
            }
        });
        if(!user) {
            throw new InternalServerErrorException('User not found');
        }
        const tokens = await this.generateTokens(userId, user.email);
        await this.updateRefreshToken(userId, tokens.refreshToken);
        return{
            ...tokens,
            user,
        }
    }

    async logout(userId: string) : Promise<void>{
        
        await this.prismaService.user.update({
            where : { id : userId },
            data : { refreshToken : null }
        });
    }
    private isEmail(identifier: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(identifier);
      }

    async login(loginDTOs : LoginDTOs) : Promise<AuthResponseDTOs>{
        const { identifier, password } = loginDTOs;
        const isEmailInput = this.isEmail(identifier)
        const user = await this.prismaService.user.findFirst({
            where : isEmailInput
            ?{email : identifier}
            : {phonenumber : identifier},
        });
        if(!user || !(await bcrypt.compare(password, user.password))){
            throw new UnauthorizedException('Invalid email or password');
        }
        const tokens = await this.generateTokens(user.id, user.email);
        await this.updateRefreshToken(user.id, tokens.refreshToken);
        return {
            accessToken : tokens.accessToken,
            refreshToken : tokens.refreshToken,
            user : {
                email : user.email,
                firstName : user.firstName,
                lastName : user.lastName,
                role : user.role,
                createdAt : user.createdAt,
                updatedAt : user.updatedAt,
                phonenumber : user.phonenumber,
                age : user.age

            }
        }
    }
}
