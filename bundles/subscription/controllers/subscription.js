
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

    // build product helper
    this.build();
  }

  /**
   * order individual item
   */
  async build () {
    // price hooks
    this.eden.pre('payment.pay', this._pay);

    // pre pricing submit
    this.eden.pre('product.submit', (req, product) => {
      // check type
      if (product.get('type') !== 'subscription') return;

      // set pricing
      product.set('subscription', req.body.subscription || {});
    });

    // register product types
    productHelper.product('subscription', {

    }, async (product, opts) => {
      // get prices
      let prices = Array.from(product.get('pricing'));

      // loop prices
      let price = prices.reduce((smallest, price) => {
        // return if price smaller
        if (price.price < smallest.price) return price;

        // return smallest
        return smallest;
      }, {
        'price' : Infinity
      });

      // check period in opts
      if (opts && opts.period) {
        // set price
        price = prices.find((p) => p.period === opts.period);
      }

      // return price
      return {
        'amount'    : parseFloat(price.price),
        'period'    : price.period,
        'currency'  : 'USD',
        'available' : true
      };
    }, async (product, opts) => {

    });
  }

  /**
   * pay invoice
   *
   * @param  {product} Payment
   *
   * @return {Promise}
   */
  async _pay (payment) {
    // check method
    if (payment.get('error')) return;

    // load user
    let invoice = await payment.get('invoice');
    let order   = await invoice.get('order');

    // get lines
    let lines    = order.get('lines');
    let products = await order.get('products');

    // check lines
    let subscriptionLines = lines.filter((line) => {
      // get product
      let product = products.find((p) => p.get('_id').toString() === line.product);

      // check product
      return product.get('type') === 'subscription';
    });

    // check line
    if (!subscriptionLines || !subscriptionLines.length) return;

    // setup logic
    await Promise.all(subscriptionLines.map(async (line) => {
      // get product
      let product = products.find((p) => p.get('_id').toString() === line.product);
      let prices  = Array.from(product.get('pricing'));

      // loop prices
      let price = prices.reduce((smallest, price) => {
        // return if price smaller
        if (price.price < smallest.price) return price;

        // return smallest
        return smallest;
      }, {
        'price' : Infinity
      });

      // check period in opts
      if (line.opts && line.opts.period) {
        // set price
        price = prices.find((p) => p.period === line.opts.period);
      }

      // loop quantity
      for (let i = 0; i < parseInt(line.qty); i++) {
        // create new subscription
        let subscription = await Subscription.findOne({
          'lid'        : i,
          'period'     : line.opts.period || price.period,
          'user.id'    : (await order.get('user')).get('_id').toString(),
          'order.id'   : order,
          'product.id' : product
        }) || new Subscription({
          'lid'     : i,
          'line'    : line,
          'user'    : await order.get('user'),
          'price'   : price.amount,
          'order'   : order,
          'period'  : line.opts.period || price.period,
          'product' : product,
          'payment' : payment,
          'invoice' : invoice
        });

        // save subscription
        await subscription.save();

        // add to subscriptions
        subscriptions.push(subscription);
      }
    }));

    // save subscriptions to order
    order.set('subscriptions', subscriptions);

    // save order
    await order.save();
  }
}

/**
 * export Product Controller
 *
 * @type {SubscriptionController}
 */
exports = module.exports = SubscriptionController;
