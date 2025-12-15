import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('usage_records')
export class UsageRecord extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.usageRecords, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Column({ type: 'integer', default: 0 })
  eventsIngested!: number;

  @Column({ type: 'integer', default: 0 })
  notificationsSent!: number;

  @Index()
  @Column({ type: 'date' })
  periodStart!: string;

  @Index()
  @Column({ type: 'date' })
  periodEnd!: string;
}

