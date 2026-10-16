import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { ErrorCode, errorMessage, negotiateLocale } from '../../localization/errors';
import { DomainError } from './domain-error';

const statusCodes: Record<number, ErrorCode> = {
  400: 'BAD_REQUEST', 401: 'UNAUTHENTICATED', 403: 'FORBIDDEN', 404: 'NOT_FOUND',
  405: 'METHOD_NOT_ALLOWED', 409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE',
  415: 'UNSUPPORTED_MEDIA_TYPE', 422: 'BUSINESS_RULE_VIOLATION', 429: 'RATE_LIMITED', 503: 'SERVICE_UNAVAILABLE',
};

export function errorEnvelope(code: ErrorCode, request: FastifyRequest, fields?: DomainError['fields']) {
  return {
    success: false,
    error: {
      code, message: errorMessage(code, negotiateLocale(request.headers['accept-language'])),
      requestId: request.id,
      ...(fields?.length ? { fields } : {}),
    },
  };
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const request = host.switchToHttp().getRequest<FastifyRequest>();
    const reply = host.switchToHttp().getResponse<FastifyReply>();
    let status = 500;
    let code: ErrorCode = 'INTERNAL_ERROR';
    if (exception instanceof DomainError) {
      status = exception.status;
      code = exception.code;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      code = statusCodes[status] || 'INTERNAL_ERROR';
    } else if (exception instanceof Error && 'statusCode' in exception && typeof exception.statusCode === 'number') {
      // Fastify parser, rate-limit, and size errors use an allowlisted status only.
      status = statusCodes[exception.statusCode] ? exception.statusCode : 500;
      code = statusCodes[status] || 'INTERNAL_ERROR';
    }
    request.log[status >= 500 ? 'error' : 'warn']({ event: 'request_failed', requestId: request.id, code, statusCode: status });
    if (!reply.sent) reply.code(status).send(errorEnvelope(code, request, exception instanceof DomainError ? exception.fields : undefined));
  }
}
