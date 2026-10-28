import { render, screen } from '@testing-library/react';

import { SurveyConfidentialNotice } from './survey-confidential-notice';

describe('SurveyConfidentialNotice', () => {
  it('muestra el texto exacto de la nota de confidencialidad', () => {
    render(<SurveyConfidentialNotice />);
    expect(
      screen.getByText('Esta información es confidencial y sólo se usará con fines estadísticos'),
    ).toBeTruthy();
  });

  it('muestra el título «Información confidencial»', () => {
    render(<SurveyConfidentialNotice />);
    expect(screen.getByRole('complementary', { name: 'Información confidencial' })).toBeTruthy();
  });
});
