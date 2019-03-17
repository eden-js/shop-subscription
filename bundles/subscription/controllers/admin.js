
// bind dependencies
const Grid        = require('grid');
const formatter   = require('currency-formatter');
const Controller  = require('controller');
const escapeRegex = require('escape-string-regexp');

// require models
const Acl          = model('acl');
const User         = model('user');
const Block        = model('block');
const Subscription = model('subscription');

// bind local dependencies
const config = require('config');

// require helpers
const blockHelper        = helper('cms/block');
const subscriptionHelper = helper('subscription');

/**
 * build user admin controller
 *
 * @acl   admin.subscription.view
 * @fail  /
 * @mount /admin/shop/subscription
 */
class AdminSubscriptionController extends Controller {
  /**
   * construct user admin controller
   */
  constructor() {
    // run super
    super();

    // bind methods
    this.gridAction = this.gridAction.bind(this);
    this.indexAction = this.indexAction.bind(this);
    this.createAction = this.createAction.bind(this);
    this.updateAction = this.updateAction.bind(this);
    this.removeAction = this.removeAction.bind(this);
    this.createSubmitAction = this.createSubmitAction.bind(this);
    this.updateSubmitAction = this.updateSubmitAction.bind(this);
    this.removeSubmitAction = this.removeSubmitAction.bind(this);

    // bind private methods
    this._grid = this._grid.bind(this);

    // register simple block
    blockHelper.block('dashboard.grid.subscriptions', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Subscriptions Grid',
      description : 'Shows grid of recent subscriptions',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // create new req
      const fauxReq = {
        query : blockModel.get('state') || {},
      };

      // return
      return {
        tag   : 'grid',
        name  : 'Subscriptions',
        grid  : await this._grid(req).render(fauxReq),
        class : blockModel.get('class') || null,
        title : blockModel.get('title') || '',
      };
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // set data
      blockModel.set('class', req.body.data.class);
      blockModel.set('state', req.body.data.state);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });

    // register simple block
    blockHelper.block('dashboard.stat.subscriptions', {
      acl         : ['admin.shop'],
      for         : ['admin'],
      title       : 'Shop Subscription Stats',
      description : 'Shop Subscription stat block',
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // get data
      const data = await this._getSubscriptionsStat(await this._getAdmins());

      // set other info
      data.tag = 'stat';
      data.href = '/admin/subscription';
      data.titles = {
        today : 'Subscritions Today',
        total : 'Total Subscriptions',
      };
      data.color = blockModel.get('color') || 'primary';
      data.class = blockModel.get('class') || 'col';
      data.title = blockModel.get('title') || '';

      // return
      return data;
    }, async (req, block) => {
      // get notes block from db
      const blockModel = await Block.findOne({
        uuid : block.uuid,
      }) || new Block({
        uuid : block.uuid,
        type : block.type,
      });

      // set data
      blockModel.set('color', req.body.data.color);
      blockModel.set('class', req.body.data.class);
      blockModel.set('title', req.body.data.title);

      // save block
      await blockModel.save();
    });
  }

  /**
   * index action
   *
   * @param req
   * @param res
   *
   * @icon    fa fa-box-usd
   * @menu    {ADMIN} Subscriptions
   * @title   Subscription Administration
   * @route   {get} /
   * @layout  admin
   * @parent  /admin/shop
   */
  async indexAction(req, res) {
    // render grid
    res.render('subscription/admin', {
      grid : await this._grid(req).render(req),
    });
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route    {get} /create
   * @layout   admin
   * @priority 12
   */
  createAction(req, res) {
    // return update action
    return this.updateAction(req, res);
  }

  /**
   * update action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/update
   * @layout  admin
   */
  async updateAction(req, res) {
    // set website variable
    let create       = true;
    let subscription = new Subscription();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      subscription = await Subscription.findById(req.params.id);
    }

    // render page
    res.render('subscription/admin/update', {
      title        : create ? 'Create Subscription' : `Update ${subscription.get('_id').toString()}`,
      subscription : await subscription.sanitise(),
    });
  }

  /**
   * create submit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /create
   * @layout  admin
   */
  createSubmitAction(req, res) {
    // return update action
    return this.updateSubmitAction(req, res);
  }

  /**
   * add/edit action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/update
   * @layout  admin
   */
  async updateSubmitAction(req, res) {
    // set website variable
    let create       = true;
    let subscription = new Subscription();

    // check for website model
    if (req.params.id) {
      // load by id
      create = false;
      subscription = await Subscription.findById(req.params.id);
    }

    // await hook
    await this.eden.hook('subscription.submit', req, subscription);

    // save subscription
    await subscription.save();

    // send alert
    req.alert('success', `Successfully ${create ? 'Created' : 'Updated'} subscription!`);

    // render page
    res.render('subscription/admin/update', {
      title        : create ? 'Create Subscription' : `Update ${subscription.get('_id').toString()}`,
      subscription : await subscription.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/remove
   * @layout  admin
   */
  async removeAction(req, res) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // render page
    res.render('subscription/admin/remove', {
      title        : `Remove ${subscription.get('_id').toString()}`,
      subscription : await subscription.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/remove
   * @title   subscription Administration
   * @layout  admin
   */
  async removeSubmitAction(req, res) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // alert Removed
    req.alert('success', `Successfully removed ${subscription.get('_id').toString()}`);

    // delete website
    await subscription.remove();

    // render index
    return this.indexAction(req, res);
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {get} /:id/cancel
   * @layout  admin
   */
  async cancelAction(req, res) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // render page
    res.render('subscription/admin/cancel', {
      title        : `Cancel ${subscription.get('_id').toString()}`,
      subscription : await subscription.sanitise(),
    });
  }

  /**
   * delete action
   *
   * @param req
   * @param res
   *
   * @route   {post} /:id/cancel
   * @title   subscription Administration
   * @layout  admin
   */
  async cancelSubmitAction(req, res) {
    // set website variable
    let subscription = false;

    // check for website model
    if (req.params.id) {
      // load user
      subscription = await Subscription.findById(req.params.id);
    }

    // delete website
    await subscriptionHelper.cancel(subscription);

    // check state
    if (subscription.get('state') !== 'active') {
      // emit cancelled
      this.eden.emit('subscription.cancelled', subscription.get('_id').toString());

      // alert Removed
      req.alert('success', `Successfully canelled ${subscription.get('_id').toString()}`);
    }

    // render index
    return this.indexAction(req, res);
  }

  /**
   * user grid action
   *
   * @param req
   * @param res
   *
   * @route {post} /grid
   */
  gridAction(req, res) {
    // return post grid request
    return this._grid(req).post(req, res);
  }

  /**
   * renders grid
   *
   * @return {grid}
   */
  _grid(req) {
    // create new grid
    const subscriptionGrid = new Grid();

    // set route
    subscriptionGrid.route('/admin/subscription/grid');

    // set grid model
    subscriptionGrid.model(Subscription);

    // add grid columns
    subscriptionGrid.column('_id', {
      title  : 'ID',
      format : async (col) => {
        return col ? col.toString() : '<i>N/A</i>';
      },
    }).column('user', {
      sort   : true,
      title  : 'User',
      format : async (col, row) => {
        // get user
        const user = await row.get('user');

        // return user name
        return user ? `<a href="/admin/user/${user.get('_id').toString()}">${user.name() || user.get('email')}</a>` : 'Anonymous';
      },
    })
      .column('product', {
        sort   : true,
        title  : 'Product',
        format : async (col, row) => {
          // return product
          return col ? `<a href="/product/${col.get('slug')}">${col.get(`title.${req.language}`)}</a>` : '<i>N/A</i>';
        },
      })
      .column('price', {
        sort   : true,
        title  : 'Price',
        format : async (col, row) => {
        // get currency
          const invoice = await row.get('invoice');

          // return invoice total
          return col ? formatter.format(col, {
            code : invoice.get('currency') || config.get('shop.currency') || 'USD',
          }) : '<i>N/A</i>';
        },
      })
      .column('paid', {
        sort   : true,
        title  : 'Paid',
        format : async (col, row) => {
        // get invoice
          const payment = await row.get('payment');

          // get paid
          return payment && payment.get('complete') ? '<span class="btn btn-sm btn-success">Paid</span>' : '<span class="btn btn-sm btn-danger">Unpaid</span>';
        },
      })
      .column('created_at', {
        sort   : true,
        title  : 'Created',
        format : async (col) => {
          return col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          });
        },
      })
      .column('started', {
        sort   : true,
        title  : 'Started',
        format : async (col, row) => {
          // return invoice total
          return col ? col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          }) : '<i>N/A</i>';
        },
      })
      .column('due', {
        sort   : true,
        title  : 'Due',
        format : async (col, row) => {
          // return invoice total
          return col ? col.toLocaleDateString('en-GB', {
            day   : 'numeric',
            month : 'short',
            year  : 'numeric',
          }) : '<i>N/A</i>';
        },
      })
      .column('state', {
        sort   : true,
        title  : 'State',
        format : async (col, row) => {
          // pending
          return `<span class="btn btn-sm btn-${col === 'cancelled' ? 'danger' : 'success'}">${req.t(`subscription:state.${col || 'pending'}`)}</span>`;
        },
      })
      .column('actions', {
        type   : false,
        width  : '1%',
        title  : 'Actions',
        format : async (col, row) => {
          return [
            '<div class="btn-group btn-group-sm" role="group">',
            `<a href="/admin/subscription/${row.get('_id').toString()}/update" class="btn btn-primary"><i class="fa fa-pencil"></i></a>`,
            `<a href="/admin/subscription/${row.get('_id').toString()}/remove" class="btn btn-danger"><i class="fa fa-times"></i></a>`,
            `<a href="/admin/subscription/${row.get('_id').toString()}/cancel" class="btn btn-danger"><i class="fa fa-ban"></i></a>`,
            '</div>',
          ].join('');
        },
      });

    // add grid filters
    subscriptionGrid.filter('username', {
      title : 'Username',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('username', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        subscriptionGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    }).filter('email', {
      title : 'Email',
      type  : 'text',
      query : async (param) => {
        // check param
        if (!param || !param.length) return;

        // get users
        const users = await User.match('email', new RegExp(escapeRegex(param.toString().toLowerCase()), 'i')).find();

        // user id in
        subscriptionGrid.in('user.id', users.map(user => user.get('_id').toString()));
      },
    });

    // set default sort subscription
    subscriptionGrid.sort('created_at', -1);

    // return grid
    return subscriptionGrid;
  }

  /**
   * deposit logic
   *
   * @param {Array} Admins
   *
   * @return {Object}
   */
  async _getSubscriptionsStat(admins) {
    // let date
    const start = new Date();
    start.setHours(24, 0, 0, 0);
    start.setDate(start.getDate() - 14);

    // set last
    const last = new Date();
    last.setHours(24, 0, 0, 0);

    // create Date
    let current = new Date(start);

    // set totals
    const totals = [];
    const values = [];

    // loop for deposits
    while (current <= last) {
      // set next
      const next = new Date(current);
      next.setDate(next.getDate() + 1);

      // return amount sum
      const total = await Subscription.gte('created_at', current).lte('created_at', next).where({
        state : 'active',
      }).nin('user.id', admins)
        .count();

      // add to totals
      totals.push(total);
      values.push(total);

      // add to date
      current = next;
    }

    // set midnight
    const midnight = new Date();
    midnight.setHours(0, 0, 0, 0);

    // return totals and values
    return {
      total   : (await Subscription.where({
        state : 'active',
      }).nin('user.id', admins).count()).toLocaleString(),
      today   : (await Subscription.where({
        state : 'active',
      }).gte('created_at', new Date(new Date().setHours(0, 0, 0, 0))).nin('user.id', admins).count()).toLocaleString(),
      weekly  : (await Subscription.where({
        state : 'active',
      }).gte('created_at', new Date(midnight.getTime() - (7 * 24 * 60 * 60 * 1000))).nin('user.id', admins).count()).toLocaleString(),
      monthly : (await Subscription.where({
        state : 'active',
      }).gte('created_at', new Date(midnight.getTime() - (30 * 24 * 60 * 60 * 1000))).nin('user.id', admins).count()).toLocaleString(),

      totals,
      values,
    };
  }

  /**
   * gets admins
   *
   * @return {*}
   */
  async _getAdmins() {
    // set admins
    const adminACL = await Acl.findOne({
      name : 'Admin',
    });

    // get admins
    const admins = (await User.where({
      'acl.id' : adminACL.get('_id').toString(),
    }).find()).map(user => user.get('_id').toString());

    // return admins
    return admins;
  }
}

/**
 * export admin controller
 *
 * @type {admin}
 */
exports = module.exports = AdminSubscriptionController;
