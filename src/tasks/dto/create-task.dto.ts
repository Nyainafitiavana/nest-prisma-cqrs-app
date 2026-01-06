import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  IsNotEmpty,
} from 'class-validator';
import { ValidationMessages } from '../../common/validation/validation-messages';

export class CreateTaskDto {
  @IsString({ message: ValidationMessages.type('Title', 'string') })
  @IsNotEmpty({ message: ValidationMessages.required('Title') })
  @MinLength(3, { message: ValidationMessages.minLength('Title', 3) })
  @MaxLength(100, { message: ValidationMessages.maxLength('Title', 100) })
  title: string;

  @IsOptional()
  @IsString({ message: ValidationMessages.type('Description', 'string') })
  @MaxLength(500, { message: ValidationMessages.maxLength('Description', 500) })
  description?: string;
}
