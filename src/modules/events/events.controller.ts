import { Body, Controller, Headers, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { CreateEventDto } from './dto/create-event.dto';
import { EventsService } from './events.service';

@Controller('events')
@UseGuards(ApiKeyGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async ingest(
    @Body() body: CreateEventDto,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Req() req: Request & { tenant: any },
  ) {
    const tenant = req.tenant;
    const event = await this.eventsService.ingestEvent(body, tenant, idempotencyKey);
    return { id: event.id, status: 'enqueued' };
  }
}

