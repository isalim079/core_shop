import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Environment } from '../config/environment';
import { Public, RequestAccess } from '../common/guards/access';
import { DomainError } from '../common/errors/domain-error';
import { ErrorResponseDto } from '../common/errors/error-response.dto';
import { Authentication } from './auth.service';
import { AuthStore } from './auth-store.service';
import { Sessions, SessionTokens } from './sessions.service';
import { CodeDto, ContactDto, GoogleDto, LoginDto, ProfileDto, RefreshDto, RegisterDto, ResetPasswordDto, SessionResponseDto } from './auth.dto';

@ApiTags('Authentication')
@ApiResponse({ status: 400, type: ErrorResponseDto })
@ApiResponse({ status: 401, type: ErrorResponseDto })
@ApiResponse({ status: 429, type: ErrorResponseDto })
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: Authentication, private readonly sessions: Sessions, private readonly store: AuthStore,
    private readonly access: RequestAccess, private readonly config: ConfigService<Environment, true>) {}
  private principal(request: FastifyRequest) {
    const principal = this.access.principal(request);
    if (!principal) throw new DomainError('UNAUTHENTICATED', 401);
    return principal;
  }
  private respond(client: string, tokens: SessionTokens, reply: FastifyReply) {
    if (client === 'mobile') return { sessionId: tokens.sessionId, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, accessExpiresAt: tokens.accessExpiresAt, expiresAt: tokens.expiresAt };
    const secure = this.config.get('NODE_ENV', { infer: true }) === 'production';
    const common = { secure, httpOnly: true, sameSite: 'lax' as const };
    reply.setCookie(this.sessions.cookieName('access'), tokens.accessToken, { ...common, path: '/', expires: tokens.accessExpiresAt });
    reply.setCookie(this.sessions.cookieName('refresh'), tokens.refreshToken, { ...common, path: '/api/v1/auth/web', expires: tokens.expiresAt });
    return { sessionId: tokens.sessionId, accessExpiresAt: tokens.accessExpiresAt, expiresAt: tokens.expiresAt, csrfToken: tokens.csrfToken };
  }
  @Public() @Post('registration/request')
  @ApiOperation({ summary: 'Request a registration verification code; SMTP/SMS must be configured.' })
  registerRequest(@Body() dto: ContactDto, @Req() req: FastifyRequest) { return this.auth.requestCode(dto.channel, dto.contact, 'REGISTER', req.ip, req.id); }

  @Public() @Post('registration/complete')
  @ApiOperation({ summary: 'Verify contact and create the password; then sign in.' })
  register(@Body() dto: RegisterDto, @Req() req: FastifyRequest) { return this.auth.completeCode(dto, 'REGISTER', req.ip, req.id); }

  @Public() @Post('password/reset/request')
  resetRequest(@Body() dto: ContactDto, @Req() req: FastifyRequest) { return this.auth.requestCode(dto.channel, dto.contact, 'RESET', req.ip, req.id); }

  @Public() @Post('password/reset/complete')
  @ApiOperation({ summary: 'Reset password with contact proof and revoke all sessions.' })
  reset(@Body() dto: ResetPasswordDto, @Req() req: FastifyRequest) { return this.auth.completeCode(dto, 'RESET', req.ip, req.id); }

  @Public() @Post(':client/login') @ApiResponse({ status: 201, type: SessionResponseDto })
  @ApiOperation({ summary: 'Password login: client is web (cookies + allowed Origin) or mobile (bearer, no Origin).' })
  async login(@Param('client') client: string, @Body() dto: LoginDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kind = this.sessions.transport(req, client);
    return this.respond(client, await this.auth.login(dto.channel, dto.contact, dto.password, kind, dto.deviceName, req.ip, req.id), reply);
  }
  @Public() @Post(':client/refresh') @ApiResponse({ status: 201, type: SessionResponseDto })
  async refresh(@Param('client') client: string, @Body() dto: RefreshDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kind = this.sessions.transport(req, client);
    if (kind === 'WEB' && dto.refreshToken !== undefined) throw new DomainError('BAD_REQUEST', 400);
    const token = kind === 'WEB' ? req.cookies[this.sessions.cookieName('refresh')] : dto.refreshToken;
    return this.respond(client, await this.sessions.refresh(token ?? '', kind, req.headers['x-csrf-token'], req.ip, req.id), reply);
  }
  @Public() @Post('web/csrf')
  @ApiOperation({ summary: 'Restore a CSRF token after page reload; requires allowed Origin and refresh cookie.' })
  csrf(@Req() req: FastifyRequest) { return this.sessions.csrf(req); }

  @Public() @Post('google/challenge')
  @ApiOperation({ summary: 'Get a single-use nonce. Pass nonce to the Google sign-in SDK.' })
  googleChallenge(@Req() req: FastifyRequest) { return this.auth.googleChallenge(req.ip); }

  @Public() @Post(':client/google') @ApiResponse({ status: 201, type: SessionResponseDto })
  async googleLogin(@Param('client') client: string, @Body() dto: GoogleDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const kind = this.sessions.transport(req, client);
    return this.respond(client, await this.auth.googleSignIn(dto.challengeId, dto.idToken, kind, dto.deviceName, req.ip, req.id), reply);
  }

  @Get('me')
  me(@Req() req: FastifyRequest) {
    return this.store.db.user.findUnique({ where: { id: this.principal(req).userId }, select: { id: true, email: true, phone: true, displayName: true, preferredLanguage: true, emailVerifiedAt: true, phoneVerifiedAt: true, createdAt: true } });
  }
  @Patch('me')
  async update(@Body() dto: ProfileDto, @Req() req: FastifyRequest) {
    const { userId, credentialId } = this.principal(req);
    await this.store.db.$transaction(async (tx) => {
      if (!await this.store.lockUser(tx, userId)) throw new DomainError('UNAUTHENTICATED', 401);
      await this.store.requireSession(tx, userId, credentialId);
      await tx.user.update({ where: { id: userId }, data: dto });
      await this.store.audit(tx, req.id, 'AUTH_PROFILE_UPDATED', userId);
    });
    return this.me(req);
  }
  @Get('sessions')
  list(@Req() req: FastifyRequest) {
    return this.store.db.authSession.findMany({ where: { userId: this.principal(req).userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { createdAt: 'desc' }, take: 20,
      select: { id: true, clientKind: true, deviceName: true, createdAt: true, expiresAt: true } });
  }
  @Delete('sessions/:id')
  async revoke(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: FastifyRequest) {
    await this.sessions.revoke(this.principal(req).userId, req.id, id); return { success: true };
  }
  @Post('logout')
  async logout(@Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const principal = this.principal(req);
    await this.sessions.revoke(principal.userId, req.id, principal.credentialId);
    reply.clearCookie(this.sessions.cookieName('access'), { path: '/' });
    reply.clearCookie(this.sessions.cookieName('refresh'), { path: '/api/v1/auth/web' });
    return { success: true };
  }
  @Post('logout-all')
  async logoutAll(@Req() req: FastifyRequest) { await this.sessions.revoke(this.principal(req).userId, req.id); return { success: true }; }

  @Post('contacts/request')
  async requestContact(@Body() dto: ContactDto, @Req() req: FastifyRequest) {
    const p = this.principal(req); await this.auth.requireRecent(p.userId, p.credentialId);
    return this.auth.requestCode(dto.channel, dto.contact, 'LINK', req.ip, req.id, p.userId, p.credentialId);
  }
  @Post('contacts/complete')
  async completeContact(@Body() dto: CodeDto, @Req() req: FastifyRequest) {
    const p = this.principal(req); await this.auth.requireRecent(p.userId, p.credentialId);
    return this.auth.linkContact(p.userId, dto.challengeId, dto.code, req.ip, req.id, p.credentialId);
  }
  @Post(':client/google/link') @ApiResponse({ status: 201, type: SessionResponseDto })
  async linkGoogle(@Param('client') client: string, @Body() dto: GoogleDto, @Req() req: FastifyRequest, @Res({ passthrough: true }) reply: FastifyReply) {
    const p = this.principal(req); await this.auth.requireRecent(p.userId, p.credentialId);
    const kind = this.sessions.transport(req, client);
    return this.respond(client, await this.auth.googleSignIn(dto.challengeId, dto.idToken, kind, dto.deviceName, req.ip, req.id, p.userId, p.credentialId), reply);
  }
}
