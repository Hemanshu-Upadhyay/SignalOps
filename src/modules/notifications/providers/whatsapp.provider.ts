import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class WhatsappProvider implements NotificationProvider {
  private readonly logger = new Logger(WhatsappProvider.name);

  name(): NotificationChannel {
    return 'whatsapp';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Placeholder for WhatsApp provider integration
    this.logger.log(`WhatsApp to ${payload.destination}: ${payload.message}`);
  }
}

