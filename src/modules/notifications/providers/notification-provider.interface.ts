export interface NotificationPayload {
  subject: string;
  message: string;
  destination: string;
  context?: Record<string, any>;
}

export type NotificationChannel = 'email' | 'telegram' | 'whatsapp';

export interface NotificationProvider {
  send(payload: NotificationPayload): Promise<void>;
  name(): NotificationChannel;
}

