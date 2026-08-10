import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { AppModule } from './app.module';
import { UPLOADS_ROOT } from './common/multer.config';

function ensureUploadFolders() {
  for (const sub of ['logos', 'cr', 'bank', 'products', 'chat', 'misc']) {
    mkdirSync(join(process.cwd(), UPLOADS_ROOT, sub), { recursive: true });
  }
}

async function bootstrap() {
  ensureUploadFolders();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // خدمة الملفات المرفوعة (السجل التجاري، تصديق الحساب، الشعارات، صور المنتجات) بشكل ثابت
  app.useStaticAssets(join(process.cwd(), UPLOADS_ROOT), { prefix: '/uploads' });

  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${port}/api`);
}
bootstrap();
