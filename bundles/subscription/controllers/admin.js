
// Bind dependencies
const alert       = require('alert');
const crypto      = require('crypto');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// Require models
const Block    = model('block');
const Product  = model('product');
const Category = model('category');

// Bind local dependencies
const config = require('config');

// Get helpers
const BlockHelper   = helper('cms/block');
const ProductHelper = helper('product');

/**
 * Build user admin controller
 *
 * @acl   admin.product.view
 * @fail  /
 * @mount /admin/product
 */
class AdminSubscriptionController extends Controller {

  /**
   * Construct user admin controller
   */
  constructor () {
    // Run super
    super();

    // Bind build methods
    this.build = this.build.bind(this);
    

    // Build
    this.build();
  }

  /**
   * Builds admin category
   */
  build () {
    // On simple product sanitise
    this.eden.pre('product.sanitise', (data) => {
      // Check product type
      if (data.product.get('type') !== 'subscription') return;

      // Set price
      data.sanitised.price     = parseFloat(data.product.get('pricing.price')) || 0.00;
      data.sanitised.available = (parseInt(data.product.get('availability.quantity')) || 0) > 0;
    });

    // Pre pricing submit
    this.eden.pre('product.pricing', (data) => {
      // Check type
      if (data.type !== 'subscription') return;

      // Set pricing
      data.pricing.price = parseFloat(data.pricing.price);
    });

    // Pre pricing submit
    this.eden.pre('product.submit', (req, product) => {
      // Check type
      if (product.get('type') !== 'subscription') return;

    });

    // Pre pricing submit
    this.eden.pre('product.availability', (data) => {
      // Check type
      if (data.type !== 'subscription') return;

      // Set pricing
      data.availability.quantity = parseInt(data.availability.quantity);
    });

    // Register product types
    ProductHelper.register('subscription');
  }
}

/**
 * Export admin controller
 *
 * @type {AdminSubscriptionController}
 */
exports = module.exports = AdminSubscriptionController;
