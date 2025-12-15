import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { Worker, QueueEvents, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { AppModule } from '../app.module';
import { Rule, EventRecord, Tenant } from '../entities';
import { BillingService } from '../modules/billing/billing.service';
import { NotificationsService } from '../modules/notifications/notifications.service';
import { RulesService } from '../modules/rules/rules.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn', 'log'] });
  const config = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const rulesService = app.get(RulesService);
  const notificationsService = app.get(NotificationsService);
  const billingService = app.get(BillingService);

  const redisConfig = config.get('redis');
  const queueName = config.get('queues.eventQueueName');
  const dlqName = config.get('queues.deadLetterQueueName');

  const worker = new Worker(
    queueName,
    async (job) => {
      const { tenantId, eventId } = job.data as { tenantId: string; eventId: string; type: string };
      // Temporary visibility logging
      // eslint-disable-next-line no-console
      console.log('[Worker] Processing job', job.id, 'tenant', tenantId, 'event', eventId);
      const event = await dataSource.getRepository(EventRecord).findOne({
        where: { id: eventId },
      });
      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }
      const tenant = await dataSource.getRepository(Tenant).findOne({ where: { id: tenantId } });
      if (!tenant) throw new Error(`Tenant ${tenantId} not found`);

      const rules = await rulesService.getActiveRulesForEvent(tenantId, event.type);
      // eslint-disable-next-line no-console
      console.log('[Worker] Loaded rules', rules.length, 'for event type', event.type);
      for (const rule of rules) {
        const match = evaluateRule(rule, event.payload);
        if (match) {
          // eslint-disable-next-line no-console
          console.log('[Worker] Rule matched', rule.id, 'name', rule.name);
          await executeActions(rule, tenantId, { event, rule }, notificationsService, billingService);
        }
      }
    },
    { connection: redisConfig },
  );

  const queueEvents = new QueueEvents(queueName, { connection: redisConfig });
  await queueEvents.waitUntilReady();
  const dlqQueue = new Queue(dlqName, { connection: redisConfig });
  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    await dlqQueue.add(
      'failed-event',
      { jobId, failedReason },
      { removeOnComplete: true, attempts: 1 },
    );
  });

  // eslint-disable-next-line no-console
  console.log(`Worker listening on queue ${queueName}`);
  await worker.waitUntilReady();
}

function evaluateRule(rule: Rule, payload: Record<string, any>): boolean {
  const conditions = rule.definition?.conditions ?? {};
  if (conditions.equals) {
    const equals = conditions.equals as Record<string, any>;
    for (const [key, value] of Object.entries(equals)) {
      if (payload[key] !== value) return false;
    }
  }
  return true;
}

async function executeActions(
  rule: Rule,
  tenantId: string,
  context: { event: EventRecord; rule: Rule },
  notificationsService: NotificationsService,
  billingService: BillingService,
) {
  const actions = rule.definition?.actions ?? [];
  for (const action of actions) {
    if (action.type === 'notify') {
      await notificationsService.sendForRule(tenantId, action.channel, {
        subject: action.subject ?? `Rule ${rule.name} triggered`,
        message: action.template ?? JSON.stringify(context.event.payload),
        destination: action.destination ?? '',
        context,
      });
      await billingService.incrementNotifications(tenantId);
    }
  }
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Worker bootstrap failed', err);
  process.exit(1);
});

