import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayUnique, IsArray, IsEnum, IsInt, IsString, IsUUID, Length, Matches, Max, Min, ValidateIf } from 'class-validator';
import { ContactDto } from '../auth/auth.dto';

const languages = { en: 'en', bn: 'bn', 'en-bn': 'en-bn' };
const accessModes = { ALL: 'ALL', SELECTED: 'SELECTED' };
export class CreateOrganizationDto {
  @ApiProperty() @IsString() @Length(1, 160) @Matches(/\S/)
  name!: string;
  @ApiProperty({ example: 'BDT' }) @Matches(/^[A-Z]{3}$/)
  currency!: string;
  @ApiProperty({ example: 'Asia/Dhaka' }) @IsString() @Length(1, 80)
  timezone!: string;
  @ApiPropertyOptional({ minimum: 0, maximum: 4 }) @ValidateIf((_o, v) => v !== undefined) @IsInt() @Min(0) @Max(4)
  currencyScale?: number;
  @ApiPropertyOptional({ default: 3, minimum: 0, maximum: 6 }) @ValidateIf((_o, v) => v !== undefined) @IsInt() @Min(0) @Max(6)
  quantityScale?: number;
  @ApiPropertyOptional({ maxLength: 500 }) @ValidateIf((_o, v) => v !== undefined) @IsString() @Length(1, 500)
  address?: string;
  @ApiPropertyOptional({ enum: Object.keys(languages), default: 'en' }) @ValidateIf((_o, v) => v !== undefined) @IsEnum(languages)
  documentLanguage?: 'en' | 'bn' | 'en-bn';
}
export class UpdateOrganizationDto {
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined) @IsString() @Length(1, 160) @Matches(/\S/)
  name?: string;
  @ApiPropertyOptional({ nullable: true }) @ValidateIf((_o, v) => v !== undefined && v !== null) @IsString() @Length(1, 500)
  address?: string | null;
  @ApiPropertyOptional({ enum: Object.keys(languages) }) @ValidateIf((_o, v) => v !== undefined) @IsEnum(languages)
  documentLanguage?: 'en' | 'bn' | 'en-bn';
}
export class CreateBranchDto {
  @ApiProperty() @Matches(/^[A-Z][A-Z0-9_-]{0,31}$/)
  code!: string;
  @ApiProperty() @IsString() @Length(1, 160) @Matches(/\S/)
  name!: string;
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined) @IsString() @Length(1, 500)
  address?: string;
}
export class UpdateBranchDto {
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined) @IsString() @Length(1, 160) @Matches(/\S/)
  name?: string;
  @ApiPropertyOptional({ nullable: true }) @ValidateIf((_o, v) => v !== undefined && v !== null) @IsString() @Length(1, 500)
  address?: string | null;
}
export class CreateRoleDto {
  @ApiProperty() @Matches(/^[A-Z][A-Z0-9_]{0,39}$/)
  code!: string;
  @ApiProperty() @IsString() @Length(1, 80) @Matches(/\S/)
  name!: string;
  @ApiProperty({ type: [String], maxItems: 80 }) @IsArray() @ArrayMaxSize(80) @ArrayUnique() @Matches(/^[A-Z][A-Z0-9_]{0,79}$/, { each: true })
  permissionCodes!: string[];
}
export class UpdateRoleDto {
  @ApiPropertyOptional() @ValidateIf((_o, v) => v !== undefined) @IsString() @Length(1, 80) @Matches(/\S/)
  name?: string;
  @ApiPropertyOptional({ type: [String], maxItems: 80 }) @ValidateIf((_o, v) => v !== undefined) @IsArray() @ArrayMaxSize(80) @ArrayUnique() @Matches(/^[A-Z][A-Z0-9_]{0,79}$/, { each: true })
  permissionCodes?: string[];
}
export class AccessAssignmentDto {
  @ApiProperty({ type: [String], format: 'uuid', maxItems: 10 }) @IsArray() @ArrayMaxSize(10) @ArrayUnique() @IsUUID(undefined, { each: true })
  roleIds!: string[];
  @ApiProperty({ enum: Object.keys(accessModes) }) @IsEnum(accessModes)
  branchAccess!: 'ALL' | 'SELECTED';
  @ApiProperty({ type: [String], format: 'uuid', maxItems: 100 }) @IsArray() @ArrayMaxSize(100) @ArrayUnique() @IsUUID(undefined, { each: true })
  branchIds!: string[];
}
export class CreateInvitationDto extends ContactDto {
  @ApiProperty({ type: [String], maxItems: 10 }) @IsArray() @ArrayMaxSize(10) @ArrayUnique() @IsUUID(undefined, { each: true })
  roleIds!: string[];
  @ApiProperty({ enum: Object.keys(accessModes) }) @IsEnum(accessModes)
  branchAccess!: 'ALL' | 'SELECTED';
  @ApiProperty({ type: [String], maxItems: 100 }) @IsArray() @ArrayMaxSize(100) @ArrayUnique() @IsUUID(undefined, { each: true })
  branchIds!: string[];
}
export class UpdateMembershipDto extends AccessAssignmentDto {
  @ApiProperty({ enum: ['ACTIVE', 'SUSPENDED', 'REVOKED'] }) @IsEnum({ ACTIVE: 'ACTIVE', SUSPENDED: 'SUSPENDED', REVOKED: 'REVOKED' })
  status!: 'ACTIVE' | 'SUSPENDED' | 'REVOKED';
}
export class TransferOwnershipDto {
  @ApiProperty() @IsUUID()
  membershipId!: string;
  @ApiProperty({ type: [String], maxItems: 10, description: 'Explicit role assignments for the former owner; an empty array removes delegated permissions.' })
  @IsArray() @ArrayMaxSize(10) @ArrayUnique() @IsUUID(undefined, { each: true })
  previousOwnerRoleIds!: string[];
}
export class BrandingDto {
  @ApiPropertyOptional({ nullable: true }) @ValidateIf((_o, v) => v !== undefined && v !== null) @IsUUID()
  logoFileId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @ValidateIf((_o, v) => v !== undefined && v !== null) @IsUUID()
  coverFileId?: string | null;
}
