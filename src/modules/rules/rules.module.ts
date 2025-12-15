import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rule } from '../../entities';
import { RulesService } from './rules.service';

@Module({
  imports: [TypeOrmModule.forFeature([Rule])],
  providers: [RulesService],
  exports: [RulesService],
})
export class RulesModule {}

