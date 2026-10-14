'use client';

import { useState } from 'react';
import { CirclePauseIcon } from 'lucide-react';
import { ConfirmModal } from '@/shared/components/confirm-modal';
import { useMentorParticipation } from '../hooks/use-mentor-participation';
import { ActivePanel } from './active-panel';
import { InactivePanel } from './inactive-panel';
import { SecondaryButton } from './mentor-button';
import { MentorSavedAreas } from './mentor-saved-areas';

export function MentorProfile() {
  const { profile, loading, saving, error, changeParticipation, retry } = useMentorParticipation();
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  return <>
    {loading && <p role="status">Cargando participación…</p>}
    {error && !confirmDeactivate && <div role="alert" className="mentor-api-error">
      <p>{error}</p>
      {!profile && !loading && <SecondaryButton onClick={retry}>Reintentar</SecondaryButton>}
    </div>}
    {profile?.isActive ? (
      <ActivePanel requirements={profile.requirements} onDeactivate={() => setConfirmDeactivate(true)} />
    ) : (
      <InactivePanel requirements={profile?.requirements ?? null} activating={saving} onActivate={() => { void changeParticipation(true); }} />
    )}
    {profile && !loading && <MentorSavedAreas />}
    <ConfirmModal
      open={confirmDeactivate}
      icon={CirclePauseIcon}
      title="Desactivar participación como mentor"
      description="¿Deseas desactivar tu participación como mentor?"
      confirmLabel="Desactivar participación"
      confirming={saving}
      onCancel={() => setConfirmDeactivate(false)}
      onConfirm={() => {
        void changeParticipation(false).then(success => {
          if (success) setConfirmDeactivate(false);
        });
      }}
    >
      {error && <p role="alert">{error}</p>}
    </ConfirmModal>
  </>;
}
