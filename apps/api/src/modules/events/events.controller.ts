import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';

@Controller('api/events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  @Post()
  async createEvent(
    @Body() createEventDto: CreateEventDto,
    @Headers('x-user-id') userId: string,
  ) {
    this.requireUserId(userId);

    return this.eventsService.createEvent(
      createEventDto,
      userId,
    );
  }

  @Get('catalog')
  async getCatalog() {
    return this.eventsService.getCatalog();
  }

  @Get('admin')
  async getAdminEvents(
    @Headers('x-user-id') userId: string,
  ) {
    this.requireUserId(userId);

    return this.eventsService.getAdminEvents(userId);
  }

  @Get('admin/:id')
  async getAdminDraft(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
  ) {
    this.requireUserId(userId);

    return this.eventsService.getAdminDraft(
      eventId,
      userId,
    );
  }

  @Get(':id')
  async getEventById(
    @Param('id') eventId: string,
  ) {
    return this.eventsService.getEventById(eventId);
  }

  @Patch('admin/:id')
  async updateAdminDraft(
    @Param('id') eventId: string,
    @Body() updateEventDto: UpdateDraftEventDto,
    @Headers('x-user-id') userId: string,
  ) {
    this.requireUserId(userId);

    return this.eventsService.updateAdminDraft(
      eventId,
      updateEventDto,
      userId,
    );
  }

  @Patch('admin/:id/publish')
  async publishAdminDraft(
    @Param('id') eventId: string,
    @Headers('x-user-id') userId: string,
  ) {
    this.requireUserId(userId);

    return this.eventsService.publishAdminDraft(
      eventId,
      userId,
    );
  }

  private requireUserId(userId: string): void {
    if (!userId) {
      throw new BadRequestException(
        'Se requiere el identificador del usuario creador',
      );
    }
  }
}
