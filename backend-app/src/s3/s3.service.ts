import { Injectable, Logger } from '@nestjs/common';
import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ConfigService } from '@nestjs/config';
import { FileDTO } from './dto/file.dto';

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private s3: S3Client;
  private bucket: string;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('COGNITO_REGION'),
    });
    this.bucket = this.configService.get<string>('S3_BUCKET') || '';
    if (!this.bucket) {
      this.logger.warn('S3 bucket is not set (S3_BUCKET env)');
    }
  }

  async uploadFile(file: FileDTO, folder?: string) {
    const key = `${folder ? folder + '/' : ''}${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await this.s3.send(command);

    return {
      key,
      url: `https://${this.bucket}.s3.ap-southeast-1.amazonaws.com/${key}`,
    };
  }

  async getFileUrl(key: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await getSignedUrl(this.s3, command, { expiresIn: 3600 }); // 1h
  }

  async deleteFile(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return await this.s3.send(command);
  }
}
