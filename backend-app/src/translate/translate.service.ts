import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { BedrockService } from '../bedrock/bedrock.service';
import { TranslateRequestDTO } from './dto/translate-request.dto';
// import { TranslateResponseDTO } from './dto/translate-response.dto';
import { randomUUID } from 'crypto';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { ConfigService } from '@nestjs/config';
import { DynamoService } from '../database/dynamo.service';

@Injectable()
export class TranslateService {
  constructor(
    @Inject('SQS_CLIENT') private readonly sqsClient: SQSClient,
    private readonly configService: ConfigService,
    private readonly bedrockClient: BedrockService,
    private readonly dynamoDB: DynamoService,
  ) {}

  // async handleTranslation(
  //   request: TranslateRequestDTO,
  // ): Promise<TranslateResponseDTO> {
  //   const {
  //     targetLanguages,
  //     language,
  //     fields,
  //     UserRequestedTranslation,
  //     itemId,
  //     itemPath,
  //   } = request;
  //   const results = [];
  //   for (const field of fields) {
  //     const translations: Record<string, string> = {};

  //     await Promise.all(
  //       targetLanguages.map(async (targetLanguage) => {
  //         const translated = await this.bedrockClient.translate(
  //           field.texttotranslate,
  //           targetLanguage,
  //           language,
  //         );
  //         if (translated) {
  //           translations[targetLanguage] = translated;
  //         }
  //       }),
  //     );

  //     results.push({ metadata: fields[0].metadata, translations });
  //   }
  //   return {
  //     itemId,
  //     itemPath,
  //     requestedBy: UserRequestedTranslation,
  //     sourceLanguage: language,
  //     targetLanguages,
  //     results,
  //     timestamp: new Date().toISOString(),
  //   };
  // }

  async enqueueTranslation(request: TranslateRequestDTO): Promise<string> {
    const jobId = randomUUID();
    const payload = { jobId, request };

    await this.sqsClient.send(
      new SendMessageCommand({
        QueueUrl: this.configService.get<string>('TRANSLATION_QUEUE_URL'),
        MessageBody: JSON.stringify(payload),
      }),
    );
    return jobId;
  }

  async getTranslationResult(jobId: string) {
    const result = await this.dynamoDB.getResult(jobId);
    if (!result)
      throw new NotFoundException(`No record found for jobId ${jobId}`);
    return result;
  }
}
