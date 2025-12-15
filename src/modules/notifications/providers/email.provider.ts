import { Injectable, Logger } from '@nestjs/common';
import {
  NotificationChannel,
  NotificationPayload,
  NotificationProvider,
} from './notification-provider.interface';

@Injectable()
export class EmailProvider implements NotificationProvider {
  private readonly logger = new Logger(EmailProvider.name);

  name(): NotificationChannel {
    return 'email';
  }

  async send(payload: NotificationPayload): Promise<void> {
    // Placeholder for SMTP or provider SDK integration
    this.logger.log(`Email to ${payload.destination}: ${payload.subject}`);
  }
}

