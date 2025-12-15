import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';
import { NotificationChannel } from '../modules/notifications/providers/notification-provider.interface';

@Entity('notification_configs')
export class NotificationConfig extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.notificationConfigs, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'varchar', length: 80 })
  channel!: NotificationChannel;

  @Column({ type: 'jsonb' })
  config!: Record<string, any>;

  @Column({ type: 'varchar', length: 30, default: 'active' })
  status!: 'active' | 'disabled';
}

