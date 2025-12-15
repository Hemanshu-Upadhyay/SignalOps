import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('events')
export class EventRecord extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  type!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  source?: string;

  @Column({ type: 'jsonb' })
  payload!: Record<string, any>;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  occurredAt!: Date;

  @Index()
  @Column({ type: 'varchar', length: 255, nullable: true })
  idempotencyKey?: string;
}

