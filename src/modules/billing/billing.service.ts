import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageRecord } from '../../entities';

@Injectable()
export class BillingService {
  constructor(@InjectRepository(UsageRecord) private readonly usage: Repository<UsageRecord>) {}

  async incrementNotifications(tenantId: string) {
    const record = await this.getOrCreateCurrentUsage(tenantId);
    await this.usage.update(
      { id: record.id },
      { notificationsSent: () => '"notificationsSent" + 1' },
    );
  }

  private async getOrCreateCurrentUsage(tenantId: string) {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
      .toISOString()
      .slice(0, 10);
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0))
      .toISOString()
      .slice(0, 10);

    let record = await this.usage.findOne({ where: { tenantId, periodStart: start, periodEnd: end } });
    if (!record) {
      record = this.usage.create({ tenantId, periodStart: start, periodEnd: end });
      record = await this.usage.save(record);
    }
    return record;
  }
}

