var Collection = Mongo.Collection;

var capitalize = function (string) {
  return string.charAt(0).toUpperCase() + string.substring(1).toLowerCase();
};

var needsPrevious = function(klass, collectionName, method) {
  // grab the hooks

  // console.log(collectionName);
  var hooks = Meteor._ensure(klass, '_hooks', collectionName);
  // console.log(hooks);
  // console.log(method);
  if (method === 'update')
    hooks = hooks.afterUpdate;
  if (method === 'remove')
    hooks = hooks.afterRemove;
  // if (hooks) console.log(hooks);
  // if (method === 'remove') console.log(hooks);
  return _.any(hooks, function(hook) { return hook.needsPrevious; });
};

var runHooks = function (klass, hook, collection, args) {
  var self = this
    , hooks
    , callbacks;

  hooks = Meteor._ensure(klass, '_hooks', collection);
  callbacks = hooks[hook];

  // args.push()

  // first arg might be the collection name

//   if (typeof args[0] === 'string')
//     args = args.slice(1);

  if (_.isArray(callbacks)) {
    _.each(callbacks, function (hook) {
      hook.callback.apply(self, args);
    });
  }
};

var defineHookMethod = function (klass, name) {
  Collection.prototype[name] = function (options, fn) {
    // if options is a function, fn = options;
    fn = fn || _.isFunction(options) && options;
    var hook = _.extend({callback: fn}, options);
      
    var collectionName = this._name
      , hooks = Meteor._ensure(klass, '_hooks', collectionName)
      , callbacks;

    callbacks = hooks[name] = hooks[name] || [];
    callbacks.push(hook);
  };
};

var wrapMethod = function (klass, method) {
  var wrapped = klass.prototype[method];
  klass.prototype[method] = function (/* args */) {
    var ret
      , args = _.toArray(arguments)
      , collectionName = this._name || args[0];
    

    // if (Meteor.isServer)
    //   args.shift(); // drop the first argument

    if (needsPrevious(klass, collectionName, method))
      this.previous = this.find(args[0]).fetch();
    
    // console.log(args);
    runHooks.call(this,
      klass,
      'before' + capitalize(method),
      collectionName,
      args
    );

    ret = wrapped.apply(this, arguments);

    runHooks.call(this,
      klass,
      'after' + capitalize(method),
      collectionName,
      args
    );

    return ret;
  };
};

var wrapMutatorMethods = function (klass) {
  _.each(['insert', 'update', 'remove'], function (method) {
    defineHookMethod(klass, 'before' + capitalize(method));
    defineHookMethod(klass, 'after' + capitalize(method));
    wrapMethod(klass, method);
  });
};

// if (Meteor.isServer) {
//   wrapMutatorMethods(MongoInternals.Connection);
// }

// if (Meteor.isClient) {
wrapMutatorMethods(Collection);
// }