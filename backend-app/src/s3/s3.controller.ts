import {
  Controller,
  Post,
  Get,
  Delete,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from './s3.service';
import { FileDTO } from './dto/file.dto';

@Controller('files')
export class FileController {
  constructor(private readonly s3Service: S3Service) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: FileDTO) {
    return this.s3Service.uploadFile(file, 'uploads');
  }

  @Get('download')
  async download(@Query('key') key: string) {
    return { signedUrl: await this.s3Service.getFileUrl(key) };
  }

  @Delete()
  async delete(@Body('key') key: string) {
    return this.s3Service.deleteFile(key);
  }
}
