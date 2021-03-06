
// require dependencies
const Events = require('events');

// require local stores
const productStore = require('product/public/js/product');

/**
 * build bootstrap class
 */
class SubscriptionStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor(...args) {
    // set observable
    super(...args);

    // build
    this.build = this.build.bind(this);

    // build cart store
    this.build();
  }

  /**
   * build cart
   */
  build() {
    // register variable product
    productStore.product('subscription', {

    }, (product, opts) => {
      // let price
      const price = Object.values(product.pricing || {});

      // return price
      if (!opts.period) return product.price.amount;

      // get type
      const type = price.find(p => p.period === opts.period);

      // return price
      return parseFloat(type.price);
    }, () => {

    });
  }
}

/**
 * export new bootstrap function
 *
 * @return {price}
 */
module.exports = new SubscriptionStore();
