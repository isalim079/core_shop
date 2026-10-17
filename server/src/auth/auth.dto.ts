import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsUUID, Length, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';

export class ContactDto {
  @ApiProperty({ enum: ['EMAIL', 'PHONE'] })
  @IsEnum({ EMAIL: 'EMAIL', PHONE: 'PHONE' })
  channel!: 'EMAIL' | 'PHONE';

  @ApiProperty({ description: 'Email address or E.164 phone number, including country code.' })
  @IsString() @Length(3, 254)
  contact!: string;
}
export class CodeDto {
  @ApiProperty() @IsUUID()
  challengeId!: string;
  @ApiProperty({ pattern: '^\\d{6}$' }) @Matches(/^\d{6}$/)
  code!: string;
}
export class ResetPasswordDto extends CodeDto {
  @ApiProperty({ minLength: 15, maxLength: 128, writeOnly: true }) @IsString() @MinLength(15) @MaxLength(128)
  password!: string;
}
export class RegisterDto extends ResetPasswordDto {
  @ApiProperty({ maxLength: 120 }) @IsString() @Length(1, 120) @Matches(/\S/)
  displayName!: string;
  @ApiPropertyOptional({ enum: ['en', 'bn'] }) @ValidateIf((_o, value) => value !== undefined) @IsEnum({ en: 'en', bn: 'bn' })
  preferredLanguage?: 'en' | 'bn';
}
export class LoginDto extends ContactDto {
  @ApiProperty({ writeOnly: true }) @IsString() @Length(1, 128)
  password!: string;
  @ApiProperty({ maxLength: 80 }) @IsString() @Length(1, 80)
  deviceName!: string;
}
export class RefreshDto {
  @ApiPropertyOptional({ writeOnly: true, description: 'Mobile only; web uses an HttpOnly cookie.' })
  @ValidateIf((_o, value) => value !== undefined) @Matches(/^[A-Za-z0-9_-]{43}$/)
  refreshToken?: string;
}
export class GoogleDto {
  @ApiProperty() @IsUUID()
  challengeId!: string;
  @ApiProperty({ writeOnly: true }) @IsString() @Length(20, 16384)
  idToken!: string;
  @ApiProperty({ maxLength: 80 }) @IsString() @Length(1, 80)
  deviceName!: string;
}
export class ProfileDto {
  @ApiPropertyOptional() @ValidateIf((_o, value) => value !== undefined) @IsString() @Length(1, 120) @Matches(/\S/)
  displayName?: string;
  @ApiPropertyOptional({ enum: ['en', 'bn'] }) @ValidateIf((_o, value) => value !== undefined) @IsEnum({ en: 'en', bn: 'bn' })
  preferredLanguage?: 'en' | 'bn';
}
export class SessionResponseDto {
  @ApiProperty() sessionId!: string;
  @ApiProperty() accessExpiresAt!: Date;
  @ApiProperty() expiresAt!: Date;
  @ApiPropertyOptional({ description: 'Mobile only. Store refresh tokens in OS secure storage.' }) refreshToken?: string;
  @ApiPropertyOptional({ description: 'Mobile only. Send as Authorization: Bearer.' }) accessToken?: string;
  @ApiPropertyOptional({ description: 'Web only. Send X-CSRF-Token for cookie-authenticated writes.' }) csrfToken?: string;
}
