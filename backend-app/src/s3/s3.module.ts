import { Module } from '@nestjs/common';
import { S3Service } from './s3.service';
import { FileController } from './s3.controller';

@Module({
  providers: [S3Service],
  exports: [S3Service],
  controllers: [FileController],
})
export class S3Module {}
