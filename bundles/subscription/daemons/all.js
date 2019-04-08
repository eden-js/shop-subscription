
// require dependencies
const Daemon = require('daemon');

// require models
const Subscription = model('subscription');

// require helpers
const subscriptionHelper = helper('subscription');

/**
 * build example dameon class
 */
class SubscriptionAllDaemon extends Daemon {
  /**
   * construct rentlar daemon class
   */
  constructor() {
    // run super eden
    super();

    // bind methods
    this.build = this.build.bind(this);
    this.sendSubscriptions = this.sendSubscriptions.bind(this);

    // run build method
    this.building = this.build();
  }

  /**
   * builds rentlar slack daemon
   */
  async build() {
    // updated subscription
    const updatedSubscription = async (subscription) => {
      // get user
      const user = await subscription.get('user');

      // check user
      if (!user) return;

      // lock user
      await user.lock();

      // try catch
      try {
        // get subs
        const subs = await subscriptionHelper.active(user);

        // get actives
        const actives = (await Promise.all(subs.map(async (active) => {
          // get product
          const product = await active.get('product');

          // check product
          if (product) return product.get('sku');
        }))).filter(sku => sku);

        // set subscriptions
        user.set('subscription', {
          subs : actives,
        });
        user.set('subscription.subscriptions', subs);

        // save user
        await user.save();
      } catch (e) {}

      // unlock
      user.unlock();
    };

    // build sale daemon
    this.eden.pre('shop.stats.send', this.sendSubscriptions);

    // post updated
    this.eden.post('subscription.create', updatedSubscription);
    this.eden.post('subscription.update', updatedSubscription);
  }

  /**
   * sends subscription stats
   *
   * @param  {Object} stats
   *
   * @return {*}
   */
  async sendSubscriptions(stats) {
    // set today
    const week  = new Date((new Date()).getTime() - (7 * 24 * 60 * 60 * 1000));
    const today = new Date((new Date()).getTime() - (24 * 60 * 60 * 1000));
    const month = new Date();

    // remove one month
    month.setMonth(month.getMonth() - 1);

    // add stats
    stats.activeSubscriptions = {
      title : 'Active Subscriptions',
      money : {
        Today : await Subscription.where({
          state : 'active',
        }).gte('started_at', today).gt('price', 0).sum('price'),
        'This Week' : await Subscription.where({
          state : 'active',
        }).gte('started_at', week).gt('price', 0).sum('price'),
        'This Month' : await Subscription.where({
          state : 'active',
        }).gte('started_at', month).gt('price', 0).sum('price'),
        'All Time' : await Subscription.where({
          state : 'active',
        }).gt('price', 0).sum('price'),
      },
      count : {
        Today : await Subscription.where({
          state : 'active',
        }).gte('started_at', today).count(),
        'This Week' : await Subscription.where({
          state : 'active',
        }).gte('started_at', week).count(),
        'This Month' : await Subscription.where({
          state : 'active',
        }).gte('started_at', month).count(),
        'All Time' : await Subscription.where({
          state : 'active',
        }).count(),
      },
    };

    // add stats
    stats.cancelledSubscriptions = {
      title : 'Cancelled Subscriptions',
      money : {
        Today : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', today).gt('price', 0).sum('price'),
        'This Week' : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', week).gt('price', 0).sum('price'),
        'This Month' : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', month).gt('price', 0).sum('price'),
      },
      count : {
        Today : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', today).count(),
        'This Week' : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', week).count(),
        'This Month' : await Subscription.where({
          state : 'cancelled',
        }).gte('started_at', month).count(),
      },
    };
  }
}

/**
 * export slack daemon class
 *
 * @type {SubscriptionAllDaemon}
 */
module.exports = SubscriptionAllDaemon;
