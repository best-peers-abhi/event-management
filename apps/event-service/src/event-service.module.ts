import { Module } from '@nestjs/common';
import { EventModule } from './event/event.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';


@Module({
  imports: [EventModule, TypeOrmModule.forRoot({
    type: 'postgres',
    host: 'localhost',
    port: 5432,
    database: 'event_db',
    username: 'postgres',
    password: 'root',
    autoLoadEntities: true,
    synchronize: true,
  })],
  controllers: [],
  providers: [],
})
export class EventServiceModule { }
