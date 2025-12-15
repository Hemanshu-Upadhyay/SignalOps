import { Inject, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { QUEUE_TOKENS } from './queue.constants';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@Inject(QUEUE_TOKENS.EVENT_QUEUE) private readonly eventQueue: Queue) {}

  async enqueueEvent(job: { tenantId: string; eventId: string; type: string }) {
    await this.eventQueue.add(
      'process-event',
      { ...job },
      {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    this.logger.debug(`Enqueued event ${job.eventId} for tenant ${job.tenantId}`);
  }
}

