
// require dependencies
const Helper = require('helper');

// require models
const Payment      = model('payment');
const Subscription = model('subscription');

/**
 * create subscription helper
 *
 * @extends Helper
 */
class SubscriptionHelper extends Helper {
  /**
   * run subscription helper
   */
  constructor() {
    // run super
    super(...arguments);
  }

  /**
   * cancels subscription
   *
   * @param  {User} user
   *
   * @return {*}
   */
  async active(user) {
    // get payment
    return await Subscription.where({
      state     : 'active',
      'user.id' : user.get('_id').toString(),
    }).find();
  }

  /**
   * cancels subscription
   *
   * @param  {Subscription} subscription
   *
   * @return {*}
   */
  async cancel(subscription) {
    // get payment
    const payment = await subscription.get('payment') || await Payment.where({
      'invoice.id' : subscription.get('invoice.id'),
    }).ne('complete', null).findOne();

    // no payment
    if (!payment) return;

    // await endpoint
    const rtn = await this.eden.call(`subscription.${payment.get('method.type')}.cancel`, subscription, payment);

    // emit cancelled
    if (subscription.get('state') === 'cancelled') {
      // emit
      this.eden.emit('subscription.cancelled', subscription);
    }

    // return
    return rtn;
  }

  /**
   * cancels subscription
   *
   * @param  {Subscription} subscription
   *
   * @return {*}
   */
  async update(subscription) {
    // get payment
    const payment = await subscription.get('payment');

    // no payment
    if (!payment) return;

    // await endpoint
    const rtn = await this.eden.call(`subscription.${payment.get('method.type')}.update`, subscription, payment);

    // emit cancelled
    if (subscription.get('state') === 'cancelled') {
      // emit
      this.eden.emit('subscription.cancelled', subscription);
    }

    // return
    return rtn;
  }
}

/**
 * export subscription helper
 *
 * @type {SubscriptionHelper}
 */
exports = module.exports = new SubscriptionHelper();
