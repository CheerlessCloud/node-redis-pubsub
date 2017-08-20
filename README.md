[![Greenkeeper badge](https://badges.greenkeeper.io/CheerlessCloud/redis-pubsub.svg)](https://greenkeeper.io/)
[![dependencies Status](https://david-dm.org/CheerlessCloud/redis-pubsub/status.svg)](https://david-dm.org/CheerlessCloud/redis-pubsub)
[![devDependencies Status](https://david-dm.org/CheerlessCloud/redis-pubsub/dev-status.svg)](https://david-dm.org/CheerlessCloud/redis-pubsub?type=dev)

[![npm](https://img.shields.io/npm/v/redis-ps.svg)]()
[![node](https://img.shields.io/node/v/redis-ps.svg)]()
[![MIT License](https://img.shields.io/npm/l/redis-ps.svg)]()

[![Sponsor](https://app.codesponsor.io/embed/jkPpzosXxwDBBaBNpoqWKCXd/CheerlessCloud/node-redis-pubsub.svg)](https://app.codesponsor.io/link/jkPpzosXxwDBBaBNpoqWKCXd/CheerlessCloud/node-redis-pubsub)

[![NPM](https://nodei.co/npm/redis-ps.png)](https://nodei.co/npm/redis-ps/)

# RedisPS
Wrapper for easy communication between processes via Redis Pub/Sub.

***WIP*, don't use this in production for your own safety!**

### Install
```shell
npm install redis-ps
```
```shell
yarn add redis-ps
```

### Create instance
You can connect to socket:
```javascript
new RedisPS('/tmp/redis.sock');
```
By [Redis DSN](http://www.iana.org/assignments/uri-schemes/prov/redis):
```javascript
new RedisPS('redis://:authpassword@127.0.0.1:6380/4');
```
Or by ordinary host and port:
```javascript
new Redis({
  port: 6379, // Redis port, default is 6379
  host: '127.0.0.1', // Redis host is '127.0.0.1'
  family: 4, // 4 (IPv4) or 6 (IPv6)
  password: 'auth',
  db: 0,
})
```

#### Listen messages
```javascript
// listen method return Listener instance
redisPS.listen('channel name', (err, payload, listener) => {
  // err - error or null
  // payload - message payload
  // listener - listener of this callback
  if (err) {
    // If the listener is no longer needed, you must manually call the listener.stop().
    listener.stop();
    console.error(err, listener);
  }

  console.log(payload);
});
```

#### Once

```javascript
// if you want to wait until message will receive, you can use 'once' method
(async () => {
  // once return Promise with payload, so you can "await" they
  const payload = await redisPS.once('channel name');
})();
```

#### Emit messages
```javascript
redisPS.emit('channel name', { payload });
```


### Roadmap
 - [x] Enable and use ESlint with Airbnb config
 - [x] Add tests with Ava
 - [ ] Add possibility to set error timeout in 'once' listener
 - [ ] Add option to allow only one callback in channel
 - [ ] Optimize listening with pSubscribe
 - [ ] Add Babel and use private fields in classes
