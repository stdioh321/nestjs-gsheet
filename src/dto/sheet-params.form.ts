import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MinLength } from 'class-validator';

export class SheetParamsForm {
  @IsString()
  @MinLength(3)
  @ApiProperty({
    required: true,
    default: '1-r2jRuEgjLwyllwVpDYeJyQjrtNDo6_kYo8FVXilN6c',
    description: 'Spreedsheet Id',
    type: String,
  })
  projectId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  @ApiProperty({
    required: false,
    default: 'Sheet1',
    description: 'Sheet name',
    type: String,
  })
  sheet?: string = process.env.SHEET_NAME || 'Sheet1';
}
