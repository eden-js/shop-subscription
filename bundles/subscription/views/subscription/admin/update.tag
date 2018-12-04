<subscription-admin-update-page>
  <div class="page page-shop">

    <admin-header title="{ opts.subscription.id ? 'Update' : 'Create' } Order">
      <yield to="right">
        <a href="/admin/subscription" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
      <form method="post" action="/admin/subscription/{ opts.subscription.id ? opts.subscription.id + '/update' : 'create' }">
        <div class="row">
          <div class="col-md-7">
            <div class="card card-subscription mb-3">
              <div class="card-header">
                { this.t('subscription.title') }
              </div>
              <div class="card-body">
                <div class="row mb-2">
                  <div class="col-3">
                    <b>{ this.t('subscription.number') }</b>
                  </div>
                  <div class="col-9">
                    { opts.subscription.id }
                  </div>
                </div>
                <div class="row mb-2">
                  <div class="col-3">
                    <b>{ this.t('subscription.status') }</b>
                  </div>
                  <div class="col-9">
                    { opts.subscription.status || 'Pending' }
                  </div>
                </div>
              </div>
            </div>
            <virtual each={ action, i in this.subscription.actions }>
              <div data-is="{ action.type }-subscription" subscription={ this.subscription } action={ action } />
            </virtual>
            <button type="submit" class="btn btn-lg btn-success mt-3">
              { opts.subscription.id ? 'Update' : 'Create' } subscription
            </button>
          </div>
          <div class="col-md-5">
            <div class="card card-summary">
              <div class="card-header">
                { this.t('checkout.summary') }
              </div>
              <div class="card-body">
                <product-summary type="subscription" lines={ this.subscription.lines } actions={ this.subscription.actions } products={ this.subscription.products } />
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  </div>

  <script>
    // do mixins
    this.mixin('i18n');

  </script>
</subscription-admin-update-page>
