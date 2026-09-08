import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto.js';

@Injectable()
export class UserService {
    private readonly logger = new Logger(UserService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) { }

    async createUser(createUserDto: CreateUserDto) {
        this.logger.log(`[USER-SERVICE] 🗄️ Database: Creating and saving user (email: ${createUserDto.email})...`);
        const user = this.userRepository.create(createUserDto);
        const savedUser = await this.userRepository.save(user);
        this.logger.log(`[USER-SERVICE] 🗄️ Database: User saved with generated ID: ${savedUser.id}`);
        return savedUser;
    }

    async findById(id: number) {
        this.logger.log(`[USER-SERVICE] 🗄️ Database: Finding user by ID: ${id}...`);
        const user = await this.userRepository.findOne({
            where: { id },
        });
        this.logger.log(`[USER-SERVICE] 🗄️ Database: User found for ID ${id}: ${user ? 'YES' : 'NO'}`);
        return user;
    }

    async findByEmail(email: string) {
        this.logger.log(`[USER-SERVICE] 🗄️ Database: Finding user by email: ${email}...`);
        const user = await this.userRepository.findOne({
            where: { email },
        });
        this.logger.log(`[USER-SERVICE] 🗄️ Database: User found for email ${email}: ${user ? 'YES' : 'NO'}`);
        return user;
    }

    async findAll() {
        this.logger.log(`[USER-SERVICE] 🗄️ Database: Fetching all users...`);
        const users = await this.userRepository.find();
        this.logger.log(`[USER-SERVICE] 🗄️ Database: Retrieved ${users.length} users.`);
        return users;
    }
}

