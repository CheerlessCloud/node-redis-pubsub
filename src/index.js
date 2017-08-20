const Listener = require('./listener');
const Promise = require('bluebird');
const Redis = require('ioredis');

/**
 * @typedef {object} RedisConnection
 * @method publish
 * @method subscribe
 * @method on
 */

const channels = Symbol('channels');
const connectionFabric = Symbol('connectionFabric');
const redisSub = Symbol('redisSub');
const redisPub = Symbol('redisPub');

/**
 * @class PubSub
 */
class PubSub {
  /**
   * @class PubSub
   * @param {Object} options - Options.
   * @param {function.<RedisConnection>=} options.connectionFabric
   * - Function to instantiate custom redis client.
   * @param {string=} options.dsn - DSN string  of Redis server.
   * @param {string=} options.socket - Socket address  of Redis server.
   * @param {string=} [options.host='127.0.0.1'] - Host of Redis server.
   * @param {number=} [options.port=6379] - Port of Redis server.
   * @param {string=} options.password - Password  of Redis server.
   * @param {number=} [options.db=0] - Database index.
   * @param {function(err)} [options.logger] 
   * - Logger callback (this invoke with errors from ioredis client).
   */
  constructor(options) {
    this[channels] = new Map();

    if (options.connectionFabric) {
      if (typeof options.connectionFabric !== 'function') {
        throw new TypeError('options.connectionFabric must be function.');
      }

      this[connectionFabric] = options.connectionFabric;
    } else {
      this[connectionFabric] = () => {
        let connection;
        if (options.dsn) {
          connection = new Redis(options.dsn);
        } else if (options.socket) {
          connection = new Redis(options.socket);
        } else {
          connection = new Redis(options);
        }

        connection.on('error', options.logger);

        return connection;
      };
    }

    this[redisSub] = this[connectionFabric]();
    this[redisPub] = this[connectionFabric]();

    this[redisSub].on('message', (channel, message) => {
      const listeners = this[channels].get(channel);

      listeners.forEach((listener) => {
        listener.execute(message);
      });
    });
  }

  /**
   * @description Count of channels
   * @type {number}
   */
  get count() {
    return this[channels].count;
  }

  /**
   * @function listen
   * @param {string} channel - Target channel.
   * @param {function(Error, (object|Buffer), Listener)} callback - Callback.
   * @param {object=} options - Options for listener.
   * @param {boolean=} options.once - Invoke listener once a time and destroy.
   * @returns {Listener} - Return Listener object.
   */
  listen(channel, callback, options) {
    const listener = new Listener(
      channel,
      callback,
      Object.assign({}, options, { stop: this.stop.bind(this) }));

    if (this[channels].has(channel)) {
      this[channels].get(channel).push(listener);
    } else {
      this[channels].set(channel, [listener]);
      this[redisSub].subscribe(channel);
    }

    return listener;
  }

  /**
   * @function once
   * @param {string} channel - Channel for subscribe.
   * @returns {Promise.<object>} - Promise who resolved with message.
   */
  once(channel) {
    return new Promise((resolve, reject) => {
      const callback = (err, message) => (!err ? resolve(message) : reject(err));
      this.listen(channel, callback, { once: true });
    });
  }

  /**
   * @function stop
   * @param {(Listener|object)} listener - Listener object.
   * @param {string} listener.channel - Channel name.
   * @param {number} listener.id - Listener ID.
   */
  stop(listener) {
    const listeners = this[channels].get(listener.channel);

    if (listeners.length === 1) {
      this[channels].delete(listener.channel);
      this[redisSub].unsubscribe(listener.channel);
    }

    listeners.forEach((item, i) => {
      if (item.id === listener.id) {
        listeners.splice(i, 1);
      }
    });
  }

  /**
   * @function emit
   * @param {string} channel - Channel name for emmiting message.
   * @param {Object} message - Message payload.
   */
  emit(channel, message) {
    this[redisPub].publish(channel, JSON.stringify(message));
  }
}

module.exports = PubSub;
