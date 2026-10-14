import { IsEnum } from 'class-validator';
import { MentorAvailabilityStatus } from '../mentorship-availability.model';

/** HU-6.4 (CA-NF 03): el body es { availabilityStatus: AVAILABLE | PAUSED | UNAVAILABLE }. */
export class UpdateAvailabilityDto {
  @IsEnum(MentorAvailabilityStatus)
  availabilityStatus!: MentorAvailabilityStatus;
}
