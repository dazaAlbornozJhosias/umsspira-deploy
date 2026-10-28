import { BriefcaseIcon, CompassIcon, FileTextIcon, InfoIcon, LayersIcon } from 'lucide-react';
import type { MentorDetailProfile } from '../../model/mentor-detail';

const EMPTY_INFO_PLACEHOLDER = 'El mentor todavía no agregó esta información.';

export function MentorDetailInfo({ mentor }: { mentor: MentorDetailProfile }) {
  const hasAbout = Boolean(mentor.about && mentor.about.trim());
  const hasExperience = Boolean(mentor.experience && mentor.experience.trim());
  const hasRelevantInfo = Boolean(mentor.relevantInfo && mentor.relevantInfo.trim());
  const hasTechnicalAreas = mentor.technicalAreas.length > 0;
  const hasInterests = mentor.interests.length > 0 && mentor.interests.some((g) => g.items.length > 0);

  return (
    <div className="mentor-detail-info-column">
      {/* 1. Sobre el mentor */}
      <section className="mentor-detail-card" aria-labelledby="mentor-detail-about-title">
        <h2 id="mentor-detail-about-title" className="mentor-detail-card-title">
          <FileTextIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Sobre el mentor
        </h2>
        {hasAbout ? (
          <p className="mentor-detail-card-text">{mentor.about}</p>
        ) : (
          <p className="mentor-detail-card-text mentor-detail-empty-text">
            {EMPTY_INFO_PLACEHOLDER}
          </p>
        )}
      </section>

      {/* 2. Experiencia profesional */}
      <section className="mentor-detail-card" aria-labelledby="mentor-detail-exp-title">
        <h2 id="mentor-detail-exp-title" className="mentor-detail-card-title">
          <BriefcaseIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Experiencia profesional
        </h2>
        {hasExperience ? (
          <p className="mentor-detail-card-text">{mentor.experience}</p>
        ) : (
          <p className="mentor-detail-card-text mentor-detail-empty-text">
            {EMPTY_INFO_PLACEHOLDER}
          </p>
        )}
      </section>

      {/* 3. Información relevante (CA-NF-15) */}
      <section className="mentor-detail-card" aria-labelledby="mentor-detail-relevant-title">
        <h2 id="mentor-detail-relevant-title" className="mentor-detail-card-title">
          <InfoIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Información relevante
        </h2>
        {hasRelevantInfo ? (
          <p className="mentor-detail-card-text">{mentor.relevantInfo}</p>
        ) : (
          <p className="mentor-detail-card-text mentor-detail-empty-text">
            {EMPTY_INFO_PLACEHOLDER}
          </p>
        )}
      </section>

      {/* 4. Áreas técnicas */}
      <section className="mentor-detail-card" aria-labelledby="mentor-detail-areas-title">
        <h2 id="mentor-detail-areas-title" className="mentor-detail-card-title">
          <LayersIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Áreas técnicas
        </h2>
        {hasTechnicalAreas ? (
          <ul className="mentor-detail-pills" aria-label="Lista de áreas técnicas">
            {mentor.technicalAreas.map((area) => (
              <li key={area} className="mentor-detail-pill">
                {area}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mentor-detail-card-text mentor-detail-empty-text">
            Sin áreas técnicas registradas
          </p>
        )}
      </section>

      {/* 5. Intereses de mentoría agrupados por área */}
      <section className="mentor-detail-card" aria-labelledby="mentor-detail-interests-title">
        <h2 id="mentor-detail-interests-title" className="mentor-detail-card-title">
          <CompassIcon className="mentor-detail-card-icon icon" aria-hidden="true" />
          Intereses de mentoría
        </h2>
        {hasInterests ? (
          <div className="mentor-detail-interest-groups">
            {mentor.interests.map((group) => {
              if (group.items.length === 0) return null;
              return (
                <div key={group.area} className="mentor-detail-interest-group">
                  <h3 className="mentor-detail-interest-group-title">{group.area}</h3>
                  <ul className="mentor-detail-pills" aria-label={`Intereses en ${group.area}`}>
                    {group.items.map((item) => (
                      <li key={item} className="mentor-detail-pill mentor-detail-pill-subtle">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="mentor-detail-card-text mentor-detail-empty-text">
            Sin temas de interés registrados
          </p>
        )}
      </section>
    </div>
  );
}
