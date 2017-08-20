/* eslint no-new: "off", no-param-reassign: "off" */
const test = require('ava');
const IORedis = require('ioredis');
const RedisPS = require('./../src/index');

test.beforeEach((t) => {
  t.context = {
    redisPS: new RedisPS({
      dsn: 'redis://127.0.0.1:6379/4',
      logger: t.log,
    }),
  };
});

test.cb('RedisPS - Emit and listen', (t) => {
  const { redisPS } = t.context;
  t.is(redisPS.channelsCount, 0);

  redisPS.listen('cname', (err, payload, listener) => {
    if (err) {
      t.end(err);
    }

    t.deepEqual(payload, { success: true });

    t.is(redisPS.channelsCount, 1);

    listener.stop();
    t.end();
  });

  t.is(redisPS.channelsCount, 1);

  redisPS.emit('cname', { success: true });
});

test('RedisPS - Listen once', async (t) => {
  const { redisPS } = t.context;
  t.is(redisPS.channelsCount, 0);

  redisPS.once('channelname')
    .then((payload) => {
      t.deepEqual(payload, { success: true });
      t.is(redisPS.channelsCount, 0);
    })
    .catch(err => t.end(err));

  t.is(redisPS.channelsCount, 1);
  redisPS.emit('channelname', { success: true });
});

test.cb('RedisPS - Two listeners on one channel', (t) => {
  t.plan(6);
  const { redisPS } = t.context;
  t.is(redisPS.channelsCount, 0);

  const callback = (err, payload) => {
    if (err) {
      t.end(err);
    }

    t.deepEqual(payload, { success: true });
    t.true(true);
  };

  redisPS.listen('chname', callback);
  redisPS.listen('chname', callback);

  t.deepEqual(redisPS.count, { channels: 1, callbacks: 2 });

  redisPS.emit('chname', { success: true });

  setTimeout(() => t.end(), 1000);
});

test('RedisPS - Invalid payload', async (t) => {
  const { redisPS } = t.context;
  t.is(redisPS.channelsCount, 0);

  redisPS.once('invalid-payload')
    .catch(err => t.throws(() => { throw err; }, SyntaxError));

  new IORedis('redis://127.0.0.1:6379/4')
    .publish('invalid-payload', '{ json invalid }');
});
