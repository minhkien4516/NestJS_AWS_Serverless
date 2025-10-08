import { PublishCommand, SNSClient } from '@aws-sdk/client-sns';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class NotificationService {
  private sns: SNSClient;

  constructor(private readonly configService: ConfigService) {
    this.sns = new SNSClient({
      region: this.configService.get<string>('COGNITO_REGION'),
    });
  }

  async publishMessage(topicArn: string, message: string) {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: message,
    });

    return this.sns.send(command);
  }

  async sendSMS(phoneNumber: string, message: string) {
    console.log(phoneNumber, message);
    const command = new PublishCommand({
      PhoneNumber: phoneNumber,
      Message: message,
    });

    return this.sns.send(command);
  }
}
