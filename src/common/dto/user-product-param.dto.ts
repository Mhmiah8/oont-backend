import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserProductParamDto {
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  userId: string;

  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  productId: string;
}
