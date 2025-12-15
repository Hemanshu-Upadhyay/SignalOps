export default () => ({
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  database: {
    url: process.env.DATABASE_URL,
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
    user: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'signalops',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change-me',
    jwtTtlSeconds: parseInt(process.env.JWT_TTL_SECONDS || '3600', 10),
  },
  queues: {
    eventQueueName: process.env.EVENT_QUEUE_NAME || 'events',
    deadLetterQueueName: process.env.DLQ_NAME || 'events-dlq',
  },
});

