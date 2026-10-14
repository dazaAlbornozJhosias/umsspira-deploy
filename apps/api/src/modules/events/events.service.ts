
import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import type {
  EventItem,
  EventStatus,
} from '@umsspira/shared-types';

import { supabase } from '../../shared/lib/supabase';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateDraftEventDto } from './dto/update-draft-event.dto';

const DRAFT_EVENT_STATUS: Extract<EventStatus, 'BORRADOR'> =
  'BORRADOR';

const PUBLISHED_EVENT_STATUS: Extract<EventStatus, 'PUBLICADO'> =
  'PUBLICADO';

type EventRow = {
  id: string;
  id_usuario: string;
  titulo: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  cupo_maximo: number;
  ubicacion: string | null;
  estado: string;
  fecha_creacion: string;
};

@Injectable()
export class EventsService {
  /**
   * T4
   * Crea un nuevo evento.
   */
  async createEvent(
    createEventDto: CreateEventDto,
    userId: string,
  ): Promise<EventItem> {
    const {
      title,
      description,
      startDate,
      endDate,
      maxCapacity,
      location,
      status,
    } = createEventDto;

    this.validateEventData(
      title,
      startDate,
      endDate,
      maxCapacity,
    );

    const initialStatus: EventStatus =
      status ?? DRAFT_EVENT_STATUS;

    const databaseStatus = initialStatus.toLowerCase();
    const createdAt = new Date().toISOString();

    const { data, error } = await supabase
      .from('evento')
      .insert([
        {
          id_usuario: userId,
          titulo: title,
          descripcion: description ?? null,
          fecha_inicio: startDate,
          fecha_fin: endDate,
          cupo_maximo: maxCapacity,
          ubicacion: location ?? null,
          estado: databaseStatus,
          fecha_creacion: createdAt,
        },
      ])
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error al guardar el evento: ${error.message}`,
      );
    }

    return this.mapEventRow(data);
  }

  async getAdminEvents(userId: string): Promise<EventItem[]> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('id_usuario', userId)
      .order('fecha_creacion', {
        ascending: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Error al consultar los eventos administrativos: ${error.message}`,
      );
    }

    return (data ?? []).map((row) => this.mapEventRow(row));
  }

  async getAdminDraft(
    eventId: string,
    userId: string,
  ): Promise<EventItem> {
    const event = await this.getOwnedEvent(eventId, userId);

    this.ensureDraft(event);

    return this.mapEventRow(event);
  }

  async updateAdminDraft(
    eventId: string,
    updateEventDto: UpdateDraftEventDto,
    userId: string,
  ): Promise<EventItem> {
    const currentEvent = await this.getOwnedEvent(eventId, userId);

    this.ensureDraft(currentEvent);

    const {
      title,
      description,
      startDate,
      endDate,
      maxCapacity,
      location,
    } = updateEventDto;

    this.validateEventData(
      title,
      startDate,
      endDate,
      maxCapacity,
    );

    const { data, error } = await supabase
      .from('evento')
      .update({
        titulo: title,
        descripcion: description ?? null,
        fecha_inicio: startDate,
        fecha_fin: endDate,
        cupo_maximo: maxCapacity,
        ubicacion: location ?? null,
        estado: DRAFT_EVENT_STATUS.toLowerCase(),
      })
      .eq('id', eventId)
      .eq('id_usuario', userId)
      .eq('estado', DRAFT_EVENT_STATUS.toLowerCase())
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error al actualizar el borrador: ${error.message}`,
      );
    }

    return this.mapEventRow(data);
  }

  async publishAdminDraft(
    eventId: string,
    userId: string,
  ): Promise<EventItem> {
    const currentEvent = await this.getOwnedEvent(eventId, userId);

    this.ensureDraft(currentEvent);

    this.validateEventData(
      currentEvent.titulo,
      currentEvent.fecha_inicio,
      currentEvent.fecha_fin,
      currentEvent.cupo_maximo,
    );

    const { data, error } = await supabase
      .from('evento')
      .update({
        estado: PUBLISHED_EVENT_STATUS.toLowerCase(),
      })
      .eq('id', eventId)
      .eq('id_usuario', userId)
      .eq('estado', DRAFT_EVENT_STATUS.toLowerCase())
      .select()
      .single();

    if (error) {
      throw new InternalServerErrorException(
        `Error al publicar el borrador: ${error.message}`,
      );
    }

    return this.mapEventRow(data);
  }

  /**
   * T7
   * Catálogo para el egresado.
   * Devuelve eventos publicados que todavía no han finalizado.
   */
  async getCatalog(): Promise<EventItem[]> {
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('estado', PUBLISHED_EVENT_STATUS.toLowerCase())
      .gt('fecha_fin', now)
      .order('fecha_inicio', {
        ascending: true,
      });

    if (error) {
      throw new InternalServerErrorException(
        `Error al consultar el catálogo de eventos: ${error.message}`,
      );
    }

    return (data ?? []).map((row) => this.mapEventRow(row));
  }

  async getEventById(eventId: string): Promise<EventItem> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('id', eventId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Error al consultar el evento: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(
        'No se encontró el evento solicitado',
      );
    }

    return this.mapEventRow(data);
  }

  private async getOwnedEvent(
    eventId: string,
    userId: string,
  ): Promise<EventRow> {
    const { data, error } = await supabase
      .from('evento')
      .select('*')
      .eq('id', eventId)
      .eq('id_usuario', userId)
      .maybeSingle();

    if (error) {
      throw new InternalServerErrorException(
        `Error al consultar el evento: ${error.message}`,
      );
    }

    if (!data) {
      throw new NotFoundException(
        'No se encontró el evento solicitado para el usuario autenticado',
      );
    }

    return data;
  }

  private ensureDraft(event: EventRow): void {
    if (event.estado.toUpperCase() !== DRAFT_EVENT_STATUS) {
      throw new ConflictException(
        'El evento ya no se encuentra en estado BORRADOR',
      );
    }
  }

  private validateEventData(
    title: string,
    startDate: string,
    endDate: string,
    maxCapacity: number,
  ): void {
    if (!title?.trim()) {
      throw new BadRequestException(
        'El título es obligatorio',
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (
      Number.isNaN(start.getTime()) ||
      Number.isNaN(end.getTime())
    ) {
      throw new BadRequestException(
        'Las fechas del evento deben ser válidas',
      );
    }

    if (end <= start) {
      throw new BadRequestException(
        'La fecha de finalización debe ser posterior a la fecha de inicio',
      );
    }

    if (
      !Number.isInteger(maxCapacity) ||
      maxCapacity <= 0
    ) {
      throw new BadRequestException(
        'El cupo máximo debe ser un número entero mayor a 0',
      );
    }
  }

  /**
   * Convierte una fila de la tabla evento
   * al modelo EventItem utilizado por la API.
   */
  private mapEventRow(row: EventRow): EventItem {
    return {
      id: row.id,
      title: row.titulo,
      description: row.descripcion ?? null,
      startDate: row.fecha_inicio,
      endDate: row.fecha_fin,
      maxCapacity: row.cupo_maximo,
      location: row.ubicacion ?? null,
      status: row.estado.toUpperCase() as EventStatus,
      createdBy: row.id_usuario,
      createdAt: row.fecha_creacion,
    };
  }
}