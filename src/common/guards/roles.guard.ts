import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core'; // <--- Import Reflector
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorators/roles.decorator'; // <--- Import the Key

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector, // <--- Inject Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. Get the required roles from the route (e.g., ['admin', 'manager'])
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are required for this route, allow access
    if (!requiredRoles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token provided');
    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid token format');

    try {
      const payload = await this.jwtService.verifyAsync(token);
      request.user = payload;

      // 2. Check if the user's role is in the allowed list
      if (requiredRoles.includes(payload.role)) {
        return true; // Authorized
      } else {
        throw new ForbiddenException(`Access denied. Requires one of: ${requiredRoles.join(', ')}`);
      }
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or Expired Token');
    }
  }
}