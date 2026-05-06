import { mixin } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptions } from '@nestjs/swagger';
import { Type } from '@nestjs/class-transformer';
import { IsNumber, ValidateNested } from '@nestjs/class-validator';

type Constructor<T = {}> = new (...args: any[]) => T;

export function BaseResponse<TBase extends Constructor>(
  Base: TBase,
  options?: ApiPropertyOptions,
) {
  class ResponseDTO {
    @ApiProperty({
      description: 'número de items retornados',
    })
    @IsNumber()
    count!: number;

    @ApiProperty({
      description: 'mensaje de retorno',
      example: 'item creado con éxito',
    })
    message!: string;

    @ApiProperty({
      isArray: true,
      type: Base,
      ...options,
    })
    @Type(() => Base)
    @ValidateNested({ each: true })
    data!: Array<InstanceType<TBase>>;
  }
  return mixin(ResponseDTO);
}
