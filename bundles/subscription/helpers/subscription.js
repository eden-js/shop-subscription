
// require dependencies
const Helper = require('helper');

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
   * @param  {Subscription} subscription
   *
   * @return {*}
   */
  async cancel(subscription) {
    // get payment
    const payment = await subscription.get('payment');

    // await endpoint
    return await this.eden.call(`subscription.${payment.get('method.type')}.cancel`, subscription, payment);
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

    // await endpoint
    return await this.eden.call(`subscription.${payment.get('method.type')}.update`, subscription, payment);
  }
}

/**
 * export subscription helper
 *
 * @type {SubscriptionHelper}
 */
exports = module.exports = new SubscriptionHelper();
