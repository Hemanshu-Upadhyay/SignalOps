import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ApiKey } from './api-key.entity';
import { Rule } from './rule.entity';
import { NotificationConfig } from './notification-config.entity';
import { UsageRecord } from './usage-record.entity';

@Entity('tenants')
export class Tenant extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 120 })
  slug!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status!: 'active' | 'suspended';

  @Column({ type: 'varchar', length: 50, default: 'free' })
  plan!: 'free' | 'pro' | 'enterprise';

  @Column({ type: 'integer', default: 100000 })
  monthlySoftLimit!: number;

  @Column({ type: 'integer', default: 120000 })
  monthlyHardLimit!: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @OneToMany(() => User, (user) => user.tenant)
  users?: User[];

  @OneToMany(() => ApiKey, (key) => key.tenant)
  apiKeys?: ApiKey[];

  @OneToMany(() => Rule, (rule) => rule.tenant)
  rules?: Rule[];

  @OneToMany(() => NotificationConfig, (config) => config.tenant)
  notificationConfigs?: NotificationConfig[];

  @OneToMany(() => UsageRecord, (usage) => usage.tenant)
  usageRecords?: UsageRecord[];
}

