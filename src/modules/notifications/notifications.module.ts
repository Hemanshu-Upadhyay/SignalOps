import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationConfig } from '../../entities';
import { EmailProvider } from './providers/email.provider';
import { TelegramProvider } from './providers/telegram.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [TypeOrmModule.forFeature([NotificationConfig])],
  providers: [NotificationsService, EmailProvider, TelegramProvider, WhatsappProvider],
  exports: [NotificationsService],
})
export class NotificationsModule {}

