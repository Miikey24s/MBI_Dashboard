import { PartialType } from '@nestjs/mapped-types';
import { CreateToChucDto } from './create-to-chuc.dto';

export class UpdateToChucDto extends PartialType(CreateToChucDto) {}
