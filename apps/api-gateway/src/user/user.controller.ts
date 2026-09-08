import { Body, Controller, Get, Inject, Logger, Param, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('users')
export class UserController {
    private readonly logger = new Logger(UserController.name);

    constructor(
        @Inject('USER_SERVICE')
        private readonly userClient: ClientProxy,
    ) { }

    @Get()
    findAll() {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /users received`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP message pattern 'user.findAll' to USER_SERVICE (port 3001)...`);
        return this.userClient.send('user.findAll', {});
    }

    @Post()
    create(@Body() data: any) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP POST /users received with data: ${JSON.stringify(data)}`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP message pattern 'user.create' to USER_SERVICE (port 3001)...`);
        return this.userClient.send('user.create', data);
    }

    @Get(':id')
    findById(@Param('id') id: number) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /users/${id} received`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP message pattern 'user.findById' (id: ${id}) to USER_SERVICE (port 3001)...`);
        return this.userClient.send('user.findById', Number(id));
    }

    @Get('email/:email')
    findByEmail(@Param('email') email: string) {
        this.logger.log(`[API-GATEWAY] 📥 HTTP GET /users/email/${email} received`);
        this.logger.log(`[API-GATEWAY] ➡️ Forwarding TCP message pattern 'user.findByEmail' (email: ${email}) to USER_SERVICE (port 3001)...`);
        return this.userClient.send('user.findByEmail', email);
    }
}

