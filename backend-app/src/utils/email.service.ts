import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly ses: SESClient;

  constructor(private readonly configService: ConfigService) {
    this.ses = new SESClient({
      region: this.configService.get<string>('COGNITO_REGION'),
    });
  }

  async sendEmail(to: string, subject: string, body: string) {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
        },
        Body: {
          Text: {
            Data: body,
          },
          Html: {
            Data: `<p>${body}</p>`,
          },
        },
      },
      Source: this.configService.get<string>('EMAIL_ADDRESS'),
    });
    return this.ses.send(command);
  }
}
