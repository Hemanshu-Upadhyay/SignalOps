import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { ApiKey, Tenant, User } from '../../entities';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(ApiKey) private readonly apiKeys: Repository<ApiKey>,
    @InjectRepository(Tenant) private readonly tenants: Repository<Tenant>,
  ) {}

  async validateApiKey(rawKey: string): Promise<{ tenant: Tenant; apiKey: ApiKey }> {
    const prefix = this.extractPrefix(rawKey);
    const candidates = await this.apiKeys.find({
      where: { keyPrefix: prefix },
      relations: ['tenant'],
    });

    const match = await Promise.all(
      candidates.map(async (key) => ({
        key,
        valid: await bcrypt.compare(rawKey, key.keyHash),
      })),
    ).then((results) => results.find((res) => res.valid));

    if (!match) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (match.key.expiresAt && match.key.expiresAt < new Date()) {
      throw new UnauthorizedException('API key expired');
    }

    await this.apiKeys.update({ id: match.key.id }, { lastUsedAt: new Date() });

    return { tenant: match.key.tenant, apiKey: match.key };
  }

  async hashApiKey(raw: string): Promise<string> {
    return bcrypt.hash(raw, 12);
  }

  extractPrefix(raw: string): string {
    return raw.substring(0, 16);
  }
}

