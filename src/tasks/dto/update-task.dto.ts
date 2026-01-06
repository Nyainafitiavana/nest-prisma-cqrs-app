import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsIn,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation/validation-messages';

export class UpdateTaskDto {
  @IsOptional()
  @IsString({ message: ValidationMessages.type('Title', 'string') })
  @MinLength(3, { message: ValidationMessages.minLength('Title', 3) })
  @MaxLength(100, { message: ValidationMessages.maxLength('Title', 100) })
  title?: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.type('Description', 'string') })
  @MaxLength(500, { message: ValidationMessages.maxLength('Description', 500) })
  description?: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.type('Status', 'string') })
  @IsIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'], {
    message: ValidationMessages.isIn('Status', [
      'PENDING',
      'IN_PROGRESS',
      'COMPLETED',
      'CANCELLED',
    ]),
  })
  status?: string;
}
