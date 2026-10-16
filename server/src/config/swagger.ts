import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Environment } from './environment';

export async function configureSwagger(app: NestFastifyApplication, mode: Environment['NODE_ENV']) {
  if (mode !== 'development') return;

  const { DocumentBuilder, SwaggerModule } = await import('@nestjs/swagger');
  const documentConfig = new DocumentBuilder()
    .setTitle('Core Shop API')
    .setDescription('Core Shop server API documentation')
    .setVersion('0.1.0')
    .build();
  SwaggerModule.setup('api-docs', app, () => SwaggerModule.createDocument(app, documentConfig));
}
