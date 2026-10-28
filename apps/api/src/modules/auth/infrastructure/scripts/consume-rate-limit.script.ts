export const CONSUME_RATE_LIMIT_SCRIPT = `
local attempts = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if attempts == 1 or ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {attempts, ttl}
`;
