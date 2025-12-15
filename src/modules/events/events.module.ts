import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventRecord, IdempotencyKey, UsageRecord } from '../../entities';
import { QueueModule } from '../../queue/queue.module';
import { AuthModule } from '../auth/auth.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventRecord, IdempotencyKey, UsageRecord]),
    QueueModule,
    AuthModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}

