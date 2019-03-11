
// require daemon
const config = require('config');
const Daemon = require('daemon');

// require models
const Subscription = model('subscription');

/**
 * Stripe Daemon
 *
 * @cluster back
 * @cluster subscription
 *
 * @extends Daemon
 */
class SubscriptionDaemon extends Daemon {
  /**
   * construct stripe daemon
   */
  constructor() {
    // run super
    super(...arguments);

    // bind build method
    this.build = this.build.bind(this);
    this.checkSubscription = this.checkSubscription.bind(this);
    this.checkSubscriptions = this.checkSubscriptions.bind(this);

    // do building
    this.building = this.build();
  }

  /**
   * build subscription daemon
   */
  build() {
    // set interval
    this.interval = setInterval(this.checkSubscriptions, 60 * 60 * 1000);

    // subscriptions
    this.checkSubscriptions();

    // create endpoint
    this.eden.endpoint('subscription.update', async (id) => {
      // get subscription
      const subscription = await Subscription.findbyId(id);

      // check subscription
      this.checkSubscription(subscription);
    }, true);
  }

  /**
   * check subscriptions
   *
   * @return {Promise}
   */
  async checkSubscriptions() {
    // get subscriptions
    const subscriptions = await Subscription.find({
      state : 'active',
    });

    // each
    subscriptions.forEach(this.checkSubscription);
  }

  /**
   * checks subscription
   *
   * @return {Promise}
   */
  async checkSubscription(subscription) {
    // get payment
    const payment = await subscription.get('payment');

    // await check
    await this.eden.call(`subscription.${payment.get('method.type')}.update`, subscription, payment);

    // check active
    if (subscription.get('state') !== 'active') {
      // emit
      this.eden.emit('subscription.cancelled', subscription.get('_id').toString());
    }
  }
}

/**
 * export stripe daemon
 *
 * @type {*}
 */
exports = module.exports = SubscriptionDaemon;
