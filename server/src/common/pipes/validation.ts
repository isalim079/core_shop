import { ValidationError, ValidationPipe } from '@nestjs/common';
import { DomainError, FieldViolation } from '../errors/domain-error';

function violations(errors: ValidationError[], prefix = ''): FieldViolation[] {
  return errors.slice(0, 50).flatMap((error) => {
    // Unknown field names are attacker-controlled; do not echo them.
    const field = error.constraints?.whitelistValidation ? '$' : `${prefix}${error.property}`.slice(0, 160);
    return [
      ...Object.keys(error.constraints || {}).slice(0, 10).map((constraint) => ({
        field, code: constraint === 'whitelistValidation' ? 'UNKNOWN_FIELD' : constraint.replace(/([A-Z])/g, '_$1').toUpperCase(),
      })),
      ...violations(error.children || [], `${field}.`),
    ];
  }).slice(0, 50);
}

export function createValidationPipe() {
  return new ValidationPipe({
    transform: true, whitelist: true, forbidNonWhitelisted: true, forbidUnknownValues: true,
    transformOptions: { enableImplicitConversion: false },
    validationError: { target: false, value: false },
    exceptionFactory: (errors) => new DomainError('VALIDATION_FAILED', 400, violations(errors)),
  });
}
