import {
  Controller,
  Post,
  Body,
  BadRequestException,
  UseGuards,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../decorators/role.decorator';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @Role('ADMIN')
  @UseGuards(AuthGuard('jwt'))
  async createPurchase(@Body() data: { userId: number; courseId: number }) {
    if (!data.userId || !data.courseId) {
      throw new BadRequestException('Usuário e Curso são obrigatórios');
    }

    return this.purchasesService.createFakePayment(data.userId, data.courseId);
  }
}
