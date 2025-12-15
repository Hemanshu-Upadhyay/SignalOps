import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageRecord } from '../../entities';
import { BillingService } from './billing.service';

@Module({
  imports: [TypeOrmModule.forFeature([UsageRecord])],
  providers: [BillingService],
  exports: [BillingService],
})
export class BillingModule {}

