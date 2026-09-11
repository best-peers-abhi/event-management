import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, MessagePattern, Payload } from '@nestjs/microservices';
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

    // =========================================================================
    // KAFKA EVENT CONSUMER (Asynchronous Pub/Sub via topic 'event.created')
    // =========================================================================

    @EventPattern('event.created')
    async handleEventCreated(@Payload() data: any, @Ctx() context: KafkaContext | unknown) {
        const kafkaCtx = context as KafkaContext;
        this.logger.log(`[USER-SERVICE] 🔔 [KAFKA CONSUMER] Broadcast received for Topic 'event.created'!`);
        this.logger.log(`[USER-SERVICE] 📢 Notification: Event "${data?.title}" (ID: ${data?.id}, Capacity: ${data?.capacity}) is created! Please register into that event.`);
        const topic = kafkaCtx.getTopic();
        const partition = kafkaCtx.getPartition();
        const message = kafkaCtx.getMessage();

        this.logger.log(
            `[KAFKA] Topic: ${topic}, Partition: ${partition}, Offset: ${message.offset}`,
        );
    }
}

