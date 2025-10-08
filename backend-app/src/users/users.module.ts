import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DynamoModule } from '../database/dynamo.module';

@Module({
  imports: [DynamoModule],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
