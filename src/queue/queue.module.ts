import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Queue } from 'bullmq';
import { QUEUE_TOKENS } from './queue.constants';
import { QueueService } from './queue.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: QUEUE_TOKENS.EVENT_QUEUE,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = config.get('redis');
        const queues = config.get('queues');
        return new Queue(queues.eventQueueName, {
          connection: redis,
        });
      },
    },
    {
      provide: QUEUE_TOKENS.DLQ,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = config.get('redis');
        const queues = config.get('queues');
        return new Queue(queues.deadLetterQueueName, {
          connection: redis,
        });
      },
    },
    QueueService,
  ],
  exports: [QUEUE_TOKENS.EVENT_QUEUE, QUEUE_TOKENS.DLQ, QueueService],
})
export class QueueModule {}

