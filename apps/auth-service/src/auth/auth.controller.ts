import { Controller, Logger } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        private readonly authService: AuthService,
    ) { }

    @MessagePattern('auth.register')
    async register(@Payload() data: RegisterDto) {
        this.logger.log(`[AUTH-SERVICE] 📥 Microservice received TCP message 'auth.register' for: ${data.email}`);
        return this.authService.register(data);
    }

    @MessagePattern('auth.login')
    async login(@Payload() data: LoginDto) {
        this.logger.log(`[AUTH-SERVICE] 📥 Microservice received TCP message 'auth.login' for: ${data.email}`);
        return this.authService.login(data);
    }
}

