<subscription-admin-page>
  <div class="page page-shop">

    <admin-header title="Manage Subscriptions">
      <yield to="right">
        <a href="/admin/shop" class="btn btn-lg btn-primary">
          Back
        </a>
      </yield>
    </admin-header>
    
    <div class="container-fluid">
      
      <grid grid={ opts.grid } table-class="table table-striped table-bordered" title="Subscriptions Grid" />
      
    </div>
  </div>
</subscription-admin-page>
