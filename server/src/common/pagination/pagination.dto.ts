import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsString, Matches, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { z } from 'zod';
import { DomainError } from '../errors/domain-error';

export enum SortDirection { ASC = 'asc', DESC = 'desc' }

export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @Transform(({ value }: { value: unknown }) => typeof value === 'string' && /^[1-9][0-9]{0,2}$/.test(value) ? Number(value) : value)
  @IsInt() @Min(1) @Max(100)
  limit = 20;

  @ApiPropertyOptional({ maxLength: 512 })
  @ValidateIf((_object, value) => value !== undefined)
  @IsString() @MaxLength(512) @Matches(/^[A-Za-z0-9_-]+$/)
  cursor?: string;

  @ApiPropertyOptional({ enum: SortDirection, default: SortDirection.DESC })
  @IsEnum(SortDirection)
  direction: SortDirection = SortDirection.DESC;
}

const cursorSchema = z.object({ v: z.literal(1), id: z.uuid(), createdAt: z.iso.datetime() }).strict();
export type PageCursor = z.infer<typeof cursorSchema>;
export function decodeCursor(cursor: string): PageCursor {
  try {
    if (cursor.length > 512 || !/^[A-Za-z0-9_-]+$/.test(cursor)) throw new Error();
    return cursorSchema.parse(JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8')));
  } catch { throw new DomainError('BAD_REQUEST', 400); }
}
export function encodeCursor(value: PageCursor) {
  return Buffer.from(JSON.stringify(cursorSchema.parse(value))).toString('base64url');
}

export function allowedSort<T extends string>(field: string, allowed: readonly T[]): T {
  if (!allowed.includes(field as T)) throw new DomainError('BAD_REQUEST', 400);
  return field as T;
}
