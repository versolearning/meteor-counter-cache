var debug = function(str) {
  // console.log('counter-cache: ' + str);
};

// iterator for the property functions below
var walker = function(node, part) { return node[part]; };

_.mixin({
  dottedProperty: function(record, key) {
    return _.reduce(key.split('.'), walker, record || {});
  }
});

var resolveForeignKey = function(doc, foreignKey) {
  // console.log(doc, foreignKey);
  return _.isFunction(foreignKey) ? foreignKey(doc) : _.dottedProperty(doc, foreignKey);
};

var applyFilter = function(doc, filter) {
  if (_.isFunction(filter))
    return filter(doc);

  return true;
};

Mongo.Collection.prototype.maintainCountOf = function(collection, foreignKey, counterField, filter) {
  var self = this;

  // what is Meteor.users an instanceof ?
  // if (! (collection instanceof Meteor.Collection))
  //   throw new Error("Expected first parameter to be a Meteor Collection");
  if (typeof collection === 'undefined')
    throw new Error("Missing parameter: collection");
  if (typeof foreignKey === 'undefined')
    throw new Error("Missing parameter: foreignKey");

  if (typeof counterField === 'undefined')
    counterField = collection._name + 'Count';

  debug('setup counts of `' + collection._name + '` onto `' + this._name + '` with counter field `' + counterField + '`');

  var modifier = { $inc: {}};
  var increment = function(_id) {
    debug('increment ' + _id);
    if (! _id) return;

    modifier.$inc[counterField] = 1;
    self.update(_id, modifier);
  };
  var decrement = function(_id) {
    debug('decrement ' + _id);
    if (! _id) return;

    modifier.$inc[counterField] = -1;
    self.update(_id, modifier);
  };

  collection.afterInsert(function(doc) {
    var foreignKeyValue = resolveForeignKey(doc, foreignKey);
    if (foreignKeyValue && applyFilter(doc, filter))
      increment(foreignKeyValue);
  });

  collection.afterUpdate({ needsPrevious: true }, function(_id, modifier) {
    var self = this;
    var oldDocs = this.previous;

    // console.log(oldDoc.fetch()[0]);

    // console.log(modifier);
    // console.log(fieldNames);
    // console.log(self.previous);
    // console.log(doc);

    // LocalCollection._modify(doc, modifier);

    _.each(oldDocs, function(oldDoc) {
      var doc = collection.findOne(_id);
      var oldDocForeignKeyValue = resolveForeignKey(oldDoc, foreignKey);
      var newDocForeignKeyValue = resolveForeignKey(doc, foreignKey);

      var filterApplyOldValue = applyFilter(oldDoc, filter);
      var filterApplyNewValue = applyFilter(doc, filter);

      if (oldDocForeignKeyValue === newDocForeignKeyValue && filterApplyOldValue === filterApplyNewValue)
        return;

      if (oldDocForeignKeyValue && filterApplyOldValue)
        decrement(oldDocForeignKeyValue);

      if (newDocForeignKeyValue && filterApplyNewValue)
        increment(newDocForeignKeyValue);
    });
  });

  collection.afterRemove({ needsPrevious: true }, function(_id) {
    var docs = this.previous;

    _.each(docs, function(doc) {
      var foreignKeyValue = resolveForeignKey(doc, foreignKey);
      if (foreignKeyValue && applyFilter(doc, filter))
        decrement(foreignKeyValue);
    });
  });
};
