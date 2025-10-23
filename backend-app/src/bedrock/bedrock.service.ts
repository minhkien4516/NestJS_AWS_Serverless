import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BedrockService {
  private readonly client: BedrockRuntimeClient;
  private readonly logger = new Logger(BedrockService.name);

  constructor(private readonly configService: ConfigService) {
    this.client = new BedrockRuntimeClient({
      region: this.configService.get<string>('COGNITO_REGION'),
      // maxAttempts: 3,
    });
  }

  async translate(
    text: string,
    targetLanguage: string,
    sourceLanguage: string,
  ): Promise<string> {
    const prompt = [
      {
        type: 'text',
        text: `
    You are a professional translator.
    Translate the following text from ${sourceLanguage} to ${targetLanguage}.
    Return only the translated text.

    Text: 
    ${text}
    `,
      },
    ];

    const command = new InvokeModelCommand({
      modelId:
        this.configService.get<string>('BEDROCK_MODEL_ARN') ||
        'arn:aws:bedrock:ap-southeast-1:438465128644:inference-profile/apac.anthropic.claude-3-sonnet-20240229-v1:0',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        anthropic_version: 'bedrock-2025-09-31',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1000,
      }),
    });

    const response = await this.client.send(command);
    const decoded = new TextDecoder().decode(response.body);
    const parsed = JSON.parse(decoded);

    const translated =
      parsed?.content?.[0]?.text ||
      parsed?.output_text ||
      parsed?.outputText ||
      '';
    this.logger.log(`Translated to ${targetLanguage}`);
    return String(translated).trim();
  }

  // async callWithBackoff(
  //   command: InvokeModelCommand,
  //   targetLanguage: string,
  //   retries = 5,
  //   delay = 1000,
  // ): Promise<string> {
  //   try {
  //     const response = await this.client.send(command);
  //     const decoded = new TextDecoder().decode(response.body);
  //     const output = JSON.parse(decoded);

  //     const translated = output?.content?.[0]?.text?.trim() || '';
  //     this.logger.log(`Translation (${targetLanguage}) success`);
  //     return translated;
  //   } catch (error) {
  //     const statusCode = error?.$metadata?.httpStatusCode;
  //     const requestId = error?.$metadata?.requestId;

  //     // Handle throttling with exponential backoff
  //     if (
  //       (error.name === 'ThrottlingException' || statusCode === 429) &&
  //       retries > 0
  //     ) {
  //       this.logger.warn(
  //         `Throttled on ${targetLanguage}. Retrying in ${delay}ms (RequestId: ${requestId}, statusCode: ${statusCode})`,
  //       );
  //       await new Promise((resolve) => setTimeout(resolve, delay));
  //       return this.callWithBackoff(
  //         command,
  //         targetLanguage,
  //         retries - 1,
  //         delay * 2,
  //       );
  //     }

  //     // Log error details
  //     this.logger.error(
  //       `❌ Error translating (${targetLanguage}) [${requestId || 'no-id'}]: ${error.message}`,
  //     );
  //     throw new Error(`Translation failed for ${targetLanguage}`);
  //   }
  // }
}
