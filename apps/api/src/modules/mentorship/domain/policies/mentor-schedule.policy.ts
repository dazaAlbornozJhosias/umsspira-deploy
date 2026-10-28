import type { MentorBooking, MentorSchedule, MentorSlotDay } from '../entities/mentor';

export const MENTORSHIP_TIME_ZONE = 'America/La_Paz';
const SESSION_MINUTES = 60;

export interface UpcomingDay {
  date: string;
  weekday: number;
}

export interface UpcomingWindow {
  days: UpcomingDay[];
  currentTime: string;
}

const minutes = (time: string) => {
  const [hours, mins] = time.split(':').map(Number);
  return hours * 60 + mins;
};

const clock = (value: number) =>
  `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;

export function upcomingWindow(now: Date, length = 7, timeZone = MENTORSHIP_TIME_ZONE): UpcomingWindow {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  const start = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
  const days = Array.from({ length }, (_, offset) => {
    const day = new Date(start + offset * 86_400_000);
    return { date: day.toISOString().slice(0, 10), weekday: day.getUTCDay() || 7 };
  });
  return { days, currentTime: `${parts.hour}:${parts.minute}` };
}

export function buildUpcomingSlots(
  schedules: readonly MentorSchedule[],
  bookings: readonly MentorBooking[],
  window: UpcomingWindow,
): MentorSlotDay[] {
  return window.days.flatMap(({ date, weekday }, index) => {
    const starts = new Set<number>();
    for (const schedule of schedules) {
      if (schedule.weekday !== weekday) {
        continue;
      }
      const end = minutes(schedule.end);
      for (let start = minutes(schedule.start); start + SESSION_MINUTES <= end; start += SESSION_MINUTES) {
        starts.add(start);
      }
    }
    const now = minutes(window.currentTime);
    const taken = bookings.filter((booking) => booking.date === date);
    const times = [...starts]
      .sort((a, b) => a - b)
      .filter((start) => index > 0 || start > now)
      .filter(
        (start) =>
          !taken.some(
            (booking) =>
              minutes(booking.start) < start + SESSION_MINUTES && start < minutes(booking.end),
          ),
      )
      .map(clock);
    return times.length ? [{ date, weekday, times }] : [];
  });
}
