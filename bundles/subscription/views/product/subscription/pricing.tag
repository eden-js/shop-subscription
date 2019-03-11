<product-subscription-pricing>
  <div class="card mb-3">
    <div class="card-header">
      Subscription Pricing
    </div>

    <div each={ option, i in this.options }>
      <div class={ 'card-body' : true, 'pt-0' : i > 0 }>
        <div class="row">
          <div class="col-6">
            <div class="form-group m-0">
              <label for="option-{ i }-price">Price</label>
              <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text">$</span>
              </div>
                <input type="number" name="pricing[{ i }][price]" step="0.01" class="form-control" id="option-{ i }-price" aria-describedby="pricing-price" placeholder="Enter price" value={ option.price }>
                <div class="input-group-append">
                  <span class="input-group-text">USD</span>
                </div>
              </div>
            </div>
          </div>
          <div class="col-4">
            <div class="form-group m-0">
              <label for="option-{ i }-period">Period</label>
              <select class="form-control" name="pricing[{ i }][period]" id="option-{ i }-period" value={ option.period }>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="biannually">Biannually</option>
                <option value="annually">Annually</option>
              </select>
            </div>
          </div>
          <div class="col-2">
            <label>&nbsp;</label>
            <button class="btn btn-block btn-danger" onclick={ onRemoveOption }>
              Remove Option
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="card-footer">
      <button class="btn btn-success" onclick={ onOption }>
        Add Pricing Option
      </button>
    </div>
  </div>

  <script>
    // set values
    this.options = Object.values(opts.product.pricing || []);

    /**
     * on option
     *
     * @param  {Event} e
     */
    onOption (e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // push options
      this.options.push({});

      // update view
      this.update();
    }

    /**
     * on option
     *
     * @param  {Event} e
     */
    onRemoveOption (e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();

      // push options
      this.options.splice(e.item.i, 1);

      // update view
      this.update();
    }

  </script>
</product-subscription-pricing>
