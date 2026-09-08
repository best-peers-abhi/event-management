import { HttpStatus, Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { LoginDto, RegisterDto } from './dto/auth.dto.js';
import { firstValueFrom } from 'rxjs';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        @Inject('USER_SERVICE') private readonly userClient: ClientProxy,
        private readonly jwtService: JwtService,
    ) { }

    async register(registerDto: RegisterDto) {
        this.logger.log(`[AUTH-SERVICE] 🔍 Step 1: Checking if user already exists in USER_SERVICE (email: ${registerDto.email})...`);
        this.logger.log(`[AUTH-SERVICE] ➡️ Step 1.1: Sending TCP message 'user.findByEmail' to USER_SERVICE (port 3001)...`);

        const existingUser = await firstValueFrom(
            this.userClient.send(
                'user.findByEmail',
                registerDto.email,
            ),
        );

        // 2. User already exists check
        if (existingUser) {
            this.logger.warn(`[AUTH-SERVICE] ⚠️ Conflict: User with email ${registerDto.email} already exists!`);
            throw new RpcException({
                statusCode: HttpStatus.CONFLICT,
                message: 'User already exists',
            });
        }

        this.logger.log(`[AUTH-SERVICE] ✅ Step 2: User does not exist. Proceeding to hash password...`);

        // 3. Hash the password
        const hashedPassword = await bcrypt.hash(
            registerDto.password,
            10,
        );
        this.logger.log(`[AUTH-SERVICE] 🔐 Step 3: Password successfully hashed with bcrypt.`);

        // 4. Send create command to User Service
        this.logger.log(`[AUTH-SERVICE] ➡️ Step 4: Sending TCP message 'user.create' to USER_SERVICE (port 3001)...`);
        const user = await firstValueFrom(
            this.userClient.send(
                'user.create',
                {
                    name: registerDto.name,
                    email: registerDto.email,
                    password: hashedPassword,
                },
            ),
        );

        this.logger.log(`[AUTH-SERVICE] ✅ Step 5: User created successfully with ID: ${user?.id}. Returning response to Gateway.`);

        // 5. Return the newly created user
        return {
            message: 'User registered successfully',
            user,
        };
    }

    async login(loginDto: LoginDto) {
        this.logger.log(`[AUTH-SERVICE] 🔍 Step 1: Looking up user by email in USER_SERVICE (email: ${loginDto.email})...`);
        this.logger.log(`[AUTH-SERVICE] ➡️ Step 1.1: Sending TCP message 'user.findByEmail' to USER_SERVICE (port 3001)...`);

        const existingUser = await firstValueFrom(
            this.userClient.send(
                'user.findByEmail',
                loginDto.email,
            ),
        );

        if (!existingUser) {
            this.logger.warn(`[AUTH-SERVICE] ❌ Login failed: No user found with email ${loginDto.email}`);
            throw new RpcException({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid Email',
            });
        }

        this.logger.log(`[AUTH-SERVICE] 🔐 Step 2: User found (ID: ${existingUser.id}). Comparing password hash with bcrypt...`);
        const isPasswordValid = await bcrypt.compare(
            loginDto.password,
            existingUser.password,
        );

        if (!isPasswordValid) {
            this.logger.warn(`[AUTH-SERVICE] ❌ Login failed: Incorrect password for email ${loginDto.email}`);
            throw new RpcException({
                statusCode: HttpStatus.UNAUTHORIZED,
                message: 'Invalid Password',
            });
        }

        this.logger.log(`[AUTH-SERVICE] 🎟️ Step 3: Password verified! Generating JWT Access Token...`);
        const payload = {
            id: existingUser.id,
            sub: existingUser.id,
            email: existingUser.email,
        };

        const accessToken = await this.jwtService.signAsync(payload);
        this.logger.log(`[AUTH-SERVICE] ✅ Step 4: JWT token generated successfully. Returning response to Gateway.`);

        return {
            message: 'User logged in successfully',
            user: {
                id: existingUser.id,
                name: existingUser.name,
                email: existingUser.email,
                createdAt: existingUser.createdAt,
            },
            token: accessToken,
        };
    }
}


