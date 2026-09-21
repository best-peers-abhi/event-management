import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PassportModule } from '@nestjs/passport';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JwtStrategy } from './jwt.strategy.js';

@Module({
    imports: [
        ClientsModule.register([
            {
                name: 'AUTH_SERVICE',
                transport: Transport.TCP,
                options: {
                    host: process.env.AUTH_SERVICE_HOST || 'localhost',
                    port: Number(process.env.AUTH_SERVICE_PORT) || 3002,
                },
            },
        ]),
        PassportModule.register({ defaultStrategy: 'jwt' }),
    ],
    exports: [
        PassportModule,
        JwtAuthGuard
    ],
    providers: [JwtStrategy, JwtAuthGuard],
    controllers: [AuthController]
})
export class AuthModule { }
