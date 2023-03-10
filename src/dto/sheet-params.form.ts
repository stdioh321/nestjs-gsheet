import { IsString, IsOptional, MinLength } from 'class-validator';

export class SheetParamsForm {
  @IsString()
  @MinLength(3)
  projectId: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  sheet?: string = `Sheet1`;
}
