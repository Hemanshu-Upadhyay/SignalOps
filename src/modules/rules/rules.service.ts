import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rule } from '../../entities';

@Injectable()
export class RulesService {
  constructor(@InjectRepository(Rule) private readonly rules: Repository<Rule>) {}

  async getActiveRulesForEvent(tenantId: string, eventType: string): Promise<Rule[]> {
    return this.rules.find({
      where: { tenantId, eventType, status: 'active' },
      order: { version: 'DESC' },
    });
  }
}

