import { render, screen } from '@testing-library/react';
import MentorProfileInfoRoute from './page';

jest.mock('@/features/mentorship/components/mentor-profile-info-page', () => ({
  MentorProfileInfoPage: () => <div data-testid="mentor-profile-info-page">Perfil de mentor info</div>,
}));

describe('MentorProfileInfoRoute (Routing Next.js /mentorship/profile/information)', () => {
  it('renderiza correctamente el componente principal de información del perfil del mentor', () => {
    render(<MentorProfileInfoRoute />);
    expect(screen.getByTestId('mentor-profile-info-page')).toBeInTheDocument();
  });
});
