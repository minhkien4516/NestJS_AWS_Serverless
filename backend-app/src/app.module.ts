import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import * as Joi from 'joi';
import { S3Module } from './s3/s3.module';
import { TranslateModule } from './translate/translate.module';
import { BedrockModule } from './bedrock/bedrock.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        COGNITO_CLIENT_ID: Joi.string().required(),
        COGNITO_CLIENT_SECRET: Joi.string().required(),
        COGNITO_USER_POOL_ID: Joi.string().required(),
        COGNITO_REGION: Joi.string().required(),
      }),
    }),
    UsersModule,
    AuthModule,
    S3Module,
    TranslateModule,
    BedrockModule,
  ],
})
export class AppModule {}
