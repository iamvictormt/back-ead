import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateUser(@Req() req, @Body() dto: UpdateUserDto) {
    try {
      return await this.usersService.updateUser(req.user.userId, dto);
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  async changePassword(@Req() req, @Body() dto: ChangePasswordDto) {
    try {
      await this.usersService.changePassword(
        req.user.userId,
        dto.oldPassword,
        dto.newPassword,
      );
      return { message: 'Senha alterada com sucesso' };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }
}
