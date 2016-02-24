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
  const increment = function(_id, direction, skipAllCounterUpdate) {
    direction = direction || 1;
    let mod;
    const counterName = options.target.counter;
    const targetCollection = options.target.collection;
    const targetDoc = (targetCollection.findOneIncludeArchived || targetCollection.findOne).bind(targetCollection)(_id);

    // In Verso we maintain two different counters for each object type: an original counter
    // (e.g. responseCount) and an "allCounter" (e.g. responseCountAll). The latter counts all items,
    // including archived ones.

    // allCounter is needed only in some collections:
    const allCounterEnabled = (targetCollection._name === 'classes' && counterName === 'flipCount')
      || (targetCollection._name === 'users' && counterName === 'counts.flipCount')
      || (targetCollection._name === 'flips' && counterName === 'responseCount')
      || (targetCollection._name === 'flips' && counterName === 'commentCount');

    // Make sure that allCounter is initialized and up-to-date with the original counter before we
    // proceed further.
    if (allCounterEnabled && targetDoc[counterName] && !targetDoc[`${counterName}All`]) {
      mod = {$set: {}};
      mod.$set[`${counterName}All`] = targetDoc[counterName];
      targetCollection.update(_id, mod);
    }

    mod = {$inc: {}};
    mod.$inc[counterName] = direction;

    // By default, allCounter is always updated at the same time with the original counter.
    // But there are cases when we need to skip this update (e.g. when we archive a response and
    // want to preserve responseCountAll for campus views).
    if (allCounterEnabled && !skipAllCounterUpdate)
      mod.$inc[`${counterName}All`] = direction;

    targetCollection.update(_id, mod);
  };

  const getDoc = function(id) {
    const fields = {};
    // optimization -- if we don't have special foreignKey or filter functions,
    //   we know we only need the foreign key from the db
    if (! options.source.filter && ! _.isFunction(options.source.foreignKey))
      fields[options.source.foreignKey] = 1;

    return (options.source.collection.findOneIncludeArchived || options.source.collection.findOne)
      .bind(options.source.collection)(id, {fields: fields});
  }

  var resolve = function(doc) {
    return resolveForeignKey(doc, options.source.foreignKey);
  }

  var filter = function(doc) {
    return applyFilter(doc, options.source.filter);
  }

  _.extend(this, {
    insert: function(doc, skipAllCounterUpdate) {
      var foreignKeyValue = resolve(doc);
      if (foreignKeyValue && filter(doc))
        increment(foreignKeyValue, 1, skipAllCounterUpdate);
    },
    update: function(id, modifier, skipAllCounterUpdate) {
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
        increment(oldDocForeignKeyValue, -1, skipAllCounterUpdate);

      if (newDocForeignKeyValue && filterApplyNewValue)
        increment(newDocForeignKeyValue, 1, skipAllCounterUpdate);
    },
    remove: function(id, skipAllCounterUpdate) {
      var doc = getDoc(id);
      var foreignKeyValue = resolve(doc);
      if (foreignKeyValue && filter(doc))
        increment(foreignKeyValue, -1, skipAllCounterUpdate);
    }
  });
}
