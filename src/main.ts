import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(app.get('Reflector')),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  const config = new DocumentBuilder()
    .setTitle('KABARI API')
    .setDescription('Platform Undangan Digital & Manajemen Acara')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/v1`);
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
