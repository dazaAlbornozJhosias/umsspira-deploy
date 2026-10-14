// apps/api/src/modules/auth/controllers/auth.controller.ts
import { Body, Controller, Get, HttpCode, Post, UseGuards } from '@nestjs/common';
import type { AuthenticatedUser } from '@umsspira/shared-types';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../contracts/dto';
import { AuthGuard, CurrentUser } from '@/shared/guards';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const data = await this.authService.login(dto);
    return { data };
  }

  @Get('me')
  @UseGuards(AuthGuard)
  me(@CurrentUser() user: AuthenticatedUser) {
    return { data: user };
  }
}