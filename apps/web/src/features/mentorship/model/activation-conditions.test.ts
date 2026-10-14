import { getActivationEligibility } from './activation-conditions';

describe('activación de mentor', () => {
  it.each([
    [true, 1, true],
    [false, 0, false],
  ])('titulado=%s', (egresado, metCount, eligible) => {
    expect(getActivationEligibility({ egresado })).toMatchObject({ total: 1, metCount, eligible });
  });
});
