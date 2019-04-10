<product-subscription-summary>
  <div class="row mb-2">
    <div class="col-2 pr-0">
      <img class="img-fluid img-thumbnail" if={ opts.line.product.images && opts.line.product.images[0] } src={ this.media.url(opts.line.product.images[0], 'sm-sq') } alt={ opts.line.product.title[this.language] }>
    </div>
    <div class="col-7 d-flex align-items-center">
      <div class="w-100">
        <b class="d-block mb-0 text-overflow">
          { opts.line.qty }x { opts.line.product.title[this.language] }
        </b>
        <p class="mb-0 text-overflow">
          { opts.line.product.short[this.language] }
        </p>
      </div>
    </div>
    <div class="col-3 d-flex align-items-center">
      <div class="w-100 text-right">
        <money amount={ (this.product.price(opts.line.product, opts.line.opts) * opts.line.qty) } /> { this.t(getOption().period) }
      </div>
    </div>
  </div>

  <script>
    // do media
    this.mixin('i18n');
    this.mixin('media');
    this.mixin('product');

    // set language
    this.language = this.i18n.lang();

    /**
     * returns price
     *
     * @return {Float}
     */
    getOption () {
      // check frontend
      if (!this.eden.frontend || !opts.line.opts.period) return opts.line.product.price;

      // get value
      return (opts.line.product.pricing).find((p) => p.period === opts.line.opts.period);
    }

    /**
     * on language update function
     */
    this.on('update', () => {
      // set language
      this.language = this.i18n.lang();
    });

  </script>
</product-subscription-summary>
