import { Injectable, UnauthorizedException } from '@nestjs/common';
import {
  CognitoIdentityProviderClient,
  ConfirmSignUpCommand,
  GetUserCommand,
  InitiateAuthCommand,
  RevokeTokenCommand,
  SignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { generateSecretHash } from './auth.helper';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../utils/email.service';
import { NotificationService } from '../utils/notification.service';

@Injectable()
export class AuthService {
  private client: CognitoIdentityProviderClient;
  constructor(
    private readonly configService: ConfigService,
    private emailService: EmailService,
    private notificationService: NotificationService,
  ) {
    this.client = new CognitoIdentityProviderClient({
      region: this.configService.get<string>('COGNITO_REGION')!,
    });
  }

  async signup(email: string, password: string) {
    const secretHash = generateSecretHash(
      email,
      this.configService.get<string>('COGNITO_CLIENT_ID')!,
      this.configService.get<string>('COGNITO_CLIENT_SECRET')!,
    );

    const command = new SignUpCommand({
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
      Username: email,
      Password: password,
      SecretHash: secretHash,
      UserAttributes: [
        {
          Name: 'email',
          Value: email,
        },
      ],
    });
    return this.client.send(command);
  }

  async confirmSignup(email: string, code: string) {
    const secretHash = generateSecretHash(
      email,
      this.configService.get<string>('COGNITO_CLIENT_ID')!,
      this.configService.get<string>('COGNITO_CLIENT_SECRET')!,
    );

    // const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const command = new ConfirmSignUpCommand({
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
      SecretHash: secretHash,
      Username: email,
      ConfirmationCode: code,
    });
    /**
     * Avoid Increasing Cost
     */
    // await this.notificationService.publishMessage(
    //   this.configService.get<string>('SNS_EMAIL_TOPIC_ARN')!,
    //   'You have successfully signed up.',
    // );
    // if (otp) {
    // await this.notificationService.sendSMS(
    //   '+84777724410',
    //   `You have successfully signed up. Your OTP is ${otp}`,
    // );
    // }

    return this.client.send(command);
  }

  async login(email: string, password: string) {
    const secretHash = generateSecretHash(
      email,
      this.configService.get<string>('COGNITO_CLIENT_ID')!,
      this.configService.get<string>('COGNITO_CLIENT_SECRET')!,
    );

    const command = new InitiateAuthCommand({
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash,
      },
    });

    try {
      const response = await this.client.send(command);
      if (response) {
        // const otp = Math.floor(100000 + Math.random() * 900000).toString();
        /**
         * Avoid Increasing Cost
         */
        await this.emailService.sendEmail(
          email,
          'Login Notification',
          'You have successfully logged in.',
        );
        // await this.notificationService.publishMessage(
        //   this.configService.get<string>('SNS_EMAIL_TOPIC_ARN')!,
        //   'You have successfully logged in.',
        // );
        // if (otp) {
        //   await this.notificationService.sendSMS(
        //     '+84777724410',
        //     `You have successfully logged in. Your OTP is ${otp}`,
        //   );
        // }
      }
      return {
        accessToken: response.AuthenticationResult?.AccessToken,
        idToken: response.AuthenticationResult?.IdToken,
        refreshToken: response.AuthenticationResult?.RefreshToken,
      };
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err.message);
      } else {
        console.error('An unknown error occurred:', err);
      }
    }
  }

  async logout(refreshToken: string) {
    const command = new RevokeTokenCommand({
      Token: refreshToken,
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
      ClientSecret: this.configService.get<string>('COGNITO_CLIENT_SECRET')!,
    });
    return this.client.send(command);
  }

  async getUser(accessToken: string) {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });
    try {
      return this.client.send(command);
    } catch (err) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err.message);
      } else {
        console.error('An unknown error occurred:', err);
      }
    }
  }

  async refreshToken(userId: string, refreshToken: string) {
    const secretHash = generateSecretHash(
      userId,
      this.configService.get<string>('COGNITO_CLIENT_ID')!,
      this.configService.get<string>('COGNITO_CLIENT_SECRET')!,
    );

    const command = new InitiateAuthCommand({
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: this.configService.get<string>('COGNITO_CLIENT_ID')!,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash,
      },
    });

    const response = await this.client.send(command);

    return {
      accessToken: response.AuthenticationResult?.AccessToken,
      idToken: response.AuthenticationResult?.IdToken,
    };
  }
}
