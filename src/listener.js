let maxId = 0;
/**
 * @function getNextId
 * @returns {number} - Next ID.
 */
// eslint-disable-next-line no-return-assign
const getNextId = () => ((maxId < 2147483648) ? (maxId += 1) : (maxId = 0));

const idS = Symbol('id');
const channelS = Symbol('channel');
const callbackS = Symbol('callback');
/**
 * @class Listener
 */
class Listener {
  /**
   * @class Listener
   * @param {string} channel - Listener channel.
   * @param {function(Error, any, Listener)} callback - Callback for sended message.
   * @param {Object} options - Options.
   * @param {function(Listener)} options.stop - Stop listening method.
   * @param {boolean=} [options.once=false] - Invoke only once try.
   */
  constructor(channel, callback, options) {
    this[idS] = getNextId();
    this[channelS] = channel;
    this.options = options;

    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function.');
    }

    this[callbackS] = callback;

    /**
     * @function stop
     * @description Stop and remove this listener
     */
    this.stop = () => options.stop(this);
  }

  /**
   * @readonly
   * @type {number}
   */
  get id() {
    return this[idS];
  }

  /**
   * @readonly
   * @type {string}
   */
  get channel() {
    return this[channelS];
  }

  /**
   * @function execute
   * @param {(string|Buffer)} message - Recieved message.
   */
  execute(message) {
    try {
      this[callbackS](null, JSON.parse(message.toString()), this);
    } catch (err) {
      this[callbackS](err, null, this);
    } finally {
      if (this.options.once) {
        this.stop();
      }
    }
  }
}

module.exports = Listener;
