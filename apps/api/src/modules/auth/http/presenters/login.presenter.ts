import type { IssuedSession } from '../../application/contracts/issued-session';
import { presentUser } from '../../../user/http/presenters/user.presenter';

export function presentLogin(result: IssuedSession) {
  return {
    data: {
      accessToken: result.accessToken,
      role: result.actor.role,
      expiresIn: result.expiresIn,
      user: presentUser(result.actor),
    },
  };
}
