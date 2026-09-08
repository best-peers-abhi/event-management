import { Body, Controller, Inject, Logger, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name);

    constructor(
        @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    ) { }
    @Post('/register')
    register(@Body() registerDto: any) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP POST /auth/register received for email: ${registerDto?.email}`);
        this.logger.log(`[API-GATEWAY] ➡️ Step 1: Forwarding TCP message pattern 'auth.register' to AUTH_SERVICE (port 3002)...`);
        return this.authClient.send(
            'auth.register',
            registerDto,
        );
    }

    @Post('/login')
    login(@Body() loginDto: any) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP POST /auth/login received for email: ${loginDto?.email}`);
        this.logger.log(`[API-GATEWAY] ➡️ Step 1: Forwarding TCP message pattern 'auth.login' to AUTH_SERVICE (port 3002)...`);
        return this.authClient.send(
            'auth.login',
            loginDto,
        );
    }
}
