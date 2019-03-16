
// bind dependencies
const uuid       = require('uuid');
const config     = require('config');
const Controller = require('controller');

// require models
const Subscription = model('subscription');

// get helpers
const ProductHelper = helper('product');

/**
 * build product controller
 */
class SubscriptionController extends Controller {
  /**
   * construct user SubscriptionController controller
   */
  constructor() {
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
  async build() {
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
    ProductHelper.register('subscription', {
      options  : ['availability'],
      sections : ['subscription-pricing', 'display'],
    }, async (product, opts) => {
      // get price
      const price = this._price(product, opts);

      // return price
      return {
        amount    : parseFloat(price.price),
        period    : price.period,
        currency  : config.get('shop.currency') || 'USD',
        available : true,
      };
    }, async (product, line, req) => {
      // get price
      const price = this._price(product, line.opts);

      // check if only single
      if (product.get('subscription.isSingle')) {
        // check if user has subscription
        if (req.lines.find((l) => {
          // return if found
          return l.product === product.get('_id').toString();
        })) {
          // do alert
          req.alert('error', `You can only have one ${product.get(`title.${req.language}`)} at once!`);

          // return false
          return false;
        } if (await Subscription.findOne({
          state        : 'active',
          'user.id'    : req.user.get('_id').toString(),
          'product.id' : product.get('_id').toString(),
        })) {
          // do alert
          req.alert('error', 'You already have this subscription!');

          // return false
          return false;
        }
      }
    }, async (product, line, order) => {
      // get user
      const user = await order.get('user');

      // get price
      const price = this._price(product, line.opts);

      // get opts
      const subscription = await Subscription.findOne({
        uuid : line.opts.uuid,
      }) || new Subscription({
        line,
        user,
        order,
        product,
        price  : price.price,
        period : line.opts.period || price.period,
      });

      // set paypal
      subscription.set('state', 'active');
      subscription.set('started', new Date());

      // set now
      const due = new Date();

      // check interval
      if (subscription.get('period') === 'weekly') {
        // set now
        due.setTime((new Date()).getTime() + (7 * 24 * 60 * 60 * 1000));
      } else if (subscription.get('period') === 'monthly') {
        // set due to one week ahead
        due.setMonth(due.getMonth() + 1);
      } else if (subscription.get('period') === 'quarterly') {
        // set due to one week ahead
        due.setMonth(due.getMonth() + 3);
      } else if (subscription.get('period') === 'biannually') {
        // set due to one week ahead
        due.setMonth(due.getMonth() + 6);
      } else if (subscription.get('period') === 'annually') {
        // set due to one week ahead
        due.setMonth(due.getMonth() + 12);
      }

      // set due
      subscription.set('due', due);

      // save subscription
      await subscription.save();
    });
  }

  /**
   * gets product price
   *
   * @param  {Product} product
   * @param  {Object}  opts
   *
   * @return {*}
   */
  _price(product, opts) {
    // get prices
    const prices = Array.from(product.get('pricing') || []);

    // loop prices
    let price = prices.filter(p => p.price).reduce((smallest, p) => {
      // return if price smaller
      if (p.price < smallest.price) return p;

      // return smallest
      return smallest;
    }, {
      price : Infinity,
    });

    // check period in opts
    if (opts && opts.period) {
      // set price
      price = prices.find(p => p.period === opts.period);
    }

    // return price
    return price;
  }

  /**
   * pay invoice
   *
   * @param  {product} Payment
   *
   * @return {Promise}
   */
  async _pay(payment) {
    // check method
    if (payment.get('error')) return;

    // load user
    const invoice = await payment.get('invoice');
    const orders  = await invoice.get('orders');

    // get lines
    const lines    = invoice.get('lines');
    const products = [].concat(...(await Promise.all(orders.map(order => order.get('products')))));

    // check lines
    const subscriptionLines = lines.filter((line) => {
      // get product
      const product = products.find(p => p.get('_id').toString() === line.product);

      // check product
      return product.get('type') === 'subscription';
    });

    // check line
    if (!subscriptionLines || !subscriptionLines.length) return;

    // create subscriptions array
    const subscriptions = [];

    // setup logic
    await Promise.all(subscriptionLines.map(async (line) => {
      // get product
      const product = products.find(p => p.get('_id').toString() === line.product);
      const prices  = Array.from(product.get('pricing'));

      // loop prices
      let price = prices.reduce((smallest, p) => {
        // return if price smaller
        if (p.price < smallest.price) return p;

        // return smallest
        return smallest;
      }, {
        price : Infinity,
      });

      // check period in opts
      if (line.opts && line.opts.period) {
        // set price
        price = prices.find(p => p.period === line.opts.period);
      } else {
        // set period price
        line.opts = {
          period : price.period,
        };
      }

      // set opts
      line.opts.uuid = uuid();

      // loop quantity
      for (let i = 0; i < parseInt(line.qty, 10); i += 1) {
        // get order
        const order = orders.find(o => o.get('_id').toString() === line.order);

        // create new subscription
        const subscription = await Subscription.findOne({
          lid          : i,
          period       : line.opts.period || price.period,
          'user.id'    : order.get('user.id'),
          'order.id'   : order.get('_id').toString(),
          'product.id' : product.get('_id').toString(),
        }) || new Subscription({
          lid    : i,
          user   : await order.get('user'),
          price  : price.price,
          period : line.opts.period || price.period,
          line,
          order,
          product,
          payment,
          invoice,
        });

        // set details
        subscription.set('uuid', line.opts.uuid);
        subscription.set('payment', payment);
        subscription.set('invoice', invoice);

        // save subscription
        await subscription.save();

        // set order subscriptions
        if (!subscriptions[line.order]) subscriptions[line.order] = [];

        // add to subscriptions
        subscriptions[line.order].push(subscription);
      }
    }));

    // save subscriptions to order
    await Promise.all(orders.map(async (order) => {
      // set subscriptions
      order.set('subscriptions', subscriptions[order.get('_id').toString()]);

      // save order
      await order.save();
    }));
  }
}

/**
 * export Product Controller
 *
 * @type {SubscriptionController}
 */
exports = module.exports = SubscriptionController;
