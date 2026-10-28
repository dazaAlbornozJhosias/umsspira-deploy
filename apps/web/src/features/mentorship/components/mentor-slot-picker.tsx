'use client';

import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { buildCalendarMonths, formatLongDate } from '../model/slot-calendar';
import type { MentorSlot, MentorSlotDay } from '../services/mentorship-request-api';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

interface Props {
  days: MentorSlotDay[];
  selectedDate: string;
  selectedSlot: MentorSlot | null;
  invalid: boolean;
  onSelectDate: (date: string) => void;
  onSelectSlot: (slot: MentorSlot) => void;
}

export function MentorSlotPicker({ days, selectedDate, selectedSlot, invalid, onSelectDate, onSelectSlot }: Props) {
  const months = useMemo(() => buildCalendarMonths(days), [days]);
  const [monthIndex, setMonthIndex] = useState(() => {
    const index = months.findIndex((month) => month.key === selectedDate.slice(0, 7));
    return Math.max(index, 0);
  });
  const month = months[monthIndex];
  const daySlots = days.find((entry) => entry.date === selectedDate)?.slots ?? [];

  if (!month) return <p className="mentor-request-empty">El mentor no tiene horarios publicados.</p>;

  return (
    <div className={`mentor-slot-picker${invalid ? ' is-invalid' : ''}`}>
      <div className="mentor-calendar-header">
        <button type="button" aria-label="Mes anterior" disabled={monthIndex === 0} onClick={() => setMonthIndex(monthIndex - 1)}>
          <ChevronLeftIcon aria-hidden="true" />
        </button>
        <strong aria-live="polite">{month.label}</strong>
        <button type="button" aria-label="Mes siguiente" disabled={monthIndex === months.length - 1} onClick={() => setMonthIndex(monthIndex + 1)}>
          <ChevronRightIcon aria-hidden="true" />
        </button>
      </div>
      <div className="mentor-calendar-grid" role="group" aria-label={`Calendario de ${month.label}`}>
        {WEEKDAYS.map((weekday) => <span key={weekday} className="mentor-calendar-weekday" aria-hidden="true">{weekday}</span>)}
        {Array.from({ length: month.leadingBlanks }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
        {month.cells.map((cell) => {
          const available = cell.slotCount > 0;
          const selected = cell.date === selectedDate;
          return (
            <button
              key={cell.date}
              type="button"
              disabled={!available}
              aria-pressed={selected}
              aria-label={`${formatLongDate(cell.date)}${available ? '' : ', sin horarios'}`}
              className={`mentor-calendar-day${selected ? ' is-selected' : ''}`}
              onClick={() => onSelectDate(cell.date)}
            >
              <span>{cell.day}</span>
              <small>{available ? `${cell.slotCount} ${cell.slotCount === 1 ? 'hora' : 'horas'}` : 'Sin horarios'}</small>
            </button>
          );
        })}
      </div>

      {selectedDate && (
        <div className="mentor-slot-list" role="group" aria-label={`Horarios para ${formatLongDate(selectedDate)}`}>
          <h3>Horarios del {formatLongDate(selectedDate)}</h3>
          <div>
            {daySlots.map((slot) => {
              const selected = selectedSlot?.startTime === slot.startTime;
              return (
                <button
                  key={slot.startTime}
                  type="button"
                  aria-pressed={selected}
                  className={`mentor-slot-button${selected ? ' is-selected' : ''}`}
                  onClick={() => onSelectSlot(slot)}
                >
                  {slot.startTime} – {slot.endTime}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
