
// bind dependencies
const uuid       = require('uuid');
const Grid       = require('grid');
const config     = require('config');
const formatter  = require('currency-formatter');
const Controller = require('controller');

// require models
const Payment      = model('payment');
const Invoice      = model('invoice');
const Subscription = model('subscription');

// get helpers
const productHelper = helper('product');

/**
 * build product controller
 *
 * @mount /subscription
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
    this.building = this.build();
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // BUILD METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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
    productHelper.register('subscription', {
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

      // return true
      return true;
    }, async (product, line, order) => {
      // get user
      const user    = await order.get('user');
      const invoice = await order.get('invoice');

      // loop quantity
      for (let i = 0; i < parseInt(line.qty, 10); i += 1) {
        // get opts
        const subscription = await Subscription.findOne({
          lid        : i,
          uuid       : line.uuid,
          'order.id' : order.get('_id').toString(),
        }) || await Subscription.findOne({
          lid         : i,
          'order.id'  : order.get('_id').toString(),
          'line.uuid' : line.uuid,
        }) || new Subscription({
          lid  : i,
          uuid : line.uuid,
          line,
          user,
          order,
          product,
        });

        // lock subscription
        await subscription.lock();

        // try/catch
        try {
          // set paypal
          subscription.set('uuid', line.uuid);
          subscription.set('state', 'active');
          subscription.set('started_at', new Date());

          // set price
          subscription.set('user', await subscription.get('user') || user);
          subscription.set('price', parseFloat(line.price));
          subscription.set('period', line.opts.period);
          subscription.set('invoice', invoice);
          subscription.set('payment', await Payment.where({
            'invoice.id' : invoice.get('_id').toString(),
          }).nin('complete', [null, false]).findOne());

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
        } catch (e) {}

        // unlock
        subscription.unlock();

        // do emittion
        this.eden.emit('subscription.started', subscription);
      }
    });
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // NORMAL METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * index action
   *
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @acl   true
   * @fail  next
   * @route {GET} /
   *
   * @return {*}
   */
  async indexAction(req, res) {
    // render subscription page
    res.render('subscription', {
      grid : await (await this._grid(req)).render(req),
    });
  }

  /**
   * user grid action
   *
   * @param  {Request}  req
   * @param  {Response} res
   *
   * @route {post} /grid
   */
  gridAction(req, res) {
    // return post grid request
    return this._grid(req).post(req, res);
  }

  /**
   * delete action
   *
   * @param  {Request}  req
   * @param  {Response} res
   * @param  {Function} next
   *
   * @title Cancel Subscription
   * @route {get} /:id/remove
   */
  async removeAction(req, res, next) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // return next
    if (subscription.get('user.id') !== req.user.get('_id').toString()) return next();

    // render page
    return res.render('subscription/remove', {
      title        : `Remove ${subscription.get('_id').toString()}`,
      subscription : await subscription.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param  {Request}  req
   * @param  {Response} res
   * @param  {Function} next
   *
   * @route  {post} /:id/remove
   * @title  Cancel Subscription
   */
  async removeSubmitAction(req, res, next) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // return next
    if (subscription.get('user.id') !== req.user.get('_id').toString()) return next();

    // delete website
    subscription.set('state', 'requested');
    subscription.set('request_at', new Date());

    // save
    await subscription.save();

    // emit cancel requested
    this.eden.emit('subscription.requested', subscription);

    // alert Removed
    req.alert('success', `Successfully Requested Cancellation of ${subscription.get('_id').toString()}`);

    // render index
    return res.redirect('/subscription');
  }


  // ////////////////////////////////////////////////////////////////////////////
  //
  // PRIVATE METHODS
  //
  // ////////////////////////////////////////////////////////////////////////////

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
    const invoice = await payment.get('invoice') || new Invoice();
    const orders  = await invoice.get('orders') || [];

    // get lines
    const lines    = invoice.get('lines') || [];
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

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const subscriptionGrid = new Grid();

    // set route
    subscriptionGrid.route('/subscription/grid');

    // set grid model
    subscriptionGrid.model(Subscription);

    // add grid columns
    subscriptionGrid.column('_id', {
      title  : 'ID',
      format : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
    })
      .column('product', {
        sort   : true,
        title  : 'Product',
        format : async (col) => {
          // return product
          return col ? `<a href="/product/${col.get('slug')}">${col.get(`title.${req.language}`)}</a>` : '<i>N/A</i>';
        },
      })
      .column('price', {
        sort   : true,
        title  : 'Price',
        format : async (col, row) => {
          // get currency
          const order   = await row.get('order');
          const invoice = await order.get('invoice');

          // return invoice total
          return col && invoice ? `${formatter.format(col, {
            code : invoice.get('currency') || config.get('shop.currency') || 'USD',
          })} ${order.get('currency') || config.get('shop.currency') || 'USD'}` : '<i>N/A</i>';
        },
      })
      .column('created_at', {
        sort   : true,
        title  : 'Created',
        format : async (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('started_at', {
        sort   : true,
        title  : 'Started',
        format : async (col) => {
          // return invoice total
          return col ? col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          }) : '<i>N/A</i>';
        },
      })
      .column('due', {
        sort   : true,
        title  : 'Due',
        format : async (col) => {
          // return invoice total
          return col ? col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          }) : '<i>N/A</i>';
        },
      })
      .column('state', {
        sort   : true,
        title  : 'State',
        format : async (col) => {
          // pending
          // eslint-disable-next-line no-nested-ternary
          return `<span class="btn btn-sm btn-${col === 'cancelled' ? 'danger' : (col === 'requested' ? 'warning' : 'success')}">${req.t(`subscription:state.${col || 'pending'}`)}</span>`;
        },
      })
      .column('actions', {
        type   : false,
        width  : '1%',
        title  : 'Actions',
        format : async (col, row) => {
          return row.get('state') === 'active' ? [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/subscription/${row.get('_id').toString()}/remove" class="btn btn-danger">Remove</a>`,
            '</div>',
          ].join('') : '';
        },
      });

    // by user
    subscriptionGrid.where({
      'user.id' : req.user.get('_id').toString(),
    });
    subscriptionGrid.nin('state', [null, 'pending']);

    // set default sort subscription
    subscriptionGrid.sort('created_at', -1);

    // return grid
    return subscriptionGrid;
  }
}

/**
 * export Product Controller
 *
 * @type {SubscriptionController}
 */
module.exports = SubscriptionController;
