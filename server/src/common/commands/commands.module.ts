import { Global, Module } from '@nestjs/common';
import { AuditService } from '../../audit/audit.service';
import { CommandService } from './command.service';

@Global()
@Module({ providers: [AuditService, CommandService], exports: [AuditService, CommandService] })
export class CommandsModule {}
