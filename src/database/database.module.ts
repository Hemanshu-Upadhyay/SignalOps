import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from '../config/configuration';
import {
  ApiKey,
  EventRecord,
  IdempotencyKey,
  NotificationConfig,
  Rule,
  Tenant,
  UsageRecord,
  User,
} from '../entities';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const config = configuration();
        const dbUrl = config.database.url;
        return {
          type: 'postgres',
          url: dbUrl,
          host: dbUrl ? undefined : config.database.host,
          port: dbUrl ? undefined : config.database.port,
          username: dbUrl ? undefined : config.database.user,
          password: dbUrl ? undefined : config.database.password,
          database: dbUrl ? undefined : config.database.database,
          entities: [User, Tenant, ApiKey, EventRecord, Rule, NotificationConfig, UsageRecord, IdempotencyKey],
          synchronize: false,
          logging: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}

