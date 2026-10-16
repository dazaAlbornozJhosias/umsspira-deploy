import { act, fireEvent, render, screen } from '@testing-library/react';

import { profileHeader } from '@/modules/profile/data/profile-data';
import { PROFILE_RECORDS_MOCK } from '@/modules/profile/data/profile-records-data';

import DownloadProfileButton from './download-profile-button';

describe('DownloadProfileButton', () => {
  const createObjectURL = jest.fn(() => 'blob:perfil');
  const revokeObjectURL = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 2));
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    createObjectURL.mockClear();
    revokeObjectURL.mockClear();
  });

  it('descarga el perfil en JSON con el nombre esperado', () => {
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      expect(this.download).toBe('perfil_carlos_mendoza_rios_2026-10-02.json');
      expect(this.href).toBe('blob:perfil');
    });

    render(<DownloadProfileButton header={profileHeader} records={PROFILE_RECORDS_MOCK} />);
    fireEvent.click(screen.getByRole('button', { name: 'Descargar' }));

    expect(click).toHaveBeenCalledTimes(1);
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:perfil');
  });

  it('bloquea los clics repetidos mientras descarga (HU5-03)', () => {
    jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    render(<DownloadProfileButton header={profileHeader} records={PROFILE_RECORDS_MOCK} />);
    const button = screen.getByRole('button', { name: 'Descargar' });

    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();

    act(() => {
      jest.advanceTimersByTime(1500);
    });
    expect(button).toBeEnabled();
  });

  it('se desactiva cuando el perfil no tiene bloques', () => {
    render(
      <DownloadProfileButton header={profileHeader} records={{ education: [], experience: [], certification: [] }} />,
    );

    expect(screen.getByRole('button', { name: 'Descargar' })).toBeDisabled();
  });
});
