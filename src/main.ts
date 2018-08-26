import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Settings } from './common/config/settings.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const settings = app.get(Settings);
  await app.listen(settings.Port);
}
bootstrap();
