import { fireEvent, render, screen } from '@testing-library/react';
import { CirclePauseIcon } from 'lucide-react';
import { ConfirmModal } from './confirm-modal';

it('coloca el foco, lo contiene, cierra con Escape y restaura el foco', () => {
  const trigger = document.createElement('button');
  document.body.appendChild(trigger);
  trigger.focus();
  const onCancel = jest.fn();
  const props = { open: true, icon: CirclePauseIcon, title: 'Confirmar', description: 'Descripción', confirmLabel: 'Aceptar', onCancel, onConfirm: jest.fn() };
  const { rerender, unmount } = render(<ConfirmModal {...props} />);
  const cancel = screen.getByRole('button', { name: 'Cancelar' });
  const confirm = screen.getByRole('button', { name: 'Aceptar' });
  expect(cancel).toHaveFocus();
  confirm.focus();
  fireEvent.keyDown(window, { key: 'Tab' });
  expect(screen.getByRole('button', { name: 'Cerrar' })).toHaveFocus();
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
  rerender(<ConfirmModal {...props} confirming />);
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(cancel).toBeDisabled();
  expect(confirm).toBeDisabled();
  unmount();
  expect(trigger).toHaveFocus();
  trigger.remove();
});
import '@testing-library/jest-dom';
