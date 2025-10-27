import { SQSEvent } from 'aws-lambda';
import { DynamoService } from '../database/dynamo.service';
import { BedrockService } from '../bedrock/bedrock.service';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const configService = new ConfigService();
const bedrock = new BedrockService(configService);
const dynamo = new DynamoService(configService);
const logger = new Logger('TranslationWorker');

export const handler = async (event: SQSEvent): Promise<void> => {
  logger.warn(`We have been received ${event.Records.length} records from SQS`);
  for (const record of event.Records) {
    try {
      logger.warn(`We have been received ${record.body} from SQS`);
      const payload = JSON.parse(record.body);
      const { jobId, request } = payload;
      const { fields, targetLanguages, language } = request;

      const results = [];
      for (const field of fields) {
        const translations: Record<string, string> = {};
        for (const target of targetLanguages) {
          const translated = await bedrock.translate(
            field.texttotranslate,
            target,
            language,
          );
          translations[target] = translated;
        }
        results.push({ metadata: field.metadata, translations });
      }

      await dynamo.saveResult(jobId, {
        jobId,
        results,
        sourceLanguage: language,
        targetLanguages,
        requestedBy: request.UserRequestedTranslation,
        itemId: request.itemId,
        itemPath: request.itemPath,
        timestamp: new Date().toISOString(),
      });

      console.log('Successfully processed message:', payload.jobId);
    } catch (err) {
      console.error('Worker error', err);
      throw err;
    }
  }
};
