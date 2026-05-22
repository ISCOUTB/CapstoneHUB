import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from '@nestjs/class-validator';

export class RegisterUserDto {
  @ApiProperty({ description: 'full name of the user' })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ description: 'email address of the user' })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ description: 'password for the new user' })
  @IsString()
  @MinLength(8)
  @IsNotEmpty()
  password!: string;
}
