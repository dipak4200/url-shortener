import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt'; // <--- Import JwtService

@Injectable()
export class RolesGuard implements CanActivate {
  // Inject JwtService
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    // 1. Check if header exists
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }

    // 2. Extract token (Bearer <token>)
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Invalid token format');
    }

    try {
      // 3. Verify the real JWT
      // This will throw an error if the token is invalid or expired
      const payload = await this.jwtService.verifyAsync(token, {
        secret: 'MY_SECRET_KEY', // Must match the secret in Module
      });

      // 4. Attach user to request
      request.user = payload;

      // 5. Validate Role
      if (payload.role === 'admin') {
        return true;
      } else {
        throw new ForbiddenException('Access denied: Admins only');
      }
    } catch (e) {
      if (e instanceof ForbiddenException) throw e;
      // Catch expired or invalid token errors
      throw new UnauthorizedException('Invalid or Expired Token');
    }
  }
}