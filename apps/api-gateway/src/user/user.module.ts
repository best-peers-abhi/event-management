import { Module } from '@nestjs/common';
import { UserController } from './user.controller.js';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ])
  ],
  controllers: [UserController]
})
export class UserModule { }
