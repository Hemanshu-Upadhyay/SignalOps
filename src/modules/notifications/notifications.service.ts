import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationConfig } from '../../entities';
import { EmailProvider } from './providers/email.provider';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from './providers/notification-provider.interface';
import { TelegramProvider } from './providers/telegram.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

@Injectable()
export class NotificationsService {
  private readonly providers: Map<NotificationChannel, NotificationProvider>;
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectRepository(NotificationConfig)
    private readonly configs: Repository<NotificationConfig>,
    emailProvider: EmailProvider,
    telegramProvider: TelegramProvider,
    whatsappProvider: WhatsappProvider,
  ) {
    this.providers = new Map<NotificationChannel, NotificationProvider>([
      [emailProvider.name(), emailProvider],
      [telegramProvider.name(), telegramProvider],
      [whatsappProvider.name(), whatsappProvider],
    ]);
  }

  async sendForRule(
    tenantId: string,
    channel: NotificationChannel,
    payload: NotificationPayload,
  ) {
    const config = await this.configs.findOne({ where: { tenantId, channel, status: 'active' } });
    if (!config) {
      throw new NotFoundException(`No active notification config for ${channel}`);
    }

    const provider = this.providers.get(channel);
    if (!provider) {
      throw new NotFoundException(`Unsupported channel ${channel}`);
    }

    try {
      await provider.send({ ...payload, destination: this.resolveDestination(config, payload) });
    } catch (err) {
      this.logger.error(`Failed to send ${channel} notification`, err as Error);
      throw err;
    }
  }

  private resolveDestination(config: NotificationConfig, payload: NotificationPayload): string {
    if (config.config?.destination) return config.config.destination;
    return payload.destination;
  }
}

