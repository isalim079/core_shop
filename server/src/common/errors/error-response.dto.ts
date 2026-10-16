import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_MESSAGES } from '../../localization/errors';

class FieldViolationDto {
  @ApiProperty({ example: 'limit' }) field!: string;
  @ApiProperty({ example: 'MAX' }) code!: string;
}
class ErrorDetailDto {
  @ApiProperty({ enum: Object.keys(ERROR_MESSAGES) }) code!: string;
  @ApiProperty({ example: 'The request is invalid.' }) message!: string;
  @ApiProperty({ format: 'uuid' }) requestId!: string;
  @ApiPropertyOptional({ type: [FieldViolationDto] }) fields?: FieldViolationDto[];
}
export class ErrorResponseDto {
  @ApiProperty({ enum: [false] }) success!: false;
  @ApiProperty({ type: ErrorDetailDto }) error!: ErrorDetailDto;
}
