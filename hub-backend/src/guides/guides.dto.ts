import { ApiProperty, PartialType } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { GuideCategory, UserRole } from '../generated/prisma/client';

export class CreateGuideDocumentDto {
  @ApiProperty({ description: 'Título del documento', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: 'Descripción opcional', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiProperty({ description: 'Categoría del documento', enum: GuideCategory })
  @IsEnum(GuideCategory)
  category!: GuideCategory;

  @ApiProperty({
    description:
      'Roles a los que se dirige el documento. Un arreglo vacío aplica a todos.',
    enum: UserRole,
    isArray: true,
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  audiences?: UserRole[];

  @ApiProperty({
    description: 'Enlace externo (alternativo a un archivo adjunto)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  externalUrl?: string;

  @ApiProperty({
    description: 'Si el documento se muestra en la página pública',
    required: false,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}

export class UpdateGuideDocumentDto extends PartialType(
  CreateGuideDocumentDto,
) {}
