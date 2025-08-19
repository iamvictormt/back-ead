import {
  Controller,
  Get,
  Param,
  Res,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { Response } from 'express';
import { CertificateService } from './certificates.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('certificates')
export class CertificateController {
  constructor(private readonly certificateService: CertificateService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get('user')
  async getUserCertificates(@Req() req) {
    const userId = req.user.userId;
    return this.certificateService.getUserCertificates(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('download/:courseId')
  async downloadCertificate(
    @Req() req,
    @Param('courseId') courseId: number,
    @Res() res: Response,
  ) {
    const userId = req.user.userId;

    const pdfBuffer = await this.certificateService.generateCertificatePdf(
      userId,
      courseId,
    );

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=certificado-${userId}-${courseId}.pdf`,
      'Content-Length': pdfBuffer.length,
    });

    res.end(pdfBuffer);
  }
}
