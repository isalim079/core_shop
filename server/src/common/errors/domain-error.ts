import { ErrorCode } from '../../localization/errors';

export interface FieldViolation { field: string; code: string }

export class DomainError extends Error {
  constructor(readonly code: ErrorCode, readonly status: number, readonly fields?: FieldViolation[]) {
    super(code);
  }
}
