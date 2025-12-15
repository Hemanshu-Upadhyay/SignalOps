import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class TelegramProvider implements NotificationProvider {
  private readonly logger = new Logger(TelegramProvider.name);

  name(): NotificationChannel {
    return 'telegram';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Placeholder for Telegram Bot API integration
    this.logger.log(`Telegram to ${payload.destination}: ${payload.message}`);
  }
}

