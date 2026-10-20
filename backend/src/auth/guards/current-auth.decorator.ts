import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedRequest, RequestAuth } from './access-token.guard';

export const CurrentAuth = createParamDecorator(
  (_: unknown, context: ExecutionContext): RequestAuth =>
    context.switchToHttp().getRequest<AuthenticatedRequest>().auth,
);
