import {
  BadRequestException,
  Body,
  Controller, Delete, ForbiddenException,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '../../decorators/role.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Get('')
  async getAllUsers(
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;

    return this.usersService.getAllUsers(pageNumber, pageSize);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Get('admins')
  async getAllAdmins(@Req() req) {
    return this.usersService.getAllAdmins(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Role('ADMIN')
  @Delete('admins/:id')
  async deleteAdmin(@Param('id') id: string, @Req() req) {
    const currentUserId = Number(req.user.sub);
    const targetUserId = Number(id);

    if (currentUserId === targetUserId) {
      throw new ForbiddenException('Você não pode excluir a si mesmo.');
    }

    return this.usersService.deleteAdmin(targetUserId);
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
