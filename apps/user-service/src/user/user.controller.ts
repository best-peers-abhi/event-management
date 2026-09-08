import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserService } from './user.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';

@Controller('user')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(
        private readonly userService: UserService,
    ) { }

    @MessagePattern('user.create')
    async createUser(@Payload() createUserDto: CreateUserDto) {
        this.logger.log(`[USER-SERVICE] 📥 Microservice received TCP pattern 'user.create' for email: ${createUserDto.email}`);
        return this.userService.createUser(createUserDto);
    }

    @MessagePattern('user.findById')
    async findById(@Payload() id: number) {
        this.logger.log(`[USER-SERVICE] 📥 Microservice received TCP pattern 'user.findById' for ID: ${id}`);
        return this.userService.findById(id);
    }

    @MessagePattern('user.findByEmail')
    async findByEmail(@Payload() email: string) {
        this.logger.log(`[USER-SERVICE] 📥 Microservice received TCP pattern 'user.findByEmail' for email: ${email}`);
        return this.userService.findByEmail(email);
    }

    @MessagePattern('user.findAll')
    async findAll() {
        this.logger.log(`[USER-SERVICE] 📥 Microservice received TCP pattern 'user.findAll'`);
        return this.userService.findAll();
    }
}

