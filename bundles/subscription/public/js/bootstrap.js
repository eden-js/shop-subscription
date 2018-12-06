
// require dependencies
const Events = require('events');

// require local stores
const ProductStore = require('product/public/js/product');

/**
 * build bootstrap class
 */
class SubscriptionStore extends Events {
  /**
   * construct bootstrap class
   */
  constructor () {
    // set observable
    super(...arguments);

    // build
    this.build = this.build.bind(this);

    // build cart store
    this.build();
  }

  /**
   * build cart
   */
  build () {

    // register variable product
    ProductStore.product('subscription', {

    }, (product, opts) => {
      // let price
      let price = Array.from(product.pricing);

      // return price
      if (!opts.period) return product.price.amount;

      // get type
      let type = price.find((p) => p.period === opts.period);

      // return price
      return parseFloat(type.price);
    }, (product, opts) => {

    });
  }
}

/**
 * export new bootstrap function
 *
 * @return {price}
 */
exports = module.exports = new SubscriptionStore();
