import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('idempotency_keys')
@Unique(['tenantId', 'idempotencyKey'])
export class IdempotencyKey extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 255 })
  idempotencyKey!: string;

  @Column({ type: 'uuid', nullable: true })
  eventId?: string;
}

