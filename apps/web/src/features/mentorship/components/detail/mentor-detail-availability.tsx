import { CalendarDaysIcon } from 'lucide-react';
import {
  availabilityBadgeConfig,
  type MentorDetailProfile,
} from '../../model/mentor-detail';

export function MentorDetailAvailability({ mentor }: { mentor: MentorDetailProfile }) {
  const isAvailable = mentor.availability === 'AVAILABLE';
  const badge = availabilityBadgeConfig(mentor.availability);
  const hasSlots = mentor.slots && mentor.slots.length > 0;

  return (
    <aside className="mentor-detail-card mentor-detail-availability-card" aria-labelledby="mentor-detail-avail-title">
      <div className="mentor-detail-avail-header">
        <h2 id="mentor-detail-avail-title" className="mentor-detail-card-title">
          <CalendarDaysIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Disponibilidad
        </h2>
        <span className={`mentor-detail-badge ${badge.className}`}>
          <span className="mentor-detail-badge-dot" aria-hidden="true" />
          {badge.label}
        </span>
      </div>

      {isAvailable ? (
        <div className="mentor-detail-avail-body">
          <div className="mentor-detail-avail-subheading">
            <h3 className="mentor-detail-avail-title">Horarios disponibles</h3>
            {mentor.weekLabel && <p className="mentor-detail-avail-subtitle">{mentor.weekLabel}</p>}
          </div>

          {hasSlots ? (
            <div className="mentor-detail-slots-list" role="region" aria-label="Horarios disponibles por día">
              {mentor.slots.map((day) => (
                <div key={day.date} className="mentor-detail-slot-day">
                  <h4 className="mentor-detail-slot-day-label">{day.dayLabel}</h4>
                  <ul className="mentor-detail-slot-chips" aria-label={`Horas para ${day.dayLabel}`}>
                    {day.times.map((time) => (
                      <li key={time} className="mentor-detail-slot-chip">
                        {time}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="mentor-detail-card-text mentor-detail-empty-text">
              Este mentor no tiene horarios libres en los próximos 7 días.
            </p>
          )}

          {/* Solo se invita a elegir horario cuando hay horas libres (CA-FE-05) */}
          {hasSlots && (
            <footer className="mentor-detail-avail-footer">
              <p className="mentor-detail-avail-hint">
                Elegirás fecha y horario al solicitar la mentoría.
              </p>
            </footer>
          )}
        </div>
      ) : (
        <div className="mentor-detail-avail-blocked">
          <p className="mentor-detail-avail-blocked-message">
            No hay horarios seleccionables mientras el mentor no reciba solicitudes.
          </p>
        </div>
      )}
    </aside>
  );
}
