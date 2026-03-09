import { IsString, IsOptional } from 'class-validator';

export class CreateToChucDto {
  @IsString()
  ten: string;

  @IsString()
  @IsOptional()
  moTa?: string;
}
