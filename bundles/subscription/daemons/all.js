
// require dependencies
const Daemon = require('daemon');

// require models
const Subscription = model('subscription');

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
    // build sale daemon
    this.eden.pre('shop.stats.send', this.sendSubscriptions);
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
