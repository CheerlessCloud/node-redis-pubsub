/* eslint no-new: "off" */
const test = require('ava');
const IORedis = require('ioredis');
const RedisPS = require('./../src/index');

test.cb('RedisPS - Connect by DSN', (t) => {
  new RedisPS({
    dsn: 'redis://127.0.0.1:6379/4',
    logger: t.end,
  });

  setTimeout(() => t.end(), 1000);
});

test.cb('RedisPS - Connect by host and port', (t) => {
  new RedisPS({
    host: '127.0.0.1',
    port: 6379,
    logger: t.end,
  });

  setTimeout(() => t.end(), 1000);
});

test.cb('RedisPS - Custom redis client', (t) => {
  t.plan(2);

  new RedisPS({
    connectionFabric: () => {
      t.true(true);
      return new IORedis(6379, '127.0.0.1');
    },
    logger: t.end,
  });

  setTimeout(() => t.end(), 500);
});

test('RedisPS - connectionFabric invalid value', (t) => {
  t.throws(() => new RedisPS({ connectionFabric: 'invalid value' }), TypeError);
});
