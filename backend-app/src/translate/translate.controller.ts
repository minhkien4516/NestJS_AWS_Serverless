import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TranslateService } from './translate.service';
import { TranslateRequestDTO } from './dto/translate-request.dto';

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post('/retry')
  async translateWithBackoff(@Body() request: TranslateRequestDTO) {
    return await this.translateService.handleTranslationBackoff(request);
  }

  @Post()
  async translate(@Body() request: TranslateRequestDTO) {
    const jobId = await this.translateService.enqueueTranslation(request);
    return {
      message: 'Translation job accepted',
      jobId,
      status: 'PENDING',
    };
  }

  @Get(':jobId')
  async getResult(@Param('jobId') jobId: string) {
    return this.translateService.getTranslationResult(jobId);
  }
}
