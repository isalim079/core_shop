import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DatabaseService } from '../database/database.service';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(private readonly database: DatabaseService) {}

  @Get('health')
  @ApiOperation({ summary: 'Process liveness' })
  getHealth() {
    return { status: 'ok', service: 'core-shop-server' };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Database connectivity and schema readiness' })
  @ApiResponse({ status: 200, description: 'Required database schema is available.' })
  @ApiResponse({ status: 503, description: 'Database or schema is unavailable.' })
  async getReadiness() {
    if (!await this.database.isReady()) {
      throw new ServiceUnavailableException({ status: 'not_ready', service: 'core-shop-server' });
    }
    return { status: 'ready', service: 'core-shop-server' };
  }
}
