import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GenerateAiDto {
  @IsNotEmpty({ message: 'Type is required' })
  @IsIn(['title', 'description'], { message: 'Type must be either "title" or "description"' })
  type: 'title' | 'description';

  @IsNotEmpty({ message: 'Prompt/keywords cannot be empty' })
  @IsString()
  prompt: string;

  @IsOptional()
  @IsString()
  context?: string;
}
