const IORedis = require('ioredis');

/**
 * Redis wrapper to use Promises instead of callbacks
 */
class Redis {
  constructor () {
    this.redis = new IORedis();
  }

  /**
   * Gets a key from Redis
   * @param {string} key The key to fetch
   * @return {Promise<string|Null>} The data, or null
   */
  get (key) {
    return new Promise((res, rej) => {
      this.redis.get(key, (err, data) => {
        if (err) {
          return rej(err);
        }
        res(data);
      });
    });
  }

  /**
   * Saves a value in Redis
   * @param {string} key The key
   * @param {Function} fetch Function to fetch data if not found
   * @param {int} ttl The Time To Live
   * @return {Promise<string>} The fetched data
   */
  getOrFetch (key, fetch, ttl = 300) {
    return new Promise(async (res, rej) => {
      try {
        const data = await this.get(key);
        if (null === data) {
          const data = await fetch();
          this.set(key, data, ttl);
          res(data);
        }
      } catch (e) {
        rej(e);
      }
    });
  }

  /**
   * Saves a value in Redis
   * @param {string} key The key
   * @param {string} value The value
   * @param {int} ttl The Time To Live
   */
  set (key, value, ttl = 300) {
    this.redis.set(key, data, 'EX', ttl);
  }

  /**
   * Deletes a key from Redis
   * @param {string} key The key
   */
  del (key) {
    this.redis.del(key);
  }
}

module.exports = Redis;
