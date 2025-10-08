import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EmailService } from '../utils/email.service';
import { NotificationService } from '../utils/notification.service';

@Module({
  providers: [AuthService, EmailService, NotificationService],
  controllers: [AuthController],
})
export class AuthModule {}
