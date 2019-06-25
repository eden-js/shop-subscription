
/**
 * Created by Awesome on 2/6/2016.
 */

// use strict


// import local dependencies
const eden  = require('eden');
const Model = require('model');

/**
 * create address class
 */
class Subscription extends Model {
  /**
   * construct item model
   *
   * @param attrs
   * @param options
   */
  constructor() {
    // run super
    super(...arguments);

    // bind methods
    this.sanitise = this.sanitise.bind(this);
  }

  /**
   * add indexes
   *
   * @return {Promise}
   */
  static async initialize() {
    // create index
    await this.createIndex('started', {
      started : -1,
    });

    // create index
    await this.createIndex('due', {
      due : -1,
    });

    // create index
    await this.createIndex('oderID', {
      'order.id' : 1,
    });

    // create index
    await this.createIndex('userID', {
      'user.id' : 1,
    });

    // create index
    await this.createIndex('createdAt', {
      created_at : -1,
    });

    // create index
    await this.createIndex('updatedAt', {
      updated_at : -1,
    });
  }

  /**
   * sanitises bot
   *
   * @return {Object}
   */
  async sanitise(sensitive) {
    // sanitise
    const sanitised = {
      id      : this.get('_id') ? this.get('_id').toString() : null,
      is      : 'subscription',
      due     : this.get('due'),
      state   : this.get('state'),
      order   : sensitive && await this.get('order') ? await (await this.get('order')).sanitise() : null,
      product : await this.get('product') ? await (await this.get('product')).sanitise() : null,
      started : this.get('started'),
    };

    // return sanitised bot
    await eden.hook('subscription.sanitise', {
      sanitised,
      Subscription : this,
    });

    // return sanitised
    return sanitised;
  }
}

/**
 * export Subscription class
 *
 * @type {Subscription}
 */
exports = module.exports = Subscription;
