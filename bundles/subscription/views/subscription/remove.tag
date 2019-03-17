<subscription-remove-page>
  <div class="container">
      
    <form method="post" action="/subscription/{ opts.subscription.id }/remove">
      <div class="card">
        <div class="card-body">
          <p>
            Are you sure you want to unsubscribe from <b>{ (opts.subscription.product || {}).title[this.i18n.lang()] }</b>?
          </p>
        </div>
        <div class="card-footer text-right">
          <a class="btn btn-success mr-2" href="/subscription">Back</a>
          <button type="submit" class="btn btn-danger">Confirm</button>
        </div>
      </div>
    </form>
    
  </div>
  
  <script>
    // do mixins
    this.mixin('i18n');
    
  </script>
</subscription-remove-page>
