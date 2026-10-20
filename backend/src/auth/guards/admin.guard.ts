import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AuthenticatedRequest } from './access-token.guard';

/** Runs after AccessTokenGuard and only lets the admin account through. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly users: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = await this.users.findById(request.auth.userId);
    if (user?.role !== 'admin') {
      throw new ForbiddenException('Esta sección es solo para administración.');
    }
    return true;
  }
}
