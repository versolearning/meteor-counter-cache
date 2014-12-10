var debug = function(str) {
  // console.log('counter-cache: ' + str);
};

var resolveForeignKey = function(doc, foreignKey) {
  if (_.isFunction(foreignKey)) {
    return foreignKey(doc);
  } else {
    return Meteor._get.apply(Meteor, [].concat(doc, foreignKey.split('.')));
  }
};

var applyFilter = function(doc, filter) {
  if (_.isFunction(filter))
    return filter(doc);

  return true;
};


CounterCache = function(options) {
  // could probably be more flexible in how we establish relationships
  check(options, {
    target: {
      collection: Mongo.Collection,
      counter: String
    },
    source: {
      collection: Mongo.Collection,
      foreignKey: Match.OneOf(String, Function),
      filter: Match.Optional(Function)
    }
  });
  
  // debug('setup counts of `' + collection._name + '` onto `' + this._name + '` with counter field `' + counterField + '`');
  
  // private functions (going all crockford on this one)
  var increment = function(_id, direction) {
    var mod = {$inc: {}};
    mod.$inc[options.target.counter] = direction || 1;
    options.target.collection.update(_id, mod);
  }
  
  var getDoc = function(id) {
    var fields = {};
    // optimization -- if we don't have special foreignKey or filter functions,
    //   we know we only need the foreign key from the db
    if (! options.source.filter && ! _.isFunction(options.source.foreignKey))
      fields[options.source.foreignKey] = 1;
    return options.source.collection.findOne(id, {fields: fields});
  }
  
  var resolve = function(doc) {
    return resolveForeignKey(doc, options.source.foreignKey);
  }
  
  var filter = function(doc) {
    return applyFilter(doc, options.source.filter);
  }
  
  _.extend(this, {
    insert: function(doc) {
      var foreignKeyValue = resolve(doc);
      if (foreignKeyValue && filter(doc))
        increment(foreignKeyValue, 1);
    },
    update: function(id, modifier) {
      var oldDoc = getDoc(id);

      var newDoc = EJSON.clone(oldDoc);
      LocalCollection._modify(newDoc, modifier);

        var oldDocForeignKeyValue = resolve(oldDoc);
      var newDocForeignKeyValue = resolve(newDoc);

      var filterApplyOldValue = filter(oldDoc);
      var filterApplyNewValue = filter(newDoc);

      if (oldDocForeignKeyValue === newDocForeignKeyValue && 
          filterApplyOldValue === filterApplyNewValue)
        return;

      if (oldDocForeignKeyValue && filterApplyOldValue)
        increment(oldDocForeignKeyValue, -1);

      if (newDocForeignKeyValue && filterApplyNewValue)
        increment(newDocForeignKeyValue, 1);
    },
    remove: function(id) {
      var doc = getDoc(id);
      var foreignKeyValue = resolve(doc);
      if (foreignKeyValue && filter(doc))
        increment(foreignKeyValue, -1);
    }
  });
}