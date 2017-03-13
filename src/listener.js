/**
 * @module listener
 */

let maxId = 0;
/**
 * @method getNextId
 * @return {number}
 */
function getNextId(){
  return(maxId += 1);
}

/**
 * @class Listener
 */
module.exports = class Listener{
	/**
	 * @constructor Listener
	 * @param {string} channel - listener channel
	 * @param {function} callback - callback for sending message
	 * @param {object} options
	 * @param {function} options.stop
	 * @param {boolean=} [options.once=false]
	 */
	constructor(channel, callback, options){
		this._id = getNextId();
		this._channel = channel;
    this._options = options;

		if(!callback || typeof callback !== 'function'){
			throw new TypeError('Callback must be a function.');
		}
		this._callback = callback;

    /**
  	 * @method stop
  	 * @description Stop and remove this listener
     * @return {undefined}
  	 */
    this.stop = () => options.stop(this);
	}

	/**
	 * Listener Id
	 * @type {number}
	 */
	get id(){
		return this._id;
	}

	/**
	 * Listener channel
	 * @type {string}
	 */
	get channel(){
		return this._channel;
	}

  /**
   * @method execute
   * @param {(string|Buffer)} message
   * @return {undefined}
   */
  execute(message){
    try{
      this._callback(null, JSON.parse(message.toString()));
    }catch(err){
      this._callback(err);
    }finally{
      if(this._options.once){
        this.stop();
      }
    }
  }
};
