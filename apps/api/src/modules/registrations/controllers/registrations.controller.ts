import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseFilters, UsePipes, ValidationPipe } from '@nestjs/common';
import { RegistrationsService } from '../services/registrations.service';
import {
  CreateRegistrationDataDto,
  SubmitRegistrationDto,
} from '../contracts/dto';
import { validationExceptionFactory } from '../contracts/validation-exception.factory';
import { RegistrationsExceptionFilter } from './registrations-exception.filter';

@Controller('registrations')
@UseFilters(RegistrationsExceptionFilter)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: validationExceptionFactory,
  }),
)
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get('careers')
  async getCareers() {
    const careers = await this.registrationsService.listCareers();
    return { data: careers };
  }

  @Post('sessions')
  async createSession(@Body() dto: CreateRegistrationDataDto) {
    const result = await this.registrationsService.createRegistrationSession(dto);
    return { data: result };
  }

  @Get('sessions/:token')
  async getSession(@Param('token', new ParseUUIDPipe({ errorHttpStatusCode: 410 })) token: string) {
    const result = await this.registrationsService.getRegistrationSession(token);
    return { data: result };
  }

  @Post('submit')
  async submitRegistration(@Body() dto: SubmitRegistrationDto) {
    const result = await this.registrationsService.submitRegistration(dto);
    return { data: result };
  }
}
