import 'reflect-metadata';
import { Body, Controller, Get, Module, Post, Query } from '@nestjs/common';
import { IsString, Length, Matches } from 'class-validator';
import { AppModule } from '../../src/app.module';
import { createApp } from '../../src/app';
import { Public } from '../../src/common/guards/access';
import { DomainError } from '../../src/common/errors/domain-error';
import { decodeCursor, PaginationQueryDto } from '../../src/common/pagination/pagination.dto';

class MutationDto {
  @IsString() @Length(1, 120) displayName!: string;
  @IsString() @Matches(/^(0|[1-9][0-9]{0,15})(\.[0-9]{1,4})?$/) amount!: string;
}

@Controller('__test')
class FixtureController {
  @Public() @Post('validation')
  validate(@Body() dto: MutationDto) { return dto; }

  @Public() @Get('list')
  list(@Query() dto: PaginationQueryDto) {
    if (dto.cursor) decodeCursor(dto.cursor);
    return dto;
  }

  @Public() @Get('explode')
  explode() { throw new Error('DO_NOT_DISCLOSE SQL SELECT password=secret /private/path'); }

  @Public() @Get('business-error')
  business() { throw new DomainError('PAYMENT_EXCEEDS_OUTSTANDING', 422); }

  @Get('private')
  privateRoute() { return { forbiddenLeak: true }; }
}

@Module({ imports: [AppModule], controllers: [FixtureController] })
class FixtureModule {}

export const createFixture = () => createApp(FixtureModule);
