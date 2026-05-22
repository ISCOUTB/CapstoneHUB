import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LoginUserDto {
  @ApiProperty({ description: 'email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'user password' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
