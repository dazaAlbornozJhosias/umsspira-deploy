'use client';

import { Button } from '@/shared/components/button';
import { useExitRegistration } from '../hooks/use-exit-registration';
import { ExitRegistrationDialog } from './exit-registration-dialog';

interface ExitRegistrationButtonProps {
  label?: string;
}

export function ExitRegistrationButton({ label = 'Salir del registro' }: ExitRegistrationButtonProps) {
  const { isDialogOpen, requestExit, confirmExit, cancelExit } = useExitRegistration();

  return (
    <>
      <Button type="button" variant="secondary" onClick={requestExit}>
        {label}
      </Button>
      <ExitRegistrationDialog isOpen={isDialogOpen} onConfirm={confirmExit} onCancel={cancelExit} />
    </>
  );
}
