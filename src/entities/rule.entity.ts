import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('rules')
export class Rule extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.rules, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Column({ type: 'varchar', length: 150 })
  name!: string;

  @Index()
  @Column({ type: 'varchar', length: 120 })
  eventType!: string;

  @Column({ type: 'integer', default: 1 })
  version!: number;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: 'active' | 'paused';

  @Column({ type: 'jsonb' })
  definition!: {
    conditions: any;
    actions: any;
  };
}

