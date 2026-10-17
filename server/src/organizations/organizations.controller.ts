import { Body, Controller, Get, Headers, HttpCode, Param, ParseUUIDPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { z } from 'zod';
import { RequestAccess, RequirePermissions } from '../common/guards/access';
import { DomainError } from '../common/errors/domain-error';
import { ErrorResponseDto } from '../common/errors/error-response.dto';
import { PaginationQueryDto } from '../common/pagination/pagination.dto';
import { Organizations } from './organizations.service';
import { Invitations } from './invitations.service';
import { BrandingDto, CreateBranchDto, CreateInvitationDto, CreateOrganizationDto, CreateRoleDto, TransferOwnershipDto, UpdateBranchDto, UpdateMembershipDto, UpdateOrganizationDto, UpdateRoleDto } from './organization.dto';
import { PERMISSIONS } from './permissions';

function commandKey(raw: unknown) {
  const value = z.uuid().safeParse(raw);
  if (!value.success) throw new DomainError('BAD_REQUEST', 400);
  return value.data.toLowerCase();
}
@ApiTags('Organizations and access') @ApiBearerAuth()
@ApiResponse({ status: 400, type: ErrorResponseDto }) @ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 403, type: ErrorResponseDto }) @ApiResponse({ status: 404, type: ErrorResponseDto }) @ApiResponse({ status: 409, type: ErrorResponseDto })
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: Organizations, private readonly invitations: Invitations, private readonly access: RequestAccess) {}
  private principal(req: FastifyRequest) {
    const p = this.access.principal(req); if (!p) throw new DomainError('UNAUTHENTICATED', 401); return p;
  }
  private scope(req: FastifyRequest, id: string) {
    const scope = this.access.tenant(req);
    if (scope.organizationId !== id.toLowerCase()) throw new DomainError('NOT_FOUND', 404);
    return scope;
  }
  @Get() @ApiOperation({ summary: 'List only active organizations belonging to the current user.' })
  list(@Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.organizations.list(this.principal(req), query); }

  @Post() @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @ApiOperation({ summary: 'Create an organization, owner membership, MAIN branch and five role presets atomically.' })
  create(@Body() dto: CreateOrganizationDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.create(this.principal(req), dto, commandKey(key), req.id, req.ip);
  }
  @Get('invitations/incoming')
  incoming(@Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.invitations.incoming(this.principal(req), query); }

  @Post('invitations/:invitationId/accept')
  @ApiOperation({ summary: 'Accept an offer using the signed-in user’s matching verified contact. No membership token is accepted.' })
  accept(@Param('invitationId', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest) { return this.invitations.accept(this.principal(req), id, req.id); }

  @Get(':id') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('ORG_VIEW')
  details(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest) { return this.organizations.details(this.scope(req, id)); }

  @Get(':id/context') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions()
  @ApiOperation({ summary: 'Resolve current permissions and branch scope. Context selection grants no extra rights.' })
  context(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest) { return this.organizations.context(this.scope(req, id)); }

  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Patch(':id') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('ORG_UPDATE')
  update(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: UpdateOrganizationDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.update(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Patch(':id/branding') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('ORG_UPDATE')
  branding(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: BrandingDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.branding(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
  @Get(':id/branches') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('ORG_VIEW')
  branches(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.organizations.branches(this.scope(req, id), query); }

  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Post(':id/branches') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('BRANCH_MANAGE')
  createBranch(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CreateBranchDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.createBranch(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Patch(':id/branches/:branchId') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('BRANCH_MANAGE')
  updateBranch(@Param('id', new ParseUUIDPipe()) id: string, @Param('branchId', new ParseUUIDPipe()) branchId: string, @Body() dto: UpdateBranchDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.updateBranch(this.scope(req, id), this.principal(req), branchId, dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @HttpCode(200) @Post(':id/branches/:branchId/archive') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('BRANCH_MANAGE')
  archiveBranch(@Param('id', new ParseUUIDPipe()) id: string, @Param('branchId', new ParseUUIDPipe()) branchId: string, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.archiveBranch(this.scope(req, id), this.principal(req), branchId, commandKey(key), req.id);
  }
  @Get(':id/permissions') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  permissions(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest) { this.scope(req, id); return Object.entries(PERMISSIONS).map(([code, description]) => ({ code, description })); }

  @Get(':id/roles') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('ORG_VIEW')
  roles(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.organizations.roles(this.scope(req, id), query); }

  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Post(':id/roles') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  @ApiOperation({ summary: 'Owner-only role definition; role permissions are the authorization source.' })
  createRole(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CreateRoleDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.createRole(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Patch(':id/roles/:roleId') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  updateRole(@Param('id', new ParseUUIDPipe()) id: string, @Param('roleId', new ParseUUIDPipe()) roleId: string, @Body() dto: UpdateRoleDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.updateRole(this.scope(req, id), this.principal(req), roleId, dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @HttpCode(200) @Post(':id/roles/:roleId/archive') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  archiveRole(@Param('id', new ParseUUIDPipe()) id: string, @Param('roleId', new ParseUUIDPipe()) roleId: string, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.archiveRole(this.scope(req, id), this.principal(req), roleId, commandKey(key), req.id);
  }
  @Get(':id/memberships') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  members(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.organizations.members(this.scope(req, id), query); }

  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Patch(':id/memberships/:membershipId') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  updateMember(@Param('id', new ParseUUIDPipe()) id: string, @Param('membershipId', new ParseUUIDPipe()) membershipId: string, @Body() dto: UpdateMembershipDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.updateMember(this.scope(req, id), this.principal(req), membershipId, dto, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @Post(':id/invitations') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  createInvitation(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: CreateInvitationDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.invitations.create(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
  @Get(':id/invitations') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  invitationsList(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest, @Query() query: PaginationQueryDto) { return this.invitations.list(this.scope(req, id), query); }

  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @HttpCode(200) @Post(':id/invitations/:invitationId/revoke') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  revokeInvitation(@Param('id', new ParseUUIDPipe()) id: string, @Param('invitationId', new ParseUUIDPipe()) invitationId: string, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.invitations.revoke(this.scope(req, id), this.principal(req), invitationId, commandKey(key), req.id);
  }
  @ApiHeader({ name: 'Idempotency-Key', required: true, schema: { type: 'string', format: 'uuid' } })
  @HttpCode(200) @Post(':id/ownership/transfer') @ApiHeader({ name: 'X-Organization-Id', required: true }) @RequirePermissions('STAFF_MANAGE')
  @ApiOperation({ summary: 'Owner-only atomic transfer; requires a session created within ten minutes.' })
  transfer(@Param('id', new ParseUUIDPipe()) id: string, @Body() dto: TransferOwnershipDto, @Headers('idempotency-key') key: unknown, @Req() req: FastifyRequest) {
    return this.organizations.transfer(this.scope(req, id), this.principal(req), dto, commandKey(key), req.id);
  }
}
