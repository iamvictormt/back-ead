// certificate.service.ts
import { Injectable } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import { PrismaService } from '../../../prisma/prisma.service';
import { join } from 'path';
import { readFile } from 'fs/promises';

@Injectable()
export class CertificateService {
  constructor(private prisma: PrismaService) {}

  // Buscar certificados de um usuário
  async getUserCertificates(userId: number) {
    return this.prisma.certificate.findMany({
      where: { userId },
      include: { course: true },
    });
  }

  // Gerar PDF a partir de HTML
  async generateCertificatePdf(userId: number, courseId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    const certificate = await this.prisma.certificate.findFirst({ where: { courseId, userId } });


    if (!user || !course || !certificate) {
      throw new Error('Usuário ou curso não encontrado.');
    }

    const templatePath = join(process.cwd(), 'templates', 'certificate-template.html');
    let html = await readFile(templatePath, 'utf-8');

    const issuedAt = certificate.issuedAt;
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('pt-BR', options).format(issuedAt);

    html = html
      .replace('[Nome do Aluno]', user.name)
      .replace('[Nome do Curso]', course.title)
      .replace('[Data de Conclusão]', formattedDate)
      .replace('[Codigo de verificação]', certificate.token);


    // Inicializa o Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({ format: 'A4', landscape: true, printBackground: true });

    await browser.close();
    return pdfBuffer;
  }
}
