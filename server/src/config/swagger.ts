import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Environment } from './environment';
import { ErrorResponseDto } from '../common/errors/error-response.dto';

export async function configureSwagger(app: NestFastifyApplication, mode: Environment['NODE_ENV']) {
  if (mode !== 'development') return;

  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const documentConfig = new DocumentBuilder()
    .setTitle('Core Shop API')
    .setDescription('Core Shop server API documentation')
    .setVersion('0.1.0')
    .addGlobalParameters({ name: 'Accept-Language', in: 'header', required: false, schema: { type: 'string', enum: ['en', 'bn'], default: 'en' } })
    .addGlobalResponse({ status: 400, type: ErrorResponseDto }, { status: 429, type: ErrorResponseDto }, { status: 500, type: ErrorResponseDto })
    .build();
  SwaggerModule.setup('api-docs', app, () => SwaggerModule.createDocument(app, documentConfig));
}
