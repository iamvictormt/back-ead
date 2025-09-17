import { BadRequestException, Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../../decorators/role.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.usersService.create(body.name, body.email, body.password);
  }

  @Post('register-admin')
  @Role('ADMIN')
  async registerAdmin(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.usersService.create(body.name, body.email, body.password, true);
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    console.log(body)
    const user = await this.authService.validateUser(body.email, body.password);
    return this.authService.login(user);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  async findMyProfile(@Req() req) {
    const userId = req.user.userId;
    return this.usersService.findMyProfile(userId);
  }
}
