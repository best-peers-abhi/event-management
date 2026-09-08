import { IsNotEmpty } from "class-validator";

export class RegisterEventDto {
    @IsNotEmpty()
    eventId: number;

    @IsNotEmpty()
    userId: number;
}