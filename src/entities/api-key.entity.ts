import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('api_keys')
export class ApiKey extends BaseEntity {
  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  keyHash!: string;

  @Index()
  @Column({ type: 'varchar', length: 24 })
  keyPrefix!: string;

  @Column({ type: 'varchar', length: 255 })
  label!: string;

  @Column({ type: 'varchar', array: true, default: '{}' })
  scopes!: string[];

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt?: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.apiKeys, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;
}

