<product-subscription-price>
  { this.t('from') } <span itemprop="price" content={ (this.price.amount || 0).toFixed(2) }><money amount={ this.price.amount } /></span><span itemprop="priceCurrency" content="USD" />
  <link itemprop="availability" href="http://schema.org/InStock" if={ this.price.available } />

  <script>
    // do mixins
    this.mixin('i18n');

    // set default price
    this.price = opts.product.price;

  </script>
</product-subscription-price>
