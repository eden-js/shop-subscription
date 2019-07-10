
// require daemon
const Daemon = require('daemon');

// require models
const Subscription = model('subscription');

// require helper
const subscriptionHelper = helper('subscription');

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
  constructor(...args) {
    // run super
    super(...args);

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
    // await check
    await subscriptionHelper.update(subscription);
  }
}

/**
 * export stripe daemon
 *
 * @type {*}
 */
module.exports = SubscriptionDaemon;
