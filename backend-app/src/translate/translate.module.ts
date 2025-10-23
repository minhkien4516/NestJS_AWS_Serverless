import { Module } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateController } from './translate.controller';
import { BedrockModule } from '../bedrock/bedrock.module';
import { SQSClient } from '@aws-sdk/client-sqs';
import { DynamoModule } from '../database/dynamo.module';

@Module({
  imports: [BedrockModule, DynamoModule],
  providers: [
    TranslateService,
    {
      provide: 'SQS_CLIENT',
      useFactory: () => new SQSClient({ region: process.env.AWS_REGION }),
    },
  ],
  controllers: [TranslateController],
  exports: [TranslateService],
})
export class TranslateModule {}
