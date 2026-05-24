import { CanActivate, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core/services/reflector.service";
import { Role } from "@prisma/client";
import { ROLE_KEY } from "../decorators/role.decorator";

@Injectable()
export class RoleGuard implements CanActivate{
    constructor(private readonly reflector: Reflector){}

    canActivate(context: any): boolean | Promise<boolean> {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLE_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) {
            return true;
        }
        const { user } = context.switchToHttp().getRequest();
        return requiredRoles.some((role) => user.role === role);
    }
}