import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) throw new UnauthorizedException('No token provided');

    const token = authHeader.split(' ')[1];
    if (!token) throw new UnauthorizedException('Invalid token format');

    try {
      // ✅ CHANGED: We removed the { secret: ... } option.
      // The JwtService now uses the secret we configured in AppModule.
      const payload = await this.jwtService.verifyAsync(token);

      request.user = payload;

      if (payload.role === 'admin') {
        return true;
      } else {
        throw new ForbiddenException('Access denied: Admins only');
      }
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      throw new UnauthorizedException('Invalid or Expired Token');
    }
  }
}