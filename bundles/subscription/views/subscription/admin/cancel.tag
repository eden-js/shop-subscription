<subscription-admin-cancel-page>
  <div class="page page-shop">

    <admin-header title="Remove Order">
      <yield to="right">
        <a href="/admin/subscription" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
        
      <form method="post" action="/admin/subscription/{ opts.subscription.id }/cancel">
        <div class="card">
          <div class="card-body">
            <p>
              Are you sure you want to cancel <b>{ opts.subscription.id }</b>?
            </p>
          </div>
          <div class="card-footer">
            <button type="submit" class="btn btn-primary">Submit</button>
          </div>
        </div>
      </form>
      
    </div>
  </div>
</subscription-admin-cancel-page>
