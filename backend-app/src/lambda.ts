import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import serverless, { Handler } from 'serverless-http';

let server: Handler | null = null;

async function bootstrap(): Promise<Handler> {
  if (!server) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);
    const app = await NestFactory.create(AppModule, adapter);
    app.enableCors();
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.setGlobalPrefix('api/v1');
    await app.init();
    return serverless(expressApp);
  }
  return server!;
}

export const handler = async (event: any, context: any) => {
  server = server ?? (await bootstrap());
  return server(event, context);
};
