
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
    
  }
}

/**
 * Export admin controller
 *
 * @type {AdminSubscriptionController}
 */
exports = module.exports = AdminSubscriptionController;
