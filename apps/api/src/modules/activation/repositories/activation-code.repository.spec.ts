import type Redis from 'ioredis';
import { ActivationCodeRepository } from './activation-code.repository';

function redisWith(results: unknown) {
  const chain = {
    del: jest.fn().mockReturnThis(),
    hset: jest.fn().mockReturnThis(),
    expire: jest.fn().mockReturnThis(),
    exec: jest.fn().mockResolvedValue(results),
  };
  const redis = { multi: jest.fn().mockReturnValue(chain) } as unknown as Redis;
  return { chain, repo: new ActivationCodeRepository(redis) };
}

describe('ActivationCodeRepository', () => {
  it('reemplaza la clave de la solicitud en una sola transacción', async () => {
    const { chain, repo } = redisWith([[null, 1], [null, 2], [null, 1]]);

    await repo.save('solicitud-1', 'hash-abc', 86400);

    expect(chain.del).toHaveBeenCalledWith('activation:solicitud-1');
    expect(chain.hset).toHaveBeenCalledWith('activation:solicitud-1', {
      codeHash: 'hash-abc',
      attempts: 0,
    });
    expect(chain.expire).toHaveBeenCalledWith('activation:solicitud-1', 86400);
  });

  it('falla si Redis rechaza algún comando de la transacción', async () => {
    const { repo } = redisWith([[null, 1], [new Error('fallo'), null], [null, 1]]);
    await expect(repo.save('solicitud-1', 'hash-abc', 86400)).rejects.toThrow('Redis');
  });

  it('falla si la transacción se cancela', async () => {
    const { repo } = redisWith(null);
    await expect(repo.save('solicitud-1', 'hash-abc', 86400)).rejects.toThrow('Redis');
  });
});