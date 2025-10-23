import { SQSEvent } from 'aws-lambda';
import { DynamoService } from '../database/dynamo.service';
import { BedrockService } from '../bedrock/bedrock.service';
import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();
const bedrock = new BedrockService(configService);
const dynamo = new DynamoService(configService);

export const handler = async (event: SQSEvent) => {
  for (const record of event.Records) {
    try {
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
    } catch (err) {
      console.error('Worker error', err);
      throw err;
    }
  }
};
