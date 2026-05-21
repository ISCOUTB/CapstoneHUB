import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginUserDto } from './dto/login-user.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() payload: RegisterUserDto) {
    return this.authService.register(payload);
  }

  @Post('login')
  login(@Body() payload: LoginUserDto) {
    return this.authService.login(payload);
  }
}
