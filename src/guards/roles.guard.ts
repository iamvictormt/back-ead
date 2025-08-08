import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<string>(
      'role',
      context.getHandler(),
    );
    if (!requiredRole) {
      // Se não tem role definido, libera acesso
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || user.role !== requiredRole) {
      throw new ForbiddenException('Acesso negado. Permissão insuficiente.');
    }
    return true;
  }
}
