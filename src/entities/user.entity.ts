import { Column, Entity, Index, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Tenant } from './tenant.entity';

@Entity('users')
export class User extends BaseEntity {
  @Index()
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 50, default: 'member' })
  role!: 'owner' | 'admin' | 'member';

  @ManyToOne(() => Tenant, (tenant) => tenant.users, { onDelete: 'CASCADE' })
  tenant!: Tenant;

  @Index()
  @Column({ type: 'uuid' })
  tenantId!: string;
}

