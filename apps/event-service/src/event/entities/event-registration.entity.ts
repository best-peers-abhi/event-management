import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    Unique,
} from 'typeorm';

@Entity('event_registrations')
@Unique(['eventId', 'userId'])
export class EventRegistration {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    eventId: number;

    @Column()
    userId: number;

    @CreateDateColumn()
    registeredAt: Date;
}