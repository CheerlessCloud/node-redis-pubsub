const Listener = require('./listener');
const Promise = require('bluebird');
const loggerErr = require('debug')('redisPubSub:error');

/**
 * @typedef {object} RedisConnection
 * @method publish
 * @method subscribe
 * @method on
 */

/**
 * @class PubSub
 */
class PubSub{
  /**
   * @constructor ChannelsMap
   * @param {object} options
   * @param {function.<RedisConnection>=} options.createConnection
   * @param {string=} options.dsn
   * @param {string=} options.socket
   * @param {string=} [options.host='127.0.0.1']
   * @param {number=} [options.port=6379]
   * @param {string=} options.password
   * @param {number=} [options.db=0]
   * @param {string=} [options.redisModuleName='ioredis']
   */
  constructor(options){
    this._channels = new Map();

    if(options.createConnection){
      if(typeof options.createConnection !== 'function'){
        throw new Error('createConnection parameter must be function.');
      }

      this._createConnection = options.createConnection;
    }else{
      const Redis = require(options.redisModuleName || 'ioredis');

      this._createConnection = function(){
        let connection;
        if(options.dsn){
          connection = new Redis(options.dsn);
        }else if(options.socket){
          connection = new Redis(options.socket);
        }else{
          connection = new Redis({
            host     : options.host || '127.0.0.1',
            port     : options.port || 6379,
            password : options.password,
            db       : options.db || 0,
          });
        }

        connection.on('error', loggerErr);

        return connection;
      };
    }

    this._redisSub = this._createConnection();
    this._redisPub = this._createConnection();

    this._redisSub.on('message', (channel, message) => {
      const listeners = this._channels.get(channel);

      if(!listeners || listeners.length === 0){
        return;
      }

      for(const listener of listeners){
        listener.execute(message);
      }
    });
  }

  /**
   * Count of channels
   * @type {number}
   */
  get count(){
    return this._channels.count();
  }

  /**
   * @method listen
   * @param {string} channel - target channel
   * @param {function.<Error, (object|Buffer)>} callback
   * @param {object=} options
   * @param {boolean=} options.once
   * @return {Listener}
   */
  listen(channel, callback, options){
    const listener = new Listener(
      channel,
      callback,
      Object.assign(
        {},
        options,
        {stop : this.stop.bind(this)}
      ));

    if(this._channels.has(channel)){
      this._channels.get(channel).push(listener);
    }else{
      this._channels.set(channel, [ listener ]);
    }
    this._redisSub.subscribe(channel);
    return listener;
  }

  /**
   * @method once
   * @param {string} channel
   * @return {Promise.<object>}
   */
  once(channel){
    return new Promise((resolve, reject) =>
      this.listen(channel, (err, message) =>
        !err ? resolve(message) : reject(err)),
        {once : true}
      );
  }

  /**
   * @method stop
   * @param {(Listener|object)} listener
   * @param {string} listener.channel
   * @param {number} listener.id
   * @return {undefined}
   */
  stop(listener){
    const channel = this._channels.get(listener.channel);
    if(!channel){
      return;
    }

    if(channel.length === 1){
      this._channels.delete(listener.channel);
    }

    for(let i = 0; i < channel.length; i++){
      if(channel[i].id === listener.id){
        channel.splice(i, 1);
        break;
      }
    }
  }

  /**
   * @method emit
   * @param {string} channel
   * @param {object} message
   */
  emit(channel, message){
    this._redisPub.publish(channel, JSON.stringify(message));
  }
}

module.exports = PubSub;
