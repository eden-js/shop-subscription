<subscription-admin-remove-page>
  <div class="page page-shop">

    <admin-header title="Remove Order">
      <yield to="right">
        <a href="/admin/shop/subscription" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
        
      <form method="post" action="/admin/shop/subscription/{ opts.subscription.id }/remove">
        <div class="card">
          <div class="card-body">
            <p>
              Are you sure you want to delete <b>{ opts.subscription.id }</b>?
            </p>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
      
    </div>
  </div>
</subscription-admin-remove-page>
