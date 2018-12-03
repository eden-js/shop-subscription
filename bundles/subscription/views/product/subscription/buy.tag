<product-subscription-buy>
  <div class="product-subscription-buy">
    <div class="card">
      <div class="card-body pb-0">
        <div class="row">
          <div class="col-6">
            <div class="form-group">
              <label for="period">
                Select Period
              </label>
              <select name="period" class="form-control" onchange={ onChange }>
                <option each={ option, i in opts.product.pricing } value={ option.period } no-reorder>
                  { this.t(option.period) } - { format(parseFloat(option.price)) }
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div class="card-footer">
        <span class="btn-group float-right">
          <a href="#!" if={ this.cart.line(opts.product, { 'period' : this.period }) } onclick={ onRemove } class="btn btn-danger">
            <i class="fa fa-times" />
          </a>
          <a href="#!" onclick={ onAdd } class={ 'btn btn-success' : true, 'disabled' : !opts.product.price.available }>
            <money amount={ price() } /> { this.t('cart.add') }
          </a>
        </span>
        <span class="float-right btn btn-link" if={ this.cart.line(opts.product, { 'period' : this.period }) }>
          <span>{ this.cart.line(opts.product, { 'period' : this.period }).qty }</span>
        </span>
      </div>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');
    this.mixin('cart');
    this.mixin('settings');

    /**
     * returns price
     *
     * @return {Float}
     */
    price () {
      // check frontend
      if (!this.eden.frontend || !this.period) return opts.product.price.amount;

      // get value
      return parseFloat((opts.product.pricing).find((p) => p.period === this.period).price);
    }

    /**
     * on add function
     *
     * @param  {Event} e
     */
    onAdd (e) {
      // prevent default
      e.preventDefault();

      // get product
      this.cart.add(opts.product, {
        'period' : this.period
      });
    }

    /**
     * on remove function
     *
     * @param  {Event} e
     */
    onRemove (e) {
      // prevent default
      e.preventDefault();

      // get product
      this.cart.remove(this.cart.line(opts.product, {
        'period' : this.period
      }));
    }

    /**
     * update view
     *
     * @param  {Event} e
     */
    onChange (e) {
      // update view
      this.period = jQuery(e.target.value);

      // update view
      this.update();
    }

    /**
     * formats currency
     *
     * @return {String}
     */
    format (amount) {
      // require currency
      let currency = require('currency-formatter');

      // get value
      let value = opts.convert !== false ? (parseFloat(amount) * this.eden.get('rates')[opts.currency || this.settings.currency || 'USD']) : amount;

      // check value
      if (this.settings.currency === 'JPY') {
        // round to nearest 10
        value = Math.ceil(value / 10) * 10;
      } else {
        value = Math.ceil(value * 10) / 10;
      }

      // return formatted currency
      return this.eden.frontend ? currency.format(value, {
        'code' : opts.currency || this.settings.currency || 'USD'
      }) : value.toLocaleString();
    }
  </script>
</product-subscription-buy>
