import { BadRequestException, Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, EventRecord, IdempotencyKey, UsageRecord } from '../../entities';
import { QueueService } from '../../queue/queue.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);

  constructor(
    @InjectRepository(EventRecord) private readonly events: Repository<EventRecord>,
    private readonly queueService: QueueService,
  ) {}

  async ingestEvent(dto: CreateEventDto, tenant: Tenant, idempotencyKey?: string) {
    if (idempotencyKey?.length && idempotencyKey.length > 255) {
      throw new BadRequestException('Idempotency key too long');
    }

    return this.events.manager.transaction(async (manager) => {
      const idempotencyRepo = manager.getRepository(IdempotencyKey);
      const existingIdempotency =
        idempotencyKey &&
        (await idempotencyRepo.findOne({
          where: { tenantId: tenant.id, idempotencyKey },
        }));

      if (existingIdempotency) {
        const existingEvent = await manager.getRepository(EventRecord).findOne({
          where: { id: existingIdempotency.eventId },
        });
        if (existingEvent) return existingEvent;
      }

      await this.ensureUsageWithinLimits(manager.getRepository(UsageRecord), tenant);

      const event = manager.getRepository(EventRecord).create({
        tenantId: tenant.id,
        type: dto.type,
        source: dto.source,
        payload: dto.payload,
        occurredAt: dto.occurredAt ? new Date(dto.occurredAt) : new Date(),
        idempotencyKey,
      });

      const saved = await manager.getRepository(EventRecord).save(event);

      if (idempotencyKey) {
        await idempotencyRepo.save({ tenantId: tenant.id, idempotencyKey, eventId: saved.id });
      }

      await this.incrementUsage(manager.getRepository(UsageRecord), tenant.id);
      await this.queueService.enqueueEvent({ tenantId: tenant.id, eventId: saved.id, type: dto.type });
      return saved;
    });
  }

  private async ensureUsageWithinLimits(repo: Repository<UsageRecord>, tenant: Tenant) {
    const record = await this.getOrCreateCurrentUsage(repo, tenant.id);
    if (record.eventsIngested >= tenant.monthlyHardLimit) {
      throw new HttpException('Hard limit reached', HttpStatus.TOO_MANY_REQUESTS);
    }
    if (record.eventsIngested >= tenant.monthlySoftLimit) {
      this.logger.warn(`Tenant ${tenant.slug} above soft limit ${tenant.monthlySoftLimit}`);
    }
  }

  private async incrementUsage(repo: Repository<UsageRecord>, tenantId: string) {
    const record = await this.getOrCreateCurrentUsage(repo, tenantId);
    await repo.update({ id: record.id }, { eventsIngested: () => '"eventsIngested" + 1' });
  }

  private async getOrCreateCurrentUsage(repo: Repository<UsageRecord>, tenantId: string) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    let record = await repo.findOne({ where: { tenantId, periodStart: start, periodEnd: end } });
    if (!record) {
      record = repo.create({
        tenantId,
        periodStart: start,
        periodEnd: end,
      });
      record = await repo.save(record);
    }
    return record;
  }
}

