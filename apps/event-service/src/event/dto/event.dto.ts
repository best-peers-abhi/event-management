import {
    IsDateString,
    IsInt,
    IsNotEmpty,
    IsString,
    Min,
} from 'class-validator';

export class EventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    description: string;

    @IsString()
    @IsNotEmpty()
    location: string;

    @IsDateString()
    startDate: string;

    @IsDateString()
    endDate: string;

    @IsInt()
    @Min(1)
    capacity: number;
}