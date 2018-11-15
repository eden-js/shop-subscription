
// bind dependencies
const config     = require('config');
const Controller = require('controller');

// require models
const Product = model('product');

// get helpers
const productHelper = helper('product');

/**
 * build product controller
 */
class SubscriptionController extends Controller {
  /**
   * construct user SubscriptionController controller
   */
  constructor () {
    // run super
    super();

    // bind build methods
    this.build = this.build.bind(this);

    // bind private methods
    this._pricing      = this._pricing.bind(this);
    this._availability = this._availability.bind(this);

    // build product helper
    this.build();
  }

  /**
   * order individual item
   */
  async build () {
    // price hooks
    this.eden.pre('line.price', this._subscriptionPrice);

    // await variable pricing
    this.eden.pre('product.subscription.pricing',      this._pricing);
    this.eden.pre('product.subscription.availability', this._availability);

    // pre pricing submit
    this.eden.pre('product.submit', (req, product) => {
      // check type
      if (product.get('type') !== 'subscription') return;

      // set pricing
      product.set('subscription', req.body.subscription || {});
    });

    // on simple product sanitise
    this.eden.pre('product.sanitise', (data) => {
      // check product type
      if (data.product.get('type') !== 'subscription') return;

      // set price
      data.sanitised.price        = parseFloat(data.product.get('pricing.price')) || 0.00;
      data.sanitised.available    = (parseInt(data.product.get('availability.quantity')) || 0) > 0;
      data.sanitised.subscription = data.product.get('subscription') || {};
    });

    // register product types
    productHelper.register('subscription');

  }

  /**
   * hook product information
   *
   * @param  {Object}  data
   *
   * @return {Promise}
   */
  async _pricing (data) {
    // return on error
    if (data.error) return;

    // set price
    data.price = parseFloat(data.product.get('pricing.price'));
  }

  /**
   * hook product information
   *
   * @param  {Object}  data
   *
   * @return {Promise}
   */
  async _availability (data) {
    // return on error
    if (data.error) return;

    // check available
    if (data.qty > data.product.get('availability.quantity')) data.error = {
      'id'   : 'availability.notavailable',
      'text' : 'Not enough quantity available'
    };
  }

  /**
   * alter variation price
   *
   * @param  {Object} opts
   *
   * @return {*}
   */
  async _subscriptionPrice (opts) {
    // check product type
    if (opts.item.product.get('type') !== 'subscription') return;

    // set price
    let price = parseFloat(opts.item.product.get('pricing.price'));

    // set price
    opts.base  = price;
    opts.price = price * opts.item.qty;
  }
}

/**
 * export Product Controller
 *
 * @type {SubscriptionController}
 */
exports = module.exports = SubscriptionController;
